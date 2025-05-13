// src/components/ui/GoogleLogin.jsx

import React from 'react';
// Firebase Auth 및 Google Provider
import { auth, provider } from '../../firebase/firebaseConfig';
// Popup 로그인도 함께 임포트
import { signInWithRedirect, signInWithPopup } from 'firebase/auth';

export default function GoogleLogin() {
  const ua = navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isInStandalone =
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  const handleLogin = async () => {
    try {
      console.log('🔄 로그인 시작', { isIos, isInStandalone });
      if (isIos && isInStandalone) {
        // PWA 모드: 팝업 로그인 시도
        await signInWithPopup(auth, provider);
      } else {
        // 그 외: 리디렉트 로그인
        await signInWithRedirect(auth, provider);
      }
    } catch (err) {
      console.error('Google 로그인 실패:', err);
      // 팝업이 막혔거나 에러나면 리디렉트로 폴백
      await signInWithRedirect(auth, provider);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
      <img src="/logo.png" alt="학교 로고" className="w-32 h-32 mb-6" />
      <div className="bg-white p-6 rounded-xl shadow max-w-xs w-full text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-800">출결 관리 시스템</h1>
        <h2 className="text-md font-semibold text-gray-600">Google 로그인</h2>
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
