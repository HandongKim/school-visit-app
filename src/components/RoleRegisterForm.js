// src/components/RoleRegisterForm.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const RoleRegisterForm = ({ user, onComplete }) => {
  const [role, setRole] = useState('');
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setMessage(''); // 기존 메시지 초기화
  
    if (!role) {
      setMessage('역할을 선택해주세요.');
      return;
    }
  
    if (role === 'homeroom' && (!grade || !classNum)) {
      setMessage('학년과 반을 모두 입력해주세요.');
      return;
    }
  
    // ✅ Firestore에 저장할 데이터 구성
    const userData = {
        uid: user.uid,
        name: user.displayName || '이름없음',
        email: user.email || '',
        role,
    };
  
    if (role === 'homeroom') {
      userData.grade = grade;
      userData.class = classNum;
    }
  
    console.log('📤 저장할 데이터:', userData);
  
    try {
      // ✅ Firestore 저장
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('✅ Firestore 저장 성공');
      setMessage('등록 완료!');
      onComplete(userData); // App.js로 데이터 전달
    } catch (err) {
      console.error('❌ Firestore 저장 오류:', err.message || err);
      setMessage('등록 중 오류가 발생했습니다.');
    }
  };
    

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 px-4">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">역할 등록</h2>

        <label className="block mb-2 text-sm font-medium">교사 역할</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="">선택</option>
          <option value="homeroom">담임교사</option>
          <option value="subject">교과교사</option>
          <option value="nurse">보건교사</option>
          <option value="counselor">상담교사</option>
          <option value="gatekeeper">정문관리자</option>
        </select>

        {role === 'homeroom' && (
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              placeholder="학년"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="number"
              placeholder="반"
              value={classNum}
              onChange={(e) => setClassNum(e.target.value)}
              className="w-1/2 p-2 border rounded"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white w-full p-2 rounded font-semibold"
        >
          저장
        </button>

        {message && <p className="mt-3 text-sm text-center text-gray-600">{message}</p>}
      </div>
    </div>
  );
};

export default RoleRegisterForm;
