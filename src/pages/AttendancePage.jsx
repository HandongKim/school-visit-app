// d:\school-visit-app\src\pages\AttendancePage.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, doc, getDoc, setDoc, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'; // Firestore 함수 임포트

/**
 * @file AttendancePage.jsx
 * @description (개발/테스트용) 학생들의 출결 상태를 관리하는 페이지 컴포넌트입니다.
 * 특정 학년/반을 선택하여 학생 목록을 불러오고, 각 학생의 출결 상태(출석, 지각, 결석, 조퇴 등)를
 * 기록하거나 수정할 수 있는 기능을 제공합니다. (현재는 기본 구조만 잡혀있습니다)
 */

/**
 * AttendancePage 컴포넌트
 * @returns {JSX.Element} 출결 관리 페이지 UI
 */
export default function AttendancePage() {
  // 선택된 날짜, 학년, 반을 관리하는 상태입니다.
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // 오늘 날짜 기본값
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // 선택된 학년/반의 학생 목록을 저장하는 상태입니다.
  const [students, setStudents] = useState([]);
  // 각 학생의 출결 상태를 저장하는 상태입니다. { studentId: '출석상태' } 형태
  const [attendanceStatus, setAttendanceStatus] = useState({});
  // 데이터 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(false);
  // 오류 메시지를 저장하는 상태입니다.
  const [error, setError] = useState('');

  // (예시) 출결 상태 옵션
  const ATTENDANCE_OPTIONS = ['출석', '지각', '결석(병결)', '결석(무단)', '결석(기타)', '조퇴', '결과'];

  // 학년, 반, 날짜가 변경될 때 학생 목록 및 해당 날짜의 출결 정보를 불러옵니다.
  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      // 학년 또는 반이 선택되지 않았으면 함수를 종료합니다.
      if (!selectedGrade || !selectedClass) {
        setStudents([]);
        setAttendanceStatus({});
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        // 1. 선택된 학년/반의 학생 목록을 'students' 컬렉션에서 불러옵니다.
        const studentsQuery = query(
          collection(db, 'students', selectedGrade, selectedClass)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const fetchedStudents = studentsSnapshot.docs.map(doc => ({
          id: doc.id, // 학생 문서 ID (예: 학번 또는 고유 ID)
          ...doc.data(), // 학생 정보 (name 등)
        }));
        setStudents(fetchedStudents);

        // 2. 선택된 날짜의 출결 정보를 'attendance' 컬렉션에서 불러옵니다.
        //    문서 ID는 'YYYY-MM-DD_학년_반' 형식을 사용할 수 있습니다.
        //    또는 각 학생별로 날짜별 출결 문서를 가질 수도 있습니다.
        //    이 예제에서는 날짜별로 하나의 문서를 사용하고, 그 안에 학생들의 상태를 저장한다고 가정합니다.
        const attendanceDocId = `${selectedDate}_${selectedGrade}_${selectedClass}`;
        const attendanceDocRef = doc(db, 'attendance', attendanceDocId);
        const attendanceDocSnap = await getDoc(attendanceDocRef);

        if (attendanceDocSnap.exists()) {
          setAttendanceStatus(attendanceDocSnap.data().statuses || {}); // statuses 필드에 학생별 상태 저장
        } else {
          // 해당 날짜의 출결 기록이 없으면, 모든 학생을 '출석'으로 초기화 (또는 빈 상태)
          const initialStatuses = {};
          fetchedStudents.forEach(student => {
            initialStatuses[student.id] = '출석'; // 기본값을 '출석'으로 설정
          });
          setAttendanceStatus(initialStatuses);
        }
      } catch (err) {
        console.error("학생 및 출결 정보 로드 중 오류:", err);
        setError('정보를 불러오는 중 오류가 발생했습니다.');
        setStudents([]);
        setAttendanceStatus({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsAndAttendance();
  }, [selectedDate, selectedGrade, selectedClass]);

  /**
   * 특정 학생의 출결 상태를 변경하는 핸들러 함수입니다.
   * @param {string} studentId - 상태를 변경할 학생의 ID
   * @param {string} status - 새로운 출결 상태
   */
  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  /**
   * 현재 설정된 출결 상태를 Firestore에 저장하는 비동기 함수입니다.
   */
  const handleSaveAttendance = async () => {
    if (!selectedDate || !selectedGrade || !selectedClass) {
      alert('날짜, 학년, 반을 모두 선택해주세요.');
      return;
    }
    if (students.length === 0) {
      alert('출결을 저장할 학생이 없습니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const attendanceDocId = `${selectedDate}_${selectedGrade}_${selectedClass}`;
      const attendanceDocRef = doc(db, 'attendance', attendanceDocId);
      // `setDoc`을 사용하여 문서를 생성하거나 덮어씁니다.
      // `merge: true` 옵션을 사용하면 기존 필드를 유지하면서 지정된 필드만 업데이트/추가할 수 있습니다.
      await setDoc(attendanceDocRef, { 
        date: selectedDate,
        grade: selectedGrade,
        classNum: selectedClass, // Firestore 필드명은 'classNum' 또는 'class'로 통일
        statuses: attendanceStatus, // 학생별 출결 상태 객체
        lastModified: serverTimestamp(), // 마지막 수정 시각
      }, { merge: true });

      alert('✅ 출결 정보가 저장되었습니다!');
    } catch (err) {
      console.error("출결 정보 저장 중 오류:", err);
      setError('출결 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 출결 관리 페이지 UI를 렌더링합니다.
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">일일 출결 관리 (테스트)</h1>

      {/* 날짜, 학년, 반 선택 필터 */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="attendanceDate" className="block text-sm font-medium text-gray-700">날짜</label>
          <input
            type="date"
            id="attendanceDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="gradeSelect" className="block text-sm font-medium text-gray-700">학년</label>
          <select
            id="gradeSelect"
            value={selectedGrade}
            onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClass(''); setStudents([]); setAttendanceStatus({}); }} // 학년 변경 시 반, 학생, 출결 초기화
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="">학년 선택</option>
            {[1, 2, 3].map(g => <option key={g} value={String(g)}>{g}학년</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="classSelect" className="block text-sm font-medium text-gray-700">반</label>
          <select
            id="classSelect"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={!selectedGrade} // 학년이 선택되어야 활성화
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="">반 선택</option>
            {/* 예시 반 목록 (실제로는 학년에 따라 동적으로 변경될 수 있음) */}
            {[...Array(12)].map((_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}반</option>)}
          </select>
        </div>
      </div>

      {/* 로딩 및 오류 메시지 표시 */}
      {isLoading && <p className="text-center text-blue-500">데이터를 불러오는 중...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* 학생 목록 및 출결 상태 입력 */}
      {!isLoading && !error && selectedGrade && selectedClass && (
        students.length > 0 ? (
          <div className="space-y-3">
            {students.map(student => (
              <div key={student.id} className="p-3 bg-white rounded-md shadow border grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="font-medium col-span-1 sm:col-span-1">{student.number || '번호없음'}번 {student.name}</span>
                <div className="col-span-1 sm:col-span-2">
                  <select
                    value={attendanceStatus[student.id] || '출석'} // 해당 학생의 상태, 없으면 '출석' 기본값
                    onChange={(e) => handleStatusChange(student.id, e.target.value)}
                    className="w-full p-1.5 border border-gray-300 rounded-md text-sm"
                  >
                    {ATTENDANCE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <button
              onClick={handleSaveAttendance}
              disabled={isLoading}
              className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow disabled:bg-green-300"
            >
              {isLoading ? '저장 중...' : '출결 정보 저장'}
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500">선택한 학년/반에 학생 정보가 없거나, 아직 불러오지 못했습니다.</p>
        )
      )}
      {!selectedGrade && !selectedClass && !isLoading && (
        <p className="text-center text-gray-400">날짜, 학년, 반을 선택하여 출결을 관리하세요.</p>
      )}
    </div>
  );
}
