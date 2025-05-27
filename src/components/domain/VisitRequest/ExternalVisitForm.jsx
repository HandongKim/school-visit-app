// d:\school-visit-app\src\components\domain\VisitRequest\ExternalVisitForm.jsx

import React, { useState } from 'react';
import { db } from '../../../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Firestore 함수 임포트

/**
 * @file ExternalVisitForm.jsx
 * @description 학교에 방문하는 외부인(학부모, 강사 등)의 방문 정보를 기록하는 폼 컴포넌트입니다.
 * 교과교사 또는 담임교사가 이 기록을 작성할 수 있습니다.
 * 기록된 정보는 Firestore 'external_visits' 컬렉션에 저장됩니다.
 */

/**
 * ExternalVisitForm 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {object} props.userInfo - 현재 로그인한 교사의 정보 (이름, UID 등 기록자 정보로 사용)
 * @returns {JSX.Element} 외부인 방문 기록 폼 UI
 */
export default function ExternalVisitForm({ userInfo }) {
  // 폼 입력 값을 관리하는 상태입니다.
  const [form, setForm] = useState({
    visitorName: '',    // 방문자 이름
    visitorAffiliation: '', // 방문자 소속 (예: OO학부모, XX업체)
    visitorContact: '', // 방문자 연락처
    purpose: '',        // 방문 목적
    destination: '',    // 방문 장소 (예: 3학년 1반 교실, 교장실, 본관 2층 OO실)
    entryTime: new Date().toISOString().substring(0, 16), // 방문 시작 시간 (YYYY-MM-DDTHH:mm 형식)
    exitTime: '',       // 퇴교 예정/실제 시간 (선택적)
    notes: '',          // 기타 특이사항
  });

  // 로딩 상태 (Firestore 저장 중일 때 true)
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 폼 입력 요소의 변경 이벤트를 처리하는 핸들러 함수입니다.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} e - 변경 이벤트 객체
   */
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  /**
   * 폼 제출 이벤트를 처리하는 비동기 핸들러 함수입니다.
   * 입력된 외부인 방문 기록을 Firestore에 저장합니다.
   * @param {React.FormEvent<HTMLFormElement>} e - 폼 제출 이벤트 객체
   */
  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);

    // 필수 필드 유효성 검사
    if (!form.visitorName.trim() || !form.purpose.trim() || !form.destination.trim() || !form.entryTime) {
      alert('방문자 이름, 방문 목적, 방문 장소, 방문 시작 시간은 필수 항목입니다.');
      setIsLoading(false);
      return;
    }

    // Firestore에 저장할 데이터 객체(payload)를 구성합니다.
    const payload = {
      visitorName:    form.visitorName.trim(),
      visitorAffiliation: form.visitorAffiliation.trim(),
      visitorContact: form.visitorContact.trim(),
      purpose:        form.purpose.trim(),
      destination:    form.destination.trim(),
      entryTime:      new Date(form.entryTime), // ISO 문자열을 Date 객체로 변환
      exitTime:       form.exitTime ? new Date(form.exitTime) : null, // 퇴교 시간이 있으면 Date 객체로, 없으면 null
      notes:          form.notes.trim(),
      recordedByUid:  userInfo.uid,  // 기록한 교사 UID
      teacherName:    userInfo.name,   // 기록한 교사 이름
      createdAt:      serverTimestamp(), // 서버 타임스탬프 사용
    };

    try {
      // 'external_visits' 컬렉션에 payload 데이터 추가
      await addDoc(collection(db, 'external_visits'), payload);
      alert('✅ 외부인 방문 기록이 저장되었습니다!');
      // 폼 초기화
      setForm({
        visitorName: '',
        visitorAffiliation: '',
        visitorContact: '',
        purpose: '',
        destination: '',
        entryTime: new Date().toISOString().substring(0, 16),
        exitTime: '',
        notes: '',
      });
    } catch (err) {
      console.error("외부인 방문 기록 저장 중 오류:", err);
      alert('❌ 외부인 방문 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 외부인 방문 기록 폼 UI를 렌더링합니다.
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">외부인 방문 기록</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 방문자 정보 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700 mb-1">방문자 이름</label>
              <input
                type="text"
                name="visitorName"
                id="visitorName"
                value={form.visitorName}
                onChange={handleChange}
                className="border p-2 w-full rounded text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="visitorAffiliation" className="block text-sm font-medium text-gray-700 mb-1">소속 (선택)</label>
              <input
                type="text"
                name="visitorAffiliation"
                id="visitorAffiliation"
                value={form.visitorAffiliation}
                onChange={handleChange}
                placeholder="예: OO초 학부모, XX업체"
                className="border p-2 w-full rounded text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="visitorContact" className="block text-sm font-medium text-gray-700 mb-1">방문자 연락처 (선택)</label>
            <input
              type="tel"
              name="visitorContact"
              id="visitorContact"
              value={form.visitorContact}
              onChange={handleChange}
              placeholder="예: 010-1234-5678"
              className="border p-2 w-full rounded text-sm"
            />
          </div>

          {/* 방문 목적 및 장소 섹션 */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">방문 목적</label>
            <input
              type="text"
              name="purpose"
              id="purpose"
              value={form.purpose}
              onChange={handleChange}
              className="border p-2 w-full rounded text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">방문 장소</label>
            <input
              type="text"
              name="destination"
              id="destination"
              value={form.destination}
              onChange={handleChange}
              placeholder="예: 3학년 1반, 교장실"
              className="border p-2 w-full rounded text-sm"
              required
            />
          </div>

          {/* 방문 시간 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="entryTime" className="block text-sm font-medium text-gray-700 mb-1">방문 시작 시각</label>
              <input
                type="datetime-local"
                name="entryTime"
                id="entryTime"
                value={form.entryTime}
                onChange={handleChange}
                className="border p-2 w-full rounded text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="exitTime" className="block text-sm font-medium text-gray-700 mb-1">퇴교 시각 (선택)</label>
              <input
                type="datetime-local"
                name="exitTime"
                id="exitTime"
                value={form.exitTime}
                onChange={handleChange}
                className="border p-2 w-full rounded text-sm"
              />
            </div>
          </div>
          
          {/* 기타 특이사항 */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">기타 특이사항 (선택)</label>
            <textarea
              name="notes"
              id="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="필요시 추가 정보를 입력해주세요."
              className="border p-2 w-full rounded text-sm h-20 resize-none"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-500 hover:bg-purple-600 text-white w-full py-2.5 rounded text-sm font-medium disabled:bg-purple-300"
          >
            {isLoading ? '저장 중...' : '외부인 방문 기록 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
