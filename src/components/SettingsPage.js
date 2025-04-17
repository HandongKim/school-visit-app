// src/components/SettingsPage.js
import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SettingsPage = ({ user, onUpdate }) => {
  const [role, setRole] = useState('');
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRole(data.role || '');
        setGrade(data.grade || '');
        setClassNum(data.class || '');
      }
    };
    loadUserData();
  }, [user]);

  const handleUpdate = async () => {
    if (!role) {
      setMessage('역할을 선택해주세요.');
      return;
    }

    if (role === 'homeroom' && (!grade || !classNum)) {
      setMessage('담임교사의 경우 학년과 반을 입력해야 합니다.');
      return;
    }

    const updatedData = { role };

    if (role === 'homeroom') {
      updatedData.grade = grade;
      updatedData.class = classNum;
    } else {
      updatedData.grade = null;
      updatedData.class = null;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updatedData);
      setMessage('저장 완료!');
      onUpdate(updatedData); // App.js에서 상태 반영
    } catch (err) {
      console.error(err);
      setMessage('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">교사 정보 수정</h2>

        <label className="block text-sm mb-1 font-medium">교사 역할</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="">선택</option>
          <option value="homeroom">담임교사</option>
          <option value="subject">교과교사</option>
          <option value="nurse">보건교사</option>
          <option value="counselor">상담교사</option>
          <option value="gatekeeper">정문관리자</option>
        </select>

        {role === 'homeroom' && (
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              placeholder="학년"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="number"
              placeholder="반"
              value={classNum}
              onChange={(e) => setClassNum(e.target.value)}
              className="w-1/2 p-2 border rounded"
            />
          </div>
        )}

        <button
          onClick={handleUpdate}
          className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded font-semibold"
        >
          저장
        </button>

        {message && <p className="mt-4 text-sm text-center text-gray-600">{message}</p>}
      </div>
    </div>
  );
};

export default SettingsPage;
