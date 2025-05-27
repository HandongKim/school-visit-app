// d:\school-visit-app\src\routes\AppContentRoutes.jsx

import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom'; // react-router-dom 관련 컴포넌트 및 훅 임포트
import { auth } from '../firebase/firebaseConfig'; // Firebase auth 인스턴스 (SettingsPage에서 사용)
import { PATHS, ROLES } from '../constants/appConstants'; // 애플리케이션 경로 및 역할 상수 임포트

// 레이아웃 및 메뉴 컴포넌트 임포트
import PageLayout from '../layouts/PageLayout';             // 공통 페이지 레이아웃 컴포넌트
import DashboardMenu from '../components/ui/DashboardMenu'; // 메인 대시보드 메뉴 컴포넌트

// 페이지/도메인 컴포넌트 임포트 (각 기능별 페이지 컴포넌트)
import VisitRequestForm  from '../components/domain/VisitRequest/VisitRequestForm';   // 방문 신청 폼
import BreakVisitForm    from '../components/domain/VisitRequest/BreakVisitForm';     // 쉬는 시간 방문 폼
import ApprovalScreen    from '../components/domain/VisitRequest/ApprovalScreen';     // 방문 요청 승인 화면
import LeaveRequestForm  from '../components/domain/VisitRequest/LeaveRequestForm';   // 조퇴/외출 기록 폼
import ExternalVisitForm from '../components/domain/VisitRequest/ExternalVisitForm';  // 외부인 방문 기록 폼
import AdminVisitorView  from '../components/domain/VisitRequest/AdminVisitorView';   // 관리자용 방문 현황 뷰
import SettingsPage      from '../components/ui/SettingsPage';                          // 설정 페이지

/**
 * @file AppContentRoutes.jsx
 * @description 인증된 사용자가 접근하는 내부 페이지들의 라우팅 규칙을 정의하는 컴포넌트입니다.
 * 메인 메뉴(DashboardMenu)를 인덱스 라우트('/')로 설정하고,
 * 그 외의 기능 페이지들은 PageLayout을 통해 중첩 라우트(nested routes)로 구성합니다.
 */

// 사용자 역할(ROLES 상수)에 따른 한글 표시 이름을 매핑하는 객체입니다.
// 예: ROLES.NURSE ('nurse') -> '보건 선생님'
const roleDisplayNames = {
  [ROLES.NURSE]: '보건 선생님',
  [ROLES.COUNSELOR]: '상담 선생님',
  [ROLES.WELFARE]: '복지 담당 선생님',
  [ROLES.HOMEROOM]: '담임 선생님',
  [ROLES.SUBJECT]: '교과 선생님',
  default: '사용자', // 매핑되는 역할이 없을 경우 사용될 기본 표시 이름
};

/**
 * AppContentRoutes 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {object} props.userInfo - 현재 로그인된 사용자의 정보 (이름, 역할 등). 각 페이지 컴포넌트로 전달됩니다.
 * @param {function} props.onUserUpdate - 사용자 정보 업데이트 시 호출될 콜백 함수 (SettingsPage에서 사용).
 *                                      App.jsx의 userInfo 상태를 업데이트합니다.
 * @returns {JSX.Element} 내부 페이지 라우팅 UI
 */
function AppContentRoutes({ userInfo, onUserUpdate }) {
  // userInfo가 아직 로드되지 않았거나 유효하지 않은 경우 (예: App.jsx에서 비동기 로드 중),
  // 로딩 메시지를 표시합니다. 이는 App.jsx에서 이미 userInfo가 있을 때만 이 컴포넌트를
  // 렌더링하도록 처리했으므로, 추가적인 방어 코드 또는 더 복잡한 비동기 로직을 대비한 것입니다.
  if (!userInfo) {
    return <div className="min-h-screen flex items-center justify-center">사용자 정보를 불러오는 중입니다...</div>;
  }

  return (
    <Routes> {/* 여러 Route들을 그룹화합니다. */}
      {/* 
        인덱스 라우트(index route): 부모 라우트의 경로와 정확히 일치할 때 렌더링됩니다.
        App.jsx에서 이 AppContentRoutes는 '/*' 경로로 마운트되므로,
        실질적으로 사용자가 로그인 후 처음 보게 되는 페이지(메인 메뉴)가 됩니다.
        `element` prop에는 DashboardMenu 컴포넌트를 렌더링하도록 지정하고, `userInfo`를 전달합니다.
      */}
      <Route index element={<DashboardMenu userInfo={userInfo} />} />

      {/* 
        레이아웃 라우트(Layout Route): PageLayout을 사용하는 모든 페이지들의 부모 라우트입니다.
        `path` 없이 `element`만 지정하면, 이 라우트의 자식 라우트들이 렌더링될 때
        PageLayout 컴포넌트가 함께 렌더링되고, 자식 컴포넌트는 PageLayout 내부의 <Outlet />에 표시됩니다.
        `userInfo`를 PageLayout으로 전달합니다.
      */}
      <Route element={<PageLayout userInfo={userInfo} />}>
        {/* 각 기능 페이지에 대한 라우트 정의. PATHS 상수를 사용하여 경로를 지정합니다. */}
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
        {/* 
          'status' 경로는 여러 역할에서 다른 의미로 사용될 수 있습니다.
          (예: 특별실 교사의 '요청 내역', 교과/담임 교사의 '승인 현황')
          현재는 간단한 플레이스홀더 UI를 보여주며, 역할에 따라 제목과 내용을 다르게 표시합니다.
          추후 이 부분은 별도의 컴포넌트(예: StatusPage.jsx)로 분리하여 더 복잡한 로직을 처리할 수 있습니다.
        */}
        <Route 
          path={PATHS.STATUS}   
          element={
            <div className="p-4">
              {/* userInfo.role에 따라 페이지 제목을 동적으로 설정합니다. */}
              <h2 className="text-xl font-semibold mb-4">
                {(userInfo.role === ROLES.HOMEROOM || userInfo.role === ROLES.SUBJECT) ? '승인 현황' : '요청 내역'}
              </h2>
              {/* roleDisplayNames를 사용하여 사용자 역할의 한글 이름과 사용자 이름을 표시합니다. */}
              <p className="text-md text-gray-700">
                {roleDisplayNames[userInfo.role] || roleDisplayNames.default} ({userInfo.name}님)의 현황 페이지입니다.
              </p>
              {/* 여기에 역할별 조건부 렌더링 또는 공통 현황 컴포넌트가 올 수 있습니다. */}
            </div>
          } 
        />
        
        {/* 
          와일드카드 라우트 ('*'): 위에서 정의된 경로들과 일치하는 것이 없을 때 렌더링됩니다. (404 Not Found 페이지 역할)
          간단한 "페이지를 찾을 수 없습니다" 메시지와 함께 메인 메뉴로 돌아가는 링크를 제공합니다.
        */}
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
