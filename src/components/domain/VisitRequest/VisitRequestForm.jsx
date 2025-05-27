// d:\school-visit-app\src\components\domain\VisitRequest\VisitRequestForm.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, addDoc, getDocs, query } from 'firebase/firestore'; // Firestore 함수 임포트

/**
 * @file VisitRequestForm.jsx
 * @description 학생들이 수업 중 특별실(보건실, 상담실, 복지실 등) 방문을 신청하는 폼 컴포넌트입니다.
 * 사용자의 역할(userInfo.role)에 따라 폼의 일부 필드가 자동으로 채워지거나 비활성화될 수 있습니다.
 * 신청 내용은 Firestore 'visits' 컬렉션에 저장됩니다.
 */

/**
 * VisitRequestForm 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {object} props.userInfo - 현재 로그인한 사용자의 정보 (역할, 학년, 반 등)
 * @returns {JSX.Element} 방문 신청 폼 UI
 */
export default function VisitRequestForm({ userInfo }) {
  // userInfo 객체에서 사용자의 역할을 추출합니다. (Optional Chaining 사용)
  const role = userInfo?.role;

  // 역할에 따른 기본 방문 유형(type)을 매핑하는 객체입니다.
  const typeMapping = {
    nurse:     '보건실',
    counselor: '상담실',
    welfare:   '복지실',
  };
  // 현재 로그인한 사용자의 역할이 특별실 담당 교사(nurse, counselor, welfare)인지 여부를 판단합니다.
  const isFixedType = ['nurse', 'counselor', 'welfare'].includes(role);
  // 사용자의 역할에 따라 기본 방문 유형을 설정합니다. 특별실 담당이 아니거나 매핑되는 역할이 없으면 '보건실'을 기본값으로 합니다.
  const defaultType = typeMapping[role] || '보건실';

  // 폼 입력 값을 관리하는 상태(state)입니다.
  const [form, setForm] = useState({
    grade:    userInfo?.grade   || '', // 사용자의 학년 정보가 있으면 기본값으로, 없으면 빈 문자열
    class:    userInfo?.class   || '', // 사용자의 반 정보가 있으면 기본값으로, 없으면 빈 문자열
    name:     '',                     // 학생 이름
    type:     '',                     // 방문 유형 (예: 보건실), useEffect에서 역할에 따라 초기화됨
    reason:   '',                     // 방문 사유
    time:     '1교시',                // 방문 희망 교시 (쉬는 시간 방문 기능이 제거되었으므로 항상 교시 선택)
    // breakVisit: false,             // 쉬는 시간 방문 여부 (제거됨)
    // departureTime:  '',             // 쉬는 시간 방문 시 출발 시각 (제거됨)
  });

  // 컴포넌트 마운트 시 또는 defaultType, isFixedType이 변경될 때 실행됩니다.
  // 사용자의 역할에 따라 'type' 필드의 초기값을 설정합니다.
  useEffect(() => {
    if (isFixedType) { // 특별실 담당 교사인 경우
      setForm(f => ({ ...f, type: defaultType })); // 해당 특별실로 유형 고정
    } else { // 그 외 역할인 경우 (예: 교과교사 등)
      // 기본적으로 '보건실'을 선택하도록 설정합니다.
      // 또는 사용자가 직접 선택하도록 빈 문자열로 둘 수도 있습니다: setForm(f => ({ ...f, type: '' }));
      setForm(f => ({ ...f, type: '보건실' }));
    }
  }, [defaultType, isFixedType]); // defaultType 또는 isFixedType이 변경될 때마다 이 효과를 다시 실행합니다.

  // 학생 목록을 저장하는 상태입니다. (학년, 반 선택 시 해당 반 학생 목록을 불러옴)
  const [studentList, setStudentList] = useState([]);

  // form.grade, form.class, 또는 role 상태가 변경될 때 실행됩니다.
  // 담임교사가 아닌 경우, 선택된 학년/반의 학생 목록을 Firestore에서 불러옵니다.
  useEffect(() => {
    async function loadStudents() {
      // 학년 또는 반 정보가 없으면 학생 목록을 비우고 함수를 종료합니다.
      if (!form.grade || !form.class) {
        setStudentList([]);
        return;
      }
      // Firestore 'students' 컬렉션 내의 해당 학년/반 경로에서 학생 데이터를 쿼리합니다.
      const q = query(
        collection(db, 'students', form.grade, form.class)
      );
      const snap = await getDocs(q); // 쿼리 실행
      // 가져온 문서들에서 학생 이름만 추출하여 studentList 상태에 저장합니다.
      setStudentList(snap.docs.map(d => d.data().name));
    }

    // 사용자의 역할이 'homeroom'(담임교사)이 아닌 경우에만 학생 목록을 로드합니다.
    // 담임교사는 본인 반 학생 정보를 직접 입력하거나 다른 방식으로 처리할 수 있습니다.
    if (role !== 'homeroom') {
      loadStudents();
    }
  }, [form.grade, form.class, role]); // form.grade, form.class, role 중 하나라도 변경되면 이 효과를 다시 실행합니다.

  /**
   * 폼 입력 요소의 변경 이벤트를 처리하는 핸들러 함수입니다.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} e - 변경 이벤트 객체
   */
  const handleChange = e => {
    const { name, value } = e.target; // 변경된 입력 요소의 name과 value를 가져옵니다.
    // 이전 폼 상태를 기반으로 변경된 필드의 값만 업데이트합니다.
    setForm(prev => ({
      ...prev,
      [name]: value // name 속성값을 키로 사용하여 동적으로 상태 업데이트
    }));
  };

  /**
   * 폼 제출 이벤트를 처리하는 비동기 핸들러 함수입니다.
   * 입력된 방문 신청 정보를 Firestore에 저장합니다.
   * @param {React.FormEvent<HTMLFormElement>} e - 폼 제출 이벤트 객체
   */
  const handleSubmit = async e => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

    // 필수 필드 유효성 검사: 방문 유형(type)이 선택되지 않았으면 알림을 표시하고 함수를 종료합니다.
    if (!form.type) {
      alert('방문 유형을 선택해주세요.');
      return;
    }

    // Firestore에 저장할 데이터 객체(payload)를 구성합니다.
    const payload = {
      grade:        form.grade,
      class:        form.class,
      name:         form.name,
      type:         form.type,
      reason:       form.reason,
      time:         form.time, // 항상 form.time (교시) 사용
      // breakVisit:   form.breakVisit, // 쉬는 시간 방문 관련 필드 제거
      // departureTime: form.breakVisit ? new Date(form.departureTime) : null, // 제거
      status:       { homeroom:'대기', subject:'대기' }, // 수업 중 방문은 항상 담임/교과교사 승인 대기 상태로 시작
      confirmed:    false, // 최종 승인 여부 (초기값은 false)
      createdAt:    new Date(), // 신청 생성 시각
    };

    try {
      // 'visits' 컬렉션에 payload 데이터를 새로운 문서로 추가합니다.
      await addDoc(collection(db, 'visits'), payload);
      alert('✅ 방문 신청이 저장되었습니다!');
      // 신청 성공 후 폼의 일부 필드를 초기화합니다.
      // 학년, 반, 방문 유형은 유지하고 학생 이름, 사유, 시간만 초기화합니다.
      setForm(f => ({
        ...f,
        name:         '',
        reason:       '',
        time:         '1교시', // 시간은 기본값 '1교시'로
        // breakVisit:   false, // 제거
        // departureTime:''    // 제거
      }));
    } catch (err) {
      console.error("신청 저장 중 오류:", err);
      alert('❌ 신청 저장 중 오류가 발생했습니다.');
    }
  };

  // 방문 신청 폼 UI를 렌더링합니다.
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">수업 중 방문 신청</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 학년 및 반 선택 섹션 */}
          <div className="flex gap-2">
            <select
              name="grade"
              value={form.grade}
              onChange={handleChange}
              disabled={role === 'homeroom'} // 담임교사는 본인 학년으로 고정 (변경 불가)
              className={`border p-2 rounded w-1/2 text-sm ${
                role === 'homeroom' ? 'bg-gray-100 cursor-not-allowed' : '' // 담임교사일 경우 비활성화 스타일 적용
              }`}
              required // 필수 입력 필드
            >
              <option value="">학년</option>
              {[1,2,3].map(g=>(
                <option key={g} value={String(g)}>{g}학년</option>
              ))}
            </select>
            <select
              name="class"
              value={form.class}
              onChange={handleChange}
              disabled={role === 'homeroom'} // 담임교사는 본인 반으로 고정 (변경 불가)
              className={`border p-2 rounded w-1/2 text-sm ${
                role === 'homeroom' ? 'bg-gray-100 cursor-not-allowed' : '' // 담임교사일 경우 비활성화 스타일 적용
              }`}
              required // 필수 입력 필드
            >
              <option value="">반</option>
              {[...Array(12)].map((_,i)=>( // 1반부터 12반까지 옵션 생성
                <option key={i+1} value={String(i+1)}>{i+1}반</option>
              ))}
            </select>
          </div>

          {/* 학생 이름 입력/선택 섹션 */}
          {/* 담임교사가 아니고, 불러온 학생 목록이 있을 때만 드롭다운(select)으로 표시 */}
          {role !== 'homeroom' && studentList.length > 0 ? (
            <select
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
              required
            >
              <option value="">학생 선택</option>
              {studentList.map(name=>(
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          ) : ( // 그 외의 경우 (담임교사이거나, 학생 목록이 없거나 로드 전) 직접 입력(input) 필드 표시
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="학생 이름"
              className="border p-2 w-full rounded text-sm"
              required
            />
          )}

          {/* 방문 유형 선택 섹션 */}
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            disabled={isFixedType} // 특별실 담당 교사는 본인 특별실로 유형 고정 (변경 불가)
            className={`border p-2 w-full rounded text-sm ${
              isFixedType ? 'bg-gray-100 cursor-not-allowed' : '' // 특별실 교사일 경우 비활성화 스타일 적용
            }`}
            required
          >
            {/* 특별실 담당 교사가 아닐 경우, 사용자가 직접 선택할 수 있도록 기본 빈 옵션 추가 */}
            {!isFixedType && <option value="">방문할 곳 선택</option>}
            <option value="보건실">보건실</option>
            <option value="상담실">상담실</option>
            <option value="복지실">복지실</option>
            {/* 필요시 다른 방문 유형 옵션 추가 가능 */}
          </select>

          {/* 쉬는 시간 방문 여부 체크박스 - 이 섹션은 기능 변경으로 인해 전체 제거됨 */}
          {/* 
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="breakVisit"
              checked={form.breakVisit}
              onChange={handleChange}
              id="breakVisit"
            />
            <label htmlFor="breakVisit">쉬는 시간 방문</label>
          </div>
          */}

          {/* 방문 희망 시간(교시) 선택 섹션 - 항상 표시됨 */}
          <select
            name="time"
            value={form.time}
            onChange={handleChange}
            className="border p-2 w-full rounded text-sm"
            required // 수업 중 방문이므로 시간 선택은 필수
          >
            {/* 1교시부터 8교시까지 옵션 생성 */}
            {['1교시','2교시','3교시','4교시','5교시','6교시','7교시', '8교시'].map(p=>(
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          
          {/* 방문 사유 입력 섹션 */}
          <textarea // 여러 줄 입력이 가능하도록 input 대신 textarea 사용
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="방문 사유를 구체적으로 입력해주세요."
            className="border p-2 w-full rounded text-sm h-24 resize-none" // 높이 고정, 리사이즈 불가
            required
          />

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2.5 rounded text-sm font-medium"
          >
            방문 신청하기
          </button>
        </form>
      </div>
    </div>
  );
}
