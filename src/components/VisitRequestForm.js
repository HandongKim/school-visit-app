// src/components/VisitRequestForm.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const VisitRequestForm = () => {
  const [form, setForm] = useState({
    grade: '',
    class: '',
    name: '',
    time: '1교시',
    reason: '',
    type: '보건실'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'visits'), {
        ...form,
        status: {
          homeroom: '대기',
          subject: '대기'
        },
        confirmed: false,
        createdAt: new Date()
      });
      alert('방문 요청이 저장되었습니다!');
      setForm({ grade: '', class: '', name: '', time: '1교시', reason: '', type: '보건실' });
    } catch (error) {
      console.error('저장 실패:', error);
      alert('요청 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">학생 방문 요청</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input name="grade" value={form.grade} onChange={handleChange} placeholder="학년" className="border border-gray-300 p-2 rounded w-1/2 text-sm" required />
            <input name="class" value={form.class} onChange={handleChange} placeholder="반" className="border border-gray-300 p-2 rounded w-1/2 text-sm" required />
          </div>
          <input name="name" value={form.name} onChange={handleChange} placeholder="이름" className="border border-gray-300 p-2 rounded w-full text-sm" required />
          <select name="time" value={form.time} onChange={handleChange} className="border border-gray-300 p-2 w-full rounded text-sm">
            {['1교시','2교시','3교시','4교시','5교시','6교시','7교시'].map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
          <input name="reason" value={form.reason} onChange={handleChange} placeholder="사유" className="border border-gray-300 p-2 w-full rounded text-sm" required />
          <select name="type" value={form.type} onChange={handleChange} className="border border-gray-300 p-2 w-full rounded text-sm">
            <option value="보건실">보건실</option>
            <option value="상담실">상담실</option>
          </select>
          <button type="submit" className="bg-blue-500 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-600 w-full transition">요청 저장</button>
        </form>
      </div>
    </div>
  );
};

export default VisitRequestForm;