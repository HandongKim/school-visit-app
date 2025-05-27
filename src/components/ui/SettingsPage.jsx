// d:\school-visit-app\src\components\ui\SettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/firebaseConfig'; // Firebase Firestore 및 Auth 인스턴스 임포트
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore'; // Firestore 함수 임포트, deleteField 추가
import { ROLES, ROLE_NAMES } from '../../constants/appConstants'; // 역할 및 역할 이름 상수 임포트

/**
 * @file SettingsPage.jsx
 * @description 사용자가 자신의 등록된 정보를 확인하고 수정할 수 있는 설정 페이지 컴포넌트입니다.
 * 사용자 이름 및 역할을 변경할 수 있으며, 역할에 따라 학년/반 정보 입력 UI가 동적으로 제공됩니다.
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
  // 수정 모드에서 사용될 사용자 이름 상태
  const [name, setName] = useState('');
  // 수정 모드에서 사용될 사용자 역할 상태
  const [selectedRole, setSelectedRole] = useState('');
  // 수정 모드에서 사용될 학년 상태 (담임 역할 시)
  const [selectedGrade, setSelectedGrade] = useState('');
  // 수정 모드에서 사용될 반 상태 (담임 역할 시)
  const [selectedClassNum, setSelectedClassNum] = useState('');

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
      setSuccessMessage(''); // 메시지 초기화
      try {
        // Firestore 'users' 컬렉션에서 현재 사용자의 UID로 문서를 조회합니다.
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserInfo(userData); // 불러온 사용자 정보를 userInfo 상태에 저장
          setName(userData.name || ''); // 사용자 이름을 name 상태에 초기값으로 설정
          setSelectedRole(userData.role || ''); // 사용자 역할을 selectedRole 상태에 초기값으로 설정
          // 역할이 담임교사인 경우 학년, 반 정보도 상태에 설정
          if (userData.role === ROLES.HOMEROOM) {
            setSelectedGrade(userData.grade || '');
            setSelectedClassNum(userData.class || '');
          } else {
            setSelectedGrade('');
            setSelectedClassNum('');
          }
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
   * 역할 변경 시 호출되는 핸들러 함수입니다.
   * 새로운 역할에 따라 학년/반 입력 필드 상태를 초기화합니다.
   * @param {React.ChangeEvent<HTMLSelectElement>} e - 변경 이벤트 객체
   */
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    // 역할이 담임교사가 아니면 학년/반 정보 초기화
    if (newRole !== ROLES.HOMEROOM) {
      setSelectedGrade('');
      setSelectedClassNum('');
    } else {
      // 역할이 담임교사로 변경되었을 때, 기존 userInfo에 해당 정보가 있고 이전 역할도 담임이었다면 불러오고,
      // 그렇지 않으면 (새로 담임이 되거나, 이전 정보가 없으면) 빈 값으로 둠 (사용자가 직접 입력하도록 유도)
      if (userInfo?.role === newRole) { // 이전 역할과 새 역할이 모두 담임인 경우
        setSelectedGrade(userInfo?.grade || '');
        setSelectedClassNum(userInfo?.class || '');
      } else { // 다른 역할에서 담임으로 변경된 경우 또는 초기 로드 시
        setSelectedGrade('');
        setSelectedClassNum('');
      }
    }
  };


  /**
   * 사용자 정보(이름, 역할, 학년, 반) 변경 폼 제출 시 실행되는 비동기 핸들러 함수입니다.
   * 변경된 사용자 정보를 Firestore에 업데이트합니다.
   * @param {React.FormEvent<HTMLFormElement>} e - 폼 제출 이벤트 객체
   */
  const handleInfoUpdate = async (e) => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지
    setError(''); // 이전 오류 메시지 초기화
    setSuccessMessage(''); // 이전 성공 메시지 초기화

    // 필수 필드 유효성 검사
    if (!name.trim() || !selectedRole) {
      setError('이름과 역할은 필수 항목입니다.');
      return;
    }
    // 역할이 담임일 경우 학년, 반 정보도 필수
    if (selectedRole === ROLES.HOMEROOM && (!selectedGrade || !selectedClassNum)) {
      setError('담임 역할은 학년과 반 정보를 모두 입력해야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // Firestore 'users' 컬렉션에서 현재 사용자 문서 참조
      const userDocRef = doc(db, 'users', user.uid);
      
      // 업데이트할 필드 객체 구성
      const updatedFields = {
        name: name.trim(),
        role: selectedRole,
      };

      // 선택된 역할에 따라 학년/반 정보 처리
      if (selectedRole === ROLES.HOMEROOM) { // 담임교사인 경우에만 학년/반 정보 저장
        updatedFields.grade = selectedGrade;
        updatedFields.class = selectedClassNum; // Firestore 필드명은 'class'로
      } else {
        // 다른 역할로 변경 시 학년/반 필드 삭제
        updatedFields.grade = deleteField();
        updatedFields.class = deleteField();
      }

      await updateDoc(userDocRef, updatedFields);

      setSuccessMessage('사용자 정보가 성공적으로 변경되었습니다.');
      // 부모 컴포넌트(App.jsx)의 userInfo 상태도 업데이트하기 위해 onUpdate 콜백 호출
      if (onUpdate) {
        const callbackData = {...updatedFields};
        if (updatedFields.grade === deleteField()) delete callbackData.grade;
        if (updatedFields.class === deleteField()) delete callbackData.class;
        onUpdate(callbackData);
      }
      // 현재 페이지의 userInfo 상태도 업데이트
      setUserInfo(prev => {
        const newInfo = { ...prev, ...updatedFields };
        if (updatedFields.grade === deleteField()) delete newInfo.grade;
        if (updatedFields.class === deleteField()) delete newInfo.class;
        return newInfo;
      });
    } catch (err) {
      console.error("사용자 정보 업데이트 중 오류:", err);
      setError('정보 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중일 때 표시할 UI (초기 데이터 로드 시)
  if (isLoading && !userInfo) {
    return <div className="p-4 text-center">정보를 불러오는 중입니다...</div>;
  }

  // 사용자 정보를 찾을 수 없을 때 표시할 UI (초기 로드 실패 등)
  if (!userInfo && !error && !isLoading) {
    return <div className="p-4 text-center">사용자 정보를 표시할 수 없습니다. 다시 시도해주세요.</div>;
  }
  
  // 오류 발생 시 표시할 UI (userInfo가 없는 경우에만, 정보가 있으면 폼과 함께 오류 표시)
  if (error && !userInfo && !isLoading) {
     return <div className="p-4 text-center text-red-500">{error}</div>;
  }


  // 사용자 설정 페이지 UI 렌더링
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="bg-white shadow-xl rounded-lg p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          사용자 설정
        </h2>

        {/* 오류 메시지 표시 */}
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded">{error}</p>}
        {/* 성공 메시지 표시 */}
        {successMessage && <p className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded">{successMessage}</p>}

        {/* 사용자 정보 표시 섹션 (현재 정보) */}
        {userInfo && (
          <div className="space-y-3 mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-700">현재 정보</h3>
            <p><span className="font-medium text-gray-600">이메일:</span> {userInfo.email}</p>
            <p><span className="font-medium text-gray-600">이름:</span> {userInfo.name}</p>
            <p><span className="font-medium text-gray-600">역할:</span> {ROLE_NAMES[userInfo.role] || userInfo.role}</p>
            {/* 현재 역할이 담임이고, 학년/반 정보가 있을 때만 표시 */}
            {userInfo.role === ROLES.HOMEROOM && userInfo.grade && userInfo.class && (
              <>
                <p><span className="font-medium text-gray-600">학년:</span> {userInfo.grade}학년</p>
                <p><span className="font-medium text-gray-600">반:</span> {userInfo.class}반</p>
              </>
            )}
          </div>
        )}

        {/* 정보 변경 폼 섹션 */}
        <form onSubmit={handleInfoUpdate} className="space-y-6">
          {/* 이름 입력 필드 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="새로운 이름을 입력하세요"
              required
            />
          </div>

          {/* 역할 변경 드롭다운 */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              역할 변경
            </label>
            <select
              name="role"
              id="role"
              value={selectedRole}
              onChange={handleRoleChange} // 역할 변경 시 handleRoleChange 호출
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">역할 선택</option>
              {/* ROLES 객체의 모든 키-값 쌍을 순회하며 옵션 생성 */}
              {Object.keys(ROLES).map((roleKey) => (
                <option key={ROLES[roleKey]} value={ROLES[roleKey]}>
                  {/* ROLE_NAMES에 해당 역할의 한글 이름이 있으면 사용, 없으면 역할 키(영문 대문자) 사용 */}
                  {ROLE_NAMES[ROLES[roleKey]] || roleKey}
                </option>
              ))}
            </select>
          </div>

          {/* 역할이 담임일 경우 학년/반 입력 필드 동적 표시 */}
          {selectedRole === ROLES.HOMEROOM && (
            <>
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                <select
                  name="grade"
                  id="grade"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
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
                <label htmlFor="classNum" className="block text-sm font-medium text-gray-700 mb-1">반</label>
                <select
                  name="classNum"
                  id="classNum"
                  value={selectedClassNum}
                  onChange={(e) => setSelectedClassNum(e.target.value)}
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
          
          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !name.trim() || !selectedRole || (selectedRole === ROLES.HOMEROOM && (!selectedGrade || !selectedClassNum))}
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
              '정보 변경하기'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
