// d:\school-visit-app\src\components\domain\VisitRequest\AdminVisitorView.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore'; // Firestore 함수 임포트

/**
 * @file AdminVisitorView.jsx
 * @description 학교의 모든 방문 기록(수업 중 방문, 쉬는 시간 방문, 조퇴/외출, 외부인 방문)을
 * 통합적으로 조회하고 필터링할 수 있는 관리자용 현황판 컴포넌트입니다.
 * 날짜별, 유형별 필터링 기능을 제공합니다.
 */

/**
 * AdminVisitorView 컴포넌트
 * @returns {JSX.Element} 방문 현황 조회 및 필터링 UI
 */
export default function AdminVisitorView() {
  // 모든 유형의 방문 기록을 저장하는 상태입니다.
  const [allVisits, setAllVisits] = useState([]);
  // 필터링된 방문 기록을 저장하는 상태입니다.
  const [filteredVisits, setFilteredVisits] = useState([]);
  // 데이터 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(true);
  // 오류 메시지를 저장하는 상태입니다.
  const [error, setError] = useState('');

  // 필터링 옵션을 관리하는 상태입니다.
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // 오늘 날짜를 기본값으로 (YYYY-MM-DD)
  const [filterType, setFilterType] = useState('all'); // 'all', 'classVisit', 'breakVisit', 'leave', 'external'

  /**
   * Firestore에서 모든 유형의 방문 기록을 불러오는 비동기 함수입니다.
   * 각 컬렉션('visits', 'leaves', 'external_visits')에서 데이터를 가져와 통합합니다.
   */
  const fetchAllVisits = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. 수업 중 방문 및 쉬는 시간 방문 기록 ('visits' 컬렉션)
      const visitsQuery = query(collection(db, 'visits'), orderBy('createdAt', 'desc'));
      const visitsSnapshot = await getDocs(visitsQuery);
      const visitsData = visitsSnapshot.docs.map(doc => ({
        id: doc.id,
        viewType: doc.data().isBreakVisit ? '쉬는시간 방문' : '수업중 방문', // 표시용 타입
        ...doc.data(),
        // Firestore 타임스탬프를 JavaScript Date 객체로 변환
        displayTimestamp: doc.data().isBreakVisit 
                          ? (doc.data().departureTime?.toDate ? doc.data().departureTime.toDate() : new Date(doc.data().departureTime))
                          : (doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)),
      }));

      // 2. 조퇴/외출 기록 ('leaves' 컬렉션)
      const leavesQuery = query(collection(db, 'leaves'), orderBy('createdAt', 'desc'));
      const leavesSnapshot = await getDocs(leavesQuery);
      const leavesData = leavesSnapshot.docs.map(doc => ({
        id: doc.id,
        viewType: doc.data().type, // '조퇴' 또는 '외출'
        studentName: doc.data().studentName, // 일관성을 위해 'name' 대신 'studentName' 사용
        ...doc.data(),
        displayTimestamp: doc.data().leaveTime?.toDate ? doc.data().leaveTime.toDate() : new Date(doc.data().leaveTime),
      }));

      // 3. 외부인 방문 기록 ('external_visits' 컬렉션)
      const externalVisitsQuery = query(collection(db, 'external_visits'), orderBy('createdAt', 'desc'));
      const externalVisitsSnapshot = await getDocs(externalVisitsQuery);
      const externalVisitsData = externalVisitsSnapshot.docs.map(doc => ({
        id: doc.id,
        viewType: '외부인 방문',
        visitorName: doc.data().visitorName, // 일관성을 위해 'name' 대신 'visitorName' 사용
        ...doc.data(),
        displayTimestamp: doc.data().entryTime?.toDate ? doc.data().entryTime.toDate() : new Date(doc.data().entryTime),
      }));

      // 모든 기록을 통합하고, displayTimestamp 기준으로 최신순 정렬
      const combinedData = [...visitsData, ...leavesData, ...externalVisitsData].sort(
        (a, b) => b.displayTimestamp - a.displayTimestamp
      );

      setAllVisits(combinedData);
    } catch (err) {
      console.error("전체 방문 기록 로드 중 오류:", err);
      setError('전체 방문 기록을 불러오는 중 오류가 발생했습니다.');
      setAllVisits([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 전체 방문 기록을 불러옵니다.
  useEffect(() => {
    fetchAllVisits();
  }, []);

  // allVisits, filterDate, filterType 상태가 변경될 때마다 필터링 로직을 실행합니다.
  // useMemo를 사용하여 필터링된 결과를 캐싱하여 불필요한 재계산을 방지할 수 있지만,
  // 여기서는 useEffect로 상태를 직접 업데이트합니다.
  useEffect(() => {
    let newFilteredVisits = [...allVisits];

    // 1. 날짜 필터링
    if (filterDate) {
      const selectedDateStart = Timestamp.fromDate(new Date(filterDate + "T00:00:00"));
      const selectedDateEnd = Timestamp.fromDate(new Date(filterDate + "T23:59:59"));
      
      newFilteredVisits = newFilteredVisits.filter(visit => {
        // 각 방문 유형별로 기준이 되는 시간 필드가 다를 수 있음에 유의
        let visitTimestamp;
        if (visit.viewType === '수업중 방문') {
          visitTimestamp = visit.createdAt; // Firestore Timestamp 객체
        } else if (visit.viewType === '쉬는시간 방문') {
          visitTimestamp = visit.departureTime; // Firestore Timestamp 객체
        } else if (visit.viewType === '조퇴' || visit.viewType === '외출') {
          visitTimestamp = visit.leaveTime; // Firestore Timestamp 객체
        } else if (visit.viewType === '외부인 방문') {
          visitTimestamp = visit.entryTime; // Firestore Timestamp 객체
        }
        
        // visitTimestamp가 Firestore Timestamp 객체가 아닐 경우 Date 객체로 변환 시도
        if (visitTimestamp && !(visitTimestamp instanceof Timestamp) && visitTimestamp.seconds) {
            visitTimestamp = new Timestamp(visitTimestamp.seconds, visitTimestamp.nanoseconds);
        } else if (visitTimestamp && !(visitTimestamp instanceof Timestamp)) {
            // Firestore Timestamp가 아닌 경우, Date 객체로 가정하고 변환 시도
            // 이 부분은 데이터 저장 방식에 따라 더 견고하게 처리 필요
            try {
                const dateObj = new Date(visitTimestamp);
                if (!isNaN(dateObj.getTime())) { // 유효한 Date 객체인지 확인
                    visitTimestamp = Timestamp.fromDate(dateObj);
                } else {
                    return false; // 유효하지 않은 날짜면 필터에서 제외
                }
            } catch (e) {
                return false; // 변환 중 오류 발생 시 필터에서 제외
            }
        }


        return visitTimestamp && visitTimestamp >= selectedDateStart && visitTimestamp <= selectedDateEnd;
      });
    }

    // 2. 유형 필터링
    if (filterType !== 'all') {
      newFilteredVisits = newFilteredVisits.filter(visit => {
        if (filterType === 'classVisit') return visit.viewType === '수업중 방문';
        if (filterType === 'breakVisit') return visit.viewType === '쉬는시간 방문';
        if (filterType === 'leave') return visit.viewType === '조퇴' || visit.viewType === '외출';
        if (filterType === 'external') return visit.viewType === '외부인 방문';
        return false;
      });
    }

    setFilteredVisits(newFilteredVisits);
  }, [allVisits, filterDate, filterType]);


  // 로딩 중일 때 표시할 UI
  if (isLoading && allVisits.length === 0) { // 초기 로딩 시에만 전체 로딩 메시지
    return <div className="p-4 text-center">전체 방문 기록을 불러오는 중입니다...</div>;
  }

  // 오류 발생 시 표시할 UI
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  // 방문 현황 조회 및 필터링 UI 렌더링
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-6 text-center">전체 방문/출입 현황</h2>

      {/* 필터링 섹션 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full sm:w-auto">
          <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 mb-1">날짜 선택</label>
          <input
            type="date"
            id="filterDate"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border p-2 w-full rounded text-sm"
          />
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">유형 선택</label>
          <select
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border p-2 w-full rounded text-sm"
          >
            <option value="all">전체</option>
            <option value="classVisit">수업중 방문 (학생)</option>
            <option value="breakVisit">쉬는시간 방문 (학생)</option>
            <option value="leave">조퇴/외출 (학생)</option>
            <option value="external">외부인 방문</option>
          </select>
        </div>
        {isLoading && allVisits.length > 0 && <p className="text-sm text-blue-500">필터링 중...</p>}
      </div>

      {/* 방문 기록 목록 */}
      {filteredVisits.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">선택한 조건에 해당하는 기록이 없습니다.</p>
      )}
      <div className="space-y-3">
        {filteredVisits.map(visit => (
          <div key={visit.id} className="bg-white p-3 rounded-md shadow border border-gray-200 text-sm">
            <p className="font-semibold text-blue-600">{visit.viewType}</p>
            {/* 각 방문 유형에 따라 다른 정보 표시 */}
            {(visit.viewType === '수업중 방문' || visit.viewType === '쉬는시간 방문') && (
              <>
                <p>학생: {visit.grade}학년 {visit.class}반 {visit.name}</p>
                <p>장소: {visit.type}, 사유: {visit.reason}</p>
                <p>요청/방문 시각: {visit.displayTimestamp?.toLocaleString('ko-KR')}</p>
                <p>담임 승인: {visit.status?.homeroom || 'N/A'}, 교과 승인: {visit.status?.subject || 'N/A'}</p>
              </>
            )}
            {(visit.viewType === '조퇴' || visit.viewType === '외출') && (
              <>
                <p>학생: {visit.grade}학년 {visit.class}반 {visit.studentName}</p>
                <p>사유: {visit.reason}, 보호자 연락처: {visit.guardianContact}</p>
                <p>{visit.type} 시각: {visit.displayTimestamp?.toLocaleString('ko-KR')}</p>
                {visit.type === '외출' && visit.returnTime && <p>복귀 예정: {visit.returnTime.toDate ? visit.returnTime.toDate().toLocaleString('ko-KR') : new Date(visit.returnTime).toLocaleString('ko-KR')}</p>}
                <p>기록 교사: {visit.teacherName}</p>
              </>
            )}
            {visit.viewType === '외부인 방문' && (
              <>
                <p>방문자: {visit.visitorName} ({visit.visitorAffiliation || '소속 정보 없음'})</p>
                <p>목적: {visit.purpose}, 장소: {visit.destination}</p>
                <p>방문 시각: {visit.displayTimestamp?.toLocaleString('ko-KR')}</p>
                {visit.exitTime && <p>퇴교 시각: {visit.exitTime.toDate ? visit.exitTime.toDate().toLocaleString('ko-KR') : new Date(visit.exitTime).toLocaleString('ko-KR')}</p>}
                <p>기록 교사: {visit.teacherName}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
