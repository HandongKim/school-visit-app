// src/index.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
// 전역 스타일(CSS + Tailwind)
import './index.css';
// App 컴포넌트를 alias 경로로 import (@ maps to src/)
import App from '@/App';
// 웹 바이탈 측정용 함수 (필요 시 사용)
import reportWebVitals from '@/reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // React.StrictMode로 감싸면 개발 모드 경고 및 검사 기능이 활성화됩니다.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// reportWebVitals 함수에 콜백을 넘기면 웹 바이탈 데이터를 로깅하거나 보내도록 설정할 수 있습니다.
// 예시: reportWebVitals(console.log);
