// d:\school-visit-app\src\layouts\PageLayout.jsx

import React from 'react';
import { Link, Outlet } from 'react-router-dom'; // 라우팅 관련 컴포넌트 임포트

/**
 * @file PageLayout.jsx
 * @description 인증된 사용자가 접근하는 내부 페이지들의 공통 레이아웃을 제공하는 컴포넌트입니다.
 * 페이지 상단에는 헤더(사용자 이름, 메뉴로 돌아가기 링크)가 위치하고,
 * 메인 콘텐츠 영역에는 <Outlet />을 통해 각 페이지의 실제 내용이 렌더링됩니다.
 */

/**
 * PageLayout 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {object} props.userInfo - 현재 로그인된 사용자의 정보. 헤더에 사용자 이름을 표시하는 데 사용될 수 있습니다.
 *                                (예: { name: '홍길동', role: 'subject' })
 * @returns {JSX.Element} 공통 페이지 레이아웃 UI
 */
function PageLayout({ userInfo }) {
  return (
    // 전체 페이지 컨테이너 스타일링
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 px-4 py-6">
      {/* 페이지 상단 헤더 영역 */}
      <header className="bg-white shadow rounded-xl px-6 py-4 mb-6 text-center font-bold text-lg">
        {/* 
          userInfo 객체가 존재하고 name 속성이 있다면 사용자 이름을 포함한 메시지를 표시하고,
          그렇지 않다면 '선택된 페이지'라는 기본 텍스트를 표시합니다. (Optional Chaining 사용)
        */}
        {userInfo?.name ? `${userInfo.name}님이 선택한 페이지` : '선택된 페이지'}
        {/* 메뉴로 돌아가기 링크를 포함하는 div */}
        <div className="mt-2">
          {/*
            react-router-dom의 Link 컴포넌트를 사용하여 메뉴 페이지(대시보드)로 돌아가는 링크를 생성합니다.
            `to=".."`: 현재 경로의 부모 경로로 이동합니다. AppContentRoutes에서 이 레이아웃은 중첩 라우트의
                       일부이므로, 부모 경로는 DashboardMenu가 있는 인덱스 라우트가 됩니다.
            `relative="path"`: `to` prop에 지정된 경로를 현재 URL 경로 기준으로 해석하도록 합니다.
          */}
          <Link to=".." relative="path" className="text-blue-500 underline text-sm">
            ← 메뉴로 돌아가기
          </Link>
        </div>
      </header>
      {/* 메인 콘텐츠 영역 */}
      <main>
        {/* 
          react-router-dom의 Outlet 컴포넌트입니다.
          부모 라우트(<Route element={<PageLayout />}>)의 자식 라우트 컴포넌트가
          이 위치에 렌더링됩니다. 예를 들어, URL이 '/home'이면 여기에 <VisitRequestForm />이 표시됩니다.
        */}
        <Outlet />
      </main>
    </div>
  );
}

export default PageLayout;
