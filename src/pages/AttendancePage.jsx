// src/pages/AttendancePage.jsx

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import {
  collection,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore';

// 출결 상태 옵션 및 사유 옵션 정의
const attendanceOptions = ['출석', '결석', '지각', '조퇴', '결과'];
const reasonOptions     = ['인정', '질병', '기타', '미인정'];

// 테이블에 표시할 모든 “교시” 컬럼 (조회 포함)
const periods = ['조회','1교시','2교시','3교시','4교시','5교시','6교시','7교시'];

export default function AttendancePage() {
  // 날짜·학년·반 선택
  const [selectedDate, setSelectedDate]   = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [selectedClass, setSelectedClass] = useState('1');

  // 현재 활성화된 교시 (헤더 클릭으로 변경)
  const [selectedPeriod, setSelectedPeriod] = useState('조회');

  // 세션 ID 자동 생성
  const sessionId = `${selectedDate}_${selectedGrade}-${selectedClass}_${selectedPeriod}`;
  const [currentSession, setCurrentSession] = useState(null);

  // 학생 목록 및 출결 데이터
  const [students, setStudents]             = useState([]);
  const [attendanceData, setAttendanceData] = useState({});

  // 모달 상태
  const [modal, setModal] = useState({
    open:   false,
    student: null,
    period:  null,
    status:  null,
  });

  // 1) 학생 명단 로드
  useEffect(() => {
    async function fetchStudents() {
      const col = collection(db,'students',selectedGrade,selectedClass);
      const snap = await getDocs(col);
      setStudents(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    }
    fetchStudents();
  },[selectedGrade,selectedClass]);

  // 2) 세션이 바뀔 때마다 Firestore에 세션 문서 생성 & 엔트리 로드
  useEffect(() => {
    async function startAndLoad() {
      // 세션 생성(merge)
      const ref = doc(db,'attendanceSessions',sessionId);
      const user = auth.currentUser;
      await setDoc(ref,{
        date: selectedDate,
        grade: selectedGrade,
        class: selectedClass,
        period: selectedPeriod,
        enteredBy: user.uid,
        enteredByName: user.displayName,
        createdAt: new Date()
      },{ merge:true });
      setCurrentSession(sessionId);

      // 엔트리 로드
      const col = collection(db,'attendanceSessions',sessionId,'entries');
      const snap= await getDocs(col);
      const obj = snap.docs.reduce((acc,d)=>{
        const data=d.data();
        acc[d.id]={ status:data.status, reason:data.reason, period:data.period };
        return acc;
      },{});
      setAttendanceData(obj);
    }
    startAndLoad();
  },[sessionId]);

  // 출결 저장 함수(엔트리별)
  const handleSelect = async (studentId, period, status, reason) => {
    if (!currentSession) return;
    const ref = doc(db,'attendanceSessions',currentSession,'entries',studentId);
    const user = auth.currentUser;
    const payload = {
      period,
      status,
      reason: status==='출석'?null:reason,
      timestamp: new Date(),
      editedBy: user.uid,
      editedByName:user.displayName
    };
    await setDoc(ref,payload,{ merge:true });
    setAttendanceData(prev=>({
      ...prev,
      [studentId]:{ status:payload.status, reason:payload.reason, period }
    }));
    setModal({ open:false, student:null, period:null, status:null });
  };

  // 모달 열기
  const openModal = (student, period) => {
    setModal({ open:true, student, period, status:null });
  };

  // “저장” 버튼 핸들러
  const saveAll = () => {
    alert('출결 정보가 저장되었습니다.');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">출석부</h1>

      {/* 필터 & 저장 버튼 */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        {/* 날짜 */}
        <div>
          <label className="block font-semibold mb-1">날짜</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e=>setSelectedDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        {/* 학년 */}
        <div>
          <label className="block font-semibold mb-1">학년</label>
          <select
            value={selectedGrade}
            onChange={e=>setSelectedGrade(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {[1,2,3].map(g=>(
              <option key={g} value={String(g)}>{g}학년</option>
            ))}
          </select>
        </div>
        {/* 반 */}
        <div>
          <label className="block font-semibold mb-1">반</label>
          <select
            value={selectedClass}
            onChange={e=>setSelectedClass(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {[...Array(10)].map((_,c)=>(
              <option key={c+1} value={String(c+1)}>{c+1}반</option>
            ))}
          </select>
        </div>
        {/* 저장 */}
        <button
          onClick={saveAll}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          저장
        </button>
      </div>

      {/* 다교시 표 */}
      <div className="overflow-auto max-h-[60vh] border border-gray-300">
        <table className="w-full border-collapse table-fixed">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border w-1/6 sticky top-0 bg-gray-100 z-10">학생 이름</th>
              {periods.map(p=>(
                <th
                  key={p}
                  className={`
                    p-2 border sticky top-0 bg-gray-100 z-10
                    text-center cursor-pointer
                    ${selectedPeriod===p?'bg-blue-200':''}
                  `}
                  onClick={()=>setSelectedPeriod(p)}
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length===0 ? (
              <tr>
                <td colSpan={periods.length+1} className="p-4 text-center text-gray-500">
                  선택한 반의 학생 정보가 없습니다.
                </td>
              </tr>
            ) : students.map(student=>(
              <tr key={student.id}>
                <td className="p-2 border">{student.name}</td>
                {periods.map(p=>{
                  const att=attendanceData[student.id];
                  const cellText = att?.period===p
                    ? (att.reason?`${att.status} (${att.reason})`:att.status)
                    : '';
                  const cellColor = p===selectedPeriod
                    ? 'bg-blue-50'
                    : '';
                  const isEditable = p===selectedPeriod;
                  return (
                    <td
                      key={p}
                      className={`p-2 border text-center ${cellColor} ${isEditable?'cursor-pointer hover:bg-gray-100':''}`}
                      onClick={()=>isEditable && openModal(student,p)}
                    >
                      {cellText}
                    </td>
                  )
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
            <h2 className="text-lg font-bold mb-4">
              {modal.student.name} ({modal.period}) 출결 상태 선택
            </h2>
            {attendanceOptions.map(status=>(
              <button
                key={status}
                onClick={()=> status==='출석'
                  ? handleSelect(modal.student.id,modal.period,'출석',null)
                  : setModal(m=>({...m,status}))}
                className="block w-full text-left border px-3 py-1 mb-2 rounded hover:bg-gray-100"
              >
                {status}
              </button>
            ))}
            {modal.status&&modal.status!=='출석'&&(
              <div className="mt-4">
                <div className="font-semibold mb-2">사유 선택</div>
                {reasonOptions.map(reason=>(
                  <button
                    key={reason}
                    onClick={()=>handleSelect(modal.student.id,modal.period,modal.status,reason)}
                    className="border px-3 py-1 mr-2 mb-2 rounded hover:bg-gray-100"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={()=>setModal({open:false,student:null,period:null,status:null})}
              className="mt-4 text-sm text-gray-500 underline"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
