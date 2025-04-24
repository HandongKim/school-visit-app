// src/App.jsx

import React, { useEffect, useState } from 'react';
// 라우팅 컴포넌트 불러오기 (react-router-dom)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// alias(@)를 이용해 공통 UI 컴포넌트 불러오기
import GoogleLogin         from '@components/ui/GoogleLogin';
import RoleRegisterForm    from '@components/ui/RoleRegisterForm';
import SettingsPage        from '@components/ui/SettingsPage';

// 도메인별 컴포넌트 import (VisitRequest 모듈)
import VisitRequestForm    from '@components/domain/VisitRequest/VisitRequestForm';
import ApprovalScreen      from '@components/domain/VisitRequest/ApprovalScreen';
import LeaveRequestForm    from '@components/domain/VisitRequest/LeaveRequestForm';
import ExternalVisitForm   from '@components/domain/VisitRequest/ExternalVisitForm';
import AdminVisitorView    from '@components/domain/VisitRequest/AdminVisitorView';

// 페이지 컴포넌트 import (pages 폴더)
import AttendancePage          from '@/pages/AttendancePage';
import HomeroomAttendancePage  from '@/pages/HomeroomAttendancePage';
import AdminStudentUpload      from '@/pages/AdminStudentUpload';

// Firebase 설정 파일(alias 경로) 및 Firestore 함수 불러오기
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

function AppContent() {
  // -- 사용자 인증/정보 상태 관리 --------------------------------
  const [firebaseUser, setFirebaseUser] = useState(null);  // Firebase auth user
  const [userInfo, setUserInfo]         = useState(null);  // Firestore의 사용자 정보

  // -- 현재 보고 있는 페이지를 나타내는 상태 -----------------------
  const [page, setPage] = useState('');

  // FirebaseUser가 변경될 때마다 Firestore에서 추가 정보(fetch) 수행
  useEffect(() => {
    async function fetchUserInfo() {
      if (!firebaseUser) return;
      try {
        const docRef  = doc(db, 'users', firebaseUser.uid);
        const snap    = await getDoc(docRef);
        setUserInfo(snap.exists() ? snap.data() : null);
      } catch (err) {
        console.error('유저 정보 조회 오류:', err);
      }
    }
    fetchUserInfo();
  }, [firebaseUser]);

  // -- 로그인 전 화면 --------------------------------------------
  if (!firebaseUser) {
    return <GoogleLogin onLogin={user => setFirebaseUser(user)} />;
  }

  // -- 사용자 정보 등록 전 화면 ----------------------------------
  if (!userInfo) {
    return (
      <RoleRegisterForm
        user={firebaseUser}
        onComplete={info => setUserInfo(info)}
      />
    );
  }

  // 등록된 사용자 역할(role) 가져오기
  const role = userInfo.role;

  // -- 메뉴 화면 -----------------------------------------------
  if (page === '' || page === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 gap-4 px-4">
        <h1 className="text-xl font-semibold mb-2">
          {userInfo.name}님, 환영합니다!
        </h1>
        <p className="text-sm text-gray-600">원하시는 작업을 선택해주세요.</p>

        {/* 보건·상담 선생님 메뉴 */}
        {(role === 'nurse' || role === 'counselor') && (
          <>
            <button onClick={() => setPage('home')}   className="btn-teal">
              방문 요청
            </button>
            <button onClick={() => setPage('status')} className="btn-teal">
              요청 현황
            </button>
          </>
        )}

        {/* 담임·교과 선생님 메뉴 */}
        {(role === 'homeroom' || role === 'subject') && (
          <>
            <button onClick={() => setPage('approve')} className="btn-indigo">
              요청 승인
            </button>
            <button onClick={() => setPage('status')}  className="btn-indigo">
              승인 현황
            </button>
          </>
        )}

        {role === 'homeroom' && (
          <button onClick={() => setPage('leave')} className="btn-yellow">
            조퇴/외출 기록
          </button>
        )}

        {(role === 'subject' || role === 'homeroom') && (
          <button onClick={() => setPage('external')} className="btn-gray">
            외부인 방문 기록
          </button>
        )}

        {role === 'gatekeeper' && (
          <button onClick={() => setPage('admin')} className="btn-dark">
            외부인 / 조퇴 현황
          </button>
        )}

        {/* 설정 및 로그아웃 */}
        <button onClick={() => setPage('settings')} className="btn-blue">
          설정
        </button>
        <button
          onClick={() => {
            setFirebaseUser(null);
            setUserInfo(null);
          }}
          className="btn-red"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // -- 실제 콘텐츠 화면 -----------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 px-4 py-6">
      {/* 헤더: 현재 페이지명 및 메뉴 돌아가기 */}
      <header className="bg-white shadow rounded-xl px-6 py-4 mb-6 text-center font-bold text-lg">
        {userInfo.name}님이 선택한 페이지
        <div className="mt-2">
          <button
            onClick={() => setPage('menu')}
            className="text-blue-500 underline text-sm"
          >
            ← 메뉴로 돌아가기
          </button>
        </div>
      </header>

      {/* main 영역: 페이지별 컴포넌트 렌더링 */}
      <main>
        {page === 'home'     && <VisitRequestForm />}
        {page === 'approve'  && <ApprovalScreen role={role} mode="approve" userInfo={userInfo} />}
        {page === 'status'   && <ApprovalScreen role={role} mode="status"  userInfo={userInfo} />}
        {page === 'leave'    && <LeaveRequestForm userInfo={userInfo} />}
        {page === 'external' && <ExternalVisitForm />}
        {page === 'admin'    && <AdminVisitorView />}
        {page === 'settings' && (
          <SettingsPage
            user={firebaseUser}
            onUpdate={updated => {
              setUserInfo(prev => ({ ...prev, ...updated }));
              setPage('menu');
            }}
          />
        )}
      </main>
    </div>
  );
}

// 최상위 App 컴포넌트: 라우터 설정
export default function App() {
  return (
    <Router>
      <Routes>
        {/* 개발용 출석 페이지 */}
        <Route path="/attendance-dev"       element={<AttendancePage />} />
        {/* 학생 업로드 페이지 */}
        <Route path="/admin-students"       element={<AdminStudentUpload />} />
        {/* 담임 출석부 페이지 */}
        <Route path="/homeroom-attendance"  element={<HomeroomAttendancePage />} />
        {/* 나머지 경로는 AppContent로 처리 */}
        <Route path="/*"                    element={<AppContent />} />
      </Routes>
    </Router>
  );
}
