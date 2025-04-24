// src/pages/HomeroomAttendancePage.jsx

import React, { useEffect, useState, useRef } from 'react';
// Firebase 설정을 alias 경로로 import
import { db } from '@/firebase/firebaseConfig';
// Firestore 함수들
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

// 출결 상태 및 사유 옵션
const attendanceOptions = ['출석', '결석', '지각', '조퇴', '결과'];
const reasonOptions     = ['인정', '질병', '기타', '미인정'];

export default function HomeroomAttendancePage() {
  // -- 필터 상태 관리 ----------------------------------------
  const [selectedDate, setSelectedDate]     = useState(
    () => new Date().toISOString().split('T')[0]
  ); // 기본값: 오늘 날짜 (YYYY-MM-DD)
  const [selectedPeriod, setSelectedPeriod] = useState('조회'); // 조회 모드 기본값
  const [selectedGrade, setSelectedGrade]   = useState('1');    // 1~3학년
  const [selectedClass, setSelectedClass]   = useState('1');    // 1~5반

  // -- 데이터 상태 관리 --------------------------------------
  const [students, setStudents]           = useState([]);     // 반 학생 목록
  const [attendanceData, setAttendanceData] = useState({});    // { studentId: { status, reason } }
  const [saveMessage, setSaveMessage]     = useState('');     // 저장 결과 메시지

  // 자동 저장 타이머 ref
  const autoSaveTimer = useRef(null);

  // -- 반 학생 목록 불러오기 ----------------------------------
  useEffect(() => {
    async function fetchStudents() {
      const path = `students/${selectedGrade}/${selectedClass}`;
      try {
        const snap = await getDocs(collection(db, path));
        // Firestore 문서를 배열로 변환 후 번호 순 정렬
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.number - b.number);
        setStudents(list);
      } catch (err) {
        console.error('학생 데이터 조회 오류:', err);
      }
    }
    fetchStudents();
  }, [selectedGrade, selectedClass]);

  // -- 셀 클릭 시 모달 열기 ------------------------------------
  const handleCellClick = student => {
    setModal({ open: true, student });
  };

  // -- 모달 상태 관리 ----------------------------------------
  const [modal, setModal] = useState({ open: false, student: null });

  // -- 출결 선택 후 상태 저장 및 자동 저장 트리거 -------------
  const handleSelect = (status, reason) => {
    // '출석'이면 사유 null 처리
    const saveReason = status === '출석' ? null : reason;
    setAttendanceData(prev => ({
      ...prev,
      [modal.student.id]: { status, reason: saveReason }
    }));
    setModal({ open: false, student: null });

    // 이전 타이머 클리어 후 3초 뒤 자동 저장
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave('auto');
    }, 3000);
  };

  // -- 저장 함수 (수동 / 자동) --------------------------------
  const handleSave = async (type = 'manual') => {
    const basePath = `attendance/${selectedDate}/${selectedGrade}_${selectedClass}`;
    try {
      // 각 학생별로 Firestore setDoc 호출
      const promises = students.map(student => {
        const att = attendanceData[student.id];
        if (!att) return Promise.resolve();
        const ref = doc(db, `${basePath}/${student.id}`);
        return setDoc(ref, {
          name:      student.name,
          number:    student.number,
          period:    selectedPeriod,
          status:    att.status,
          reason:    att.reason || null,
          timestamp: new Date(),
        });
      });
      await Promise.all(promises);

      // 수동 저장 시에만 메시지 띄우기
      if (type === 'manual') {
        setSaveMessage('✅ 저장이 완료되었습니다.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (err) {
      console.error('저장 실패:', err);
      setSaveMessage('❌ 저장에 실패했습니다.');
    }
  };

  // -- 상태 표시 및 색상 헬퍼 -------------------------------
  const displayStatus = student => {
    const att = attendanceData[student.id];
    if (!att) return '출석';
    return att.reason ? `${att.status} (${att.reason})` : att.status;
  };
  const getColor = status =>
    status === '결석' ? 'text-red-500'
    : status === '지각' ? 'text-yellow-500'
    : status === '조퇴' ? 'text-purple-500'
    : status === '결과' ? 'text-green-500'
    : 'text-gray-600';

  return (
    <div className="p-6 relative">
      {/* 제목 */}
      <h1 className="text-2xl font-bold mb-4">[담임용] 출석부</h1>

      {/* 필터 선택창: 날짜 / 교시 / 학년 / 반 */}
      <div className="flex gap-4 flex-wrap mb-4">
        {/* 날짜 */}
        <div>
          <label className="block font-semibold mb-1">날짜</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        {/* 교시 */}
        <div>
          <label className="block font-semibold mb-1">교시</label>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="조회">조회</option>
            {[...Array(7)].map((_, i) => (
              <option key={i+1} value={`${i+1}교시`}>
                {i+1}교시
              </option>
            ))}
          </select>
        </div>
        {/* 학년 */}
        <div>
          <label className="block font-semibold mb-1">학년</label>
          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {[1,2,3].map(g => (
              <option key={g} value={String(g)}>{g}학년</option>
            ))}
          </select>
        </div>
        {/* 반 */}
        <div>
          <label className="block font-semibold mb-1">반</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {[1,2,3,4,5].map(c => (
              <option key={c} value={String(c)}>{c}반</option>
            ))}
          </select>
        </div>
      </div>

      {/* 저장 버튼 및 메시지 */}
      <div className="mb-4">
        <button
          onClick={() => handleSave('manual')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded shadow"
        >
          저장
        </button>
        {saveMessage && (
          <p className="mt-2 text-sm text-green-600 font-semibold">
            {saveMessage}
          </p>
        )}
      </div>

      {/* 출석 테이블 */}
      <table className="w-full border text-center">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 w-1/3">이름</th>
            <th className="border p-2">출결 상태</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="2" className="border p-4 text-gray-400">
                선택한 반의 학생 정보가 없습니다.
              </td>
            </tr>
          ) : (
            students.map(student => {
              const statusText = displayStatus(student);
              const colorClass = getColor(attendanceData[student.id]?.status);
              return (
                <tr key={student.id}>
                  <td className="border p-2">{student.name}</td>
                  <td
                    className={`border p-2 cursor-pointer font-semibold ${colorClass}`}
                    onClick={() => handleCellClick(student)}
                  >
                    {statusText}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* 출결 선택 모달 */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80">
            <h2 className="text-lg font-bold mb-4">
              {modal.student.name} 출결 상태 선택
            </h2>

            {attendanceOptions.map(status => (
              <div key={status} className="mb-2">
                {/* 출결 상태 타이틀 */}
                <div className="font-semibold mb-1">{status}</div>

                {/* 출석은 단일 버튼, 나머지는 사유 선택 */}
                {status === '출석' ? (
                  <button
                    onClick={() => handleSelect('출석', null)}
                    className="border px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-sm"
                  >
                    출석으로 설정
                  </button>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {reasonOptions.map(reason => (
                      <button
                        key={reason}
                        onClick={() => handleSelect(status, reason)}
                        className="border px-3 py-1 rounded hover:bg-blue-100 text-sm"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 모달 닫기 버튼 */}
            <button
              onClick={() => setModal({ open: false, student: null })}
              className="mt-4 text-sm text-gray-500 underline"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
