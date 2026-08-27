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
  // localhost 개발 환경은 앱 origin과 Firebase authDomain이 달라
  // signInWithRedirect의 상태 복원이 브라우저 서드파티 저장소 정책에 막히는 경우가 많음 → 팝업 사용
  const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const handleLogin = async () => {
    try {
      console.log('🔄 로그인 시작', { isIos, isInStandalone, isLocalDev });
      if (isIos && isInStandalone) {
        // PWA 모드: 팝업 로그인 시도
        await signInWithPopup(auth, provider);
      } else if (isLocalDev) {
        // 로컬 개발 환경: 팝업 로그인 (redirect는 localhost에서 깨지기 쉬움)
        await signInWithPopup(auth, provider);
      } else {
        // 그 외(운영 환경): 리디렉트 로그인
        await signInWithRedirect(auth, provider);
      }
    } catch (err) {
      console.error('Google 로그인 실패:', err);
      // 팝업을 닫고 다시 누르는 등, 이전 시도가 새 시도에 의해 취소되는 건 정상적인 부작용이라
      // 굳이 알림으로 방해하지 않음 (사용자가 다시 누른 시도는 별도로 정상 진행됨)
      const isBenignCancel = ['auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(err.code);
      if (isBenignCancel) return;
      if (isLocalDev) {
        // 로컬에서는 redirect로 폴백해봤자 같은 문제가 재현되므로 폴백하지 않고 바로 알림
        alert(`로그인 실패: ${err.code || err.message}\n브라우저 콘솔(F12)의 에러 내용을 확인해주세요.`);
        return;
      }
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
