// src/components/LeaveRequestForm.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const LeaveRequestForm = () => {
  const [form, setForm] = useState({
    grade: '',
    class: '',
    name: '',
    hour: '08',
    minute: '00',
    reason: '',
    type: '조퇴'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const time = `${form.hour}:${form.minute}`;
    try {
      await addDoc(collection(db, 'leaves'), {
        grade: form.grade,
        class: form.class,
        name: form.name,
        time,
        reason: form.reason,
        type: form.type,
        createdAt: new Date()
      });
      alert('조퇴/외출 기록이 저장되었습니다!');
      setForm({ grade: '', class: '', name: '', hour: '08', minute: '00', reason: '', type: '조퇴' });
    } catch (error) {
      console.error('저장 실패:', error);
      alert('기록 저장 중 오류가 발생했습니다.');
    }
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minuteOptions = ['00', '10', '20', '30', '40', '50'];

  return (
    <div className="max-w-md mx-auto p-4 border rounded-xl shadow bg-white">
      <h2 className="text-xl font-bold mb-4 text-center">조퇴/외출 기록</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <input name="grade" value={form.grade} onChange={handleChange} placeholder="학년" className="border p-2 rounded text-sm" required />
          <input name="class" value={form.class} onChange={handleChange} placeholder="반" className="border p-2 rounded text-sm" required />
        </div>
        <input name="name" value={form.name} onChange={handleChange} placeholder="이름" className="border p-2 w-full rounded text-sm" required />

        <div className="grid grid-cols-2 gap-2">
          <select name="hour" value={form.hour} onChange={handleChange} className="border p-2 rounded text-sm">
            {hourOptions.map(hour => <option key={hour} value={hour}>{hour}시</option>)}
          </select>
          <select name="minute" value={form.minute} onChange={handleChange} className="border p-2 rounded text-sm">
            {minuteOptions.map(min => <option key={min} value={min}>{min}분</option>)}
          </select>
        </div>

        <input name="reason" value={form.reason} onChange={handleChange} placeholder="사유" className="border p-2 w-full rounded text-sm" required />

        <select name="type" value={form.type} onChange={handleChange} className="border p-2 w-full rounded text-sm">
          <option value="조퇴">조퇴</option>
          <option value="외출">외출</option>
        </select>

        <button type="submit" className="bg-blue-500 text-white text-sm px-4 py-2 rounded hover:bg-blue-600 w-full">기록 저장</button>
      </form>
    </div>
  );
};

export default LeaveRequestForm;