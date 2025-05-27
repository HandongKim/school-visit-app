// d:\school-visit-app\src\components\ui\SettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/firebaseConfig'; // Firebase Firestore 및 Auth 인스턴스 임포트
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Firestore 문서 가져오기 및 업데이트 함수 임포트
import { ROLES } from '../../constants/appConstants'; // 역할 상수 임포트 (필요시 사용)

/**
 * @file SettingsPage.jsx
 * @description 사용자가 자신의 등록된 정보를 확인하고 수정할 수 있는 설정 페이지 컴포넌트입니다.
 * 현재는 주로 사용자 이름 변경 기능을 제공하며, 역할, 학년, 반 정보는 참고용으로 표시됩니다.
 * 변경된 정보는 Firestore 'users' 컬렉션에 업데이트됩니다.
 */

/**
 * SettingsPage 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {object} props.user - Firebase auth로부터 받은 현재 사용자 객체 (주로 uid를 사용)
 * @param {function} props.onUpdate - 사용자 정보가 성공적으로 업데이트되었을 때 호출되는 콜백 함수.
 *                                   App.jsx의 userInfo 상태를 업데이트합니다.
 * @returns {JSX.Element} 사용자 설정 페이지 UI
 */
export default function SettingsPage({ user, onUpdate }) {
  // 사용자 정보를 저장하는 상태입니다. Firestore에서 불러온 데이터를 담습니다.
  const [userInfo, setUserInfo] = useState(null);
  // 수정 모드에서 사용될 사용자 이름 상태입니다.
  const [name, setName] = useState('');
  // 로딩 상태 (Firestore 데이터 로딩 또는 업데이트 중일 때 true)
  const [isLoading, setIsLoading] = useState(true);
  // 오류 메시지 상태
  const [error, setError] = useState('');
  // 성공 메시지 상태
  const [successMessage, setSuccessMessage] = useState('');

  // 컴포넌트 마운트 시 또는 user 객체가 변경될 때 Firestore에서 사용자 정보를 불러옵니다.
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) { // user 객체가 없으면 (예: 로그아웃 상태) 함수 종료
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        // Firestore 'users' 컬렉션에서 현재 사용자의 UID로 문서를 조회합니다.
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserInfo(userData); // 불러온 사용자 정보를 userInfo 상태에 저장
          setName(userData.name || ''); // 사용자 이름을 name 상태에 초기값으로 설정
        } else {
          setError('사용자 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error("사용자 정보 로드 중 오류:", err);
        setError('정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserInfo();
  }, [user]); // user prop이 변경될 때마다 이 효과를 다시 실행합니다.

  /**
   * 이름 변경 폼 제출 시 실행되는 비동기 핸들러 함수입니다.
   * 변경된 사용자 이름을 Firestore에 업데이트합니다.
   * @param {React.FormEvent<HTMLFormElement>} e - 폼 제출 이벤트 객체
   */
  const handleNameUpdate = async (e) => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지
    if (!name.trim()) { // 이름이 비어있거나 공백만 있으면 오류 처리
      setError('이름을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Firestore 'users' 컬렉션에서 현재 사용자 문서 참조
      const userDocRef = doc(db, 'users', user.uid);
      // 'name' 필드만 업데이트
      await updateDoc(userDocRef, { name: name.trim() });

      setSuccessMessage('이름이 성공적으로 변경되었습니다.');
      // 부모 컴포넌트(App.jsx)의 userInfo 상태도 업데이트하기 위해 onUpdate 콜백 호출
      if (onUpdate) {
        onUpdate({ name: name.trim() });
      }
      // 현재 페이지의 userInfo 상태도 업데이트 (선택적, onUpdate가 App.jsx를 리렌더링하므로)
      setUserInfo(prev => ({ ...prev, name: name.trim() }));
    } catch (err) {
      console.error("이름 업데이트 중 오류:", err);
      setError('이름 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중일 때 표시할 UI
  if (isLoading) {
    return <div className="p-4 text-center">정보를 불러오는 중입니다...</div>;
  }

  // 사용자 정보를 찾을 수 없을 때 표시할 UI
  if (!userInfo && !error) { // 에러도 없고 userInfo도 없으면 (초기 로딩 실패 등)
    return <div className="p-4 text-center">사용자 정보를 표시할 수 없습니다.</div>;
  }
  
  // 오류 발생 시 표시할 UI
  if (error && !userInfo) { // userInfo 없이 에러만 있을 때
     return <div className="p-4 text-center text-red-500">{error}</div>;
  }


  // 사용자 설정 페이지 UI 렌더링
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="bg-white shadow-xl rounded-lg p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          사용자 설정
        </h2>

        {/* 오류 메시지 표시 (이름 변경 시 발생 가능) */}
        {error && !successMessage && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded">{error}</p>}
        {/* 성공 메시지 표시 */}
        {successMessage && <p className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded">{successMessage}</p>}

        {/* 사용자 정보 표시 섹션 */}
        {userInfo && (
          <div className="space-y-4 mb-8">
            <div>
              <p className="text-sm font-medium text-gray-500">이메일</p>
              <p className="text-lg text-gray-700">{userInfo.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">현재 이름</p>
              <p className="text-lg text-gray-700">{userInfo.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">역할</p>
              <p className="text-lg text-gray-700">{userInfo.role}</p>
            </div>
            {/* 역할이 담임 또는 교과일 경우 학년, 반 정보 표시 */}
            {(userInfo.role === ROLES.HOMEROOM || userInfo.role === ROLES.SUBJECT) && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500">학년</p>
                  <p className="text-lg text-gray-700">{userInfo.grade}학년</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">반</p>
                  <p className="text-lg text-gray-700">{userInfo.class}반</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* 이름 변경 폼 섹션 */}
        <form onSubmit={handleNameUpdate} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름 변경
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="새로운 이름을 입력하세요"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !name.trim()} // 로딩 중이거나 이름이 비어있으면 비활성화
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                변경 중...
              </>
            ) : (
              '이름 변경하기'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
