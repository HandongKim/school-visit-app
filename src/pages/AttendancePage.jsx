import React, { useState, useEffect } from 'react';
// Firebase 설정을 가져옵니다 (alias 경로 사용)
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// 출결 상태 옵션 및 사유 옵션 정의
const attendanceOptions = ['출석', '결석', '지각', '조퇴', '결과'];
const reasonOptions = ['인정', '질병', '기타', '미인정'];

export default function AttendancePage() {
  // 날짜, 교시, 학년/반 선택 상태 관리
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('1');
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [selectedClass, setSelectedClass] = useState('1');
  
  // 학생 목록 및 출결 데이터 관리
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});

  // 모달 상태 관리 (팝업 창 띄움)
  const [modal, setModal] = useState({ open: false, student: null });

  // Firestore에서 출결 데이터 가져오기
  useEffect(() => {
    async function fetchData() {
      // 선택된 날짜/교시/반 기준으로 Firestore 컬렉션에서 문서 조회
      const querySnapshot = await getDocs(
        collection(
          db,
          'attendance',
          selectedDate,
          `${selectedGrade}-${selectedClass}`,
          selectedPeriod
        )
      );
      // 가져온 문서 데이터를 키-값 객체 형태로 변환
      setAttendanceData(
        querySnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = doc.data();
          return acc;
        }, {})
      );
    }
    fetchData();
  }, [selectedDate, selectedPeriod, selectedGrade, selectedClass]);

  return (
    <div className="p-6 relative">
      {/* 페이지 제목 */}
      <h1 className="text-2xl font-bold mb-4">출석부 (테스트)</h1>

      {/* 필터 선택창: 날짜 / 교시 / 학년 / 반 */}
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block font-semibold mb-1">날짜</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">교시</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {[...Array(7)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}교시</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">학년</label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {[1, 2, 3].map((g) => (
              <option key={g} value={g}>{g}학년</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">반</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {[...Array(10)].map((_, c) => (
              <option key={c + 1} value={c + 1}>{c + 1}반</option>
            ))}
          </select>
        </div>
      </div>

      {/* 학생 출결 테이블 */}
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">학생 이름</th>
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
            students.map((student) => {
              const att = attendanceData[student.id];
              const statusText = att
                ? att.reason
                  ? `${att.status} (${att.reason})`
                  : att.status
                : '출석';

              // 상태별 텍스트 색상 지정
              const colorClass =
                att?.status === '결석' ? 'text-red-500' :
                att?.status === '지각' ? 'text-yellow-500' :
                att?.status === '조퇴' ? 'text-purple-500' :
                att?.status === '결과' ? 'text-green-500' :
                'text-gray-600';

              return (
                <tr key={student.id}>
                  <td className="border p-2">{student.name}</td>
                  {/* 상태 셀 클릭 시 모달 열기 */}
                  <td
                    className={`border p-2 cursor-pointer font-semibold ${colorClass}`}
                    onClick={() => setModal({ open: true, student })}
                  >
                    {statusText}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* 상태 변경 모달 */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-bold mb-4">출결 상태 선택</h2>
            {attendanceOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleSelect(status, null)}
                className="block w-full text-left border px-3 py-1 mb-2 rounded hover:bg-gray-100"
              >
                {status}
              </button>
            ))}

            {/* 사유 선택 (지각·결석 등일 때) */}
            {attendanceOptions.includes(modal.student?.status) && (
              <div className="mt-4">
                <div className="font-semibold mb-2">사유 선택</div>
                {reasonOptions.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleSelect(modal.student.status, reason)}
                    className="border px-3 py-1 mr-2 mb-2 rounded hover:bg-gray-100"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}

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

// handleSelect 함수는 상태/사유 선택 후 Firestore에 업데이트 하는 로직을 담습니다.
async function handleSelect(status, reason) {
  // TODO: Firestore 업데이트 로직 구현
  // 예: await setDoc(doc(db, 'attendance', ...), { status, reason });
}
