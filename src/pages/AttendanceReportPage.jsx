// src/pages/AttendanceReportPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// 교시 목록
const periods = ['조회','1교시','2교시','3교시','4교시','5교시','6교시','7교시'];
// 집계할 상태 키 (모듈 레벨로 이동해 안정적인 참조)
const STATUS_KEYS = ['결석','지각','조퇴','결과'];

// 날짜 범위 생성
function getDateRange(start, end) {
  const dates = [];
  const curr = new Date(start);
  const last = new Date(end);
  while (curr <= last) {
    dates.push(curr.toISOString().slice(0,10));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export default function AttendanceReportPage() {
  const [startDate, setStartDate]     = useState(() => { const d = new Date(); d.setDate(d.getDate()-6); return d.toISOString().slice(0,10); });
  const [endDate, setEndDate]         = useState(() => new Date().toISOString().slice(0,10));
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [selectedClass, setSelectedClass] = useState('1');
  const [reportData, setReportData]   = useState([]);
  const [loading, setLoading] = useState(false);

  // CSV 다운로드 함수
  const downloadCSV = useCallback(() => {
    if (reportData.length === 0) return;
    const headers = ['이름','통계'];
    const rows = reportData.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.summary.replace(/"/g, '""')}"`
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_report_${selectedGrade}-${selectedClass}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [reportData, selectedGrade, selectedClass, startDate, endDate]);

  // 데이터 조회 함수
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      // 1) 학생 목록
      const stuSnap = await getDocs(collection(db,'students',selectedGrade,selectedClass));
      const students = stuSnap.docs.map(d=>({ id:d.id, name:d.data().name }));

      // 2) 초기 맵 생성
      const resultMap = {};
      students.forEach(s=>{
        resultMap[s.id] = { name: s.name };
        STATUS_KEYS.forEach(key => { resultMap[s.id][key] = { reasons: {} }; });
      });

      // 3) 날짜·교시 조합으로 세션 목록 생성
      const dateRange = getDateRange(startDate, endDate);
      const sessions = dateRange.flatMap(date =>
        periods.map(pr => ({ sid: `${date}_${selectedGrade}-${selectedClass}_${pr}`, date }))
      );

      // 4) 세션별 entries 집계
      for (const { sid, date } of sessions) {
        const entSnap = await getDocs(collection(db,'attendanceSessions',sid,'entries'));
        entSnap.docs.forEach(ed => {
          const studId = ed.id.split('_')[0];
          const { status, reason } = ed.data();
          if (status && status !== '출석' && resultMap[studId]) {
            const bucket = resultMap[studId][status].reasons;
            const key = reason || '사유없음';
            if (!bucket[key]) bucket[key] = new Set();
            bucket[key].add(date);
          }
        });
      }

      // 5) 배열 변환: 중복 제거 후 count와 summary 조합
      const dataArray = students.map(s => {
        const stats = resultMap[s.id];
        const lines = [];
        STATUS_KEYS.forEach(key => {
          const buckets = stats[key].reasons;
          const uniqueDates = Array.from(new Set(
            Object.values(buckets).flatMap(setDates => Array.from(setDates))
          ));
          const count = uniqueDates.length;
          if (count > 0) {
            const parts = Object.entries(buckets).map(
              ([r, ds]) => `${r}: ${Array.from(ds).join(', ')}`
            );
            lines.push(`${key} ${count}회(${parts.join(', ')})`);
          }
        });
        return { name: stats.name, summary: lines.join(' ') || '0회' };
      });

      setReportData(dataArray);
    } catch (err) {
      console.error('통계 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedGrade, selectedClass]);

  // Effect: fetchReport 종속성에 useCallback으로 래핑된 함수 포함
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">출결 통계</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">시작 날짜</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">끝 날짜</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">학년</label>
          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {[1,2,3].map(g => (
              <option key={g} value={String(g)}>{g}학년</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">반</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {[...Array(5)].map((_, i) => (
              <option key={i+1} value={String(i+1)}>{i+1}반</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={fetchReport}
          disabled={loading}
          className="btn-teal px-4 py-2"
        >
          {loading ? '조회 중...' : '통계 조회'}
        </button>
        <button
          onClick={downloadCSV}
          disabled={loading || reportData.length === 0}
          className="btn-gray px-4 py-2"
        >
          CSV 다운로드
        </button>
      </div>
      <table className="w-full table-fixed border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 w-1/4">이름</th>
            <th className="border p-2">통계</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length === 0 ? (
            <tr>
              <td colSpan={2} className="border p-2 text-center text-gray-500">
                조회된 데이터가 없습니다.
              </td>
            </tr>
          ) : reportData.map((r, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              <td className="border p-2 text-sm">{r.name}</td>
              <td className="border p-2 text-sm whitespace-pre-wrap">{r.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
