// src/components/domain/VisitRequest/ApprovalScreen.jsx

import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  where,
  Timestamp,
} from 'firebase/firestore';

export default function ApprovalScreen({ role, mode, userInfo }) {
  const [requests, setRequests] = useState([]);
  const [withSubject, setWithSubject] = useState(false);

  const normalized = v => (v || '').toString().trim();

  // 오늘 요청 데이터 조회
  useEffect(() => {
    async function fetchData() {
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const q = query(
          collection(db, 'visits'),
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<=', Timestamp.fromDate(end))
        );
        const snap = await getDocs(q);
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('요청 조회 오류:', err);
      }
    }
    fetchData();
  }, []);

  // 승인/거절 처리
  async function handleApproval(id, type) {
    const ref = doc(db, 'visits', id);
    const now = new Date().toISOString();
    const updateFields = {
      [`status.${role}`]: type === 'approve' ? '승인' : '거절',
      [`timestamp.${role}`]: now,
    };
    if (role === 'homeroom' && type === 'approve' && withSubject) {
      updateFields['status.subject'] = '승인';
      updateFields['timestamp.subject'] = now;
    }
    try {
      await updateDoc(ref, updateFields);
      setRequests(prev =>
        prev.map(item =>
          item.id === id
            ? {
                ...item,
                status: {
                  ...item.status,
                  [role]: type === 'approve' ? '승인' : '거절',
                  ...(role === 'homeroom' && type === 'approve' && withSubject
                    ? { subject: '승인' }
                    : {}),
                },
                timestamp: {
                  ...item.timestamp,
                  [role]: now,
                  ...(role === 'homeroom' && type === 'approve' && withSubject
                    ? { subject: now }
                    : {}),
                },
              }
            : item
        )
      );
    } catch (err) {
      console.error('승인 처리 오류:', err);
    }
  }

  // 승인/현황 모드별 필터링 (쉬는 시간 방문 제외)
  const filtered = requests.filter(item => {
    if (item.breakVisit) return false;
    const status = item.status || {};
    const gradeMatch = String(item.grade) === String(userInfo.grade);
    const classMatch = String(item.class) === String(userInfo.class);
    const homeroomOk = normalized(status.homeroom) === '승인';
    const subjectOk = normalized(status.subject) === '승인';
    const bothApproved = homeroomOk && subjectOk;

    if (mode === 'approve') {
      if (role === 'homeroom')
        return !homeroomOk && !bothApproved && gradeMatch && classMatch;
      if (role === 'subject') return !subjectOk && !bothApproved;
    }
    if (mode === 'status') {
      if (role === 'homeroom')
        return (
          (!subjectOk && homeroomOk && gradeMatch && classMatch) || bothApproved
        );
      if (role === 'subject') return bothApproved;
      if (role === 'nurse' || role === 'counselor') return true;
    }
    return false;
  });

  // 승인 목록용 렌더러
  const renderApprovalItem = item => {
    const status = item.status || {};
    const isApproved = status.homeroom === '승인' && status.subject === '승인';
    const timeDisplay =
      item.breakVisit && item.departureTime
        ? new Date(item.departureTime.seconds * 1000).toLocaleTimeString(
            'ko-KR',
            { hour: '2-digit', minute: '2-digit' }
          )
        : item.time;

    return (
      <li key={item.id} className="bg-white shadow rounded-xl p-4 text-sm">
        <div className="font-semibold mb-1">
          {item.name} ({item.grade}학년 {item.class}반)
        </div>
        <div className="text-gray-700 mb-2">
          시간: {timeDisplay} <br />
          사유: {item.reason} <br />
          유형: {item.type}
        </div>
        {mode === 'approve' ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleApproval(item.id, 'approve')}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
            >
              승인
            </button>
            <button
              onClick={() => handleApproval(item.id, 'reject')}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              거절
            </button>
          </div>
        ) : (
          <div className="text-sm text-blue-600 font-semibold">
            {isApproved
              ? '승인 완료'
              : `승인 대기 중 (${status.homeroom ?? '대기'} / ${
                  status.subject ?? '대기'
                })`}
          </div>
        )}
      </li>
    );
  };

  // 쉬는 시간 방문 현황용 렌더러
  const renderBreakItem = item => {
    const timeDisplay =
      item.breakVisit && item.departureTime
        ? new Date(item.departureTime.seconds * 1000).toLocaleTimeString(
            'ko-KR',
            { hour: '2-digit', minute: '2-digit' }
          )
        : item.time;

    return (
      <li key={item.id} className="bg-white shadow rounded-xl p-4 text-sm">
        <div className="font-semibold mb-1">
          {item.name} ({item.grade}학년 {item.class}반)
        </div>
        <div className="text-gray-700 mb-2">
          시간: {timeDisplay} <br />
          사유: {item.reason} <br />
          유형: {item.type}
        </div>
      </li>
    );
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4 text-center">
        {mode === 'approve' ? '요청 승인' : '승인 현황'}
      </h2>

      {mode === 'approve' && role === 'homeroom' && (
        <div className="mb-4 flex items-center gap-2 text-base text-gray-700">
          <input
            type="checkbox"
            checked={withSubject}
            onChange={() => setWithSubject(!withSubject)}
            id="withSubjectApproval"
            className="w-4 h-4"
          />
          <label htmlFor="withSubjectApproval">교과 승인도 함께 처리</label>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 text-sm">
          표시할 요청이 없습니다.
        </p>
      ) : (
        <ul className="space-y-4">
          {filtered.map(renderApprovalItem)}
        </ul>
      )}

      {/* 쉬는 시간 방문 현황 */}
      {mode === 'status' && (() => {
        const breakVisits = requests.filter(item => item.breakVisit);
        if (!breakVisits.length) return null;
        return (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-center">
              쉬는 시간 방문 현황
            </h3>
            <ul className="space-y-4">
              {breakVisits.map(renderBreakItem)}
            </ul>
          </div>
        );
      })()}
    </div>
  );
}
