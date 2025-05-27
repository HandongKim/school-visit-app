// d:\school-visit-app\src\App.jsx

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

// 페이지 컴포넌트 임포트 (주로 테스트 또는 독립적인 페이지, 인증과 무관하거나 별도 처리)
import AttendancePage          from './pages/AttendancePage';
import HomeroomAttendancePage  from './pages/HomeroomAttendancePage';
import AdminStudentUpload      from './pages/AdminStudentUpload';
import AttendanceReportPage    from './pages/AttendanceReportPage';

// 라우팅 및 레이아웃 컴포넌트 임포트
import AppContentRoutes from './routes/AppContentRoutes'; // 인증된 사용자의 내부 라우팅 담당

/**
 * @file App.jsx
 * @description 애플리케이션의 최상위 루트 컴포넌트입니다.
 * Firebase 인증 상태를 관리하고, 사용자의 인증 상태 및 Firestore에 저장된 역할 정보에 따라
 * 적절한 페이지(로그인, 역할 등록, 또는 메인 애플리케이션 콘텐츠)를 렌더링합니다.
 * 전체적인 라우팅 설정을 담당합니다.
 */
export default function App() {
  // --- 상태(State) 정의 ---

  // `checkingAuth`: Firebase 인증 상태를 확인 중인지 여부를 나타내는 상태입니다.
  // true이면 로딩 화면을 표시하고, false이면 인증 상태에 따른 화면을 보여줍니다.
  const [checkingAuth, setCheckingAuth] = useState(true);

  // `firebaseUser`: Firebase `onAuthStateChanged` 리스너로부터 받은 현재 로그인된 사용자 객체입니다.
  // null이면 로그아웃 상태, 객체가 있으면 로그인 상태를 의미합니다.
  const [firebaseUser, setFirebaseUser] = useState(null);

  // `userInfo`: Firestore 'users' 컬렉션에서 가져온 현재 로그인된 사용자의 상세 정보입니다.
  // (예: 역할, 이름, 학년, 반 등). null이면 아직 정보를 가져오지 못했거나 정보가 없는 상태입니다.
  const [userInfo, setUserInfo]         = useState(null);

  // --- 효과(Effect) 정의 ---

  // 컴포넌트가 마운트될 때 Firebase 인증 상태 변경을 감지하는 리스너를 설정합니다.
  useEffect(() => {
    // `onAuthStateChanged`는 사용자 로그인/로그아웃 시 콜백 함수를 실행합니다.
    // 이 함수는 구독 해제 함수(unsubscribe)를 반환하여, 컴포넌트 언마운트 시 리스너를 정리할 수 있게 합니다.
    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);     // 감지된 Firebase 사용자 객체로 `firebaseUser` 상태 업데이트
      setCheckingAuth(false);    // 인증 상태 확인이 완료되었으므로 `checkingAuth`를 false로 설정
    });

    // 클린업 함수: 컴포넌트가 언마운트될 때 `onAuthStateChanged` 리스너를 제거하여 메모리 누수를 방지합니다.
    return () => unsubscribe();
  }, []); // 의존성 배열이 비어있으므로, 이 useEffect는 컴포넌트가 처음 마운트될 때 한 번만 실행됩니다.

  // `firebaseUser` 상태가 변경될 때마다 (즉, 로그인 또는 로그아웃 시)
  // Firestore에서 해당 사용자의 상세 정보를 가져옵니다.
  useEffect(() => {
    // `firebaseUser`가 null (로그아웃 상태)이면 `userInfo`도 null로 설정하고 함수를 종료합니다.
    if (!firebaseUser) {
      setUserInfo(null);
      return;
    }

    // 비동기 즉시 실행 함수 (Immediately Invoked Function Expression, IIFE)를 사용하여
    // useEffect 콜백 내에서 async/await를 사용합니다.
    (async () => {
      try {
        // Firestore 'users' 컬렉션에서 현재 사용자의 UID를 문서 ID로 사용하여 문서 참조를 만듭니다.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        // 해당 문서의 스냅샷을 가져옵니다.
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) { // 문서가 Firestore에 존재하면
          setUserInfo(userDocSnap.data()); // 문서 데이터를 `userInfo` 상태에 저장합니다.
        } else { // 문서가 존재하지 않으면 (예: 신규 가입 후 아직 역할 정보가 없는 경우)
          setUserInfo(null); // `userInfo`를 null로 설정합니다.
          console.log("Firestore에 사용자 정보가 없습니다. 역할 등록이 필요할 수 있습니다.");
        }
      } catch (error) {
        console.error("Firestore 사용자 정보 조회 중 오류 발생:", error);
        setUserInfo(null); // 오류 발생 시 `userInfo`를 null로 초기화합니다.
      }
    })();
  }, [firebaseUser]); // `firebaseUser`가 변경될 때마다 이 useEffect가 다시 실행됩니다.

  /**
   * `SettingsPage`에서 사용자 정보(예: 이름)가 업데이트되었을 때
   * `App` 컴포넌트의 `userInfo` 상태도 함께 업데이트하기 위한 콜백 함수입니다.
   * 이 함수는 `AppContentRoutes`를 통해 `SettingsPage`까지 props로 전달됩니다.
   * @param {object} updatedData - `SettingsPage`에서 업데이트된 사용자 정보의 일부
   */
  const handleUserUpdate = (updatedData) => {
    // 이전 `userInfo` 상태를 기반으로 새로운 데이터를 병합하여 상태를 업데이트합니다.
    setUserInfo(prevInfo => ({ ...prevInfo, ...updatedData }));
  };

  // --- 조건부 렌더링 로직 ---

  // 1. `checkingAuth`가 true이면 (인증 상태 확인 중), 로딩 화면을 표시합니다.
  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-lg">앱 로딩 중…</div>;
  }

  // 2. `firebaseUser`가 null이면 (로그인되어 있지 않으면), `GoogleLogin` 컴포넌트를 표시합니다.
  if (!firebaseUser) {
    return <GoogleLogin />;
  }

  // 3. `firebaseUser`는 있지만 `userInfo`가 null이면 (로그인되었으나 Firestore에 사용자 정보가 없으면),
  //    `RoleRegisterForm` 컴포넌트를 표시하여 사용자 역할을 등록하도록 합니다.
  //    (예: 최초 구글 로그인 후 아직 앱 내 역할이 지정되지 않은 상태)
  if (!userInfo) {
    // `RoleRegisterForm`에서 역할 등록이 완료되면 `onComplete` 콜백이 호출되어 `userInfo` 상태를 업데이트합니다.
    // `userInfo`가 업데이트되면 이 `App` 컴포넌트가 리렌더링되어 다음 조건(메인 앱 표시)으로 넘어갑니다.
    return <RoleRegisterForm user={firebaseUser} onComplete={info => setUserInfo(info)} />;
  }

  // 4. 모든 조건 통과 시 (로그인되어 있고, Firestore에 사용자 정보도 존재하면),
  //    메인 애플리케이션 라우팅을 설정합니다.
  return (
    <Router> {/* react-router-dom의 BrowserRouter를 사용하여 라우팅 컨텍스트를 제공합니다. */}
      <Routes> {/* 여러 Route들을 그룹화합니다. */}
        {/* 
          개별 라우트 정의:
          이 라우트들은 로그인 여부와 관계없이 접근 가능하거나 (예: 공개 페이지),
          또는 `AppContentRoutes`와는 별개의 독립적인 페이지들입니다.
          주로 테스트/개발용 페이지들이며, 필요에 따라 각 페이지 컴포넌트 내부에서
          추가적인 인증 보호 로직을 구현할 수 있습니다.
          현재 앱의 주요 기능은 아래 `AppContentRoutes` 내부에서 처리됩니다.
        */}
        {/* 예시: 만약 /visit-request 경로를 App.jsx에서 직접 처리해야 한다면 주석 해제
        <Route path="/visit-request"       element={<VisitRequestForm userInfo={userInfo} />} />
        <Route path="/break-visit"         element={<BreakVisitForm userInfo={userInfo} />} /> 
        */}
        <Route path="/attendance-dev"      element={<AttendancePage />} />
        <Route path="/attendance-report"   element={<AttendanceReportPage />} />
        <Route path="/admin-students"      element={<AdminStudentUpload />} />
        <Route path="/homeroom-attendance" element={<HomeroomAttendancePage />} />

        {/* 
          와일드카드 라우트 ('/*'): 위에서 정의된 특정 경로들과 일치하는 것이 없을 때 이 라우트가 매칭됩니다.
          인증된 사용자가 접근하는 모든 내부 페이지(메인 메뉴, 방문 신청, 설정 등)는
          `AppContentRoutes` 컴포넌트를 통해 관리됩니다.
          `userInfo`와 `handleUserUpdate` 콜백을 props로 전달하여 하위 컴포넌트에서 사용할 수 있도록 합니다.
        */}
        <Route 
          path="/*" 
          element={<AppContentRoutes userInfo={userInfo} onUserUpdate={handleUserUpdate} />} 
        />
      </Routes>
    </Router>
  );
}
