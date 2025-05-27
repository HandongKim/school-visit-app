// d:\school-visit-app\src\components\domain\VisitRequest\BreakVisitForm.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'; // Firestore 함수 임포트

/**
 * @file BreakVisitForm.jsx
 * @description 학생들이 쉬는 시간에 특별실(보건실, 상담실, 복지실 등)을 방문했을 때,
 * 해당 특별실 담당 교사가 방문 기록을 남기는 폼 컴포넌트입니다.
 * 이 기록은 교사의 승인 없이 바로 저장됩니다.
 */

/**
 * BreakVisitForm 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {object} props.userInfo - 현재 로그인한 사용자의 정보 (역할, 이름 등)
 * @returns {JSX.Element} 쉬는 시간 방문 기록 폼 UI
 */
export default function BreakVisitForm({ userInfo }) {
  // userInfo 객체에서 사용자의 역할을 추출합니다.
  const role = userInfo?.role;

  // 역할에 따른 기본 방문 유형(type)을 매핑하는 객체입니다.
  const typeMapping = {
    nurse:     '보건실',
    counselor: '상담실',
    welfare:   '복지실',
  };
  // 현재 로그인한 사용자의 역할이 특별실 담당 교사인지 여부를 판단합니다.
  const isFixedType = ['nurse', 'counselor', 'welfare'].includes(role);
  // 사용자의 역할에 따라 기본 방문 유형을 설정합니다. 특별실 담당이 아니면 '보건실'을 기본값으로 합니다.
  const defaultType = typeMapping[role] || '보건실';

  // 폼 입력 값을 관리하는 상태입니다.
  const [form, setForm] = useState({
    grade:    '', // 학생 학년
    classNum: '', // 학생 반 (Firestore에는 'class'로 저장될 수 있음)
    name:     '', // 학생 이름
    type:     defaultType, // 방문 유형, 역할에 따라 기본값 설정
    reason:   '', // 방문 사유
    // 쉬는 시간 방문이므로 'time' (교시) 필드는 필요 없습니다.
    // 대신 'departureTime' (방문 시간)을 사용합니다.
    departureTime: new Date().toISOString().substring(0, 16), // 현재 시간을 기본값으로 설정 (YYYY-MM-DDTHH:mm 형식)
  });

  // 학생 이름 자동 완성을 위한 학생 목록 상태
  const [studentList, setStudentList] = useState([]);
  // 학생 이름 입력 필드 값 상태 (자동 완성 제어용)
  const [studentNameInput, setStudentNameInput] = useState('');
  // 자동 완성 드롭다운 표시 여부 상태
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 컴포넌트 마운트 시 또는 역할(defaultType, isFixedType) 변경 시 방문 유형(type)을 설정합니다.
  useEffect(() => {
    setForm(f => ({ ...f, type: defaultType }));
  }, [defaultType]);

  // 학생 이름 입력(studentNameInput)이 변경될 때마다 실행됩니다.
  // 입력된 이름으로 시작하는 학생 목록을 Firestore에서 검색하여 자동 완성 제안을 업데이트합니다.
  useEffect(() => {
    const fetchStudents = async () => {
      // 학년, 반, 또는 학생 이름 입력값이 없으면 제안 목록을 비우고 함수를 종료합니다.
      if (!form.grade || !form.classNum || !studentNameInput.trim()) {
        setStudentList([]);
        setShowSuggestions(false);
        return;
      }
      try {
        // Firestore 'students' 컬렉션에서 해당 학년/반의 학생 중,
        // 입력된 이름(studentNameInput)으로 시작하는 학생들을 쿼리합니다.
        // Firestore는 부분 문자열 검색(startsWith)을 직접 지원하지 않으므로,
        // 일반적으로는 입력된 문자열과 같거나 큰 값부터 특정 범위까지 쿼리하는 방식을 사용합니다.
        // 여기서는 간단히 전체 목록을 가져와 필터링하거나, 더 복잡한 검색 로직(예: Algolia)을 고려할 수 있습니다.
        // 이 예제에서는 해당 학년/반 전체 학생을 가져와 클라이언트 측에서 필터링합니다.
        const q = query(
          collection(db, 'students', String(form.grade), String(form.classNum))
        );
        const querySnapshot = await getDocs(q);
        const students = querySnapshot.docs
          .map(doc => doc.data().name)
          .filter(name => name.toLowerCase().startsWith(studentNameInput.toLowerCase())); // 대소문자 구분 없이 필터링

        setStudentList(students);
        setShowSuggestions(students.length > 0); // 제안할 학생이 있으면 드롭다운 표시
      } catch (error) {
        console.error("학생 목록 로드 중 오류:", error);
        setStudentList([]);
        setShowSuggestions(false);
      }
    };

    // 입력값이 있을 때만 학생 검색 실행
    if (studentNameInput.length > 0) {
      fetchStudents();
    } else {
      setStudentList([]);
      setShowSuggestions(false);
    }
  }, [form.grade, form.classNum, studentNameInput]);

  /**
   * 폼 입력 요소의 변경 이벤트를 처리하는 핸들러 함수입니다.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} e - 변경 이벤트 객체
   */
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // 학생 이름 필드인 경우, 자동 완성 제어 상태도 업데이트합니다.
    if (name === 'name') {
      setStudentNameInput(value);
      // 사용자가 직접 이름을 모두 입력했을 수 있으므로,
      // 여기서는 setShowSuggestions(true)를 하지 않고 useEffect에서 처리합니다.
    }
  };

  /**
   * 학생 이름 자동 완성 제안 항목 클릭 시 실행되는 핸들러 함수입니다.
   * @param {string} name - 선택된 학생 이름
   */
  const handleSuggestionClick = (name) => {
    setForm(prev => ({ ...prev, name: name })); // 폼 상태의 학생 이름 업데이트
    setStudentNameInput(name);                  // 입력 필드 값도 업데이트
    setShowSuggestions(false);                  // 제안 드롭다운 숨김
  };


  /**
   * 폼 제출 이벤트를 처리하는 비동기 핸들러 함수입니다.
   * 입력된 쉬는 시간 방문 기록을 Firestore에 저장합니다.
   * @param {React.FormEvent<HTMLFormElement>} e - 폼 제출 이벤트 객체
   */
  const handleSubmit = async e => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

    // 필수 필드 유효성 검사 (학생 정보, 방문 유형, 사유, 방문 시간)
    if (!form.grade || !form.classNum || !form.name.trim() || !form.type || !form.reason.trim() || !form.departureTime) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    // Firestore에 저장할 데이터 객체(payload)를 구성합니다.
    const payload = {
      grade:        form.grade,
      class:        form.classNum, // Firestore 필드명은 'class'로 통일
      name:         form.name.trim(),
      type:         form.type,
      reason:       form.reason.trim(),
      // 쉬는 시간 방문이므로 'time' (교시) 대신 'departureTime' 사용
      departureTime: new Date(form.departureTime), // ISO 문자열을 Date 객체로 변환
      // 쉬는 시간 방문은 교사 승인이 필요 없으므로 status와 confirmed 필드를 다르게 설정
      status:       { homeroom:'승인됨', subject:'승인됨', break: '기록됨' }, // 'break' 상태 추가
      confirmed:    true, // 즉시 확정된 기록으로 처리
      isBreakVisit: true, // 쉬는 시간 방문임을 명시하는 플래그
      createdAt:    serverTimestamp(), // 서버 타임스탬프 사용 (정확한 시간 기록 및 순서 정렬에 유리)
      recordedBy:   userInfo.uid, // 기록한 교사 UID
      teacherName:  userInfo.name, // 기록한 교사 이름
    };

    try {
      // 'visits' 컬렉션에 payload 데이터를 새로운 문서로 추가합니다.
      await addDoc(collection(db, 'visits'), payload);
      alert('✅ 쉬는 시간 방문 기록이 저장되었습니다!');
      // 폼 초기화: 학생 관련 정보(학년, 반, 이름)와 사유, 방문 시간만 초기화
      // 방문 유형(type)은 현재 교사의 기본값으로 유지
      setForm(f => ({
        ...f, // type은 유지
        grade:    '',
        classNum: '',
        name:     '',
        reason:   '',
        departureTime: new Date().toISOString().substring(0, 16), // 현재 시간으로 재설정
      }));
      setStudentNameInput(''); // 학생 이름 입력 필드도 초기화
    } catch (err) {
      console.error("쉬는 시간 방문 기록 저장 중 오류:", err);
      alert('❌ 기록 저장 중 오류가 발생했습니다.');
    }
  };

  // 쉬는 시간 방문 기록 폼 UI를 렌더링합니다.
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-lg"> {/* max-w-lg로 너비 약간 증가 */}
        <h2 className="text-2xl font-semibold mb-6 text-center">쉬는 시간 방문 기록</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 학년 및 반 선택 섹션 */}
          <div className="grid grid-cols-2 gap-4"> {/* grid 사용으로 변경 */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">학년</label>
              <select
                name="grade"
                id="grade"
                value={form.grade}
                onChange={handleChange}
                className="border p-2 w-full rounded text-sm"
                required
              >
                <option value="">학년 선택</option>
                {[1, 2, 3].map(g => (
                  <option key={g} value={String(g)}>{g}학년</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="classNum" className="block text-sm font-medium text-gray-700 mb-1">반</label>
              <select
                name="classNum"
                id="classNum"
                value={form.classNum}
                onChange={handleChange}
                className="border p-2 w-full rounded text-sm"
                required
              >
                <option value="">반 선택</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>{i + 1}반</option>
                ))}
              </select>
            </div>
          </div>

          {/* 학생 이름 입력 (자동 완성 기능 포함) */}
          <div className="relative">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">학생 이름</label>
            <input
              type="text"
              name="name"
              id="name"
              value={studentNameInput} // 자동 완성 제어를 위해 studentNameInput 사용
              onChange={handleChange}   // handleChange는 form.name과 studentNameInput을 모두 업데이트
              onFocus={() => studentNameInput && studentList.length > 0 && setShowSuggestions(true)} // 포커스 시 제안 표시 (조건부)
              // onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // 포커스 아웃 시 제안 숨김 (클릭 이벤트 처리 위해 setTimeout 사용)
              placeholder="학생 이름 입력"
              className="border p-2 w-full rounded text-sm"
              autoComplete="off" // 브라우저 기본 자동 완성 끄기
              required
            />
            {/* 학생 이름 자동 완성 제안 드롭다운 */}
            {showSuggestions && studentList.length > 0 && (
              <ul 
                className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg"
                onMouseLeave={() => setShowSuggestions(false)} // 마우스가 영역을 벗어나면 숨김
              >
                {studentList.map((name, index) => (
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
          
          {/* 방문 유형 선택 섹션 */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">방문 장소</label>
            <select
              name="type"
              id="type"
              value={form.type}
              onChange={handleChange}
              disabled={isFixedType} // 특별실 담당 교사는 본인 특별실로 유형 고정
              className={`border p-2 w-full rounded text-sm ${
                isFixedType ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
            >
              {/* 특별실 담당 교사가 아닐 경우, 사용자가 직접 선택할 수 있도록 옵션 제공 */}
              {!isFixedType && <option value="">장소 선택</option>}
              <option value="보건실">보건실</option>
              <option value="상담실">상담실</option>
              <option value="복지실">복지실</option>
            </select>
          </div>

          {/* 방문 시간 입력 섹션 */}
          <div>
            <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700 mb-1">방문 시간</label>
            <input
              type="datetime-local" // 날짜와 시간을 함께 입력받는 타입
              name="departureTime"
              id="departureTime"
              value={form.departureTime}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
              required
            />
          </div>
          
          {/* 방문 사유 입력 섹션 */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">방문 사유</label>
            <textarea
              name="reason"
              id="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="방문 사유를 간략히 입력해주세요."
              className="border p-2 w-full rounded text-sm h-20 resize-none" // 높이 조절
              required
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white w-full py-2.5 rounded text-sm font-medium"
          >
            방문 기록 저장
          </button>
        </form>
      </div>
    </div>
  );
}
