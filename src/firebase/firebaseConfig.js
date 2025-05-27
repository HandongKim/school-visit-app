// d:\school-visit-app\src\firebase\firebaseConfig.js

import { initializeApp } from "firebase/app"; // Firebase 앱 초기화 함수
import { getAuth } from "firebase/auth";       // Firebase 인증 서비스 가져오기 함수
import { getFirestore } from "firebase/firestore"; // Firebase Firestore 서비스 가져오기 함수
// import { getStorage } from "firebase/storage"; // Firebase Storage 서비스 (필요시 주석 해제)
// import { getAnalytics } from "firebase/analytics"; // Firebase Analytics 서비스 (필요시 주석 해제)

/**
 * @file firebaseConfig.js
 * @description Firebase 프로젝트 설정 정보를 담고 있으며, Firebase 서비스를 초기화하는 파일입니다.
 * 이 파일에 정의된 `auth` 및 `db` 인스턴스를 통해 애플리케이션의 다른 부분에서
 * Firebase 인증 및 Firestore 데이터베이스 기능을 사용할 수 있습니다.
 * .env 파일 또는 환경 변수를 통해 Firebase 설정 값을 안전하게 관리하는 것이 권장됩니다.
 */

// Firebase 프로젝트 웹 앱의 Firebase 구성 객체입니다.
// 보안을 위해 이 값들은 직접 코드에 하드코딩하는 대신,
// 환경 변수(.env 파일 등)를 통해 주입하는 것이 좋습니다.
// 예: process.env.REACT_APP_FIREBASE_API_KEY
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, // Google Analytics 사용 시
};

// Firebase 앱을 초기화합니다.
const app = initializeApp(firebaseConfig);

// Firebase 인증 서비스 인스턴스를 가져옵니다.
// 이 `auth` 객체를 사용하여 사용자 로그인, 로그아웃, 현재 사용자 정보 가져오기 등의 작업을 수행합니다.
export const auth = getAuth(app);

// Firebase Firestore (데이터베이스) 서비스 인스턴스를 가져옵니다.
// 이 `db` 객체를 사용하여 Firestore의 컬렉션 및 문서에 접근하여 데이터를 읽고 쓸 수 있습니다.
export const db = getFirestore(app);

// Firebase Storage 서비스 인스턴스 (파일 업로드/다운로드 등에 사용, 필요시 주석 해제)
// export const storage = getStorage(app);

// Firebase Analytics 서비스 인스턴스 (사용자 행동 분석 등에 사용, 필요시 주석 해제)
// export const analytics = getAnalytics(app);

// 기본적으로 app 인스턴스를 내보낼 수도 있습니다 (다른 Firebase 서비스 초기화에 필요할 경우).
export default app;
