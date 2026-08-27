// src/pages/AdminSettingsPage.jsx

import React, { useState } from 'react';
import {
  transferAdmin,
  resetVisitRecords,
  resetStudentRoster,
} from '../firebase/adminService';

// 타이핑 확인이 필요한 위험 동작용 모달
function ConfirmDangerModal({ title, description, confirmWord, busy, onCancel, onConfirm }) {
  const [input, setInput] = useState('');
  const matched = input === confirmWord;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-2 text-red-600">{title}</h3>
        <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">{description}</p>
        <p className="text-sm mb-2">
          계속하려면 아래 칸에 <span className="font-semibold">{confirmWord}</span>를 입력하세요.
        </p>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className="border p-2 w-full rounded text-sm mb-4"
          placeholder={confirmWord}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="px-3 py-1 rounded border text-sm">
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!matched || busy}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm"
          >
            {busy ? '처리 중...' : '삭제 실행'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage({ adminMeta, onAdminTransferred }) {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [message, setMessage] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [openModal, setOpenModal] = useState(null); // 'records' | 'roster' | null
  const [busy, setBusy] = useState(false);

  const handleTransfer = async () => {
    if (!newAdminEmail) {
      setMessage('이양할 대상의 이메일을 입력해주세요.');
      return;
    }
    if (
      !window.confirm(
        `정말로 "${newAdminEmail}"에게 관리자 권한을 이양하시겠습니까?\n이양 후에는 본인의 관리자 권한이 자동으로 해제됩니다.`
      )
    ) {
      return;
    }
    setTransferring(true);
    setMessage('');
    try {
      const data = await transferAdmin(newAdminEmail);
      onAdminTransferred(data);
      setMessage(`✅ ${data.name}(${data.email})님에게 관리자 권한을 이양했습니다.`);
      setNewAdminEmail('');
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message || '이양 중 오류가 발생했습니다.'}`);
    } finally {
      setTransferring(false);
    }
  };

  const runReset = async (kind) => {
    setBusy(true);
    try {
      if (kind === 'records') {
        const result = await resetVisitRecords();
        alert(
          `✅ 기록이 초기화되었습니다.\n방문: ${result.visits}건, 조퇴/외출/외부인: ${result.leaves}건, 교시별 출결: ${result.attendanceSessionEntries}건, 담임용 출결: ${result.attendance}건`
        );
      } else {
        const count = await resetStudentRoster();
        alert(`✅ 학생 명단이 초기화되었습니다. (${count}명 삭제)`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ 초기화 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
      setOpenModal(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-8">
      <h2 className="text-xl font-bold text-center">시스템 관리</h2>

      {/* 현재 관리자 / 이양 */}
      <section className="bg-white shadow rounded-xl p-4 space-y-3">
        <h3 className="font-semibold">현재 관리자</h3>
        <p className="text-sm text-gray-700">
          {adminMeta ? `${adminMeta.name} (${adminMeta.email})` : '정보를 불러오는 중...'}
        </p>

        <label className="block text-sm font-medium mt-2">새 관리자 이메일</label>
        <input
          type="email"
          value={newAdminEmail}
          onChange={e => setNewAdminEmail(e.target.value)}
          placeholder="teacher@example.com"
          className="border p-2 w-full rounded text-sm"
        />
        <button
          onClick={handleTransfer}
          disabled={transferring}
          className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded text-sm font-semibold"
        >
          {transferring ? '처리 중...' : '관리자 이양'}
        </button>
        {message && <p className="text-sm text-center text-gray-600">{message}</p>}
      </section>

      {/* 위험 구역 */}
      <section className="bg-white border-2 border-red-300 shadow rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-red-600">위험 구역</h3>
        <p className="text-xs text-gray-500">
          이 화면의 버튼은 화면(UI)에서만 관리자에게 노출됩니다. Firestore 보안 규칙이 별도로
          설정되어 있지 않다면 서버 단에서 강제되는 것은 아니니 유의하세요.
        </p>

        <div>
          <p className="text-sm mb-2">
            방문/조퇴/외출/출결 기록을 모두 삭제합니다. 학생 명단과 교사 계정 정보는 유지됩니다.
            새 학년으로 넘어갈 때 사용하세요.
          </p>
          <button
            onClick={() => setOpenModal('records')}
            className="bg-red-500 hover:bg-red-600 text-white w-full py-2 rounded text-sm font-semibold"
          >
            새학년 기록 초기화
          </button>
        </div>

        <div>
          <p className="text-sm mb-2">
            등록된 학생 명단을 전체 삭제합니다. 새 학년 엑셀 명단을 다시 업로드하기 전에
            사용하세요.
          </p>
          <button
            onClick={() => setOpenModal('roster')}
            className="bg-red-700 hover:bg-red-800 text-white w-full py-2 rounded text-sm font-semibold"
          >
            학생 명단 전체 삭제
          </button>
        </div>
      </section>

      {openModal === 'records' && (
        <ConfirmDangerModal
          title="기록 초기화 확인"
          description={'방문/조퇴/외출/출결 기록이 모두 삭제되며 되돌릴 수 없습니다.'}
          confirmWord="초기화"
          busy={busy}
          onCancel={() => setOpenModal(null)}
          onConfirm={() => runReset('records')}
        />
      )}
      {openModal === 'roster' && (
        <ConfirmDangerModal
          title="학생 명단 삭제 확인"
          description={'전체 학생 명단이 삭제되며 되돌릴 수 없습니다.'}
          confirmWord="삭제"
          busy={busy}
          onCancel={() => setOpenModal(null)}
          onConfirm={() => runReset('roster')}
        />
      )}
    </div>
  );
}
