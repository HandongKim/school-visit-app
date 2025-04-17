// src/components/AdminVisitorView.js
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

const AdminVisitorView = () => {
  const [visitors, setVisitors] = useState([]);
  const [leavers, setLeavers] = useState([]);

  const fetchLeaves = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'leaves'),
      where('createdAt', '>=', Timestamp.fromDate(todayStart)),
      where('createdAt', '<=', Timestamp.fromDate(todayEnd))
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setVisitors(data.filter((item) => item.type === '외부인 방문'));
    setLeavers(data.filter((item) => item.type === '조퇴' || item.type === '외출'));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 text-center">외부인 방문 확인 목록</h2>
        {visitors.length === 0 ? (
          <p className="text-center text-sm text-gray-500">외부인 방문 기록이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {visitors.map((rec) => (
              <li key={rec.id} className="bg-white shadow rounded p-3 text-sm">
                <div className="font-semibold">{rec.name}</div>
                <div className="text-gray-600">{rec.time} · {rec.reason}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-center">조퇴 / 외출 학생 목록</h2>
        {leavers.length === 0 ? (
          <p className="text-center text-sm text-gray-500">조퇴 및 외출 기록이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {leavers.map((rec) => (
              <li key={rec.id} className="bg-white shadow rounded p-3 text-sm">
                <div className="font-semibold">{rec.name} ({rec.grade}학년 {rec.class}반)</div>
                <div className="text-gray-600">{rec.time} · {rec.type} · {rec.reason}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminVisitorView;
