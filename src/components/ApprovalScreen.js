// src/components/ApprovalScreen.js
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  where,
  Timestamp,
} from 'firebase/firestore';

const ApprovalScreen = ({ role, mode, userInfo }) => {
  const [requests, setRequests] = useState([]);
  const [withSubject, setWithSubject] = useState(false);

  const normalized = (v) => (v || '').toString().trim();

  useEffect(() => {
    const fetchData = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'visits'),
        where('createdAt', '>=', Timestamp.fromDate(todayStart)),
        where('createdAt', '<=', Timestamp.fromDate(todayEnd))
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
    };

    fetchData();
  }, []);

  const handleApproval = async (id, type) => {
    const ref = doc(db, 'visits', id);
    const now = new Date().toISOString();

    try {
      const updateFields = {
        [`status.${role}`]: type === 'approve' ? '승인' : '거절',
        [`timestamp.${role}`]: now,
      };

      if (role === 'homeroom' && type === 'approve' && withSubject) {
        updateFields['status.subject'] = '승인';
        updateFields['timestamp.subject'] = now;
      }

      await updateDoc(ref, updateFields);

      setRequests((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: {
                  ...item.status,
                  [role]: type === 'approve' ? '승인' : '거절',
                  ...(role === 'homeroom' &&
                  type === 'approve' &&
                  withSubject
                    ? { subject: '승인' }
                    : {}),
                },
                timestamp: {
                  ...item.timestamp,
                  [role]: now,
                  ...(role === 'homeroom' &&
                  type === 'approve' &&
                  withSubject
                    ? { subject: now }
                    : {}),
                },
              }
            : item
        )
      );
    } catch (err) {
      console.error('승인 오류:', err);
    }
  };

  const filtered = requests.filter((item) => {
    const status = item.status || {};
    const gradeMatch = String(item.grade) === String(userInfo.grade);
    const classMatch = String(item.class) === String(userInfo.class);

    const homeroomApproved = normalized(status.homeroom) === '승인';
    const subjectApproved = normalized(status.subject) === '승인';
    const bothApproved = homeroomApproved && subjectApproved;

    if (mode === 'approve') {
      if (role === 'homeroom') {
        return (
          !homeroomApproved && !bothApproved && gradeMatch && classMatch
        );
      }
      if (role === 'subject') {
        return !subjectApproved && !bothApproved;
      }
    }

    if (mode === 'status') {
      if (role === 'homeroom') {
        return (
          (!subjectApproved && homeroomApproved && gradeMatch && classMatch) ||
          bothApproved
        );
      }
      if (role === 'subject') {
        return bothApproved;
      }

      // ✅ 보건교사 또는 상담교사라면 오늘 생성된 모든 요청 보기
      if (role === 'nurse' || role === 'counselor') {
        return true; // 이미 위에서 오늘 생성된 데이터만 가져왔기 때문에 그대로 출력
      }
    }

    return false;
  });

  const renderItem = (item) => {
    const status = item.status || {};
    const isApproved =
      status.homeroom === '승인' && status.subject === '승인';

    return (
      <li key={item.id} className="bg-white shadow rounded-xl p-4 text-sm">
        <div className="font-semibold mb-1">
          {item.name} ({item.grade}학년 {item.class}반)
        </div>
        <div className="text-gray-700 mb-2">
          시간: {item.time} <br />
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
        <ul className="space-y-4">{filtered.map(renderItem)}</ul>
      )}
    </div>
  );
};

export default ApprovalScreen;
