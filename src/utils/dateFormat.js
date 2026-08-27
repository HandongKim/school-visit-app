// src/utils/dateFormat.js
// Date.toISOString()은 UTC 기준이라 한국 시간(UTC+9)에서는 자정~오전 9시 사이에
// 날짜/시간이 실제와 다르게 표시되는 문제가 있다. <input type="date">, <input type="datetime-local">
// 등에 넣을 "로컬 기준" 문자열은 반드시 이 함수들로 만든다.

function pad(n) {
  return String(n).padStart(2, '0');
}

// "YYYY-MM-DD" (로컬 기준)
export function toLocalDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "YYYY-MM-DDTHH:mm" (로컬 기준, <input type="datetime-local"> 용)
export function toLocalDatetimeString(date = new Date()) {
  return `${toLocalDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
