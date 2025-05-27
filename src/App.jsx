// d/school-visit-app/src/App.jsx

import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router, // HTML5 히스토리 API를 사용하여 UI와 URL을 동기화하는 라우터
  Routes,                  // 여러 <Route> 컴포넌트를 그룹화하고, 현재 URL과 일치하는 첫 번째 <Route>를 렌더링
  Route,                   // 특정 경로에 어떤 컴포넌트를 렌더링할지 정의
} from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth'; // Firebase 인증 상태 변경을 감지하는 함수
import { doc, getDoc } from 'firebase/firestore';   // Firestore 문서 참조 및 가져오기 함수
import { auth, db } from './firebase/firebaseConfig'; // Firebase 인증 및 Firestore 인스턴스

// UI 컴포넌트 임포트
import GoogleLogin      from './components/ui/GoogleLogin';    // 구글 로그인 컴포넌트
import RoleRegisterForm from './components/ui/RoleRegisterForm'; // 역할 등록 폼 컴포넌트

// 도메인(기능)별 컴포넌트 임포트 (App.jsx에서 직접 라우팅하는 경우)
// 대부분의 내부 페이지는 AppContentRoutes로 이동했으므로, 여기서 직접 사용하는 경우는 줄어듭니다.
// 아래 예시는 만약 특정 페이지를 App.jsx 레벨에서 직접 라우팅해야 할 경우를 대비한 것입니다.
// import VisitRequestForm   from './components/domain/VisitRequest/VisitRequestForm';
// import BreakVisitForm     from './components/domain/VisitRequest/BreakVisitForm';

// 페이지 컴포넌트 임포트 (주로 테스트 또는 독립적인 페이지, 인증과 무관하거나 별도 처리)
import AttendancePage          from './pages/AttendancePage';
import HomeroomAttendancePage  from './pages/HomeroomAttendancePage';
import AdminStudentUpload      from './pages/AdminStudentUpload';
import AttendanceReportPage    from './pages/AttendanceReportPage';

// 라우팅 및 레이아웃 컴포넌트 임포트
import AppContentRoutes from './routes/AppContentRoutes'; // 인증된 사용자의 내부 라우팅 담당

/**
 * 애플리케이션의 최상위 컴포넌트입니다.
 * 인증 상태를 확인하고, 상태에 따라 로그인 페이지, 역할 등록 페이지, 또는 메인 콘텐츠(AppContentRoutes)를 렌더링합니다.
 * 전체 라우팅 설정을 담당합니다.
 */
export default function App() {
  // --- 상태(State) 정의 ---
  // checkingAuth: 현재 Firebase 인증 상태를 확인 중인지 여부 (초기 로딩 화면 표시용)
  const [checkingAuth, setCheckingAuth] = useState(true);
  // firebaseUser: Firebase로부터 받은 현재 로그인된 사용자 객체 (인증 여부 판단용)
  const [firebaseUser, setFirebaseUser] = useState(null);
  // userInfo: Firestore 'users' 컬렉션에서 가져온 현재 로그인된 사용자의 상세 정보 (역할, 이름 등)
  const [userInfo, setUserInfo]         = useState(null);

  // --- 효과(Effect) 정의 ---

  // 컴포넌트 마운트 시 Firebase 인증 상태 변경을 감지하는 리스너 설정
  useEffect(() => {
    // onAuthStateChanged는 사용자 로그인/로그아웃 시 호출되는 콜백 함수를 등록합니다.
    // 반환되는 함수(unsubscribe)는 컴포넌트 언마운트 시 리스너를 정리합니다.
    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);     // Firebase 사용자 객체 업데이트
      setCheckingAuth(false);    // 인증 상태 확인 완료
    });
    return () => unsubscribe(); // 클린업 함수: 컴포넌트가 사라질 때 리스너 제거
  }, []); // 빈 배열을 두 번째 인자로 전달하여 컴포넌트가 처음 마운트될 때만 실행

  // firebaseUser 상태가 변경될 때마다 Firestore에서 사용자 상세 정보 가져오기
  useEffect(() => {
    if (!firebaseUser) { // 로그아웃 상태이거나 아직 사용자 정보가 없다면
      setUserInfo(null); // userInfo도 null로 설정
      return;
    }
    // 비동기 즉시 실행 함수 (IIFE)를 사용하여 async/await 사용
    (async () => {
      try {
        // Firestore 'users' 컬렉션에서 현재 사용자의 UID를 문서 ID로 사용하여 데이터 조회
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) { // 문서가 존재하면
          setUserInfo(userDocSnap.data()); // userInfo 상태에 문서 데이터 저장
        } else { // 문서가 존재하지 않으면 (예: 신규 가입 후 아직 역할 정보가 없는 경우)
          setUserInfo(null); // userInfo를 null로 설정
          console.log("Firestore에 사용자 정보가 없습니다. 역할 등록이 필요할 수 있습니다.");
        }
      } catch (error) {
        console.error("Firestore 사용자 정보 조회 중 오류 발생:", error);
        setUserInfo(null); // 오류 발생 시 userInfo 초기화
      }
    })();
  }, [firebaseUser]); // firebaseUser가 변경될 때마다 이 useEffect 실행

  // SettingsPage에서 사용자 정보(예: 이름)가 업데이트되었을 때 App 컴포넌트의 userInfo 상태를 업데이트하기 위한 콜백 함수
  // 이 함수는 AppContentRoutes를 통해 SettingsPage까지 전달됩니다.
  const handleUserUpdate = (updatedData) => {
    setUserInfo(prevInfo => ({ ...prevInfo, ...updatedData }));
  };

  // --- 조건부 렌더링 ---

  // 1. 인증 상태 확인 중일 때 로딩 화면 표시
  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-lg">앱 로딩 중…</div>;
  }

  // 2. 로그인되어 있지 않으면 GoogleLogin 컴포넌트 표시
  if (!firebaseUser) {
    return <GoogleLogin />;
  }

  // 3. 로그인되었으나 Firestore에 사용자 정보(역할 등)가 없으면 RoleRegisterForm 표시
  //    (예: 최초 로그인 후 역할 미지정 상태)
  if (!userInfo) {
    // RoleRegisterForm에서 역할 등록이 완료되면 onComplete 콜백이 호출되어 userInfo 상태를 업데이트하고,
    // 이로 인해 App 컴포넌트가 리렌더링되어 AppContentRoutes로 넘어갑니다.
    return <RoleRegisterForm user={firebaseUser} onComplete={info => setUserInfo(info)} />;
  }

  // 4. 모든 조건 통과 시 (로그인 및 사용자 정보 모두 존재) 메인 애플리케이션 라우팅
  return (
    <Router>
      <Routes>
        {/* 
          개별 라우트: 이 라우트들은 로그인 여부와 관계없이 접근 가능하거나,
          또는 AppContentRoutes와는 별개의 독립적인 페이지들입니다.
          주로 테스트/개발용 페이지들이며, 필요에 따라 인증 보호 로직을 추가할 수 있습니다.
          현재 앱의 주요 기능은 AppContentRoutes 내부에서 처리됩니다.
        */}
        {/* <Route path="/visit-request"       element={<VisitRequestForm userInfo={userInfo} />} /> */}
        {/* <Route path="/break-visit"         element={<BreakVisitForm userInfo={userInfo} />} /> */}
        <Route path="/attendance-dev"      element={<AttendancePage />} />
        <Route path="/attendance-report"   element={<AttendanceReportPage />} />
        <Route path="/admin-students"      element={<AdminStudentUpload />} />
        <Route path="/homeroom-attendance" element={<HomeroomAttendancePage />} />

        {/* 
          '/*' 경로는 위에서 정의된 특정 경로들을 제외한 모든 경로를 의미합니다.
          인증된 사용자가 접근하는 모든 내부 페이지(메인 메뉴, 방문 신청, 설정 등)는
          AppContentRoutes 컴포넌트를 통해 관리됩니다.
          userInfo와 handleUserUpdate 콜백을 props로 전달하여 하위 컴포넌트에서 사용할 수 있도록 합니다.
        */}
        <Route 
          path="/*" 
          element={<AppContentRoutes userInfo={userInfo} onUserUpdate={handleUserUpdate} />} 
        />
      </Routes>
    </Router>
  );
}
