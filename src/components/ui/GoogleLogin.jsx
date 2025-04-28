// src/components/ui/GoogleLogin.jsx

import React from 'react';
// Firebase Auth 및 Google Provider
import { auth, provider } from '../../firebase/firebaseConfig';
// Redirect 로그인 함수만 사용
import { signInWithRedirect } from 'firebase/auth';

export default function GoogleLogin() {
  // Google 로그인 (항상 Redirect 방식)
  const handleLogin = () => {
    console.log('🔄 로그인 시작 (Redirect)');
    signInWithRedirect(auth, provider);
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
      </div>
    </div>
  );
}
