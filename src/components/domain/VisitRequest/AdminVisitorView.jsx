// src/components/domain/VisitRequest/AdminVisitorView.jsx

import React, { useEffect, useState } from 'react';
// Firebase 설정을 alias 경로로 import (@ maps to src/)
import { db } from '../../../firebase/firebaseConfig';
// Firestore 쿼리용 함수 및 Timestamp 불러오기
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

export default function AdminVisitorView() {
  // 외부인 방문(rec.visitors), 조퇴/외출 학생(rec.leavers) 상태 관리
  const [visitors, setVisitors] = useState([]);
  const [leavers, setLeavers]   = useState([]);

  // 오늘 날짜 범위(start/end)를 만들어 Firestore에서 데이터 조회
  async function fetchLeaves() {
    // 오늘 00:00부터 23:59:59까지의 Timestamp 계산
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 'leaves' 컬렉션을 createdAt 필드를 기준으로 오늘 범위로 쿼리
    const q = query(
      collection(db, 'leaves'),
      where('createdAt', '>=', Timestamp.fromDate(todayStart)),
      where('createdAt', '<=', Timestamp.fromDate(todayEnd))
    );

    try {
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // type 필드에 따라 외부인 방문과 조퇴/외출 분리
      setVisitors(data.filter(item => item.type === '외부인 방문'));
      setLeavers(data.filter(item => item.type === '조퇴' || item.type === '외출'));
    } catch (err) {
      console.error('방문/조퇴 데이터 조회 오류:', err);
    }
  }

  // 컴포넌트 마운트 시 한 번 fetchLeaves 실행
  useEffect(() => {
    fetchLeaves();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4 space-y-8">
      {/* 외부인 방문 확인 목록 */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-center">
          외부인 방문 확인 목록
        </h2>
        {visitors.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            외부인 방문 기록이 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {visitors.map(rec => (
              <li
                key={rec.id}
                className="bg-white shadow rounded p-3 text-sm"
              >
                <div className="font-semibold">{rec.name}</div>
                <div className="text-gray-600">
                  {rec.time} · {rec.reason}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 조퇴 / 외출 학생 목록 */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-center">
          조퇴 / 외출 학생 목록
        </h2>
        {leavers.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            조퇴 및 외출 기록이 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {leavers.map(rec => (
              <li
                key={rec.id}
                className="bg-white shadow rounded p-3 text-sm"
              >
                {/* rec.grade, rec.class, rec.name 필드가 Firestore 문서에 있어야 합니다 */}
                <div className="font-semibold">
                  {rec.name} ({rec.grade}학년 {rec.class}반)
                </div>
                <div className="text-gray-600">
                  {rec.time} · {rec.type} · {rec.reason}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
