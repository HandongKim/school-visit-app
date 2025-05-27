// src/components/ui/DashboardMenu.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebaseConfig';         // Firebase auth 인스턴스 임포트
import { ROLES, PATHS } from '../../constants/appConstants'; // 역할 및 경로 상수 임포트

/**
 * 인증된 사용자를 위한 대시보드 메뉴 컴포넌트입니다.
 * 사용자 역할에 따라 다른 메뉴 버튼을 표시하고, 로그아웃 기능을 제공합니다.
 * @param {object} props - 컴포넌트 프로퍼티
 * @param {object} props.userInfo - 현재 로그인된 사용자 정보 (역할, 이름 등)
 */
function DashboardMenu({ userInfo }) {
  const navigate = useNavigate(); // 페이지 이동을 위한 navigate 함수 가져오기
  const role = userInfo.role;     // 사용자 역할

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Firebase 로그아웃 실행
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 gap-4 px-4">
      <h1 className="text-xl font-semibold">{userInfo.name}님, 환영합니다!</h1>
      <p className="text-sm text-gray-600">원하시는 작업을 선택해주세요.</p>

      <div className="flex flex-col gap-4">
        {(role === ROLES.NURSE || role === ROLES.COUNSELOR || role === ROLES.WELFARE) && (
          <>
            <button onClick={() => navigate(PATHS.HOME)} className="btn-teal">방문 신청</button>
            <button onClick={() => navigate(PATHS.BREAK)} className="btn-teal">쉬는 시간 방문</button>
            <button onClick={() => navigate(PATHS.STATUS)} className="btn-teal">요청 내역</button>
          </>
        )}
        {(role === ROLES.HOMEROOM || role === ROLES.SUBJECT) && (
          <>
            <button onClick={() => navigate(PATHS.APPROVE)} className="btn-indigo">요청 승인</button>
            <button onClick={() => navigate(PATHS.STATUS)} className="btn-indigo">승인 현황</button>
          </>
        )}
        {role === ROLES.HOMEROOM && (
          <button onClick={() => navigate(PATHS.LEAVE)} className="btn-yellow">조퇴/외출 기록</button>
        )}
        {(role === ROLES.SUBJECT || role === ROLES.HOMEROOM) && (
          <button onClick={() => navigate(PATHS.EXTERNAL)} className="btn-gray">외부인 방문 기록</button>
        )}
        <button onClick={() => navigate(PATHS.ADMIN)} className="btn-dark">외부인 / 조퇴 현황</button>
        <button onClick={() => navigate(PATHS.SETTINGS)} className="btn-blue">설정</button>
        <button onClick={handleLogout} className="btn-red">로그아웃</button>
      </div>
    </div>
  );
}

export default DashboardMenu;
