// d:\school-visit-app\src\constants\appConstants.js

/**
 * @file appConstants.js
 * @description 애플리케이션 전체에서 사용되는 상수들을 정의하는 파일입니다.
 * 역할(ROLES) 및 경로(PATHS)와 같이 반복적으로 사용되거나 의미를 명확히 해야 하는 값들을 관리합니다.
 * 이를 통해 코드의 일관성을 유지하고 오타로 인한 오류를 줄일 수 있습니다.
 */

/**
 * @constant ROLES
 * @description 사용자 역할을 정의하는 상수 객체입니다.
 * 각 역할은 고유한 문자열 값으로 매핑됩니다.
 * 예: `ROLES.NURSE`는 'nurse' 문자열을 나타냅니다.
 */
export const ROLES = {
  NURSE: 'nurse',         // 보건교사
  COUNSELOR: 'counselor', // 상담교사
  WELFARE: 'welfare',     // 복지교사
  HOMEROOM: 'homeroom',   // 담임교사
  SUBJECT: 'subject',     // 교과교사
  GATE_KEEPER: 'gatekeeper', // "정문관리자" 역할 추가
  // 필요에 따라 다른 역할 추가 가능 (예: ADMIN: 'admin' - 관리자)
};

/**
 * @constant PATHS
 * @description 애플리케이션 내 페이지 경로를 정의하는 상수 객체입니다.
 * `react-router-dom`의 `Link` 컴포넌트나 `useNavigate` 훅과 함께 사용되어
 * 경로 이동 시 문자열을 직접 사용하는 대신 상수를 참조하도록 합니다.
 * 각 경로는 해당 페이지의 기능을 나타내는 이름으로 매핑됩니다.
 */
export const PATHS = {
  // --- 인증 후 접근 가능한 주요 기능 경로 ---
  HOME: 'home',         // 방문 신청 (주로 특별실 교사용)
  BREAK: 'break',       // 쉬는 시간 방문 기록 (주로 특별실 교사용)
  STATUS: 'status',     // 요청 내역 (특별실 교사) / 승인 현황 (교과/담임 교사) - 역할에 따라 다른 내용 표시
  APPROVE: 'approve',   // 방문 요청 승인 (주로 교과/담임 교사용)
  LEAVE: 'leave',       // 조퇴/외출 기록 (주로 담임 교사용)
  EXTERNAL: 'external', // 외부인 방문 기록 (주로 교과/담임 교사용)
  ADMIN: 'admin',       // 외부인/조퇴 현황 (모든 교사 공통 접근 가능)
  SETTINGS: 'settings', // 사용자 설정 (모든 교사 공통 접근 가능)

  // --- 독립적인 페이지 또는 테스트용 페이지 경로 ---
  // App.jsx에서 직접 라우팅되는 경로들입니다.
  // 필요에 따라 '/'를 앞에 붙여 절대 경로로 사용하거나, AppContentRoutes 내부로 옮길 수 있습니다.
  ATTENDANCE_DEV: '/attendance-dev',            // 출석부 개발 테스트 페이지
  ATTENDANCE_REPORT: '/attendance-report',      // 출석 보고서 페이지
  ADMIN_STUDENTS: '/admin-students',            // 학생 정보 관리(업로드) 페이지
  HOMEROOM_ATTENDANCE: '/homeroom-attendance',  // 담임용 출석 페이지

  // --- 인증 관련 경로 (App.jsx에서 주로 처리) ---
  // LOGIN: '/login', // 로그인 페이지 (현재 GoogleLogin 컴포넌트가 직접 렌더링됨)
  // ROLE_REGISTER: '/register', // 역할 등록 페이지 (현재 RoleRegisterForm 컴포넌트가 직접 렌더링됨)
};

/**
 * @constant ROLE_NAMES
 * @description 사용자 역할 코드에 대한 한글 표시 이름을 정의하는 상수 객체입니다.
 * UI에 역할을 표시할 때 사용됩니다.
 */
export const ROLE_NAMES = {
  [ROLES.NURSE]: '보건교사',
  [ROLES.COUNSELOR]: '상담교사',
  [ROLES.WELFARE]: '복지교사',
  [ROLES.HOMEROOM]: '담임교사',
  [ROLES.SUBJECT]: '교과교사',
  [ROLES.GATE_KEEPER]: '정문관리자', // "정문관리자" 한글 이름 추가
};