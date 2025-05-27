// d:\school-visit-app\src\pages\HomeroomAttendancePage.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, doc, getDoc, setDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'; // Firestore 함수 임포트
// import { useAuth } from '../contexts/AuthContext'; // 만약 AuthContext를 사용한다면 주석 해제

/**
 * @file HomeroomAttendancePage.jsx
 * @description (개발/테스트용) 담임교사가 자신의 반 학생들의 출결 상태를 관리하는 페이지 컴포넌트입니다.
 * AttendancePage.jsx와 유사하지만, 담임교사의 정보(학년, 반)를 기반으로 자동으로 필터링됩니다.
 * (현재는 기본 구조만 잡혀있으며, userInfo를 props로 받아 사용하거나 Context API를 통해 가져와야 합니다)
 */

/**
 * HomeroomAttendancePage 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props (예: App.jsx로부터 userInfo 전달)
 * @param {object} [props.userInfo] - 현재 로그인한 담임교사의 정보 (role, grade, class, name 등)
 * @returns {JSX.Element} 담임교사용 출결 관리 페이지 UI
 */
export default function HomeroomAttendancePage({ userInfo }) { // userInfo를 props로 받도록 수정
  // const { currentUserInfo } = useAuth(); // AuthContext 사용 예시
  // const userInfoToUse = userInfo || currentUserInfo; // props 우선, 없으면 Context 사용
 
  // 선택된 날짜를 관리하는 상태입니다. 담임교사의 학년, 반은 userInfo에서 가져옵니다.
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const homeroomGrade = userInfo.grade;
  const homeroomClass = userInfo.class;

  // 담임 반 학생 목록을 저장하는 상태입니다.
  const [students, setStudents] = useState([]);
  // 각 학생의 출결 상태를 저장하는 상태입니다.
  const [attendanceStatus, setAttendanceStatus] = useState({});
  // 데이터 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(false);
  // 오류 메시지를 저장하는 상태입니다.
  const [error, setError] = useState('');

  const ATTENDANCE_OPTIONS = ['출석', '지각', '결석(병결)', '결석(무단)', '결석(기타)', '조퇴', '결과'];

  // 날짜가 변경될 때 학생 목록 및 해당 날짜의 출결 정보를 불러옵니다.
  useEffect(() => {
    // 담임교사의 학년, 반 정보가 없으면 함수를 종료합니다.
    if (!homeroomGrade || !homeroomClass) {
      setError('담임 학급 정보가 없습니다. 관리자에게 문의하세요.');
      setStudents([]);
      setAttendanceStatus({});
      return;
    }

    const fetchStudentsAndAttendance = async () => {
      setIsLoading(true);
      setError('');
      try {
        // 1. 담임 반 학생 목록을 'students' 컬렉션에서 불러옵니다.
        const studentsQuery = query(
          collection(db, 'students', homeroomGrade, homeroomClass)
          // 필요시 학생 번호(number) 순으로 정렬
          // orderBy('number')
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const fetchedStudents = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(fetchedStudents);

        // 2. 선택된 날짜의 출결 정보를 'attendance' 컬렉션에서 불러옵니다.
        const attendanceDocId = `${selectedDate}_${homeroomGrade}_${homeroomClass}`;
        const attendanceDocRef = doc(db, 'attendance', attendanceDocId);
        const attendanceDocSnap = await getDoc(attendanceDocRef);

        if (attendanceDocSnap.exists()) {
          setAttendanceStatus(attendanceDocSnap.data().statuses || {});
        } else {
          const initialStatuses = {};
          fetchedStudents.forEach(student => {
            initialStatuses[student.id] = '출석'; // 기본값 '출석'
          });
          setAttendanceStatus(initialStatuses);
        }
      } catch (err) {
        console.error("담임반 학생 및 출결 정보 로드 중 오류:", err);
        setError('정보를 불러오는 중 오류가 발생했습니다.');
        setStudents([]);
        setAttendanceStatus({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsAndAttendance();
  }, [selectedDate, homeroomGrade, homeroomClass]); // 의존성 배열에 homeroomGrade, homeroomClass 추가

  // userInfo가 없거나, 역할이 담임이 아니면 접근 제한
  if (!userInfo || userInfo.role !== 'homeroom') {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg shadow">
        <p className="font-semibold">접근 권한 오류</p>
        <p>이 페이지는 담임 선생님만 접근할 수 있습니다.</p>
        {!userInfo && <p className="text-sm text-gray-500 mt-2">로그인 정보가 없습니다.</p>}
        {userInfo && userInfo.role !== 'homeroom' && <p className="text-sm text-gray-500 mt-2">현재 역할: {userInfo.role}</p>}
      </div>
    );
  }

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
    if (!selectedDate || !homeroomGrade || !homeroomClass) {
      alert('날짜 또는 학급 정보가 올바르지 않습니다.');
      return;
    }
    if (students.length === 0) {
      alert('출결을 저장할 학생이 없습니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const attendanceDocId = `${selectedDate}_${homeroomGrade}_${homeroomClass}`;
      const attendanceDocRef = doc(db, 'attendance', attendanceDocId);
      await setDoc(attendanceDocRef, { 
        date: selectedDate,
        grade: homeroomGrade,
        classNum: homeroomClass,
        statuses: attendanceStatus,
        lastModified: serverTimestamp(),
        modifiedBy: userInfo.uid, // 수정한 담임교사 UID
        teacherName: userInfo.name, // 수정한 담임교사 이름
      }, { merge: true });

      alert('✅ 출결 정보가 저장되었습니다!');
    } catch (err) {
      console.error("출결 정보 저장 중 오류:", err);
      setError('출결 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 담임교사용 출결 관리 페이지 UI를 렌더링합니다.
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-center">
        {homeroomGrade}학년 {homeroomClass}반 출결 관리 (테스트)
      </h1>
      <p className="text-center text-gray-600 mb-6">담임: {userInfo.name} 선생님</p>

      {/* 날짜 선택 필터 */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow flex flex-col sm:flex-row gap-4 items-center justify-center">
        <div>
          <label htmlFor="attendanceDate" className="block text-sm font-medium text-gray-700">조회 날짜</label>
          <input
            type="date"
            id="attendanceDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
      </div>

      {isLoading && <p className="text-center text-blue-500">데이터를 불러오는 중...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!isLoading && !error && (
        students.length > 0 ? (
          <div className="space-y-3">
            {students
              .sort((a, b) => (a.number || 999) - (b.number || 999)) // 학생 번호순 정렬 (번호 없으면 뒤로)
              .map(student => (
              <div key={student.id} className="p-3 bg-white rounded-md shadow border grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="font-medium col-span-1 sm:col-span-1">
                  {student.number ? `${student.number}번` : '번호없음'} {student.name}
                </span>
                <div className="col-span-1 sm:col-span-2">
                  <select
                    value={attendanceStatus[student.id] || '출석'}
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
              className="mt-6 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md shadow disabled:bg-indigo-300"
            >
              {isLoading ? '저장 중...' : '출결 정보 저장'}
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            {homeroomGrade && homeroomClass ? '해당 학급에 등록된 학생이 없거나, 정보를 불러올 수 없습니다.' : '학급 정보를 먼저 확인해주세요.'}
          </p>
        )
      )}
    </div>
  );
}
