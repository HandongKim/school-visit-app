// src/components/ui/GoogleLogin.jsx

import React from 'react';
// Firebase Auth 및 Google Provider 불러오기
import { auth, provider } from '../../firebase/firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
// 라우팅을 위해 useNavigate 훅 추가
import { useNavigate } from 'react-router-dom';

export default function GoogleLogin({ onLogin }) {
  const navigate = useNavigate(); // navigate 함수 가져오기

  // Google 로그인 팝업
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('✅ 로그인 성공:', result.user.email);
      onLogin(result.user);
    } catch (error) {
      console.error('❌ 로그인 오류:', error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
      {/* 학교 로고 */}
      <img
        src="/logo.png"
        alt="학교 로고"
        className="w-32 h-32 mb-6"
      />

      {/* 로그인 박스 */}
      <div className="bg-white p-6 rounded-xl shadow max-w-xs w-full text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-800">
          출결 관리 시스템
        </h1>
        <h2 className="text-md font-semibold text-gray-600">
          Google 로그인
        </h2>

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold w-full"
        >
          Google 계정으로 로그인
        </button>

        {/* 테스트용 버튼: 출석 페이지로 바로 이동 */}
        <button
          onClick={() => navigate('/attendance-dev')}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-medium w-full"
        >
          (테스트) 출석 페이지 보기
        </button>
      </div>
    </div>
  );
}
