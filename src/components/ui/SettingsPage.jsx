// src/components/ui/SettingsPage.jsx

import React, { useEffect, useState } from 'react';
// Firebase 설정(alias 경로) 및 Firestore 함수 import
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function SettingsPage({ user, onUpdate }) {
  // -- 상태 관리 ------------------------------------------------
  const [role, setRole]       = useState('');  // 선택된 역할
  const [grade, setGrade]     = useState('');  // 담임용 학년
  const [classNum, setClassNum] = useState('');// 담임용 반
  const [message, setMessage] = useState('');  // 성공/오류 메시지

  // -- 컴포넌트 마운트 시 Firestore에서 사용자 정보 로드 ------------
  useEffect(() => {
    async function loadUserData() {
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || '');
          setGrade(data.grade  || '');
          setClassNum(data.class || '');
        }
      } catch (err) {
        console.error('유저 데이터 로드 오류:', err);
      }
    }
    loadUserData();
  }, [user]);

  // -- 정보 업데이트 처리 ----------------------------------------
  const handleUpdate = async () => {
    // 역할 미선택 시 경고
    if (!role) {
      setMessage('역할을 선택해주세요.');
      return;
    }
    // 담임교사인데 학년/반 미입력 시 경고
    if (role === 'homeroom' && (!grade || !classNum)) {
      setMessage('담임교사의 경우 학년과 반을 입력해야 합니다.');
      return;
    }

    // 업데이트할 데이터 객체 생성
    const updatedData = { role };
    if (role === 'homeroom') {
      updatedData.grade = grade;
      updatedData.class = classNum;
    } else {
      // 다른 역할일 땐 grade/class 제거
      updatedData.grade = null;
      updatedData.class = null;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updatedData);
      setMessage('저장 완료!');
      onUpdate(updatedData); // AppContent로 변경사항 전달
    } catch (err) {
      console.error('업데이트 오류:', err);
      setMessage('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        {/* 제목 */}
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
          교사 정보 수정
        </h2>

        {/* 역할 선택 */}
        <label className="block text-sm mb-1 font-medium">교사 역할</label>
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

        {/* 담임교사일 때만 학년/반 입력 필드 표시 */}
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
          onClick={handleUpdate}
          className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded font-semibold"
        >
          저장
        </button>

        {/* 메시지 표시 */}
        {message && (
          <p className="mt-4 text-sm text-center text-gray-600">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
