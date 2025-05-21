// src/components/domain/VisitRequest/BreakVisitForm.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebaseConfig';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';

export default function BreakVisitForm({ userInfo }) {
  const role = userInfo?.role;
  const typeMapping = {
    nurse: '보건실',
    counselor: '상담실',
    welfare: '복지실',
  };
  const isFixedType = ['nurse', 'counselor', 'welfare'].includes(role);
  const defaultType = typeMapping[role] || '보건실';

  const [form, setForm] = useState({
    grade: userInfo?.grade || '',
    class: userInfo?.class || '',
    name: '',
    type: defaultType,
    reason: '',
    departureTime: new Date().toISOString().slice(0,16),
  });

  useEffect(() => {
    if (isFixedType) setForm(f => ({ ...f, type: defaultType }));
  }, [defaultType, isFixedType]);

  const [studentList, setStudentList] = useState([]);
  useEffect(() => {
    async function loadStudents() {
      if (!form.grade || !form.class) { setStudentList([]); return; }
      const q = query(collection(db, 'students', form.grade, form.class));
      const snap = await getDocs(q);
      setStudentList(snap.docs.map(d => d.data().name));
    }
    if (role !== 'homeroom') loadStudents();
  }, [form.grade, form.class, role]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      grade: form.grade,
      class: form.class,
      name: form.name,
      type: form.type,
      reason: form.reason,
      breakVisit: true,
      time: null,
      departureTime: new Date(form.departureTime),
      status: { homeroom: '승인', subject: '승인' },
      confirmed: true,
      createdAt: new Date(),
    };
    try {
      await addDoc(collection(db, 'visits'), payload);
      alert('✅ 쉬는 시간 방문이 기록되었습니다!');
      setForm(f => ({
        ...f,
        name: '',
        reason: '',
        departureTime: new Date().toISOString().slice(0,16),
      }));
    } catch (err) {
      console.error(err);
      alert('❌ 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">쉬는 시간 방문 기록</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <select
              name="grade"
              value={form.grade}
              onChange={handleChange}
              className="border p-2 rounded w-1/2 text-sm"
              required
            >
              <option value="">학년</option>
              {[1,2,3].map(g => (
                <option key={g} value={String(g)}>{g}학년</option>
              ))}
            </select>
            <select
              name="class"
              value={form.class}
              onChange={handleChange}
              className="border p-2 rounded w-1/2 text-sm"
              required
            >
              <option value="">반</option>
              {[...Array(5)].map((_,i)=>(
                <option key={i+1} value={String(i+1)}>{i+1}반</option>
              ))}
            </select>
          </div>
          {studentList.length > 0 ? (
            <select
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
              required
            >
              <option value="">학생 선택</option>
              {studentList.map(n=>(
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          ) : (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름"
              className="border p-2 w-full rounded text-sm"
              required
            />
          )}
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            disabled={isFixedType}
            className="border p-2 w-full rounded text-sm"
            required
          >
            <option value="보건실">보건실</option>
            <option value="상담실">상담실</option>
            <option value="복지실">복지실</option>
          </select>
          <input
            type="datetime-local"
            name="departureTime"
            value={form.departureTime}
            onChange={handleChange}
            className="border p-2 w-full rounded text-sm"
            required
          />
          <input
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="사유"
            className="border p-2 w-full rounded text-sm"
            required
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded text-sm">
            기록하기
          </button>
        </form>
      </div>
    </div>
  );
}
