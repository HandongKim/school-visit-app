// src/components/domain/VisitRequest/VisitRequestForm.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebaseConfig';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';

export default function VisitRequestForm({ userInfo }) {
  const role = userInfo?.role;

  // 역할별 기본 타입 매핑
  const typeMapping = {
    nurse:     '보건실',
    counselor: '상담실',
    welfare:   '복지실',
  };
  const isFixedType = ['nurse', 'counselor', 'welfare'].includes(role);
  const defaultType = typeMapping[role] || '보건실';

  // form state
  const [form, setForm] = useState({
    grade:    userInfo?.grade   || '',
    class:    userInfo?.class   || '',
    name:     '',
    type:     '',            // ▶ 초기에는 빈 문자열로 두고
    reason:   '',
    time:     '1교시',
    breakVisit:      false,
    departureTime:  '',
  });

  // userInfo.role 이 들어오면 type 을 기본값으로 설정
  useEffect(() => {
    if (isFixedType) {
      setForm(f => ({ ...f, type: defaultType }));
    }
  }, [defaultType, isFixedType]);

  // 학생 목록 로드 (담임교사는 로드 안 함)
  const [studentList, setStudentList] = useState([]);
  useEffect(() => {
    async function loadStudents() {
      if (!form.grade || !form.class) {
        setStudentList([]);
        return;
      }
      const q = query(
        collection(db, 'students', form.grade, form.class)
      );
      const snap = await getDocs(q);
      setStudentList(snap.docs.map(d => d.data().name));
    }
    if (role !== 'homeroom') loadStudents();
  }, [form.grade, form.class, role]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      grade:        form.grade,
      class:        form.class,
      name:         form.name,
      type:         form.type,
      reason:       form.reason,
      time:         form.breakVisit ? null : form.time,
      breakVisit:   form.breakVisit,
      departureTime: form.breakVisit ? new Date(form.departureTime) : null,
      status:       { homeroom:'대기', subject:'대기' },
      confirmed:    false,
      createdAt:    new Date(),
    };
    try {
      await addDoc(collection(db, 'visits'), payload);
      alert('✅ 방문 신청이 저장되었습니다!');
      setForm(f => ({
        ...f,
        name:         '',
        reason:       '',
        time:         '1교시',
        breakVisit:   false,
        departureTime:''
        // grade/class/type 유지
      }));
    } catch (err) {
      console.error(err);
      alert('❌ 신청 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">방문 신청</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 학년·반 */}
          <div className="flex gap-2">
            <select
              name="grade"
              value={form.grade}
              onChange={handleChange}
              disabled={role === 'homeroom'}
              className={`border p-2 rounded w-1/2 text-sm ${
                role === 'homeroom' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
            >
              <option value="">학년</option>
              {[1,2,3].map(g=>(
                <option key={g} value={String(g)}>{g}학년</option>
              ))}
            </select>
            <select
              name="class"
              value={form.class}
              onChange={handleChange}
              disabled={role === 'homeroom'}
              className={`border p-2 rounded w-1/2 text-sm ${
                role === 'homeroom' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
            >
              <option value="">반</option>
              {[...Array(5)].map((_,i)=>(
                <option key={i+1} value={String(i+1)}>{i+1}반</option>
              ))}
            </select>
          </div>

          {/* 학생 이름 */}
          {studentList.length > 0 ? (
            <select
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
              required
            >
              <option value="">학생 선택</option>
              {studentList.map(name=>(
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          ) : (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름"
              className="border p-2 w-full rounded text-sm"
              required
            />
          )}

          {/* 방문 유형 */}
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            disabled={isFixedType}
            className="border p-2 w-full rounded text-sm"
            required
          >
            <option value="보건실">보건실</option>
            <option value="상담실">상담실</option>
            <option value="복지실">복지실</option>
          </select>

          {/* 쉬는 시간 방문 여부 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="breakVisit"
              checked={form.breakVisit}
              onChange={handleChange}
              id="breakVisit"
            />
            <label htmlFor="breakVisit">쉬는 시간 방문</label>
          </div>

          {/* 시간 or 출발 시각 */}
          {form.breakVisit ? (
            <input
              type="datetime-local"
              name="departureTime"
              value={form.departureTime}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
              required
            />
          ) : (
            <select
              name="time"
              value={form.time}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
            >
              {['1교시','2교시','3교시','4교시','5교시','6교시','7교시'].map(p=>(
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}

          {/* 사유 */}
          <input
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="사유"
            className="border p-2 w-full rounded text-sm"
            required
          />

          {/* 제출 */}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded text-sm"
          >
            신청하기
          </button>
        </form>
      </div>
    </div>
  );
}
