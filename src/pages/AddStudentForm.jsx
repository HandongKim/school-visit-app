// src/pages/AddStudentForm.jsx
// 담임 교사가 학기 중 전입생을 추가하거나 전출생을 삭제하는 화면

import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function AddStudentForm({ userInfo }) {
  const grade = String(userInfo?.grade || '');
  const classNum = String(userInfo?.class || '');

  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');

  const loadRoster = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'students', grade, classNum));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => Number(a.number) - Number(b.number));
      setRoster(list);
      const maxNumber = list.reduce((max, s) => Math.max(max, Number(s.number) || 0), 0);
      setNumber(String(maxNumber + 1));
    } catch (err) {
      console.error('학생 명단 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (grade && classNum) loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, classNum]);

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    if (!name || !number) {
      setMessage('이름과 번호를 모두 입력해주세요.');
      return;
    }

    const studentNum = String(number).padStart(2, '0');
    const studentId = `${grade}${classNum}${studentNum}`;
    const exists = roster.some(s => s.id === studentId);
    if (exists && !window.confirm('이미 존재하는 번호입니다. 덮어쓸까요?')) {
      return;
    }

    try {
      await setDoc(doc(db, 'students', grade, classNum, studentId), {
        name,
        number: Number(number),
      });
      setMessage(`✅ ${name} 학생이 추가되었습니다.`);
      setName('');
      await loadRoster();
    } catch (err) {
      console.error('학생 추가 오류:', err);
      setMessage('❌ 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async student => {
    if (!window.confirm(`${student.number}번 ${student.name} 학생을 명단에서 삭제할까요?`)) return;
    try {
      await deleteDoc(doc(db, 'students', grade, classNum, student.id));
      setMessage(`✅ ${student.name} 학생이 삭제되었습니다.`);
      await loadRoster();
    } catch (err) {
      console.error('학생 삭제 오류:', err);
      setMessage('❌ 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">학생 관리</h2>
        <p className="text-sm text-gray-600 text-center mb-4">
          {grade}학년 {classNum}반
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="이름"
            className="border p-2 w-full rounded text-sm"
            required
          />
          <input
            type="number"
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="번호"
            className="border p-2 w-full rounded text-sm"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded text-sm font-semibold"
          >
            추가하기
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-center text-gray-600">{message}</p>}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold mb-2 text-sm">현재 명단</h3>
        {loading ? (
          <p className="text-sm text-gray-500">불러오는 중...</p>
        ) : roster.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 학생이 없습니다.</p>
        ) : (
          <ul className="text-sm divide-y">
            {roster.map(s => (
              <li key={s.id} className="py-1 flex items-center justify-between gap-2">
                <span>{s.number}번</span>
                <span className="flex-1">{s.name}</span>
                <button
                  onClick={() => handleDelete(s)}
                  className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
