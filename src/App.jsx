// src/App.jsx

import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/firebaseConfig';
import { loadOrBootstrapAdmin } from './firebase/adminService';
import { usePendingApprovalCount } from './hooks/usePendingApprovalCount';

import GoogleLogin      from './components/ui/GoogleLogin';
import RoleRegisterForm from './components/ui/RoleRegisterForm';
import SettingsPage     from './components/ui/SettingsPage';

import VisitRequestForm   from './components/domain/VisitRequest/VisitRequestForm';
import ApprovalScreen     from './components/domain/VisitRequest/ApprovalScreen';
import LeaveRequestForm   from './components/domain/VisitRequest/LeaveRequestForm';
import ExternalVisitForm  from './components/domain/VisitRequest/ExternalVisitForm';
import AdminVisitorView   from './components/domain/VisitRequest/AdminVisitorView';
import BreakVisitForm     from './components/domain/VisitRequest/BreakVisitForm';

import AttendancePage          from './pages/AttendancePage';
import HomeroomAttendancePage  from './pages/HomeroomAttendancePage';
import AdminStudentUpload      from './pages/AdminStudentUpload';
import AttendanceReportPage    from './pages/AttendanceReportPage';
import AdminSettingsPage       from './pages/AdminSettingsPage';
import AddStudentForm          from './pages/AddStudentForm';
import TeacherManagementPage   from './pages/TeacherManagementPage';

function AppContent({ userInfo, setUserInfo, adminMeta, setAdminMeta, firebaseUser }) {
  const [page, setPage] = useState('menu');
  const [approvalTab, setApprovalTab] = useState('approve');
  const role = userInfo.role;
  const isAdmin = !!adminMeta && adminMeta.uid === firebaseUser.uid;
  const pendingCount = usePendingApprovalCount(role, userInfo);
  const goToApproval = tab => { setApprovalTab(tab); setPage('approval'); };

  if (page === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 gap-4 px-4">
        <h1 className="text-xl font-semibold">
          {userInfo.name}님, 환영합니다!
        </h1>
        <p className="text-sm text-gray-600">원하시는 작업을 선택해주세요.</p>

        {/* 역할별 메뉴 버튼 (세로 정렬) */}
        <div className="flex flex-col gap-4">
          {(role === 'nurse' || role === 'counselor' || role === 'welfare') && (
            <>
              <button onClick={() => setPage('home')}   className="btn-teal">방문 신청</button>
              <button onClick={() => setPage('break')}  className="btn-teal">쉬는 시간 방문</button>
              <button onClick={() => goToApproval('status')} className="btn-teal">요청 내역</button>
            </>
          )}
          {(role === 'homeroom' || role === 'subject') && (
            <>
              <button onClick={() => goToApproval('approve')} className="btn-indigo">
                요청 승인{pendingCount > 0 ? ` (${role === 'homeroom' ? pendingCount : `전체 ${pendingCount}`})` : ''}
              </button>
              <button onClick={() => goToApproval('status')}  className="btn-indigo">승인 현황</button>
            </>
          )}
          {role === 'homeroom' && (
            <button onClick={() => setPage('leave')} className="btn-amber">조퇴/외출 기록</button>
          )}
          {role === 'homeroom' && (
            <button onClick={() => setPage('add-student')} className="btn-violet">학생 관리</button>
          )}
          {(role === 'subject' || role === 'homeroom') && (
            <button onClick={() => setPage('external')} className="btn-amber">외부인 방문 기록</button>
          )}
          {/* 공통: 외부인/조퇴 현황, 설정, 로그아웃 */}
          <button onClick={() => setPage('admin')}    className="btn-slate">외부인 / 조퇴 현황</button>
          {isAdmin && (
            <>
              <button onClick={() => setPage('admin-upload')}   className="btn-violet">학생 명렬표 업로드</button>
              <button onClick={() => setPage('teachers')}       className="btn-violet">교사 관리</button>
              <button onClick={() => setPage('admin-settings')} className="btn-rose">시스템 관리</button>
            </>
          )}
          <button onClick={() => setPage('settings')} className="btn-blue">설정</button>
          <button
            onClick={async () => {
              setPage('menu');
              await auth.signOut();
            }}
            className="btn-red"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

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
        {page === 'home'     && <VisitRequestForm   userInfo={userInfo} />}
        {page === 'break'    && <BreakVisitForm     userInfo={userInfo} />}
        {page === 'approval' && (
          <ApprovalScreen role={role} userInfo={userInfo} initialTab={approvalTab} />
        )}
        {page === 'leave'    && <LeaveRequestForm   userInfo={userInfo} />}
        {page === 'external' && <ExternalVisitForm  userInfo={userInfo} />}
        {page === 'admin'    && <AdminVisitorView /> }
        {page === 'add-student'    && <AddStudentForm userInfo={userInfo} />}
        {page === 'admin-upload'   && <AdminStudentUpload />}
        {page === 'teachers'       && <TeacherManagementPage currentUid={firebaseUser.uid} />}
        {page === 'admin-settings' && (
          <AdminSettingsPage adminMeta={adminMeta} onAdminTransferred={setAdminMeta} />
        )}
        {page === 'settings' && (
          <SettingsPage
            user={auth.currentUser}
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
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userInfo, setUserInfo]         = useState(null);
  const [adminMeta, setAdminMeta]       = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setUserInfo(null);
      return;
    }
    (async () => {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      setUserInfo(snap.exists() ? snap.data() : null);
    })();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) {
      setAdminMeta(null);
      return;
    }
    (async () => {
      const meta = await loadOrBootstrapAdmin(firebaseUser);
      setAdminMeta(meta);
    })();
  }, [firebaseUser]);

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중…</div>;
  }
  if (!firebaseUser) {
    return <GoogleLogin />;
  }
  if (!userInfo) {
    return <RoleRegisterForm user={firebaseUser} onComplete={info => setUserInfo(info)} />;
  }

  return (
    <Router>
      <Routes>
        {/* 개별 라우트 */}
        <Route path="/visit-request" element={<VisitRequestForm userInfo={userInfo} />} />
        <Route path="/break-visit"  element={<BreakVisitForm userInfo={userInfo} />} />
        <Route path="/attendance-dev"      element={<AttendancePage />} />
        <Route path="/attendance-report"   element={<AttendanceReportPage />} />
        <Route path="/admin-students"      element={<AdminStudentUpload />} />
        <Route path="/homeroom-attendance" element={<HomeroomAttendancePage />} />

        {/* 이외 경로는 AppContent가 처리 */}
        <Route
          path="/*"
          element={
            <AppContent
              userInfo={userInfo}
              setUserInfo={setUserInfo}
              adminMeta={adminMeta}
              setAdminMeta={setAdminMeta}
              firebaseUser={firebaseUser}
            />
          }
        />
      </Routes>
    </Router>
  );
}
