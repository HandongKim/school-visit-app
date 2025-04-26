// src/components/domain/VisitRequest/ApprovalScreen.jsx

import React, { useEffect, useState } from 'react';
// Firebase 설정을 alias 경로로 import (@ maps to src/)
import { db } from '../../../firebase/firebaseConfig';
// Firestore 쿼리 및 업데이트 함수 불러오기
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
  // -- 컴포넌트 상태 관리 --------------------------------
  const [requests, setRequests]       = useState([]);   // 오늘 생성된 방문 요청 목록
  const [withSubject, setWithSubject] = useState(false); // 담임 승인 시 교과 승인도 함께 처리 여부

  // 상태 문자열을 안전하게 비교하기 위한 정규화 함수
  const normalized = v => (v || '').toString().trim();

  // -- 오늘 요청 데이터 조회 --------------------------------
  useEffect(() => {
    async function fetchData() {
      try {
        // 오늘 00:00 ~ 23:59:59 범위 생성
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        // visits 컬렉션에서 createdAt 필드를 기준으로 오늘 범위 쿼리
        const q = query(
          collection(db, 'visits'),
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<=', Timestamp.fromDate(end))
        );

        const snap = await getDocs(q);
        // 문서 데이터를 배열로 변환
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRequests(data);
      } catch (err) {
        console.error('요청 조회 오류:', err);
      }
    }

    fetchData();
  }, []); // 빈 배열: 마운트 시 한 번만 실행

  // -- 승인/거절 처리 함수 ----------------------------------
  async function handleApproval(id, type) {
    const ref = doc(db, 'visits', id);
    const now = new Date().toISOString();

    // 업데이트할 필드 생성
    const updateFields = {
      [`status.${role}`]: type === 'approve' ? '승인' : '거절',
      [`timestamp.${role}`]: now,
    };

    // 담임이 승인 시 교과 승인도 함께 처리 옵션 적용
    if (role === 'homeroom' && type === 'approve' && withSubject) {
      updateFields['status.subject']   = '승인';
      updateFields['timestamp.subject'] = now;
    }

    try {
      await updateDoc(ref, updateFields);
      // 로컬 state에도 반영
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

  // -- 사용자 역할·모드에 따른 필터링 -------------------------
  const filtered = requests.filter(item => {
    const status        = item.status || {};
    const gradeMatch    = String(item.grade) === String(userInfo.grade);
    const classMatch    = String(item.class) === String(userInfo.class);
    const homeroomOk    = normalized(status.homeroom) === '승인';
    const subjectOk     = normalized(status.subject)  === '승인';
    const bothApproved  = homeroomOk && subjectOk;

    // 승인 모드
    if (mode === 'approve') {
      if (role === 'homeroom')  return !homeroomOk && !bothApproved && gradeMatch && classMatch;
      if (role === 'subject')   return !subjectOk && !bothApproved;
    }

    // 현황 모드
    if (mode === 'status') {
      if (role === 'homeroom')
        return (!subjectOk && homeroomOk && gradeMatch && classMatch) || bothApproved;
      if (role === 'subject')   return bothApproved;
      if (role === 'nurse' || role === 'counselor')
        return true; // 보건/상담교사는 오늘 생성된 모든 요청 보기
    }

    return false;
  });

  // -- 개별 요청 아이템 렌더 함수 -----------------------------
  const renderItem = item => {
    const status     = item.status || {};
    const isApproved = status.homeroom === '승인' && status.subject === '승인';

    return (
      <li key={item.id} className="bg-white shadow rounded-xl p-4 text-sm">
        {/* 요청자 정보 */}
        <div className="font-semibold mb-1">
          {item.name} ({item.grade}학년 {item.class}반)
        </div>
        {/* 요청 상세 */}
        <div className="text-gray-700 mb-2">
          시간: {item.time} <br />
          사유: {item.reason} <br />
          유형: {item.type}
        </div>
        {/* 승인/거절 버튼 또는 현황 표시 */}
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
      {/* 제목 */}
      <h2 className="text-xl font-bold mb-4 text-center">
        {mode === 'approve' ? '요청 승인' : '승인 현황'}
      </h2>

      {/* 담임 승인 시 교과 승인 옵션 */}
      {mode === 'approve' && role === 'homeroom' && (
        <div className="mb-4 flex items-center gap-2 text-base text-gray-700">
          <input
            type="checkbox"
            checked={withSubject}
            onChange={() => setWithSubject(!withSubject)}
            id="withSubjectApproval"
            className="w-4 h-4"
          />
          <label htmlFor="withSubjectApproval">
            교과 승인도 함께 처리
          </label>
        </div>
      )}

      {/* 요청 목록 또는 안내 메시지 */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 text-sm">
          표시할 요청이 없습니다.
        </p>
      ) : (
        <ul className="space-y-4">
          {filtered.map(renderItem)}
        </ul>
      )}
    </div>
  );
}
