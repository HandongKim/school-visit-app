// src/components/domain/VisitRequest/VisitRequestForm.jsx

import React, { useState } from 'react';
// Firebase 설정을 alias 경로로 import (@ maps to src/)
import { db } from '@/firebase/firebaseConfig';
// Firestore에 문서 추가를 위한 함수들
import { collection, addDoc } from 'firebase/firestore';

export default function VisitRequestForm() {
  // -- 폼 상태 관리 --------------------------------------------
  const [form, setForm] = useState({
    grade:  '',        // 학년
    class:  '',        // 반
    name:   '',        // 학생 이름
    time:   '1교시',   // 요청 교시
    reason: '',        // 요청 사유
    type:   '보건실',  // 방문 유형: 보건실 또는 상담실
  });

  // -- 입력값 변경 핸들러 --------------------------------------
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // -- 폼 제출 핸들러 ----------------------------------------
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // visits 컬렉션에 새 요청 문서 추가
      await addDoc(collection(db, 'visits'), {
        ...form,
        status: {
          homeroom: '대기',
          subject:  '대기',
        },
        confirmed: false,
        createdAt: new Date(),
      });
      alert('✅ 방문 요청이 저장되었습니다!');
      // 폼 초기화
      setForm({
        grade:  '',
        class:  '',
        name:   '',
        time:   '1교시',
        reason: '',
        type:   '보건실',
      });
    } catch (error) {
      console.error('요청 저장 실패:', error);
      alert('❌ 요청 저장 중 오류가 발생했습니다.');
    }
  };

  // -- 렌더링 -----------------------------------------------
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
        {/* 제목 */}
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          학생 방문 요청
        </h2>

        {/* 요청 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 학년 / 반 입력 */}
          <div className="flex gap-2">
            <input
              name="grade"
              value={form.grade}
              onChange={handleChange}
              placeholder="학년"
              className="border border-gray-300 p-2 rounded w-1/2 text-sm"
              required
            />
            <input
              name="class"
              value={form.class}
              onChange={handleChange}
              placeholder="반"
              className="border border-gray-300 p-2 rounded w-1/2 text-sm"
              required
            />
          </div>

          {/* 이름 입력 */}
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="이름"
            className="border border-gray-300 p-2 rounded w-full text-sm"
            required
          />

          {/* 교시 선택 */}
          <select
            name="time"
            value={form.time}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded text-sm"
          >
            {['1교시','2교시','3교시','4교시','5교시','6교시','7교시'].map(period => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>

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
