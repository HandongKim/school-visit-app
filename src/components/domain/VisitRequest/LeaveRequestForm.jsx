// src/components/domain/VisitRequest/LeaveRequestForm.jsx

import React, { useState } from 'react';
// Firebase 설정을 alias 경로로 import (@ maps to src/)
import { db } from '../../../firebase/firebaseConfig';
// Firestore에 문서 추가를 위한 함수들
import { collection, addDoc } from 'firebase/firestore';

export default function LeaveRequestForm() {
  // -- 폼 상태 관리 --------------------------------------------
  const [form, setForm] = useState({
    grade: '',         // 학년
    class: '',         // 반
    name: '',          // 학생 이름
    hour: '08',        // 시 (기본값 08)
    minute: '00',      // 분 (기본값 00)
    reason: '',        // 조퇴/외출 사유
    type: '조퇴',      // 유형: 조퇴 또는 외출
  });

  // -- 입력값 변경 핸들러 --------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // -- 폼 제출 핸들러 ----------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    // "HH:MM" 형식 시간 문자열 생성
    const time = `${form.hour}:${form.minute}`;

    try {
      // 'leaves' 컬렉션에 새 문서 추가
      await addDoc(collection(db, 'leaves'), {
        grade:    form.grade,
        class:    form.class,
        name:     form.name,
        time,
        reason:   form.reason,
        type:     form.type,
        createdAt: new Date(),  // 생성 시간
      });
      alert('✅ 조퇴/외출 기록이 저장되었습니다!');
      // 폼 초기화
      setForm({
        grade: '', class: '', name: '',
        hour: '08', minute: '00',
        reason: '', type: '조퇴',
      });
    } catch (error) {
      console.error('저장 실패:', error);
      alert('❌ 기록 저장 중 오류가 발생했습니다.');
    }
  };

  // -- 시/분 옵션 배열 ----------------------------------------
  const hourOptions   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minuteOptions = ['00', '10', '20', '30', '40', '50'];

  return (
    <div className="max-w-md mx-auto p-4 border rounded-xl shadow bg-white">
      {/* 제목 */}
      <h2 className="text-xl font-bold mb-4 text-center">조퇴/외출 기록</h2>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 학년/반 입력 */}
        <div className="grid grid-cols-2 gap-2">
          <input
            name="grade"
            value={form.grade}
            onChange={handleChange}
            placeholder="학년"
            className="border p-2 rounded text-sm"
            required
          />
          <input
            name="class"
            value={form.class}
            onChange={handleChange}
            placeholder="반"
            className="border p-2 rounded text-sm"
            required
          />
        </div>

        {/* 이름 입력 */}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="이름"
          className="border p-2 w-full rounded text-sm"
          required
        />

        {/* 시간 선택: 시 / 분 */}
        <div className="grid grid-cols-2 gap-2">
          <select
            name="hour"
            value={form.hour}
            onChange={handleChange}
            className="border p-2 rounded text-sm"
          >
            {hourOptions.map(hour => (
              <option key={hour} value={hour}>
                {hour}시
              </option>
            ))}
          </select>
          <select
            name="minute"
            value={form.minute}
            onChange={handleChange}
            className="border p-2 rounded text-sm"
          >
            {minuteOptions.map(min => (
              <option key={min} value={min}>
                {min}분
              </option>
            ))}
          </select>
        </div>

        {/* 사유 입력 */}
        <input
          name="reason"
          value={form.reason}
          onChange={handleChange}
          placeholder="사유"
          className="border p-2 w-full rounded text-sm"
          required
        />

        {/* 조퇴/외출 유형 선택 */}
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border p-2 w-full rounded text-sm"
        >
          <option value="조퇴">조퇴</option>
          <option value="외출">외출</option>
        </select>

        {/* 제출 버튼 */}
        <button
          type="submit"
          className="bg-blue-500 text-white text-sm px-4 py-2 rounded hover:bg-blue-600 w-full"
        >
          기록 저장
        </button>
      </form>
    </div>
  );
}
