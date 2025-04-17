// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAjhuEp6jqLdeS7-arTf2IrW6w6rnFjJJs',
  authDomain: 'school-visit-fdb03.firebaseapp.com',
  projectId: 'school-visit-fdb03',
  storageBucket: 'school-visit-fdb03.firebasestorage.app',
  messagingSenderId: '57920252837',
  appId: '1:57920252837:web:ee97a39eb08da01d30d64c',
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// ✅ 필요한 서비스 객체 가져오기
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
