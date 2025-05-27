// d:\school-visit-app\src\components\ui\GoogleLogin.jsx

import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Firebase Google 인증 관련 함수 임포트
import { auth } from '../../firebase/firebaseConfig'; // Firebase auth 인스턴스 임포트

/**
 * @file GoogleLogin.jsx
 * @description 구글 계정을 사용하여 Firebase에 로그인하는 기능을 제공하는 컴포넌트입니다.
 * 사용자가 "Google 계정으로 로그인" 버튼을 클릭하면 Firebase 인증 팝업이 나타납니다.
 */

/**
 * GoogleLogin 컴포넌트
 * @returns {JSX.Element} 구글 로그인 버튼을 포함한 UI
 */
export default function GoogleLogin() {
  /**
   * 구글 로그인 버튼 클릭 시 실행되는 비동기 함수입니다.
   * Firebase의 `signInWithPopup` 메서드를 사용하여 구글 인증 공급자로 로그인을 시도합니다.
   * 성공 시 사용자 정보가 Firebase에 등록/업데이트되며, App.jsx의 `onAuthStateChanged` 리스너가 이를 감지합니다.
   * 오류 발생 시 콘솔에 에러 메시지를 출력합니다.
   */
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider(); // Google 인증 공급자 객체 생성
    try {
      await signInWithPopup(auth, provider); // Firebase 인증 팝업을 통해 로그인 시도
      // 로그인 성공 후 별도의 페이지 이동 로직은 App.jsx의 onAuthStateChanged에서 처리됩니다.
    } catch (error) {
      console.error("Google 로그인 중 오류 발생:", error);
      // 사용자에게 알림을 표시하는 등의 추가적인 오류 처리를 할 수 있습니다.
      // 예: 특정 에러 코드에 따라 다른 메시지 표시 (error.code 확인)
    }
  };

  // 구글 로그인 UI를 렌더링합니다.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">학교 방문 관리 시스템</h1>
        <p className="text-gray-600 mb-8">교직원 전용 로그인</p>
        {/* 
          구글 로그인 버튼입니다. 클릭 시 handleGoogleLogin 함수가 실행됩니다.
          스타일링은 Tailwind CSS 클래스를 사용합니다.
        */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <div className="flex items-center justify-center">
            {/* 구글 로고 SVG 아이콘 (인라인 SVG 또는 이미지 파일로 대체 가능) */}
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56,12.25C22.56,11.47 22.49,10.72 22.36,10H12V14.26H17.94C17.64,15.93 16.73,17.31 15.22,18.25V21.09H19.16C21.32,19.11 22.56,15.97 22.56,12.25Z" />
              <path d="M12,23C14.97,23 17.45,22.04 19.16,20.45L15.22,17.61C14.21,18.29 13.03,18.67 12,18.67C9.96,18.67 7.92,17.31 7.06,15.28H3.12V18.12C4.84,21.04 8.19,23 12,23Z" />
              <path d="M7.06,14.72C6.79,13.94 6.64,13.09 6.64,12.25C6.64,11.41 6.79,10.56 7.06,9.78V6.94H3.12C2.32,8.45 2,10.28 2,12.25C2,14.22 2.32,16.05 3.12,17.56L7.06,14.72Z" />
              <path d="M12,5.33C13.54,5.33 14.72,5.86 15.71,6.79L19.22,3.28C17.45,1.62 14.97,0.67 12,0.67C8.19,0.67 4.84,2.96 3.12,5.88L7.06,8.72C7.92,6.69 9.96,5.33 12,5.33Z" />
            </svg>
            Google 계정으로 로그인
          </div>
        </button>
        <p className="mt-6 text-xs text-gray-500">
          학교에서 발급받은 Google 계정을 사용해주세요.
        </p>
      </div>
    </div>
  );
}
