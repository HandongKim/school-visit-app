// src/components/domain/VisitRequest/VisitRequestForm.jsx

import React, { useState, useEffect } from 'react';
// Firebase 설정을 alias 경로로 import (@ maps to src/)
import { db } from '../../../firebase/firebaseConfig';
// Firestore에 문서 추가 및 조회를 위한 함수들
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function VisitRequestForm() {
  // -- 폼 상태 관리 --------------------------------------------
  const [form, setForm] = useState({
    grade:         '',         // 학년
    class:         '',         // 반
    name:          '',         // 학생 이름
    time:          '1교시',    // 요청 교시
    reason:        '',         // 요청 사유
    type:          '보건실',   // 방문 유형
    breakVisit:    false,      // 쉬는 시간 방문 여부
    departureTime: ''          // 쉬는 시간 방문 시 출발 시간
  });
  // 학생 목록
  const [studentsList, setStudentsList] = useState([]);

  // -- 반/학년 변경 시 학생 목록 로드 -----------------------------
  useEffect(() => {
    const { grade, class: cls } = form;
    if (grade && cls) {
      async function fetchStudents() {
        const snap = await getDocs(
          collection(db, 'students', grade, cls)
        );
        setStudentsList(
          snap.docs.map(d => ({ id: d.id, name: d.data().name }))
        );
      }
      fetchStudents();
    } else {
      setStudentsList([]);
      setForm(prev => ({ ...prev, name: '' }));
    }
  }, [form.grade, form.class]);

  // -- 입력값 변경 핸들러 --------------------------------------
  const handleChange = e => {
    const { name, type, value, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: fieldValue }));
  };

  // -- 폼 제출 핸들러 ----------------------------------------
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const docData = {
        grade:      form.grade,
        class:      form.class,
        name:       form.name,
        reason:     form.reason,
        type:       form.type,
        status:     { homeroom: '대기', subject: '대기' },
        confirmed:  false,
        breakVisit: form.breakVisit,
        createdAt:  new Date(),
      };
      if (form.breakVisit) {
        docData.departureTime = new Date(form.departureTime);
      } else {
        docData.time = form.time;
      }
      await addDoc(collection(db, 'visits'), docData);
      alert('✅ 방문 요청이 저장되었습니다!');
      setForm({
        grade:         '',
        class:         '',
        name:          '',
        time:          '1교시',
        reason:        '',
        type:          '보건실',
        breakVisit:    false,
        departureTime: ''
      });
      setStudentsList([]);
    } catch (error) {
      console.error('요청 저장 실패:', error);
      alert('❌ 요청 저장 중 오류가 발생했습니다.');
    }
  };

  // -- 렌더링 -----------------------------------------------
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          학생 방문 요청
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 학년 선택 */}
          <select
            name="grade"
            value={form.grade}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded text-sm"
            required
          >
            <option value="">학년 선택</option>
            {[1, 2, 3].map(g => (
              <option key={g} value={String(g)}>
                {g}학년
              </option>
            ))}
          </select>

          {/* 반 선택 */}
          <select
            name="class"
            value={form.class}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded text-sm"
            required
          >
            <option value="">반 선택</option>
            {[...Array(5)].map((_, i) => (
              <option key={i+1} value={String(i+1)}>
                {i+1}반
              </option>
            ))}
          </select>

          {/* 학생 선택 */}
          <select
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded text-sm"
            required
            disabled={!studentsList.length}
          >
            <option value="">학생 선택</option>
            {studentsList.map(s => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          {/* 쉬는 시간 방문 체크 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="breakVisit"
              id="breakVisit"
              checked={form.breakVisit}
              onChange={handleChange}
            />
            <label htmlFor="breakVisit" className="text-sm">
              쉬는 시간 방문
            </label>
          </div>

          {/* 교시 선택 또는 출발 시간 입력 */}
          {form.breakVisit ? (
            <div>
              <label className="block mb-1 text-sm">출발 시간</label>
              <input
                type="datetime-local"
                name="departureTime"
                value={form.departureTime}
                onChange={handleChange}
                className="border border-gray-300 p-2 w-full rounded text-sm"
                required
              />
            </div>
          ) : (
            <select
              name="time"
              value={form.time}
              onChange={handleChange}
              className="border border-gray-300 p-2 w-full rounded text-sm"
            >
              {['1교시','2교시','3교시','4교시','5교시','6교시','7교시'].map(
                period => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                )
              )}
            </select>
          )}

          {/* 사유 입력 */}
          <input
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="사유"
            className="border border-gray-300 p-2 w-full rounded text-sm"
            required
          />

          {/* 유형 선택 */}
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded text-sm"
          >
            <option value="보건실">보건실</option>
            <option value="상담실">상담실</option>
          </select>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="bg-blue-500 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-600 w-full transition"
          >
            요청 저장
          </button>
        </form>
      </div>
    </div>
  );
}
