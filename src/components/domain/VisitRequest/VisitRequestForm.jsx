// d/school-visit-app/src/components/domain/VisitRequest/VisitRequestForm.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebaseConfig';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';

export default function VisitRequestForm({ userInfo }) {
  const role = userInfo?.role;

  // 역할별 기본 타입 매핑
  const typeMapping = {
    nurse:     '보건실',
    counselor: '상담실',
    welfare:   '복지실',
  };
  const isFixedType = ['nurse', 'counselor', 'welfare'].includes(role);
  const defaultType = typeMapping[role] || '보건실'; // 기본값은 보건실로 설정

  // form state
  const [form, setForm] = useState({
    grade:    userInfo?.grade   || '',
    class:    userInfo?.class   || '',
    name:     '',
    type:     '', // 초기에는 빈 문자열, useEffect에서 역할에 따라 설정됨
    reason:   '',
    time:     '1교시', // 쉬는 시간 방문이 없어졌으므로 항상 교시 선택
    // breakVisit: false, // 쉬는 시간 방문 관련 상태 제거
    // departureTime:  '', // 쉬는 시간 방문 관련 상태 제거
  });

  // userInfo.role 이 들어오면 type 을 기본값으로 설정
  useEffect(() => {
    if (isFixedType) {
      setForm(f => ({ ...f, type: defaultType }));
    } else {
      // isFixedType이 아닌 경우 (예: 교과교사 등) 기본 타입을 '보건실'로 설정하거나,
      // 사용자가 직접 선택하도록 빈 문자열로 둘 수 있습니다.
      // 여기서는 '보건실'을 기본으로 설정합니다.
      setForm(f => ({ ...f, type: '보건실' }));
    }
  }, [defaultType, isFixedType]); // defaultType과 isFixedType이 변경될 때 실행

  // 학생 목록 로드 (담임교사는 로드 안 함)
  const [studentList, setStudentList] = useState([]);
  useEffect(() => {
    async function loadStudents() {
      if (!form.grade || !form.class) {
        setStudentList([]);
        return;
      }
      const q = query(
        collection(db, 'students', form.grade, form.class)
      );
      const snap = await getDocs(q);
      setStudentList(snap.docs.map(d => d.data().name));
    }
    // 담임교사가 아닌 경우에만 학생 목록을 로드합니다.
    if (role !== 'homeroom') {
      loadStudents();
    }
  }, [form.grade, form.class, role]); // 학년, 반, 또는 역할이 변경될 때 실행

  const handleChange = e => {
    const { name, value } = e.target; // type, checked는 이제 사용하지 않음
    setForm(prev => ({
      ...prev,
      [name]: value // 체크박스가 없으므로 간단하게 value만 할당
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // 필수 필드 유효성 검사 (type이 비어있는 경우)
    if (!form.type) {
      alert('방문 유형을 선택해주세요.');
      return;
    }

    const payload = {
      grade:        form.grade,
      class:        form.class,
      name:         form.name,
      type:         form.type,
      reason:       form.reason,
      time:         form.time, // 항상 form.time 사용
      // breakVisit:   form.breakVisit, // 제거
      // departureTime: form.breakVisit ? new Date(form.departureTime) : null, // 제거
      status:       { homeroom:'대기', subject:'대기' }, // 수업 중 방문은 항상 승인 대기
      confirmed:    false,
      createdAt:    new Date(),
    };
    try {
      await addDoc(collection(db, 'visits'), payload);
      alert('✅ 방문 신청이 저장되었습니다!');
      // 폼 초기화 시, 학생 이름, 사유, 시간만 초기화하고 학년, 반, 유형은 유지
      setForm(f => ({
        ...f,
        name:         '',
        reason:       '',
        time:         '1교시',
        // breakVisit:   false, // 제거
        // departureTime:'' // 제거
      }));
    } catch (err) {
      console.error("신청 저장 중 오류:", err);
      alert('❌ 신청 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">수업 중 방문 신청</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 학년·반 */}
          <div className="flex gap-2">
            <select
              name="grade"
              value={form.grade}
              onChange={handleChange}
              disabled={role === 'homeroom'} // 담임교사는 학년 변경 불가
              className={`border p-2 rounded w-1/2 text-sm ${
                role === 'homeroom' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
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
              disabled={role === 'homeroom'} // 담임교사는 반 변경 불가
              className={`border p-2 rounded w-1/2 text-sm ${
                role === 'homeroom' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
            >
              <option value="">반</option>
              {[...Array(12)].map((_,i)=>( // 반 개수를 12개까지 늘림 (필요에 따라 조절)
                <option key={i+1} value={String(i+1)}>{i+1}반</option>
              ))}
            </select>
          </div>

          {/* 학생 이름 */}
          {/* 담임교사가 아니고, 학생 목록이 있을 때만 select 표시 */}
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
          ) : (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="학생 이름"
              className="border p-2 w-full rounded text-sm"
              required
            />
          )}

          {/* 방문 유형 */}
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            disabled={isFixedType} // 특별실 교사는 유형 변경 불가
            className={`border p-2 w-full rounded text-sm ${
              isFixedType ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            required
          >
            {/* isFixedType이 아닐 경우, 사용자가 선택할 수 있도록 빈 옵션 추가 */}
            {!isFixedType && <option value="">방문할 곳 선택</option>}
            <option value="보건실">보건실</option>
            <option value="상담실">상담실</option>
            <option value="복지실">복지실</option>
            {/* 필요시 다른 유형 추가 */}
          </select>

          {/* 쉬는 시간 방문 여부 - 이 섹션 전체 제거됨 */}
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

          {/* 시간 (교시) - 항상 표시 */}
          <select
            name="time"
            value={form.time}
            onChange={handleChange}
            className="border p-2 w-full rounded text-sm"
            required // 수업 중 방문이므로 시간은 필수
          >
            {/* 교시 옵션 */}
            {['1교시','2교시','3교시','4교시','5교시','6교시','7교시', '8교시'].map(p=>( // 8교시까지 추가
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          
          {/* 사유 */}
          <textarea // input 대신 textarea로 변경하여 여러 줄 입력 가능하도록 함
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="방문 사유를 구체적으로 입력해주세요."
            className="border p-2 w-full rounded text-sm h-24 resize-none" // 높이 조절 및 리사이즈 방지
            required
          />

          {/* 제출 */}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2.5 rounded text-sm font-medium" // py 값 및 font-medium 추가
          >
            방문 신청하기
          </button>
        </form>
      </div>
    </div>
  );
}
