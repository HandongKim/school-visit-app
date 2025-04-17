// src/components/ExternalVisitForm.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const ExternalVisitForm = () => {
  const [name, setName] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!name || !hour || !minute || !reason) {
      setMessage('모든 항목을 입력해주세요.');
      return;
    }

    const time = `${hour}:${minute}`;
    const record = {
      name,
      time,
      reason,
      type: '외부인 방문',
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'leaves'), record);
      setMessage('✅ 외부인 방문 기록이 저장되었습니다.');
      setName('');
      setHour('');
      setMinute('');
      setReason('');
    } catch (error) {
      setMessage('❌ 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4 text-center">외부인 방문 기록</h2>

      <input
        type="text"
        placeholder="방문자 이름"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <select value={hour} onChange={e => setHour(e.target.value)} className="border p-2 rounded">
          <option value="">시</option>
          {[...Array(24)].map((_, i) => (
            <option key={i} value={String(i).padStart(2, '0')}>
              {String(i).padStart(2, '0')}시
            </option>
          ))}
        </select>

        <select value={minute} onChange={e => setMinute(e.target.value)} className="border p-2 rounded">
          <option value="">분</option>
          {['00', '10', '20', '30', '40', '50'].map((m) => (
            <option key={m} value={m}>{m}분</option>
          ))}
        </select>
      </div>

      <textarea
        placeholder="방문 사유 입력"
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800 font-semibold"
      >
        저장
      </button>

      {message && <p className="text-sm mt-3 text-center">{message}</p>}
    </div>
  );
};

export default ExternalVisitForm;
