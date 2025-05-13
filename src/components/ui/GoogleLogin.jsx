// src/components/ui/GoogleLogin.jsx

import React from 'react';
// Firebase Auth 및 Google Provider
import { auth, provider } from '../../firebase/firebaseConfig';
// Redirect 로그인 함수만 사용
import { signInWithRedirect } from 'firebase/auth';

export default function GoogleLogin() {
  // iOS 기기 여부
  const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  // 홈 화면에 추가된 PWA 모드 여부
  const isInStandalone = window.navigator.standalone === true;

  const handleLogin = () => {
    console.log('🔄 로그인 시작');
    if (isIos && isInStandalone) {
      // iOS PWA 모드라면 사파리 브라우저 새 탭으로 OAuth 페이지 열기
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const redirectUri = window.location.origin;
      const oauthUrl = [
        'https://accounts.google.com/o/oauth2/v2/auth',
        `?client_id=${clientId}`,
        `&redirect_uri=${encodeURIComponent(redirectUri)}`,
        '&response_type=token',
        '&scope=profile%20email',
        '&include_granted_scopes=true'
      ].join('');
      window.open(oauthUrl, '_blank', 'noopener');
    } else {
      // 일반 브라우저나 사파리 일반 모드에서는 Firebase Redirect 로그인 사용
      signInWithRedirect(auth, provider);
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
      </div>
    </div>
  );
}
