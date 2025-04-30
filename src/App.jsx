// src/App.jsx

import React, { useEffect, useState } from 'react';
// 라우터
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
// Firebase Auth 상태 변화 감지
import { onAuthStateChanged } from 'firebase/auth';
// Firestore 문서 조회
import { doc, getDoc } from 'firebase/firestore';
// Firebase 설정
import { auth, db } from './firebase/firebaseConfig';

// 공통 UI
import GoogleLogin         from './components/ui/GoogleLogin';
import RoleRegisterForm    from './components/ui/RoleRegisterForm';
import SettingsPage        from './components/ui/SettingsPage';
// 도메인별 컴포넌트
import VisitRequestForm    from './components/domain/VisitRequest/VisitRequestForm';
import ApprovalScreen      from './components/domain/VisitRequest/ApprovalScreen';
import LeaveRequestForm    from './components/domain/VisitRequest/LeaveRequestForm';
import ExternalVisitForm   from './components/domain/VisitRequest/ExternalVisitForm';
import AdminVisitorView    from './components/domain/VisitRequest/AdminVisitorView';
// 페이지 컴포넌트
import AttendancePage          from './pages/AttendancePage';
import HomeroomAttendancePage  from './pages/HomeroomAttendancePage';
import AdminStudentUpload      from './pages/AdminStudentUpload';
import AttendanceReportPage    from './pages/AttendanceReportPage';

function AppContent() {
  // 로그인 후 네비게이션용
  const navigate = useNavigate();
  // 로그인된 Firebase 사용자
  const [firebaseUser, setFirebaseUser] = useState(null);
  // 인증 상태 확인 중 플래그
  const [checkingAuth, setCheckingAuth] = useState(true);
  // Firestore에 저장된 추가 사용자 정보
  const [userInfo, setUserInfo] = useState(null);
  // 현재 보여줄 페이지
  const [page, setPage] = useState('');

  // 1) onAuthStateChanged 로 로그인/로그아웃 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2) firebaseUser가 바뀌면 Firestore에서 사용자 정보 불러오기
  useEffect(() => {
    if (!firebaseUser) {
      setUserInfo(null);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const ref  = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(ref);
        setUserInfo(snap.exists() ? snap.data() : null);
      } catch (err) {
        console.error('유저 정보 조회 오류:', err);
      }
    };
    fetchUserInfo();
  }, [firebaseUser]);

  // 인증 상태 확인 중일 때
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중…
      </div>
    );
  }

  // 로그인 전
  if (!firebaseUser) {
    return <GoogleLogin />;
  }

  // 사용자 정보 등록 전
  if (!userInfo) {
    return (
      <RoleRegisterForm
        user={firebaseUser}
        onComplete={info => setUserInfo(info)}
      />
    );
  }

  const role = userInfo.role;

  // 메인 메뉴
  if (page === '' || page === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 gap-4 px-4">
        <h1 className="text-xl font-semibold mb-2">
          {userInfo.name}님, 환영합니다!
        </h1>
        <p className="text-sm text-gray-600">원하시는 작업을 선택해주세요.</p>

        {/* 역할별 메뉴 버튼 */}
        {(role === 'nurse' || role === 'counselor') && (
          <>
            <button onClick={() => setPage('home')}   className="btn-teal">방문 요청</button>
            <button onClick={() => setPage('status')} className="btn-teal">요청 현황</button>
          </>
        )}
        {(role === 'homeroom' || role === 'subject') && (
          <>
            <button onClick={() => setPage('approve')} className="btn-indigo">요청 승인</button>
            <button onClick={() => setPage('status')}  className="btn-indigo">승인 현황</button>
          </>
        )}
        {role === 'homeroom' && (
          <button onClick={() => setPage('leave')} className="btn-yellow">조퇴/외출 기록</button>
        )}
        {(role === 'subject' || role === 'homeroom') && (
          <button onClick={() => setPage('external')} className="btn-gray">외부인 방문 기록</button>
        )}
        {role === 'gatekeeper' && (
          <button onClick={() => setPage('admin')} className="btn-dark">외부인 / 조퇴 현황</button>
        )}

        <button onClick={() => setPage('settings')} className="btn-blue">설정</button>
        <button
          onClick={() => {
            setFirebaseUser(null);
            setUserInfo(null);
          }}
          className="btn-red"
        >
          로그아웃
        </button>

        {/* 개발 환경에서만 노출되는 테스트 페이지 버튼 */}
        {process.env.NODE_ENV !== 'production' && (
          <button
            onClick={() => navigate('/attendance-dev')}
            className="btn-gray"
          >
            (테스트) 출석 페이지 보기
          </button>
        )}
        {/* 개발 환경에서만 노출되는 출결 통계 버튼 */}
        {process.env.NODE_ENV !== 'production' && (
          <button
            onClick={() => navigate('/attendance-report')}
            className="btn-yellow"
          >
            (테스트) 출결 통계
          </button>
        )}
      </div>
    );
  }

  // 실제 페이지 콘텐츠
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 px-4 py-6">
      <header className="bg-white shadow rounded-xl px-6 py-4 mb-6 text-center font-bold text-lg">
        {userInfo.name}님이 선택한 페이지
        <div className="mt-2">
          <button onClick={() => setPage('menu')} className="text-blue-500 underline text-sm">
            ← 메뉴로 돌아가기
          </button>
        </div>
      </header>

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

export default function App() {
  return (
    <Router>
      <Routes>
+       <Route path="/attendance-report" element={<AttendanceReportPage />} />
        <Route path="/attendance-dev"      element={<AttendancePage />} />
        <Route path="/admin-students"      element={<AdminStudentUpload />} />
        <Route path="/homeroom-attendance" element={<HomeroomAttendancePage />} />
        <Route path="/*"                   element={<AppContent />} />
      </Routes>
    </Router>
  );
}
