// d:\school-visit-app\src\components\ui\DashboardMenu.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom'; // 페이지 이동을 위한 훅
import { auth } from '../../firebase/firebaseConfig';         // Firebase auth 인스턴스 임포트
import { ROLES, PATHS } from '../../constants/appConstants'; // 역할 및 경로 상수 임포트

/**
 * @file DashboardMenu.jsx
 * @description 인증된 사용자를 위한 대시보드 메뉴 컴포넌트입니다.
 * 사용자 역할에 따라 다른 메뉴 버튼을 동적으로 표시하고, 로그아웃 기능을 제공합니다.
 */

/**
 * DashboardMenu 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {object} props.userInfo - 현재 로그인된 사용자의 정보 (예: { name: '홍길동', role: 'nurse' })
 * @returns {JSX.Element} 대시보드 메뉴 UI
 */
function DashboardMenu({ userInfo }) {
  // useNavigate 훅을 사용하여 프로그래매틱하게 라우트를 변경할 수 있는 함수를 가져옵니다.
  const navigate = useNavigate();
  // userInfo 객체에서 사용자의 역할을 추출합니다.
  const role = userInfo.role;

  /**
   * 로그아웃을 처리하는 비동기 함수입니다.
   * Firebase의 signOut 메서드를 호출하여 사용자를 로그아웃시킵니다.
   * 오류 발생 시 콘솔에 에러 메시지를 출력합니다.
   */
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Firebase 로그아웃 실행
      // App.jsx의 onAuthStateChanged 리스너가 상태 변화를 감지하고 로그인 페이지로 리디렉션합니다.
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      // 사용자에게 알림을 표시하는 등의 추가적인 오류 처리를 할 수 있습니다.
    }
  };

  // 환영 메시지와 메뉴 버튼들을 포함하는 JSX를 반환합니다.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 gap-4 px-4">
      <h1 className="text-xl font-semibold">{userInfo.name}님, 환영합니다!</h1>
      <p className="text-sm text-gray-600">원하시는 작업을 선택해주세요.</p>

      {/* 메뉴 버튼들을 그룹화하는 컨테이너입니다. */}
      <div className="flex flex-col gap-4">
        {/* 
          사용자 역할(role)에 따라 조건부로 메뉴 버튼들을 렌더링합니다.
          ROLES 상수 객체에 정의된 역할 문자열과 비교합니다.
        */}

        {/* 특별실 교사 (보건, 상담, 복지) 메뉴 */}
        {(role === ROLES.NURSE || role === ROLES.COUNSELOR || role === ROLES.WELFARE) && (
          <>
            <button onClick={() => navigate(PATHS.HOME)} className="btn-teal">방문 신청</button>
            <button onClick={() => navigate(PATHS.BREAK)} className="btn-teal">쉬는 시간 방문</button>
            <button onClick={() => navigate(PATHS.STATUS)} className="btn-teal">요청 내역</button>
          </>
        )}

        {/* 담임 또는 교과 교사 메뉴 */}
        {(role === ROLES.HOMEROOM || role === ROLES.SUBJECT) && (
          <>
            <button onClick={() => navigate(PATHS.APPROVE)} className="btn-indigo">요청 승인</button>
            <button onClick={() => navigate(PATHS.STATUS)} className="btn-indigo">승인 현황</button>
          </>
        )}

        {/* 담임 교사 전용 메뉴 */}
        {role === ROLES.HOMEROOM && (
          <button onClick={() => navigate(PATHS.LEAVE)} className="btn-yellow">조퇴/외출 기록</button>
        )}

        {/* 교과 또는 담임 교사 공통 메뉴 (외부인 방문 기록) */}
        {(role === ROLES.SUBJECT || role === ROLES.HOMEROOM) && (
          <button onClick={() => navigate(PATHS.EXTERNAL)} className="btn-gray">외부인 방문 기록</button>
        )}

        {/* 모든 역할 공통 메뉴 */}
        <button onClick={() => navigate(PATHS.ADMIN)} className="btn-dark">외부인 / 조퇴 현황</button>
        <button onClick={() => navigate(PATHS.SETTINGS)} className="btn-blue">설정</button>
        <button onClick={handleLogout} className="btn-red">로그아웃</button>
      </div>
    </div>
  );
}

export default DashboardMenu;
