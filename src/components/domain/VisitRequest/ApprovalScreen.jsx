// src/components/domain/VisitRequest/ApprovalScreen.jsx

import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  where,
  Timestamp,
} from 'firebase/firestore';

export default function ApprovalScreen({ role, mode, userInfo }) {
  const [requests, setRequests]       = useState([]);
  const [withSubject, setWithSubject] = useState(false);

  useEffect(() => {
    (async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const end   = new Date(); end.setHours(23,59,59,999);
      const q = query(
        collection(db, 'visits'),
        where('createdAt','>=',Timestamp.fromDate(start)),
        where('createdAt','<=',Timestamp.fromDate(end))
      );
      const snap = await getDocs(q);
      setRequests(snap.docs.map(d=>({id:d.id,...d.data()})));
    })();
  }, []);

  const handleApproval = async (id, type) => {
    const ref = doc(db,'visits',id);
    const now = new Date().toISOString();
    const updateFields = {
      [`status.${role}`]: type==='approve'?'승인':'거절',
      [`timestamp.${role}`]: now
    };
    if (role==='homeroom' && type==='approve' && withSubject) {
      updateFields['status.subject']='승인';
      updateFields['timestamp.subject']=now;
    }
    await updateDoc(ref, updateFields);
    setRequests(r =>
      r.map(item =>
        item.id===id
          ? { ...item,
              status: { 
                ...item.status,
                [role]:type==='approve'?'승인':'거절',
                ...(role==='homeroom'&&type==='approve'&&withSubject?{subject:'승인'}:{})
              },
              timestamp:{
                ...item.timestamp,
                [role]:now,
                ...(role==='homeroom'&&type==='approve'&&withSubject?{subject:now}:{})
              }
            }
          : item
      )
    );
  };

  const handleDelete = async id => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await deleteDoc(doc(db,'visits',id));
    setRequests(r => r.filter(item=>item.id!==id));
  };

  // 승인 현황 리스트 필터링 (breakVisit 제외)
  const filtered = requests.filter(item => {
    if (item.breakVisit) return false;
    const { homeroom, subject } = item.status||{};
    const gMatch = String(item.grade)===String(userInfo.grade);
    const cMatch = String(item.class)===String(userInfo.class);
    const hOk = homeroom==='승인';
    const sOk = subject==='승인';
    const both = hOk&&sOk;

    if (mode==='approve') {
      if (role==='homeroom') return !hOk&&!both&&gMatch&&cMatch;
      if (role==='subject')  return !sOk&&!both;
    }
    if (mode==='status') {
      if (role==='homeroom') return (hOk&&!sOk&&gMatch&&cMatch)||both;
      if (role==='subject')  return both;
      if (['nurse','counselor','welfare'].includes(role)) return true;
    }
    return false;
  });

  // 시간 순 정렬 맵
  const periodOrder = { '조회':0,'1교시':1,'2교시':2,'3교시':3,'4교시':4,'5교시':5,'6교시':6,'7교시':7 };
  const sortedFiltered = [...filtered].sort((a,b)=>
    (periodOrder[a.time]||0)-(periodOrder[b.time]||0)
  );

  // 쉬는시간 방문만 따로 추출·정렬
  const breakVisits = requests.filter(item=>item.breakVisit);
  const sortedBreak = [...breakVisits].sort((a,b)=>{
    const ta = a.departureTime?.seconds*1000||0;
    const tb = b.departureTime?.seconds*1000||0;
    return ta-tb;
  });

  // --- 승인/내역용 렌더러 ---
  const renderApprovalItem = item => {
    const { homeroom, subject } = item.status||{};
    const approved = homeroom==='승인'&&subject==='승인';
    const timeDisplay = item.time;
    return (
      <li key={item.id} className="bg-white shadow rounded-xl p-4 text-sm relative">
        <div className="font-semibold mb-1">
          {item.name} ({item.grade}학년 {item.class}반)
        </div>
        <div className="text-gray-700 mb-2">
          시간: {timeDisplay}<br/>
          사유: {item.reason}<br/>
          유형: {item.type}
        </div>
        {mode==='approve' ? (
          <div className="flex gap-2">
            <button onClick={()=>handleApproval(item.id,'approve')}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">
              승인
            </button>
            <button onClick={()=>handleApproval(item.id,'reject')}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
              거절
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600 font-semibold">
              {approved
                ? '승인 완료'
                : `승인 대기 중 (${homeroom||'대기'} / ${subject||'대기'})`}
            </span>
            <button onClick={()=>handleDelete(item.id)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm">
              삭제
            </button>
          </div>
        )}
      </li>
    );
  };

  // --- 쉬는시간 방문용 렌더러 (승인 상태 제거) ---
  const renderBreakItem = item => {
    const dt = new Date(item.departureTime.seconds*1000)
      .toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
    return (
      <li key={item.id} className="bg-white shadow rounded-xl p-4 text-sm relative">
        <div className="font-semibold mb-1">
          {item.name} ({item.grade}학년 {item.class}반)
        </div>
        <div className="text-gray-700 mb-2">
          출발시각: {dt}<br/>
          사유: {item.reason}<br/>
          유형: {item.type}
        </div>
        <button onClick={()=>handleDelete(item.id)}
          className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm">
          삭제
        </button>
      </li>
    );
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4 text-center">
        {mode==='approve' ? '요청 승인' : '요청 내역'}
      </h2>

      {mode==='approve' && role==='homeroom' && (
        <div className="mb-4 flex items-center gap-2 text-base text-gray-700">
          <input type="checkbox" checked={withSubject}
            onChange={()=>setWithSubject(!withSubject)}
            id="withSubjectApproval" className="w-4 h-4"/>
          <label htmlFor="withSubjectApproval">교과 승인도 함께 처리</label>
        </div>
      )}

      {/* 승인/내역 리스트 */}
      {sortedFiltered.length===0 ? (
        <p className="text-center text-gray-500 text-sm">
          표시할 요청이 없습니다.
        </p>
      ) : (
        <ul className="space-y-4">
          {sortedFiltered.map(renderApprovalItem)}
        </ul>
      )}

      {/* 쉬는 시간 방문 현황 (status 모드에서만) */}
      {mode==='status' && sortedBreak.length>0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-center">
            쉬는 시간 방문 현황
          </h3>
          <ul className="space-y-4">
            {sortedBreak.map(renderBreakItem)}
          </ul>
        </div>
      )}
    </div>
  );
}
