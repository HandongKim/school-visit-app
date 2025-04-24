// src/components/ui/RoleRegisterForm.jsx

import React, { useState } from 'react';
// Firebase 설정(alias 경로) 및 Firestore 함수 import
import { db } from '@/firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export default function RoleRegisterForm({ user, onComplete }) {
  // -- 폼 입력 상태 관리 ---------------------------------------
  const [role, setRole]       = useState('');  // 선택된 역할
  const [grade, setGrade]     = useState('');  // 담임용 학년
  const [classNum, setClassNum] = useState('');// 담임용 반
  const [message, setMessage] = useState('');  // 성공/오류 메시지

  // -- 저장 버튼 클릭 핸들러 -----------------------------------
  const handleSubmit = async () => {
    setMessage(''); // 기존 메시지 초기화

    // 역할 미선택 시 경고
    if (!role) {
      setMessage('역할을 선택해주세요.');
      return;
    }
    // 담임 역할인데 학년/반 미입력 시 경고
    if (role === 'homeroom' && (!grade || !classNum)) {
      setMessage('학년과 반을 모두 입력해주세요.');
      return;
    }

    // Firestore에 저장할 사용자 데이터 객체 생성
    const userData = {
      uid:   user.uid,
      name:  user.displayName || '이름없음',
      email: user.email || '',
      role,
    };
    if (role === 'homeroom') {
      userData.grade = grade;
      userData.class = classNum;
    }

    try {
      // users 컬렉션에 문서 저장 (ID는 user.uid)
      await setDoc(doc(db, 'users', user.uid), userData);
      setMessage('등록 완료!');
      onComplete(userData); // AppContent로 저장된 데이터 전달
    } catch (err) {
      console.error('Firestore 저장 오류:', err);
      setMessage('등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 px-4">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
        {/* 제목 */}
        <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">
          역할 등록
        </h2>

        {/* 역할 선택 드롭다운 */}
        <label className="block mb-2 text-sm font-medium">교사 역할</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="">선택</option>
          <option value="homeroom">담임교사</option>
          <option value="subject">교과교사</option>
          <option value="nurse">보건교사</option>
          <option value="counselor">상담교사</option>
          <option value="gatekeeper">정문관리자</option>
        </select>

        {/* 담임교사일 때만 학년/반 입력 */}
        {role === 'homeroom' && (
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              placeholder="학년"
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="number"
              placeholder="반"
              value={classNum}
              onChange={e => setClassNum(e.target.value)}
              className="w-1/2 p-2 border rounded"
            />
          </div>
        )}

        {/* 저장 버튼 */}
        <button
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white w-full p-2 rounded font-semibold"
        >
          저장
        </button>

        {/* 메시지 표시 */}
        {message && (
          <p className="mt-3 text-sm text-center text-gray-600">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
