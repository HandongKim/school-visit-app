// src/constants/appConstants.js

/**
 * 사용자 역할을 정의하는 상수 객체입니다.
 * 코드 전체에서 일관된 역할 문자열을 사용하도록 돕습니다.
 */
export const ROLES = {
  NURSE: 'nurse',         // 보건교사
  COUNSELOR: 'counselor', // 상담교사
  WELFARE: 'welfare',     // 복지교사
  HOMEROOM: 'homeroom',   // 담임교사
  SUBJECT: 'subject',     // 교과교사
  // 필요에 따라 다른 역할 추가 (예: ADMIN: 'admin')
};

/**
 * 애플리케이션 내 페이지 경로를 정의하는 상수 객체입니다.
 * react-router-dom의 Link 또는 navigate 함수와 함께 사용됩니다.
 */
export const PATHS = {
  HOME: 'home',         // 방문 신청 (특별실 교사)
  BREAK: 'break',       // 쉬는 시간 방문 (특별실 교사)
  STATUS: 'status',     // 요청 내역 (특별실 교사) / 승인 현황 (교과/담임 교사)
  APPROVE: 'approve',   // 요청 승인 (교과/담임 교사)
  LEAVE: 'leave',       // 조퇴/외출 기록 (담임 교사)
  EXTERNAL: 'external', // 외부인 방문 기록 (교과/담임 교사)
  ADMIN: 'admin',       // 외부인/조퇴 현황 (공통)
  SETTINGS: 'settings', // 설정 (공통)
  // 애플리케이션의 다른 경로들 추가
  LOGIN: '/login',              // 로그인 페이지 (예시, App.jsx에서 직접 처리)
  ROLE_REGISTER: '/register', // 역할 등록 페이지 (예시, App.jsx에서 직접 처리)
};
