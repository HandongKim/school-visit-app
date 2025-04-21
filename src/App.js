// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GoogleLogin from './components/GoogleLogin';
import RoleRegisterForm from './components/RoleRegisterForm';
import VisitRequestForm from './components/VisitRequestForm';
import ApprovalScreen from './components/ApprovalScreen';
import LeaveRequestForm from './components/LeaveRequestForm';
import AdminVisitorView from './components/AdminVisitorView';
import ExternalVisitForm from './components/ExternalVisitForm';
import SettingsPage from './components/SettingsPage';
import AttendancePage from './pages/AttendancePage'; // ✅ 새로 추가될 페이지
import AdminStudentUpload from './pages/AdminStudentUpload'; // 상단 import 추가
import HomeroomAttendancePage from './pages/HomeroomAttendancePage';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

function AppContent() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [page, setPage] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserInfo(docSnap.data());
        } else {
          setUserInfo(null);
        }
      }
    };
    fetchUserInfo();
  }, [firebaseUser]);

  if (!firebaseUser) {
    return <GoogleLogin onLogin={(user) => setFirebaseUser(user)} />;
  }

  if (!userInfo) {
    return <RoleRegisterForm user={firebaseUser} onComplete={(info) => setUserInfo(info)} />;
  }

  const role = userInfo.role;

  if (page === '' || page === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 gap-4 px-4">
        <h1 className="text-xl font-semibold mb-2">{userInfo.name}님, 환영합니다!</h1>
        <p className="text-sm text-gray-600">원하시는 작업을 선택해주세요.</p>

        {(role === 'nurse' || role === 'counselor') && (
          <>
            <button onClick={() => setPage('home')} className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl shadow w-60 font-semibold">방문 요청</button>
            <button onClick={() => setPage('status')} className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl shadow w-60 font-semibold">요청 현황</button>
          </>
        )}

        {(role === 'homeroom' || role === 'subject') && (
          <>
            <button onClick={() => setPage('approve')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl shadow w-60 font-semibold">요청 승인</button>
            <button onClick={() => setPage('status')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl shadow w-60 font-semibold">승인 현황</button>
          </>
        )}

        {role === 'homeroom' && (
          <button onClick={() => setPage('leave')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl shadow w-60 font-semibold">조퇴/외출 기록</button>
        )}

        {(role === 'subject' || role === 'homeroom') && (
          <button onClick={() => setPage('external')} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl shadow w-60 font-semibold">외부인 방문 기록</button>
        )}

        {role === 'gatekeeper' && (
          <button onClick={() => setPage('admin')} className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-xl shadow w-60 font-semibold">외부인 / 조퇴 현황</button>
        )}

        <button onClick={() => setPage('settings')} className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-3 rounded-xl shadow w-60 font-semibold">설정</button>

        <button onClick={() => {
          setFirebaseUser(null);
          setUserInfo(null);
        }} className="bg-red-400 hover:bg-red-500 text-white px-6 py-3 rounded-xl shadow w-60 font-semibold">로그아웃</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 px-4 py-6">
      <header className="bg-white shadow rounded-xl px-6 py-4 mb-6 text-center font-bold text-lg">
        {userInfo.name}님이 선택한 페이지
        <div className="mt-2">
          <button onClick={() => setPage('menu')} className="text-blue-500 underline text-sm">← 메뉴로 돌아가기</button>
        </div>
      </header>

      <main>
        {page === 'home' && <VisitRequestForm />}
        {page === 'approve' && <ApprovalScreen role={role} mode="approve" userInfo={userInfo} />}
        {page === 'status' && <ApprovalScreen role={role} mode="status" userInfo={userInfo} />}
        {page === 'leave' && <LeaveRequestForm userInfo={userInfo} />}
        {page === 'external' && <ExternalVisitForm />}
        {page === 'admin' && <AdminVisitorView />}
        {page === 'settings' && (
          <SettingsPage
            user={firebaseUser}
            onUpdate={(updated) => {
              const newUserInfo = { ...userInfo, ...updated };
              setUserInfo(newUserInfo);
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
        <Route path="/attendance-dev" element={<AttendancePage />} />
        <Route path="/admin-students" element={<AdminStudentUpload />} />
        <Route path="/homeroom-attendance" element={<HomeroomAttendancePage />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}
