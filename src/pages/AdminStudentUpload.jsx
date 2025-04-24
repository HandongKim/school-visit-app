// src/pages/AdminStudentUpload.jsx

import React, { useState } from 'react';
// Excel 파싱 라이브러리
import * as XLSX from 'xlsx';
// Firebase 설정을 alias 경로로 import
import { db } from '@/firebase/firebaseConfig';
// Firestore 쓰기 함수들
import { doc, setDoc } from 'firebase/firestore';

export default function AdminStudentUpload() {
  // 업로드 완료 메시지 상태
  const [message, setMessage] = useState('');

  // 엑셀 파일 처리 핸들러
  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async evt => {
      // ArrayBuffer → Uint8Array → workbook
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      // 시트 내용을 JSON 배열로 변환
      const rows = XLSX.utils.sheet_to_json(sheet);

      let success = 0;
      let failed  = 0;

      // 각 행마다 Firestore에 저장
      for (const row of rows) {
        const { 학년, 반, 번호, 이름 } = row;
        // 필수 필드 체크
        if (!학년 || !반 || !번호 || !이름) {
          failed++;
          continue;
        }

        const grade      = String(학년);
        const classNum   = String(반);
        const studentNum = String(번호).padStart(2, '0');  // 예: 3 → "03"
        const studentId  = `${grade}${classNum}${studentNum}`;  // 예: "1203"

        try {
          // students/{grade}/{class}/{studentId} 경로에 문서 저장
          await setDoc(
            doc(db, 'students', grade, classNum, studentId),
            {
              name:   이름,
              number: 번호,
            }
          );
          success++;
        } catch (err) {
          console.error('학생 저장 오류:', err);
          failed++;
        }
      }

      // 처리 결과 메시지 표시
      setMessage(`업로드 완료: ${success}명 성공, ${failed}명 실패`);
    };

    // 파일을 ArrayBuffer로 읽기 시작
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-6">
      {/* 페이지 제목 */}
      <h1 className="text-2xl font-bold mb-4">
        학생 명단 업로드 (엑셀)
      </h1>

      {/* 파일 선택 입력 */}
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFile}
        className="mb-4"
      />

      {/* 처리 결과 메시지 */}
      {message && (
        <p className="text-green-600 font-semibold">
          {message}
        </p>
      )}
    </div>
  );
}
