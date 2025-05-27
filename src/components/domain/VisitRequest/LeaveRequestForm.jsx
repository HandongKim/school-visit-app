// d:\school-visit-app\src\components\domain\VisitRequest\LeaveRequestForm.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, addDoc, serverTimestamp, query, getDocs } from 'firebase/firestore'; // Firestore 함수 임포트
import { ROLES } from '../../../constants/appConstants'; // 역할 상수 임포트

/**
 * @file LeaveRequestForm.jsx
 * @description 담임교사가 학생의 조퇴 또는 외출을 기록하는 폼 컴포넌트입니다.
 * 기록된 정보는 Firestore 'leaves' 컬렉션에 저장됩니다. (또는 'visits' 컬렉션에 type을 구분하여 저장할 수도 있습니다)
 * 이 예제에서는 'leaves'라는 별도 컬렉션을 사용한다고 가정합니다.
 */

/**
 * LeaveRequestForm 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {object} props.userInfo - 현재 로그인한 담임교사의 정보 (학년, 반, 이름 등)
 * @returns {JSX.Element} 조퇴/외출 기록 폼 UI
 */
export default function LeaveRequestForm({ userInfo }) {
  // 현재 로그인한 사용자가 담임교사(ROLES.HOMEROOM)가 아니면, 이 폼을 사용할 수 없음을 알립니다.
  if (userInfo.role !== ROLES.HOMEROOM) {
    return (
      <div className="p-4 text-center text-red-500">
        이 기능은 담임교사만 사용할 수 있습니다.
      </div>
    );
  }

  // 폼 입력 값을 관리하는 상태입니다.
  const [form, setForm] = useState({
    // 담임교사의 학년, 반 정보는 userInfo에서 가져와 고정합니다.
    grade:    userInfo.grade || '',
    classNum: userInfo.class || '', // Firestore에는 'class'로 저장될 수 있음
    name:     '', // 학생 이름
    type:     '조퇴', // 기록 유형 (조퇴, 외출) - 기본값 '조퇴'
    reason:   '', // 사유
    leaveTime: new Date().toISOString().substring(0, 16), // 조퇴/외출 시작 시간 (YYYY-MM-DDTHH:mm 형식)
    returnTime: '', // 복귀 예정 시간 (외출 시 선택적으로 입력)
    guardianContact: '', // 보호자 연락처
    notes: '', // 기타 특이사항
  });

  // 학생 이름 자동 완성을 위한 학생 목록 상태
  const [studentList, setStudentList] = useState([]);
  // 학생 이름 입력 필드 값 상태 (자동 완성 제어용)
  const [studentNameInput, setStudentNameInput] = useState('');
  // 자동 완성 드롭다운 표시 여부 상태
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 로딩 상태 (Firestore 저장 중일 때 true)
  const [isLoading, setIsLoading] = useState(false);

  // 컴포넌트 마운트 시 담임교사의 반 학생 목록을 불러옵니다.
  useEffect(() => {
    const fetchStudentsInClass = async () => {
      if (!userInfo.grade || !userInfo.class) return; // 학년, 반 정보 없으면 중단
      try {
        const q = query(
          collection(db, 'students', String(userInfo.grade), String(userInfo.class))
        );
        const querySnapshot = await getDocs(q);
        const students = querySnapshot.docs.map(doc => doc.data().name);
        setStudentList(students);
      } catch (error) {
        console.error("반 학생 목록 로드 중 오류:", error);
      }
    };
    fetchStudentsInClass();
  }, [userInfo.grade, userInfo.class]); // 학년 또는 반 정보가 변경될 경우 (이론상 담임은 고정)

  // 학생 이름 입력(studentNameInput)이 변경될 때마다 실행됩니다.
  // 로드된 학생 목록(studentList)에서 입력된 이름으로 시작하는 학생들을 필터링하여 제안합니다.
  useEffect(() => {
    if (!studentNameInput.trim()) {
      setShowSuggestions(false);
      return;
    }
    const filteredStudents = studentList.filter(name =>
      name.toLowerCase().startsWith(studentNameInput.toLowerCase())
    );
    setShowSuggestions(filteredStudents.length > 0);
    // 자동 완성 제안 목록을 studentList에 직접 반영하지 않고,
    // 렌더링 시점에서 studentList를 필터링하여 보여줄 수도 있습니다.
    // 여기서는 간단하게 필터링된 결과를 보여주기 위해 studentList를 직접 업데이트하지는 않습니다.
    // 대신, 드롭다운에 filteredStudents를 사용합니다. (아래 JSX 수정 필요)
  }, [studentNameInput, studentList]);


  /**
   * 폼 입력 요소의 변경 이벤트를 처리하는 핸들러 함수입니다.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} e - 변경 이벤트 객체
   */
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'name') {
      setStudentNameInput(value);
    }
  };

  /**
   * 학생 이름 자동 완성 제안 항목 클릭 시 실행되는 핸들러 함수입니다.
   * @param {string} name - 선택된 학생 이름
   */
  const handleSuggestionClick = (name) => {
    setForm(prev => ({ ...prev, name: name }));
    setStudentNameInput(name);
    setShowSuggestions(false);
  };

  /**
   * 폼 제출 이벤트를 처리하는 비동기 핸들러 함수입니다.
   * 입력된 조퇴/외출 기록을 Firestore에 저장합니다.
   * @param {React.FormEvent<HTMLFormElement>} e - 폼 제출 이벤트 객체
   */
  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);

    // 필수 필드 유효성 검사
    if (!form.name.trim() || !form.reason.trim() || !form.leaveTime || !form.guardianContact.trim()) {
      alert('학생 이름, 사유, 발생 시각, 보호자 연락처는 필수 항목입니다.');
      setIsLoading(false);
      return;
    }
    if (form.type === '외출' && !form.returnTime) {
      alert('외출 시에는 복귀 예정 시각을 입력해야 합니다.');
      setIsLoading(false);
      return;
    }

    // Firestore에 저장할 데이터 객체(payload)를 구성합니다.
    const payload = {
      grade:        form.grade,
      class:        form.classNum, // Firestore 필드명은 'class'로 통일
      studentName:  form.name.trim(),
      type:         form.type, // '조퇴' 또는 '외출'
      reason:       form.reason.trim(),
      leaveTime:    new Date(form.leaveTime), // ISO 문자열을 Date 객체로 변환
      returnTime:   form.type === '외출' && form.returnTime ? new Date(form.returnTime) : null,
      guardianContact: form.guardianContact.trim(),
      notes:        form.notes.trim(),
      recordedByUid: userInfo.uid, // 기록한 담임교사 UID
      teacherName:  userInfo.name,  // 기록한 담임교사 이름
      createdAt:    serverTimestamp(), // 서버 타임스탬프 사용
    };

    try {
      // 'leaves' 컬렉션 (또는 'visits' 컬렉션에 isLeave: true 등으로 구분)에 payload 데이터 추가
      await addDoc(collection(db, 'leaves'), payload);
      alert(`✅ ${form.type} 기록이 저장되었습니다!`);
      // 폼 초기화
      setForm({
        grade:    userInfo.grade || '',
        classNum: userInfo.class || '',
        name:     '',
        type:     '조퇴',
        reason:   '',
        leaveTime: new Date().toISOString().substring(0, 16),
        returnTime: '',
        guardianContact: '',
        notes: '',
      });
      setStudentNameInput('');
    } catch (err) {
      console.error(`${form.type} 기록 저장 중 오류:`, err);
      alert(`❌ ${form.type} 기록 저장 중 오류가 발생했습니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  // 조퇴/외출 기록 폼 UI를 렌더링합니다.
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">학생 조퇴/외출 기록</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 학년 및 반 정보 (담임교사 정보로 고정 표시) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">학년</label>
              <p className="mt-1 text-sm p-2 border border-gray-200 bg-gray-50 rounded">{form.grade}학년</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">반</label>
              <p className="mt-1 text-sm p-2 border border-gray-200 bg-gray-50 rounded">{form.classNum}반</p>
            </div>
          </div>

          {/* 학생 이름 입력 (자동 완성 기능 포함) */}
          <div className="relative">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">학생 이름</label>
            <input
              type="text"
              name="name"
              id="name"
              value={studentNameInput}
              onChange={handleChange}
              onFocus={() => studentNameInput && studentList.filter(s => s.toLowerCase().startsWith(studentNameInput.toLowerCase())).length > 0 && setShowSuggestions(true)}
              placeholder="학생 이름 입력"
              className="border p-2 w-full rounded text-sm"
              autoComplete="off"
              required
            />
            {showSuggestions && studentList.filter(s => s.toLowerCase().startsWith(studentNameInput.toLowerCase())).length > 0 && (
              <ul 
                className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg"
                onMouseLeave={() => setShowSuggestions(false)}
              >
                {studentList
                  .filter(s => s.toLowerCase().startsWith(studentNameInput.toLowerCase()))
                  .map((name, index) => (
                    <li
                      key={index}
                      onClick={() => handleSuggestionClick(name)}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {name}
                    </li>
                ))}
              </ul>
            )}
          </div>

          {/* 기록 유형 선택 (조퇴/외출) */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">구분</label>
            <select
              name="type"
              id="type"
              value={form.type}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
              required
            >
              <option value="조퇴">조퇴</option>
              <option value="외출">외출</option>
            </select>
          </div>

          {/* 발생 시각 (조퇴/외출 시작 시각) */}
          <div>
            <label htmlFor="leaveTime" className="block text-sm font-medium text-gray-700 mb-1">
              {form.type === '조퇴' ? '조퇴 시각' : '외출 시작 시각'}
            </label>
            <input
              type="datetime-local"
              name="leaveTime"
              id="leaveTime"
              value={form.leaveTime}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
              required
            />
          </div>

          {/* 복귀 예정 시각 (외출 시에만 표시) */}
          {form.type === '외출' && (
            <div>
              <label htmlFor="returnTime" className="block text-sm font-medium text-gray-700 mb-1">복귀 예정 시각</label>
              <input
                type="datetime-local"
                name="returnTime"
                id="returnTime"
                value={form.returnTime}
                onChange={handleChange}
                className="border p-2 w-full rounded text-sm"
                required={form.type === '외출'} // 외출 시 필수
              />
            </div>
          )}
          
          {/* 사유 입력 */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">사유</label>
            <textarea
              name="reason"
              id="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder={`${form.type} 사유를 입력해주세요.`}
              className="border p-2 w-full rounded text-sm h-20 resize-none"
              required
            />
          </div>

          {/* 보호자 연락처 */}
          <div>
            <label htmlFor="guardianContact" className="block text-sm font-medium text-gray-700 mb-1">보호자 연락처</label>
            <input
              type="tel" // 전화번호 입력 타입
              name="guardianContact"
              id="guardianContact"
              value={form.guardianContact}
              onChange={handleChange}
              placeholder="예: 010-1234-5678"
              className="border p-2 w-full rounded text-sm"
              required
            />
          </div>

          {/* 기타 특이사항 */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">기타 특이사항 (선택)</label>
            <textarea
              name="notes"
              id="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="필요시 추가 정보를 입력해주세요."
              className="border p-2 w-full rounded text-sm h-20 resize-none"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white w-full py-2.5 rounded text-sm font-medium disabled:bg-orange-300"
          >
            {isLoading ? '저장 중...' : `${form.type} 기록 저장`}
          </button>
        </form>
      </div>
    </div>
  );
}
