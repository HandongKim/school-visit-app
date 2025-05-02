// src/pages/AttendancePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// 출결 상태 및 사유 옵션
const attendanceOptions = ['출석', '결석', '지각', '조퇴', '결과'];
const reasonOptions     = ['인정', '질병', '기타', '미인정'];

// 교시 목록 (조회 포함)
const periods = ['조회','1교시','2교시','3교시','4교시','5교시','6교시','7교시'];

export default function AttendancePage() {
  // --- 인증 상태 ---
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setCurrentUser(user));
    return unsub;
  }, []);

  // --- 필터 state ---
  const [selectedDate, setSelectedDate]     = useState(() => new Date().toISOString().slice(0,10));
  const [selectedGrade, setSelectedGrade]   = useState('1');
  const [selectedClass, setSelectedClass]   = useState('1');
  const [selectedPeriod, setSelectedPeriod] = useState('조회');

  // --- 데이터 state ---
  const [students, setStudents]             = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [visitData, setVisitData]           = useState({});

  // --- 모달 state & ref ---
  const [modal, setModal] = useState({ open:false, student:null, period:null, status:null });
  const tableRef = useRef(null);

  // 1) 학생 목록 로드
  useEffect(() => {
    async function fetchStudents() {
      const snap = await getDocs(
        collection(db, 'students', selectedGrade, selectedClass)
      );
      setStudents(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    }
    fetchStudents();
  }, [selectedGrade, selectedClass]);

  // 2) 출결 데이터 로드 (모든 교시)
  useEffect(() => {
    if (!currentUser) return;
    async function loadAttendance() {
      const baseId = `${selectedDate}_${selectedGrade}-${selectedClass}`;
      const map = {};
      for (const pr of periods) {
        const sid  = `${baseId}_${pr}`;
        const snap = await getDocs(
          collection(db, 'attendanceSessions', sid, 'entries')
        );
        snap.docs.forEach(d => {
          const studId = d.id.split('_')[0];
          map[studId] = map[studId] || {};
          map[studId][pr] = {
            status: d.data().status,
            reason: d.data().reason
          };
        });
      }
      setAttendanceData(map);
    }
    loadAttendance();
  }, [selectedDate, selectedGrade, selectedClass, currentUser]);

  // 3) 승인된 방문 로드 (createdAt 범위 + 클라이언트 필터링)
  useEffect(() => {
    if (!currentUser) return;
    async function loadVisits() {
      try {
        // 오늘 00:00~23:59 범위
        const start = new Date(selectedDate + 'T00:00:00');
        const end   = new Date(selectedDate + 'T23:59:59.999');
        const q = query(
          collection(db, 'visits'),
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<=', Timestamp.fromDate(end))
        );
        const snap = await getDocs(q);
        const map  = {};

        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          // grade/class 필터
          if (
            String(data.grade) !== selectedGrade ||
            String(data.class) !== selectedClass
          ) return;
          // 승인 여부 필터
          if (
            data.status?.homeroom !== '승인' ||
            data.status?.subject  !== '승인'
          ) return;

          // 학생 식별 키: name
          const studentName = data.name;
          // 교시 키: time 필드 그대로 사용 (예: '3교시', '조회')
          const periodKey = data.time;

          map[studentName] = map[studentName] || {};
          map[studentName][periodKey] = data.type; // '보건실' or '상담실'
        });

        setVisitData(map);
      } catch (err) {
        console.error('방문 로드 오류:', err);
      }
    }
    loadVisits();
  }, [selectedDate, selectedGrade, selectedClass, currentUser]);

  // 4) 출결 저장 핸들러
  const handleSelect = async (studentId, period, status, reason) => {
    const baseId = `${selectedDate}_${selectedGrade}-${selectedClass}`;

    // “결석”은 전 교시
    if (status === '결석') {
      const payload = { status, reason };
      const updated = { ...attendanceData };
      for (const pr of periods) {
        const sid     = `${baseId}_${pr}`;
        const entryId = `${studentId}_${pr}`;
        await setDoc(
          doc(db, 'attendanceSessions', sid, 'entries', entryId),
          payload,
          { merge:true }
        );
        updated[studentId] = {
          ...(updated[studentId]||{}), [pr]: payload
        };
      }
      setAttendanceData(updated);

    } else {
      // 개별 교시
      const sid     = `${baseId}_${period}`;
      const entryId = `${studentId}_${period}`;
      const ref     = doc(db, 'attendanceSessions', sid, 'entries', entryId);

      if (status === '출석') {
        await deleteDoc(ref);
        setAttendanceData(prev => {
          const u = { ...prev };
          if (u[studentId]) {
            delete u[studentId][period];
            if (!Object.keys(u[studentId]).length) delete u[studentId];
          }
          return u;
        });
      } else {
        const payload = { status, reason };
        await setDoc(ref, payload, { merge:true });
        setAttendanceData(prev => ({
          ...prev,
          [studentId]: {
            ...(prev[studentId]||{}), [period]: payload
          }
        }));
      }
    }

    setModal({ open:false, student:null, period:null, status:null });
  };

  const openModal = (stu, per) =>
    setModal({ open:true, student:stu, period:per, status:null });
  const saveAll = () => alert('출결 정보가 저장되었습니다.');

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-8 md:px-16 flex flex-col">
      <h1 className="text-2xl font-bold mb-4 text-center">출석부</h1>

      {/* 필터 & 저장 */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block mb-1">날짜</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e=>setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block mb-1">학년</label>
          <select
            value={selectedGrade}
            onChange={e=>setSelectedGrade(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {[1,2,3].map(g=>(
              <option key={g} value={String(g)}>{g}학년</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">반</label>
          <select
            value={selectedClass}
            onChange={e=>setSelectedClass(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {[...Array(5)].map((_,i)=>(
              <option key={i+1} value={String(i+1)}>{i+1}반</option>
            ))}
          </select>
        </div>
        <button onClick={saveAll} className="btn-teal">저장</button>
      </div>

      {/* 표 */}
      <div ref={tableRef} className="overflow-auto bg-white shadow rounded">
        <table className="min-w-[600px] w-full table-fixed border-collapse">
          <thead className="bg-gray-200 sticky top-0">
            <tr>
              <th className="p-2 border sticky left-0 bg-gray-200 z-20">이름</th>
              {periods.map(p=>(
                <th
                  key={p}
                  className={`p-2 border text-center cursor-pointer ${
                    selectedPeriod===p ? 'bg-teal-50':''}`}
                  onClick={()=>setSelectedPeriod(p)}
                >{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(s=>(
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-2 border sticky left-0 bg-white z-10 whitespace-nowrap">
                  {s.name}
                </td>
                {periods.map(p=>{
                  const cell  = attendanceData[s.id]?.[p];
                  // 학생 이름 기준으로 visits 매핑
                  const visit = visitData[s.name]?.[p];
                  return (
                    <td
                      key={p}
                      className={`p-2 border text-center whitespace-normal ${
                        selectedPeriod===p?'bg-teal-50':''}`}
                      onClick={()=>selectedPeriod===p&&openModal(s,p)}
                    >
                      {cell ? (
                        <>
                          <span className="block text-xs">{cell.status}</span>
                          {cell.reason && (
                            <span className="block text-xs">({cell.reason})</span>
                          )}
                        </>
                      ) : visit ? (
                        <span className="block text-xs font-medium text-indigo-600">
                          {visit}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          {/* 모달 UI */}
        </div>
      )}
    </div>
  );
}
