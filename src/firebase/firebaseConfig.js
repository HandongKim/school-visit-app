// src/firebase/firebaseConfig.js

import { initializeApp } from 'firebase/app';
// Firebase Authentication과 Google Provider
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
// Firestore (DB) 서비스
import { getFirestore } from 'firebase/firestore';

// Firebase 프로젝트 설정은 환경 변수에서 로드됩니다.
// 테스트 환경의 경우 `.env.test` 파일을 사용하여 값을 지정할 수 있습니다.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// — 퍼시스턴스 설정 추가 —
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .catch(err => console.error('Auth persistence 설정 오류:', err));
export const provider = new GoogleAuthProvider();
export const db       = getFirestore(app);
