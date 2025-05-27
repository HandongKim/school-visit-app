// d:\school-visit-app\src\pages\AttendanceReportPage.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'; // Firestore 함수 임포트

/**
 * @file AttendanceReportPage.jsx
 * @description (개발/테스트용) 특정 기간 또는 특정 학급의 출결 통계 및 보고서를 조회하는 페이지 컴포넌트입니다.
 * (현재는 기본 구조와 필터링 UI만 있으며, 실제 데이터 집계 및 보고서 생성 로직은 구현 필요)
 */

/**
 * AttendanceReportPage 컴포넌트
 * @returns {JSX.Element} 출결 보고서 조회 페이지 UI
 */
export default function AttendanceReportPage() {
  // 필터링 옵션을 관리하는 상태입니다.
  const [filterStartDate, setFilterStartDate] = useState(''); // 조회 시작 날짜
  const [filterEndDate, setFilterEndDate] = useState('');   // 조회 종료 날짜
  const [filterGrade, setFilterGrade] = useState('');       // 조회 학년
  const [filterClassNum, setFilterClassNum] = useState('');   // 조회 반

  // 조회된 출결 데이터를 저장하는 상태입니다. (실제 데이터 구조는 집계 방식에 따라 달라짐)
  const [reportData, setReportData] = useState(null);
  // 데이터 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(false);
  // 오류 메시지를 저장하는 상태입니다.
  const [error, setError] = useState('');

  /**
   * 선택된 필터 조건에 따라 Firestore에서 출결 데이터를 조회하고 집계하는 비동기 함수입니다.
   * (이 함수의 실제 구현은 복잡하며, 데이터 구조 및 요구사항에 따라 크게 달라집니다.)
   */
  const fetchAndGenerateReport = async () => {
    // 필수 필터 조건 유효성 검사 (예: 시작일, 종료일)
    if (!filterStartDate || !filterEndDate) {
      alert('조회 시작일과 종료일을 모두 선택해주세요.');
      return;
    }
    if (new Date(filterStartDate) > new Date(filterEndDate)) {
      alert('시작일은 종료일보다 이전이거나 같아야 합니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    setReportData(null); // 이전 보고서 데이터 초기화

    try {
      // --- Firestore에서 데이터 조회 ---
      // 1. 'attendance' 컬렉션에서 기간 내의 모든 출결 문서를 가져옵니다.
      //    문서 ID가 'YYYY-MM-DD_학년_반' 형식이거나, 'date' 필드가 있다고 가정합니다.
      //    Firestore 쿼리는 범위 필터(>, < 등)를 하나의 필드에만 적용할 수 있는 제한이 있으므로,
      //    날짜 범위가 넓거나 데이터가 많으면 클라이언트 측에서 처리하기 어려울 수 있습니다.
      //    이 경우 Firebase Functions (Cloud Functions)를 사용한 백엔드 집계가 더 효율적입니다.

      // 예시: 'date' 필드를 기준으로 기간 내 문서 조회 (인덱싱 필요)
      const attendanceCollectionRef = collection(db, 'attendance');
      let q = query(attendanceCollectionRef,
        where('date', '>=', filterStartDate),
        where('date', '<=', filterEndDate)
      );

      // 학년 필터 추가 (선택된 경우)
      if (filterGrade) {
        q = query(q, where('grade', '==', filterGrade));
      }
      // 반 필터 추가 (선택된 경우, 학년도 선택되어야 함)
      if (filterGrade && filterClassNum) {
        q = query(q, where('classNum', '==', filterClassNum));
      }

      const querySnapshot = await getDocs(q);
      const attendanceDocs = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

      if (attendanceDocs.length === 0) {
        setReportData({ message: '선택한 조건에 해당하는 출결 데이터가 없습니다.' });
        setIsLoading(false);
        return;
      }

      // --- 데이터 집계 로직 (클라이언트 측 예시 - 단순화됨) ---
      // 실제로는 더 정교한 집계 로직이 필요합니다.
      // (예: 학생별 결석일수, 지각횟수, 출석률 등)
      let totalStudentsProcessed = 0;
      const summary = {
        totalAttendanceRecords: attendanceDocs.length,
        statusCounts: {}, // { '출석': 100, '지각': 5, '결석(병결)': 2, ... }
        // 추가적인 통계 정보...
      };

      attendanceDocs.forEach(doc => {
        if (doc.statuses) { // statuses 객체가 있는지 확인
          Object.values(doc.statuses).forEach(status => {
            summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
            totalStudentsProcessed++;
          });
        }
      });
      summary.totalStudentsProcessed = totalStudentsProcessed;


      // 집계된 데이터를 reportData 상태에 저장합니다.
      setReportData(summary);

    } catch (err) {
      console.error("출결 보고서 생성 중 오류:", err);
      setError('보고서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 폼 제출 핸들러 (실제로는 버튼 클릭 등으로 fetchAndGenerateReport 호출)
  const handleSubmitFilters = (e) => {
    e.preventDefault();
    fetchAndGenerateReport();
  };

  // 출결 보고서 조회 페이지 UI를 렌더링합니다.
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">출결 보고서 (테스트)</h1>

      {/* 필터링 옵션 폼 */}
      <form onSubmit={handleSubmitFilters} className="mb-8 p-6 bg-white rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">조회 조건 설정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700">조회 시작일</label>
            <input
              type="date"
              id="filterStartDate"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700">조회 종료일</label>
            <input
              type="date"
              id="filterEndDate"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="filterGrade" className="block text-sm font-medium text-gray-700">학년 (선택)</label>
            <select
              id="filterGrade"
              value={filterGrade}
              onChange={(e) => { setFilterGrade(e.target.value); setFilterClassNum(''); }} // 학년 변경 시 반 초기화
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">전체 학년</option>
              {[1, 2, 3].map(g => <option key={g} value={String(g)}>{g}학년</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterClassNum" className="block text-sm font-medium text-gray-700">반 (선택)</label>
            <select
              id="filterClassNum"
              value={filterClassNum}
              onChange={(e) => setFilterClassNum(e.target.value)}
              disabled={!filterGrade} // 학년이 선택되어야 활성화
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">전체 반</option>
              {filterGrade && [...Array(12)].map((_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}반</option>)}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded-md shadow disabled:bg-teal-300"
        >
          {isLoading ? '조회 중...' : '보고서 조회'}
        </button>
      </form>

      {/* 로딩 및 오류 메시지 표시 */}
      {isLoading && <p className="text-center text-blue-500 py-4">보고서를 생성 중입니다...</p>}
      {error && <p className="text-center text-red-500 py-4 bg-red-50 rounded">{error}</p>}

      {/* 보고서 데이터 표시 영역 */}
      {reportData && !isLoading && !error && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">조회 결과</h2>
          {reportData.message ? (
            <p className="text-gray-600">{reportData.message}</p>
          ) : (
            <div className="space-y-3 text-sm">
              <p><strong>총 출결 기록 문서 수:</strong> {reportData.totalAttendanceRecords}</p>
              <p><strong>처리된 총 학생 출결 건수:</strong> {reportData.totalStudentsProcessed}</p>
              <div>
                <strong>상태별 건수:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {Object.entries(reportData.statusCounts).map(([status, count]) => (
                    <li key={status}>{status}: {count}건</li>
                  ))}
                </ul>
              </div>
              {/* 여기에 차트나 더 상세한 통계 테이블 등을 추가할 수 있습니다. */}
              <p className="mt-4 text-xs text-gray-500">
                * 이 보고서는 현재 단순 집계된 결과이며, 실제 보고서 형식과는 다를 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
