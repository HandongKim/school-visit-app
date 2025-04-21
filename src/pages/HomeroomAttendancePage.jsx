import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

const attendanceOptions = ['출석', '결석', '지각', '조퇴', '결과'];
const reasonOptions = ['인정', '질병', '기타', '미인정'];

export default function HomeroomAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('조회');
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [selectedClass, setSelectedClass] = useState('1');
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [modal, setModal] = useState({ open: false, student: null });
  const [saveMessage, setSaveMessage] = useState('');

  const autoSaveTimer = useRef(null);

  // 🔄 반 학생 목록 불러오기
  useEffect(() => {
    const fetchStudents = async () => {
      const path = `students/${selectedGrade}/${selectedClass}`;
      try {
        const snapshot = await getDocs(collection(db, path));
        const studentList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.number - b.number);
        setStudents(studentList);
      } catch (error) {
        console.error('학생 데이터를 불러오는 중 오류:', error);
      }
    };
    fetchStudents();
  }, [selectedGrade, selectedClass]);

  const handleCellClick = (student) => {
    setModal({ open: true, student });
  };

  const handleSelect = (status, reason) => {
    const saveReason = status === '출석' ? null : reason;
    setAttendanceData(prev => ({
      ...prev,
      [modal.student.id]: { status, reason: saveReason }
    }));
    setModal({ open: false, student: null });

    // 자동 저장 타이머 시작
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      handleSave('auto');
    }, 3000);
  };

  // 🧾 저장 함수
  const handleSave = async (type = 'manual') => {
    const pathBase = `attendance/${selectedDate}/${selectedGrade}_${selectedClass}`;
    try {
      const promises = students.map((student) => {
        const att = attendanceData[student.id];
        if (!att) return Promise.resolve();

        const ref = doc(db, `${pathBase}/${student.id}`);
        return setDoc(ref, {
          name: student.name,
          number: student.number,
          period: selectedPeriod,
          status: att.status,
          reason: att.reason || null,
          timestamp: new Date()
        });
      });

      await Promise.all(promises);

      if (type === 'manual') {
        setSaveMessage('✅ 저장이 완료되었습니다.');
        setTimeout(() => setSaveMessage(''), 3000);
      }

    } catch (error) {
      console.error('저장 실패:', error);
      setSaveMessage('❌ 저장에 실패했습니다.');
    }
  };

  const displayStatus = (student) => {
    const att = attendanceData[student.id];
    if (!att) return '출석';
    return att.reason ? `${att.status} (${att.reason})` : att.status;
  };

  const getColor = (status) => {
    return status === '결석' ? 'text-red-500'
      : status === '지각' ? 'text-yellow-500'
      : status === '조퇴' ? 'text-purple-500'
      : status === '결과' ? 'text-green-500'
      : 'text-gray-600';
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold mb-4">[담임용] 출석부</h1>

      {/* 선택창 */}
      <div className="flex gap-4 flex-wrap mb-4">
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
            <option value="조회">조회</option>
            {[...Array(7)].map((_, i) => (
              <option key={i + 1} value={`${i + 1}교시`}>{i + 1}교시</option>
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
            {[1, 2, 3].map(g => (
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
            {[1, 2, 3, 4, 5].map(c => (
              <option key={c} value={c}>{c}반</option>
            ))}
          </select>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="mb-4">
        <button
          onClick={() => handleSave('manual')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded shadow"
        >
          저장
        </button>
        {saveMessage && (
          <p className="mt-2 text-sm text-green-600 font-semibold">{saveMessage}</p>
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
            students.map((student) => {
              const att = attendanceData[student.id];
              const color = getColor(att?.status);

              return (
                <tr key={student.id}>
                  <td className="border p-2">{student.name}</td>
                  <td
                    className={`border p-2 cursor-pointer font-semibold ${color}`}
                    onClick={() => handleCellClick(student)}
                  >
                    {displayStatus(student)}
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

            {attendanceOptions.map((status) => (
              <div key={status} className="mb-2">
                <div className="font-semibold mb-1">{status}</div>
                {status === '출석' ? (
                  <button
                    onClick={() => handleSelect('출석', null)}
                    className="border px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-sm"
                  >
                    출석으로 설정
                  </button>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {reasonOptions.map((reason) => (
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
