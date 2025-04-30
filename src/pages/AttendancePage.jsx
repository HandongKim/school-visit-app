import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// 출결 상태 옵션 및 사유 옵션 정의
const attendanceOptions = ['출석', '결석', '지각', '조퇴', '결과'];
const reasonOptions     = ['인정', '질병', '기타', '미인정'];

// 테이블에 표시할 모든 “교시” 컬럼 (조회 포함)
const periods = ['조회','1교시','2교시','3교시','4교시','5교시','6교시','7교시'];

export default function AttendancePage() {
  // 인증된 사용자 상태
  const [currentUserData, setCurrentUserData] = useState(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => setCurrentUserData(user));
    return unsubscribe;
  }, []);

  // 날짜·학년·반·교시 선택
  const [selectedDate, setSelectedDate]   = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedPeriod, setSelectedPeriod] = useState('조회');

  // 세션 ID 생성, 세션 및 데이터 상태
  const sessionId = `${selectedDate}_${selectedGrade}-${selectedClass}_${selectedPeriod}`;
  const [currentSession, setCurrentSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [modal, setModal] = useState({ open:false, student:null, period:null, status:null });

  // 테이블 스크롤 감지
  const tableContainerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const onScroll = () => setIsScrolled(el.scrollTop > 0);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // 학생 목록 로드
  useEffect(() => {
    async function fetchStudents() {
      const col = collection(db, 'students', selectedGrade, selectedClass);
      const snap = await getDocs(col);
      setStudents(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    }
    fetchStudents();
  }, [selectedGrade, selectedClass]);

  // 세션 및 출결 엔트리 로드
  useEffect(() => {
    if (!currentUserData) return;
    async function loadSession() {
      const ref = doc(db, 'attendanceSessions', sessionId);
      await setDoc(ref, {
        date: selectedDate,
        grade: selectedGrade,
        class: selectedClass,
        period: selectedPeriod,
        enteredBy: currentUserData.uid,
        enteredByName: currentUserData.displayName,
        createdAt: new Date()
      }, { merge:true });
      setCurrentSession(sessionId);

      const col = collection(db, 'attendanceSessions', sessionId, 'entries');
      const snap = await getDocs(col);
      const dataMap = snap.docs.reduce((acc,d)=>{
        const data = d.data();
        acc[d.id] = { status:data.status, reason:data.reason, period:data.period };
        return acc;
      }, {});
      setAttendanceData(dataMap);
    }
    loadSession();
  }, [sessionId, currentUserData]);

  // 출결 상태 저장
  const handleSelect = async (studentId, period, status, reason) => {
    if (!currentSession || !currentUserData) return;
    const ref = doc(db, 'attendanceSessions', currentSession, 'entries', studentId);
    const payload = {
      period,
      status,
      reason: status==='출석'?null:reason,
      timestamp: new Date(),
      editedBy: currentUserData.uid,
      editedByName: currentUserData.displayName
    };
    await setDoc(ref, payload, { merge:true });
    setAttendanceData(prev=>({ ...prev, [studentId]:{ status:payload.status, reason:payload.reason, period }}));
    setModal({ open:false, student:null, period:null, status:null });
  };

  // 모달 오픈
  const openModal = (student, period) => setModal({ open:true, student, period, status:null });
  const saveAll = () => alert('출결 정보가 저장되었습니다.');

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-8 md:px-16 flex flex-col">
      <h1 className="text-2xl font-bold mb-4 text-center">출석부</h1>

      {/* 필터 & 저장 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">날짜</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e=>setSelectedDate(e.target.value)}
            disabled={isScrolled}
            className={`border-gray-300 focus:border-teal-400 focus:ring-teal-200 rounded px-3 py-1 w-full ${isScrolled?'opacity-50 cursor-not-allowed':''}`} />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">학년</label>
          <select
            value={selectedGrade}
            onChange={e=>setSelectedGrade(e.target.value)}
            disabled={isScrolled}
            className={`border-gray-300 focus:border-teal-400 focus:ring-teal-200 rounded px-3 py-1 w-full ${isScrolled?'opacity-50 cursor-not-allowed':''}`}
          >
            {[1,2,3].map(g=> <option key={g} value={String(g)}>{g}학년</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">반</label>
          <select
            value={selectedClass}
            onChange={e=>setSelectedClass(e.target.value)}
            disabled={isScrolled}
            className={`border-gray-300 focus:border-teal-400 focus:ring-teal-200 rounded px-3 py-1 w-full ${isScrolled?'opacity-50 cursor-not-allowed':''}`}
          >
            {[...Array(10)].map((_,i)=> <option key={i+1} value={String(i+1)}>{i+1}반</option>)}
          </select>
        </div>
        <button onClick={saveAll} className="btn-teal w-full sm:w-auto">저장</button>
      </div>

      {/* 테이블 */}
      <div ref={tableContainerRef} className="relative overflow-auto bg-white shadow rounded max-h-[60vh]">
        <table className="min-w-[600px] w-full table-fixed border-collapse">
          <thead className="bg-gray-200">
            <tr className="border-t-2 border-l-2 border-gray-300 shadow-lg">
              <th className="p-2 border whitespace-nowrap sticky top-0 left-0 bg-gray-200 z-30 shadow-lg border-r-2 border-l-2 border-t-2 max-w-[120px] truncate">이름</th>
              {periods.map(p=>(
                <th
                  key={p}
                  className={`p-2 border whitespace-nowrap sticky top-0 bg-gray-200 z-20 text-center cursor-pointer border-t-2 border-gray-300 ${selectedPeriod===p?'bg-teal-100':''}`}
                  onClick={()=>setSelectedPeriod(p)}
                >{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length===0 ? (
              <tr><td colSpan={periods.length+1} className="p-4 text-center text-gray-500">학생 정보가 없습니다.</td></tr>
            ) : students.map(student=>(
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="p-2 border whitespace-nowrap sticky left-0 bg-white z-20 shadow-lg border-l-2 max-w-[120px] truncate">{student.name}</td>
                {periods.map(p=>{
                  const att = attendanceData[student.id];
                  const cellText = att?.period===p ? (att.reason?`${att.status} (${att.reason})`:att.status) : '';
                  const isEditable = p===selectedPeriod;
                  return (
                    <td
                      key={p}
                      className={`p-2 border text-center whitespace-nowrap ${isEditable?'cursor-pointer hover:bg-gray-100 bg-teal-50':''}`}
                      onClick={()=>isEditable&&openModal(student,p)}
                    >{cellText}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-bold mb-4">{modal.student.name} ({modal.period}) 출결 상태 선택</h2>
            {attendanceOptions.map(status=>(
              <button
                key={status}
                onClick={()=>status==='출석'
                  ? handleSelect(modal.student.id,modal.period,'출석',null)
                  : setModal(m=>({...m,status}))}
                className="block w-full text-left border px-3 py-1 mb-2 rounded hover:bg-gray-100"
              >{status}</button>
            ))}
            {modal.status && modal.status!=='출석' && (
              <div className="mt-4">
                <div className="font-semibold mb-2">사유 선택</div>
                {reasonOptions.map(reason=>(
                  <button
                    key={reason}
                    onClick={()=>handleSelect(modal.student.id,modal.period,modal.status,reason)}
                    className="border px-3 py-1 mr-2 mb-2 rounded hover:bg-gray-100"
                  >{reason}</button>
                ))}
              </div>
            )}
            <button
              onClick={()=>setModal({ open:false, student:null, period:null, status:null })}
              className="mt-4 text-sm text-gray-500 underline"
            >취소</button>
          </div>
        </div>
      )}
    </div>
  );
}