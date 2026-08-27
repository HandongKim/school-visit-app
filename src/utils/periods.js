// src/utils/periods.js
// 교시 목록 및 "지금이 몇 교시인지" 계산 유틸
// 시간표: 1교시 09:00 시작, 수업 45분 / 쉬는시간 10분, 4교시 후 60분 점심(12:30~13:30), 최대 7교시

export const PERIODS = ['조회', '1교시', '2교시', '3교시', '4교시', '5교시', '6교시', '7교시'];

const PERIOD_WINDOWS = [
  { label: '1교시', start: 9 * 60,       end: 9 * 60 + 45 },
  { label: '2교시', start: 9 * 60 + 55,  end: 10 * 60 + 40 },
  { label: '3교시', start: 10 * 60 + 50, end: 11 * 60 + 35 },
  { label: '4교시', start: 11 * 60 + 45, end: 12 * 60 + 30 },
  { label: '5교시', start: 13 * 60 + 30, end: 14 * 60 + 15 },
  { label: '6교시', start: 14 * 60 + 25, end: 15 * 60 + 10 },
  { label: '7교시', start: 15 * 60 + 20, end: 16 * 60 + 5 },
];

// 현재 교시를 반환. 수업 중이면 그 교시, 쉬는시간/점심시간이면 다음 교시(방문이 다음 수업에
// 걸칠 가능성이 크므로), 첫 교시 이전은 '조회', 마지막 교시 이후는 '7교시'로 폴백.
export function getCurrentPeriod(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();

  if (minutes < PERIOD_WINDOWS[0].start) return '조회';

  for (const w of PERIOD_WINDOWS) {
    if (minutes >= w.start && minutes < w.end) return w.label;
  }

  const next = PERIOD_WINDOWS.find(w => minutes < w.start);
  if (next) return next.label;

  return '7교시';
}
