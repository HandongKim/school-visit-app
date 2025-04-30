// src/pages/AttendancePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// 출결 상태 및 사유 옵션
const attendanceOptions = ['출석', '결석', '지각', '조퇴', '결과'];
const reasonOptions     = ['인정', '질병', '기타', '미인정'];

// 교시 목록 (조회 포함)
const periods = ['조회','1교시','2교시','3교시','4교시','5교시','6교시','7교시'];

export default function AttendancePage() {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, user => setCurrentUser(user)), []);

  // 필터
  const [selectedDate, setSelectedDate]   = useState(() => new Date().toISOString().slice(0,10));
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedPeriod, setSelectedPeriod] = useState('조회');

  // 학생 목록 & 출결 데이터
  const [students, setStudents]             = useState([]);
  const [attendanceData, setAttendanceData] = useState({});

  // 모달 상태
  const [modal, setModal] = useState({ open:false, student:null, period:null, status:null });
  const tableRef = useRef(null);

  // 학생 로드
  useEffect(() => {
    async function fetchStudents() {
      const snap = await getDocs(collection(db, 'students', selectedGrade, selectedClass));
      setStudents(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    }
    fetchStudents();
  }, [selectedGrade, selectedClass]);

  // 출결 로드: 모든 교시별로 엔트리 가져오기
  useEffect(() => {
    if (!currentUser) return;
    async function loadAll() {
      const baseId = `${selectedDate}_${selectedGrade}-${selectedClass}`;
      const map = {};
      for (const pr of periods) {
        const sid = `${baseId}_${pr}`;
        const snap = await getDocs(collection(db, 'attendanceSessions', sid, 'entries'));
        snap.docs.forEach(d => {
          const studId = d.id.split('_')[0];
          map[studId] = map[studId] || {};
          map[studId][pr] = { status: d.data().status, reason: d.data().reason };
        });
      }
      setAttendanceData(map);
    }
    loadAll();
  }, [selectedDate, selectedGrade, selectedClass, currentUser]);

  // 출결 저장 핸들러
  const handleSelect = async (studentId, period, status, reason) => {
    if (status === '결석') {
      const payload = { status, reason };
      const updated = { ...attendanceData };
      const baseId = `${selectedDate}_${selectedGrade}-${selectedClass}`;
      for (const pr of periods) {
        const sid = `${baseId}_${pr}`;
        const entryId = `${studentId}_${pr}`;
        await setDoc(doc(db, 'attendanceSessions', sid, 'entries', entryId), payload, { merge:true });
        updated[studentId] = { ...(updated[studentId]||{}), [pr]: payload };
      }
      setAttendanceData(updated);
    } else {
      const sid = `${selectedDate}_${selectedGrade}-${selectedClass}_${period}`;
      const entryId = `${studentId}_${period}`;
      const ref = doc(db, 'attendanceSessions', sid, 'entries', entryId);
      if (status === '출석') {
        await deleteDoc(ref);
        setAttendanceData(prev => {
          const upd = { ...prev };
          if (upd[studentId]) {
            delete upd[studentId][period];
            if (!Object.keys(upd[studentId]).length) delete upd[studentId];
          }
          return upd;
        });
      } else {
        const payload = { status, reason };
        await setDoc(ref, payload, { merge:true });
        setAttendanceData(prev => ({
          ...prev,
          [studentId]: { ...(prev[studentId]||{}), [period]: payload }
        }));
      }
    }
    setModal({ open:false, student:null, period:null, status:null });
  };

  // 모달 오픈
  const openModal = (student, period) => setModal({ open:true, student, period, status:null });
  const saveAll   = () => alert('출결 정보가 저장되었습니다.');

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
            {[1,2,3].map(g => <option key={g} value={String(g)}>{g}학년</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1">반</label>
          <select
            value={selectedClass}
            onChange={e=>setSelectedClass(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {[...Array(5)].map((_,i) => <option key={i+1} value={String(i+1)}>{i+1}반</option>)}
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
                  className={`p-2 border text-center cursor-pointer ${selectedPeriod===p?'bg-teal-50':''}`}
                  onClick={()=>setSelectedPeriod(p)}
                >{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-2 border sticky left-0 bg-white z-10 whitespace-nowrap">{s.name}</td>
                {periods.map(p => {
                  const cell = attendanceData[s.id]?.[p];
                  return (
                    <td
                      key={p}
                      className={`p-2 border text-center ${selectedPeriod===p?'bg-teal-50':''}`}
                      onClick={()=>selectedPeriod===p&&openModal(s,p)}
                    >
                      {cell && (
                        <>
                          <span className="block text-xs">{cell.status}</span>
                          {cell.reason && <span className="block text-xs">({cell.reason})</span>}
                        </>
                      )}
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
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-bold mb-4">{modal.student.name} ({modal.period})</h2>
            {attendanceOptions.map(status=>(
              <button
                key={status}
                onClick={()=>status==='출석'?handleSelect(modal.student.id, modal.period, '출석', null):setModal(m=>({...m,status}))}
                className="block w-full text-left border px-3 py-1 mb-2 rounded text-xs"
              >{status}</button>
            ))}
            {modal.status && modal.status!=='출석' && (
              <div className="mt-4">
                <div className="font-semibold mb-2 text-sm">사유</div>
                {reasonOptions.map(r=>(
                  <button
                    key={r}
                    onClick={()=>handleSelect(modal.student.id,modal.period,modal.status,r)}
                    className="border px-3 py-1 mr-2 mb-2 rounded text-xs"
                  >{r}</button>
                ))}
              </div>
            )}
            <button
              onClick={()=>setModal({open:false,student:null,period:null,status:null})}
              className="mt-4 underline text-xs"
            >취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
