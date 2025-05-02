// src/pages/AttendancePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setCurrentUser(user));
    return unsub;
  }, []);

  // 필터 state
  const [selectedDate, setSelectedDate]     = useState(() => new Date().toISOString().slice(0,10));
  const [selectedGrade, setSelectedGrade]   = useState('1');
  const [selectedClass, setSelectedClass]   = useState('1');
  const [selectedPeriod, setSelectedPeriod] = useState('조회');

  // 데이터 state
  const [students, setStudents]             = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [visitData, setVisitData]           = useState({});

  // 모달 state
  const [modal, setModal]                   = useState({ open:false, student:null, period:null });
  const [selectedStatus, setSelectedStatus] = useState(attendanceOptions[0]);
  const [selectedReason, setSelectedReason] = useState(reasonOptions[0]);
  const tableRef = useRef(null);

  // 학생 목록 로드
  useEffect(() => {
    async function fetchStudents() {
      const snap = await getDocs(
        collection(db, 'students', selectedGrade, selectedClass)
      );
      setStudents(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    }
    fetchStudents();
  }, [selectedGrade, selectedClass]);

  // 출결 데이터 로드
  useEffect(() => {
    if (!currentUser) return;
    async function loadAttendance() {
      const baseId = `${selectedDate}_${selectedGrade}-${selectedClass}`;
      const map = {};
      for (const pr of periods) {
        const sid = `${baseId}_${pr}`;
        const snap = await getDocs(
          collection(db, 'attendanceSessions', sid, 'entries')
        );
        snap.docs.forEach(d => {
          const studId = d.id.split('_')[0];
          map[studId] = map[studId] || {};
          map[studId][pr] = { status: d.data().status, reason: d.data().reason };
        });
      }
      setAttendanceData(map);
    }
    loadAttendance();
  }, [selectedDate, selectedGrade, selectedClass, currentUser]);

  // 승인된 방문 로드
  useEffect(() => {
    if (!currentUser) return;
    async function loadVisits() {
      const start = new Date(`${selectedDate}T00:00:00`);
      const end   = new Date(`${selectedDate}T23:59:59.999`);
      const q = query(
        collection(db, 'visits'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      );
      const snap = await getDocs(q);
      const map  = {};
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (
          String(data.grade) !== selectedGrade ||
          String(data.class) !== selectedClass ||
          data.status?.homeroom !== '승인' ||
          data.status?.subject  !== '승인'
        ) return;
        const studentName = data.name;
        const periodKey   = data.time;
        map[studentName] = map[studentName] || {};
        map[studentName][periodKey] = data.type;
      });
      setVisitData(map);
    }
    loadVisits();
  }, [selectedDate, selectedGrade, selectedClass, currentUser]);

  // 출결 저장 핸들러
  const handleSelect = async (studentId, period, status, reason) => {
    const baseId = `${selectedDate}_${selectedGrade}-${selectedClass}`;
    const payload = { status, reason };
    const updated = { ...attendanceData };

    if (status === '결석') {
      for (const pr of periods) {
        const sid = `${baseId}_${pr}`;
        const entryId = `${studentId}_${pr}`;
        await setDoc(doc(db, 'attendanceSessions', sid, 'entries', entryId), payload, { merge:true });
        updated[studentId] = { ...(updated[studentId]||{}), [pr]: payload };
      }
    } else if (status === '조퇴') {
      const startIndex = periods.indexOf(period);
      for (const pr of periods.slice(startIndex)) {
        const sid = `${baseId}_${pr}`;
        const entryId = `${studentId}_${pr}`;
        await setDoc(doc(db, 'attendanceSessions', sid, 'entries', entryId), payload, { merge:true });
        updated[studentId] = { ...(updated[studentId]||{}), [pr]: payload };
      }
    } else {
      const sid = `${baseId}_${period}`;
      const entryId = `${studentId}_${period}`;
      const ref = doc(db, 'attendanceSessions', sid, 'entries', entryId);
      if (status === '출석') {
        await deleteDoc(ref);
        delete updated[studentId]?.[period];
      } else {
        await setDoc(ref, payload, { merge:true });
        updated[studentId] = { ...(updated[studentId]||{}), [period]: payload };
      }
    }
    setAttendanceData(updated);
    closeModal();
  };

  // 모달 제어 함수
  const openModal = (student, period) => {
    setSelectedStatus(attendanceOptions[0]);
    setSelectedReason(reasonOptions[0]);
    setModal({ open:true, student, period });
  };
  const closeModal = () => setModal({ open:false, student:null, period:null });
  const saveModal  = () => handleSelect(modal.student.id, modal.period, selectedStatus, selectedReason);
  const saveAll    = () => alert('출결 정보가 저장되었습니다.');

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-8 md:px-16 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} style={{ width: '25%' }} className="btn-indigo px-2 py-1 rounded text-sm">← 뒤로</button>
        <h1 className="text-2xl font-bold">출석부</h1>
        <div className="w-20" />
      </div>

      {/* Filters & Save */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block mb-1">날짜</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block mb-1">학년</label>
          <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="border rounded px-2 py-1">{[1,2,3].map(g => (<option key={g} value={String(g)}>{g}학년</option>))}</select>
        </div>
        <div>
          <label className="block mb-1">반</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border rounded px-2 py-1">{[...Array(5)].map((_, i) => (<option key={i+1} value={String(i+1)}>{i+1}반</option>))}</select>
        </div>
        <button onClick={saveAll} className="btn-teal">저장</button>
      </div>

      {/* Attendance Table */}
      <div ref={tableRef} className="overflow-auto bg-white shadow rounded">
        <table className="min-w-[600px] w-full table-fixed border-separate border-spacing-0">
          <thead className="bg-gray-200 sticky top-0">
            <tr>
              <th className="p-2 border sticky left-0 bg-gray-200 z-20">이름</th>
              {periods.map(p => (
                <th key={p} className={`p-2 border text-center cursor-pointer ${selectedPeriod===p?'bg-teal-50':''}`} onClick={() => setSelectedPeriod(p)}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-2 border sticky left-0 bg-white z-20 truncate overflow-hidden" style={{ boxShadow: '2px 0 0 0 #E5E7EB' }}>{s.name}</td>
                {periods.map(p => {
                  const cell = attendanceData[s.id]?.[p];
                  const visit = visitData[s.name]?.[p];
                  return (
                    <td key={p} className="p-2 border text-center whitespace-normal cursor-pointer" onClick={() => openModal(s, p)}>
                      {cell ? (<><span className="block text-xs">{cell.status}</span>{cell.reason && <span className="block text-xs">({cell.reason})</span>}</>) : visit ? (<span className="block text-xs font-medium text-indigo-600">{visit}</span>) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 z-50 w-80">
            <h2 className="text-lg font-semibold mb-4">{modal.student.name} - {modal.period}</h2>
            <div className="mb-4"> <label className="block mb-1">상태</label> <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="border rounded w-full px-2 py-1">{attendanceOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
            <div className="mb-4"> <label className="block mb-1">사유</label> <select value={selectedReason} onChange={e => setSelectedReason(e.target.value)} className="border rounded w-full px-2 py-1">{reasonOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="whitespace-nowrap bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1">취소</button>
              <button onClick={saveModal} className="btn-teal rounded px-3 py-1">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
