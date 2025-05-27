// d:\school-visit-app\src\components\ui\RoleRegisterForm.jsx

import React, { useState } from 'react';
import { db } from '../../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { doc, setDoc } from 'firebase/firestore';   // Firestore 문서 설정 함수 임포트
import { ROLES } from '../../constants/appConstants'; // 역할 상수 임포트

/**
 * @file RoleRegisterForm.jsx
 * @description 사용자가 최초 로그인 후 자신의 역할(교사 유형, 학년, 반 등)을 등록하는 폼 컴포넌트입니다.
 * 등록된 정보는 Firestore 'users' 컬렉션에 해당 사용자 UID를 문서 ID로 하여 저장됩니다.
 */

/**
 * RoleRegisterForm 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {object} props.user - Firebase auth로부터 받은 현재 사용자 객체 (uid, email, displayName 등 포함)
 * @param {function} props.onComplete - 역할 등록이 성공적으로 완료되었을 때 호출되는 콜백 함수.
 *                                     App.jsx의 userInfo 상태를 업데이트하여 메인 앱으로 진입하도록 합니다.
 * @returns {JSX.Element} 역할 등록 폼 UI
 */
export default function RoleRegisterForm({ user, onComplete }) {
  // 폼 입력 값을 관리하는 상태입니다.
  const [formData, setFormData] = useState({
    name: user.displayName || '', // Firebase 사용자 이름이 있으면 기본값으로, 없으면 빈 문자열
    role: '',                     // 사용자 역할 (선택 필요)
    grade: '',                    // 학년 (담임 또는 교과 교사 선택 시 입력)
    classNum: '',                 // 반 (담임 또는 교과 교사 선택 시 입력)
  });
  // 로딩 상태 (Firestore 저장 중일 때 true)
  const [isLoading, setIsLoading] = useState(false);
  // 오류 메시지 상태
  const [error, setError] = useState('');

  /**
   * 폼 입력 요소의 변경 이벤트를 처리하는 핸들러 함수입니다.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - 변경 이벤트 객체
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * 폼 제출 이벤트를 처리하는 비동기 핸들러 함수입니다.
   * 입력된 사용자 정보를 Firestore에 저장합니다.
   * @param {React.FormEvent<HTMLFormElement>} e - 폼 제출 이벤트 객체
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지
    setError('');       // 이전 오류 메시지 초기화
    setIsLoading(true); // 로딩 상태 시작

    // 필수 필드 유효성 검사
    if (!formData.name || !formData.role) {
      setError('이름과 역할은 필수 항목입니다.');
      setIsLoading(false);
      return;
    }
    // 담임 또는 교과 교사 선택 시 학년, 반 정보 필수 검사
    if ((formData.role === ROLES.HOMEROOM || formData.role === ROLES.SUBJECT) && (!formData.grade || !formData.classNum)) {
      setError('담임 또는 교과 교사는 학년과 반 정보를 입력해야 합니다.');
      setIsLoading(false);
      return;
    }

    // Firestore에 저장할 사용자 정보 객체 구성
    const userData = {
      uid: user.uid,
      email: user.email,
      name: formData.name,
      role: formData.role,
      // 역할에 따라 학년, 반 정보 포함 여부 결정
      ...( (formData.role === ROLES.HOMEROOM || formData.role === ROLES.SUBJECT) && {
        grade: formData.grade,
        class: formData.classNum, // Firestore 필드명은 'class'로 통일 (기존 App.jsx 로직과 일관성)
      })
    };

    try {
      // Firestore 'users' 컬렉션에 사용자 UID를 문서 ID로 하여 userData 저장
      // `setDoc`은 문서가 존재하면 덮어쓰고, 존재하지 않으면 새로 생성합니다.
      await setDoc(doc(db, 'users', user.uid), userData);
      // 등록 완료 후 onComplete 콜백 함수를 호출하여 App.jsx의 userInfo 상태를 업데이트합니다.
      onComplete(userData);
    } catch (err) {
      console.error("역할 등록 중 오류 발생:", err);
      setError('정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false); // 로딩 상태 종료
    }
  };

  // 역할 등록 폼 UI를 렌더링합니다.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 to-blue-500 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">교직원 정보 등록</h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          원활한 서비스 이용을 위해 정보를 입력해주세요.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">역할</label>
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">역할 선택</option>
              <option value={ROLES.NURSE}>보건교사</option>
              <option value={ROLES.COUNSELOR}>상담교사</option>
              <option value={ROLES.WELFARE}>복지교사</option>
              <option value={ROLES.HOMEROOM}>담임교사</option>
              <option value={ROLES.SUBJECT}>교과교사</option>
              {/* 필요시 다른 역할 추가 */}
            </select>
          </div>

          {/* 담임 또는 교과 교사 선택 시에만 학년, 반 입력 필드 표시 */}
          {(formData.role === ROLES.HOMEROOM || formData.role === ROLES.SUBJECT) && (
            <>
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700">학년</label>
                <select
                  name="grade"
                  id="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">학년 선택</option>
                  {[1, 2, 3].map(g => (
                    <option key={g} value={String(g)}>{g}학년</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="classNum" className="block text-sm font-medium text-gray-700">반</label>
                <select
                  name="classNum"
                  id="classNum"
                  value={formData.classNum}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">반 선택</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}반</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* 오류 메시지 표시 */}
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading} // 로딩 중일 때 버튼 비활성화
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {isLoading ? '저장 중...' : '정보 저장하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
