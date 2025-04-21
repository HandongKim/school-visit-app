// src/components/GoogleLogin.js
import React from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const GoogleLogin = ({ onLogin }) => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('✅ 로그인 성공:', result.user.email);
      onLogin(result.user); // 로그인된 유저를 App으로 전달
    } catch (error) {
      console.error('❌ 로그인 오류:', error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
      {/* 학교 로고 */}
      <img src="logo.jpg" alt="풍생중학교 로고" className="w-32 h-32 mb-6" />

      {/* 로그인 박스 */}
      <div className="bg-white p-6 rounded-xl shadow max-w-xs w-full text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">풍생중학교 출결 관리 시스템</h1>
        <h2 className="text-md font-semibold mb-4 text-gray-600">Google 로그인</h2>
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold w-full"
        >
          Google 계정으로 로그인
        </button>
      </div>
    </div>
  );
};

export default GoogleLogin;
