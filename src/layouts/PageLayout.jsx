// src/layouts/PageLayout.jsx

import React from 'react';
import { Link, Outlet } from 'react-router-dom';

/**
 * 인증된 사용자를 위한 공통 페이지 레이아웃 컴포넌트입니다.
 * 헤더(선택된 페이지 이름, 메뉴로 돌아가기 링크)와 메인 콘텐츠 영역(<Outlet />)으로 구성됩니다.
 * @param {object} props - 컴포넌트 프로퍼티
 * @param {object} props.userInfo - 현재 로그인된 사용자 정보. 이름 등을 표시하는 데 사용될 수 있습니다.
 */
function PageLayout({ userInfo }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 px-4 py-6">
      <header className="bg-white shadow rounded-xl px-6 py-4 mb-6 text-center font-bold text-lg">
        {/* 사용자 이름과 함께 현재 페이지의 성격을 나타내는 텍스트 (예시) */}
        {userInfo?.name ? `${userInfo.name}님이 선택한 페이지` : '선택된 페이지'}
        <div className="mt-2">
          {/*
            Link 컴포넌트를 사용하여 메뉴 페이지로 돌아가는 링크를 만듭니다.
            `to=".."`는 현재 경로의 부모 경로로 이동하라는 의미입니다.
            `relative="path"`는 현재 경로를 기준으로 상대적으로 이동함을 명시합니다.
          */}
          <Link to=".." relative="path" className="text-blue-500 underline text-sm">
            ← 메뉴로 돌아가기
          </Link>
        </div>
      </header>
      <main>
        <Outlet /> {/* 중첩된 라우트의 자식 컴포넌트가 렌더링될 위치 */}
      </main>
    </div>
  );
}

export default PageLayout;
