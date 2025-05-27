// d:\school-visit-app\src\routes\AppContentRoutes.jsx

import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
// ROLES를 appConstants에서 함께 가져오도록 수정합니다.
import { PATHS, ROLES } from '../constants/appConstants';

// 레이아웃 및 메뉴 컴포넌트 임포트
import PageLayout from '../layouts/PageLayout';
import DashboardMenu from '../components/ui/DashboardMenu';

// 페이지/도메인 컴포넌트 임포트 (각 기능별 페이지)
import VisitRequestForm  from '../components/domain/VisitRequest/VisitRequestForm';
import BreakVisitForm    from '../components/domain/VisitRequest/BreakVisitForm';
import ApprovalScreen    from '../components/domain/VisitRequest/ApprovalScreen';
import LeaveRequestForm  from '../components/domain/VisitRequest/LeaveRequestForm';
import ExternalVisitForm from '../components/domain/VisitRequest/ExternalVisitForm';
import AdminVisitorView  from '../components/domain/VisitRequest/AdminVisitorView';
import SettingsPage      from '../components/ui/SettingsPage';

// 사용자 역할에 따른 한글 표시 이름 매핑
const roleDisplayNames = {
  [ROLES.NURSE]: '보건 선생님',
  [ROLES.COUNSELOR]: '상담 선생님',
  [ROLES.WELFARE]: '복지 담당 선생님',
  [ROLES.HOMEROOM]: '담임 선생님',
  [ROLES.SUBJECT]: '교과 선생님',
  default: '사용자', // 매핑되지 않은 역할의 기본값
};

/**
 * 인증된 사용자를 위한 내부 페이지 라우팅을 담당하는 컴포넌트입니다.
 * 메인 메뉴(DashboardMenu)를 인덱스 라우트로,
 * 그 외 기능 페이지들을 PageLayout을 통해 중첩 라우트로 구성합니다.
 * @param {object} props - 컴포넌트 프로퍼티
 * @param {object} props.userInfo - 현재 로그인된 사용자 정보 (이름, 역할 등)
 * @param {function} props.onUserUpdate - 사용자 정보 업데이트 시 호출될 콜백 함수 (SettingsPage에서 사용)
 */
function AppContentRoutes({ userInfo, onUserUpdate }) {
  if (!userInfo) {
    return <div className="min-h-screen flex items-center justify-center">사용자 정보를 불러오는 중입니다...</div>;
  }

  return (
    <Routes>
      <Route index element={<DashboardMenu userInfo={userInfo} />} />
      <Route element={<PageLayout userInfo={userInfo} />}>
        <Route path={PATHS.HOME}     element={<VisitRequestForm  userInfo={userInfo} />} />
        <Route path={PATHS.BREAK}    element={<BreakVisitForm    userInfo={userInfo} />} />
        <Route
          path={PATHS.APPROVE}
          element={<ApprovalScreen role={userInfo.role} mode="approve" userInfo={userInfo} />}
        />
        <Route path={PATHS.LEAVE}    element={<LeaveRequestForm  userInfo={userInfo} />} />
        <Route path={PATHS.EXTERNAL} element={<ExternalVisitForm userInfo={userInfo} />} />
        <Route path={PATHS.ADMIN}    element={<AdminVisitorView />} />
        <Route
          path={PATHS.SETTINGS}
          element={<SettingsPage user={auth.currentUser} onUpdate={onUserUpdate} />}
        />
        <Route
          path={PATHS.STATUS}
          element={
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">
                {(userInfo.role === ROLES.HOMEROOM || userInfo.role === ROLES.SUBJECT) ? '승인 현황' : '요청 내역'}
              </h2>
              <p className="text-md text-gray-700">
                {roleDisplayNames[userInfo.role] || roleDisplayNames.default} ({userInfo.name}님)의 현황 페이지입니다.
              </p>
            </div>
          }
        />
        <Route
          path="*"
          element={
            <div className="p-4 text-center">
              <h1 className="text-2xl font-bold mb-4">페이지를 찾을 수 없습니다.</h1>
              <Link to="/" className="text-blue-500 hover:underline">
                메인 메뉴로 돌아가기
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default AppContentRoutes;
