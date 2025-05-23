// src/firebase/firebaseConfig.js

import { initializeApp } from 'firebase/app';
// Firebase Authentication과 Google Provider
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
// Firestore (DB) 서비스
import { getFirestore } from 'firebase/firestore';

// Firebase 프로젝트 설정 (Firebase console에서 발급된 값)
const firebaseConfig = {
  apiKey: 'AIzaSyAjhuEp6jqLdeS7-arTf2IrW6w6rnFjJJs',
  authDomain: 'school-visit-fdb03.web.app',
  projectId: 'school-visit-fdb03',
  storageBucket: 'school-visit-fdb03.firebasestorage.app',
  messagingSenderId: '57920252837',
  appId: '1:57920252837:web:ee97a39eb08da01d30d64c',
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// — 퍼시스턴스 설정 추가 —
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .catch(err => console.error('Auth persistence 설정 오류:', err));
export const provider = new GoogleAuthProvider();
export const db       = getFirestore(app);
