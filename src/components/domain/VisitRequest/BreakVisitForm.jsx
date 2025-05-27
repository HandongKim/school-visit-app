// src/components/domain/VisitRequest/BreakVisitForm.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebaseConfig';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';

/**
 * 쉬는 시간 방문 기록 폼 컴포넌트.
 * 학생의 학년, 반, 이름, 방문 유형, 사유, 출발 시간을 입력받아 Firestore에 저장합니다.
 * 사용자의 역할(userInfo.role)에 따라 방문 유형(type)이 고정될 수 있습니다.
 *
 * @param {object} props - 컴포넌트 props.
 * @param {object} props.userInfo - 현재 로그인한 사용자 정보.
 * @param {string} [props.userInfo.role] - 사용자 역할 (e.g., 'nurse', 'counselor', 'welfare', 'homeroom').
 * @param {string} [props.userInfo.grade] - 사용자가 담임일 경우 담당 학년.
 * @param {string} [props.userInfo.class] - 사용자가 담임일 경우 담당 반.
 */
export default function BreakVisitForm({ userInfo }) {
  // 사용자 역할
  const role = userInfo?.role;

  // 역할에 따른 방문 유형 매핑
  const typeMapping = {
    nurse: '보건실',
    counselor: '상담실',
    welfare: '복지실',
  };
  // 특정 역할(보건교사, 상담교사, 복지교사)은 방문 유형이 고정되는지 여부
  const isFixedType = ['nurse', 'counselor', 'welfare'].includes(role);
  // 기본 방문 유형 설정 (역할에 따라 매핑된 값이 없으면 '보건실'로 기본 설정)
  const defaultType = typeMapping[role] || '보건실';

  // 폼 데이터 상태 관리
  const [form, setForm] = useState({
    // 사용자 정보가 있으면 해당 학년/반으로 초기화, 없으면 빈 문자열
    grade: userInfo?.grade || '',
    class: userInfo?.class || '',
    name: '',
    // 방문 유형: 역할에 따라 고정된 유형 또는 기본 유형으로 초기화
    type: defaultType,
    reason: '',
    // 출발 시간: 현재 시간으로 초기화 (YYYY-MM-DDTHH:mm 형식)
    departureTime: new Date().toISOString().slice(0,16),
  });

  // 컴포넌트 마운트 시 또는 defaultType, isFixedType 변경 시 방문 유형 업데이트
  useEffect(() => {
    if (isFixedType) setForm(f => ({ ...f, type: defaultType }));
  }, [defaultType, isFixedType]);

  // 학생 목록 상태 관리
  const [studentList, setStudentList] = useState([]);

  // 학년 또는 반이 변경될 때 학생 목록을 불러오는 useEffect
  useEffect(() => {
    /**
     * 선택된 학년과 반에 해당하는 학생 목록을 Firestore에서 불러옵니다.
     * 담임 교사(homeroom) 역할이 아닐 경우에만 실행됩니다.
     */
    async function loadStudents() {
      // 학년 또는 반이 선택되지 않았으면 학생 목록을 비우고 반환
      if (!form.grade || !form.class) { setStudentList([]); return; }
      // Firestore 'students' 컬렉션에서 해당 학년/반 경로로 쿼리 생성
      const q = query(collection(db, 'students', form.grade, form.class));
      const snap = await getDocs(q);
      // 불러온 학생 데이터에서 이름만 추출하여 목록 업데이트
      setStudentList(snap.docs.map(d => d.data().name));
    }
    // 담임 교사가 아닌 경우에만 학생 목록 로드 함수 호출
    if (role !== 'homeroom') loadStudents();
  }, [form.grade, form.class, role]);

  // 폼 입력 값 변경 핸들러
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async e => {
    e.preventDefault();
    // Firestore에 저장할 데이터 페이로드 구성
    const payload = {
      grade: form.grade,
      class: form.class,
      name: form.name,
      type: form.type,
      reason: form.reason,
      breakVisit: true, // 쉬는 시간 방문 여부 표시
      time: null, // 일반 방문 시 사용되는 '교시' 정보는 null로 설정
      departureTime: new Date(form.departureTime),
      // 쉬는 시간 방문은 담임/교과 교사 승인이 자동으로 '승인' 처리됨
      status: { homeroom: '승인', subject: '승인' },
      confirmed: true,
      createdAt: new Date(),
    };
    try {
      // 'visits' 컬렉션에 방문 기록 추가
      await addDoc(collection(db, 'visits'), payload);
      alert('✅ 쉬는 시간 방문이 기록되었습니다!');
      // 제출 후 폼 일부 필드 초기화 (이름, 사유, 출발 시간)
      setForm(f => ({
        ...f,
        name: '',
        reason: '',
        departureTime: new Date().toISOString().slice(0,16),
      }));
    } catch (err) {
      console.error(err);
      alert('❌ 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">쉬는 시간 방문 기록</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 학년 및 반 선택 */}
          <div className="flex gap-2">
            <select
              name="grade"
              value={form.grade}
              onChange={handleChange}
              className="border p-2 rounded w-1/2 text-sm"
              required
            >
              <option value="">학년</option>
              {[1,2,3].map(g => (
                <option key={g} value={String(g)}>{g}학년</option>
              ))}
            </select>
            <select
              name="class"
              value={form.class}
              onChange={handleChange}
              className="border p-2 rounded w-1/2 text-sm"
              required
            >
              <option value="">반</option>
              {[...Array(5)].map((_,i)=>(
                <option key={i+1} value={String(i+1)}>{i+1}반</option>
              ))}
            </select>
          </div>
          {/* 학생 이름 입력: 학생 목록이 있으면 드롭다운, 없으면 직접 입력 */}
          {studentList.length > 0 ? (
            <select
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
              required
            >
              <option value="">학생 선택</option>
              {studentList.map(n=>(
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          ) : (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름"
              className="border p-2 w-full rounded text-sm"
              required
            />
          )}
          {/* 방문 유형 선택 (역할에 따라 비활성화될 수 있음) */}
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            disabled={isFixedType}
            className="border p-2 w-full rounded text-sm"
            required
          >
            <option value="보건실">보건실</option>
            <option value="상담실">상담실</option>
            <option value="복지실">복지실</option>
          </select>
          {/* 출발 시간 선택 */}
          <input
            type="datetime-local"
            name="departureTime"
            value={form.departureTime}
            onChange={handleChange}
            className="border p-2 w-full rounded text-sm"
            required
          />
          {/* 방문 사유 입력 */}
          <input
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="사유"
            className="border p-2 w-full rounded text-sm"
            required
          />
          {/* 제출 버튼 */}
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded text-sm">
            기록하기
          </button>
        </form>
      </div>
    </div>
  );
}
