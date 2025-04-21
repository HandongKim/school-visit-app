// src/pages/AdminStudentUpload.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function AdminStudentUpload() {
  const [message, setMessage] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      let success = 0;
      let failed = 0;

      for (let row of rows) {
        const { 학년, 반, 번호, 이름 } = row;
        if (!학년 || !반 || !번호 || !이름) {
          failed++;
          continue;
        }

        const grade = String(학년);
        const classNum = String(반);
        const studentNum = String(번호).padStart(2, '0'); // 3 → 03
        const studentId = `${grade}${classNum}${studentNum}`; // 예: 1203

        try {
          await setDoc(doc(db, `students/${grade}/${classNum}/${studentId}`), {
            name: 이름,
            number: 번호
          });
          success++;
        } catch (error) {
          console.error('Error saving student:', error);
          failed++;
        }
      }

      setMessage(`업로드 완료: ${success}명 성공, ${failed}명 실패`);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">학생 명단 업로드 (엑셀)</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFile} className="mb-4" />
      {message && <p className="text-green-600 font-semibold">{message}</p>}
    </div>
  );
}
