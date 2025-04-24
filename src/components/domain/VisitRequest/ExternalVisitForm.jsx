// src/components/domain/VisitRequest/ExternalVisitForm.jsx

import React, { useState } from 'react';
// Firebase 설정을 alias 경로로 import (@ maps to src/)
import { db } from '@/firebase/firebaseConfig';
// Firestore에 문서 추가를 위한 함수
import { collection, addDoc } from 'firebase/firestore';

export default function ExternalVisitForm() {
  // -- 입력 폼 상태 관리 ------------------------------------
  const [name, setName]       = useState('');  // 방문자 이름
  const [hour, setHour]       = useState('');  // 시 (00~23)
  const [minute, setMinute]   = useState('');  // 분 (00,10,...,50)
  const [reason, setReason]   = useState('');  // 방문 사유
  const [message, setMessage] = useState('');  // 성공/오류 메시지

  // -- 폼 제출 핸들러 --------------------------------------
  const handleSubmit = async () => {
    // 필수 입력 체크
    if (!name || !hour || !minute || !reason) {
      setMessage('모든 항목을 입력해주세요.');
      return;
    }

    // 시·분을 합쳐 "HH:MM" 형식 문자열 생성
    const time = `${hour}:${minute}`;
    // Firestore에 저장할 레코드 객체
    const record = {
      name,
      time,
      reason,
      type: '외부인 방문',        // 방문 유형
      createdAt: new Date(),     // 저장 시각
    };

    try {
      // 'leaves' 컬렉션에 새 문서를 추가
      await addDoc(collection(db, 'leaves'), record);
      setMessage('✅ 외부인 방문 기록이 저장되었습니다.');
      // 폼 초기화
      setName('');
      setHour('');
      setMinute('');
      setReason('');
    } catch (error) {
      console.error('저장 중 오류:', error);
      setMessage('❌ 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow">
      {/* 제목 */}
      <h2 className="text-lg font-semibold mb-4 text-center">
        외부인 방문 기록
      </h2>

      {/* 방문자 이름 입력 */}
      <input
        type="text"
        placeholder="방문자 이름"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />

      {/* 방문 시간 선택 (시 / 분) */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <select
          value={hour}
          onChange={e => setHour(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">시</option>
          {[...Array(24)].map((_, i) => (
            <option key={i} value={String(i).padStart(2, '0')}>
              {String(i).padStart(2, '0')}시
            </option>
          ))}
        </select>

        <select
          value={minute}
          onChange={e => setMinute(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">분</option>
          {['00', '10', '20', '30', '40', '50'].map(m => (
            <option key={m} value={m}>
              {m}분
            </option>
          ))}
        </select>
      </div>

      {/* 방문 사유 입력 */}
      <textarea
        placeholder="방문 사유 입력"
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />

      {/* 저장 버튼 */}
      <button
        onClick={handleSubmit}
        className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800 font-semibold"
      >
        저장
      </button>

      {/* 성공/오류 메시지 표시 */}
      {message && (
        <p className="text-sm mt-3 text-center">{message}</p>
      )}
    </div>
  );
}
