// src/utils/visitFilters.js
// 방문 요청(visits)의 "승인 대기" 판정 로직. ApprovalScreen과 대기 건수 배지 훅이 공유해
// 두 곳의 판정 기준이 어긋나지 않도록 한다.

// 담임 기준: 담임 미승인 + (담임+교과 둘 다 승인은 아님) + 본인 반 학생
export function isPendingHomeroom(item, userInfo) {
  if (item.breakVisit) return false;
  const { homeroom, subject } = item.status || {};
  const gMatch = String(item.grade) === String(userInfo?.grade);
  const cMatch = String(item.class) === String(userInfo?.class);
  const hOk = homeroom === '승인';
  const sOk = subject === '승인';
  const both = hOk && sOk;
  return !hOk && !both && gMatch && cMatch;
}

// 교과 기준: 학교 전체에서 교과 미승인 + (둘 다 승인은 아님). 시간표 데이터가 없어
// 특정 교과교사에게 배정할 수 없으므로 전체 건수를 그대로 사용한다.
export function isPendingSubject(item) {
  if (item.breakVisit) return false;
  const { homeroom, subject } = item.status || {};
  const hOk = homeroom === '승인';
  const sOk = subject === '승인';
  const both = hOk && sOk;
  return !sOk && !both;
}
