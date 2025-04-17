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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
      <div className="bg-white p-6 rounded-xl shadow max-w-xs w-full text-center">
        <h2 className="text-lg font-bold mb-4 text-gray-700">Google 로그인</h2>
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
        >
          Google 계정으로 로그인
        </button>
      </div>
    </div>
  );
};

export default GoogleLogin;
