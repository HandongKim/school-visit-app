// d:\school-visit-app\src\components\domain\VisitRequest\ApprovalScreen.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'; // Firestore 함수 임포트
import { ROLES } from '../../../constants/appConstants'; // 역할 상수 임포트

/**
 * @file ApprovalScreen.jsx
 * @description 교사가 학생들의 특별실 방문 요청을 확인하고 승인/반려하는 화면 컴포넌트입니다.
 * 담임교사는 담임 승인(homeroom)을, 교과교사는 교과 승인(subject)을 담당합니다.
 * 모든 승인이 완료되면 요청의 confirmed 상태가 true로 변경됩니다.
 */

/**
 * ApprovalScreen 컴포넌트
 * @param {object} props - 컴포넌트에 전달되는 props
 * @param {string} props.role - 현재 로그인한 교사의 역할 (예: ROLES.HOMEROOM, ROLES.SUBJECT)
 * @param {object} props.userInfo - 현재 로그인한 교사의 정보 (이름, 학년, 반 등)
 * @returns {JSX.Element} 방문 요청 승인/반려 화면 UI
 */
export default function ApprovalScreen({ role, userInfo }) {
  // 승인 대기 중인 방문 요청 목록을 저장하는 상태입니다.
  const [requests, setRequests] = useState([]);
  // 데이터 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(true);
  // 오류 메시지를 저장하는 상태입니다.
  const [error, setError] = useState('');

  /**
   * Firestore에서 승인 대기 중인 방문 요청 목록을 불러오는 비동기 함수입니다.
   * 현재 교사의 역할 및 담당 학년/반에 따라 필터링된 요청만 가져옵니다.
   */
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let q; // Firestore 쿼리 객체
      const visitsCollectionRef = collection(db, 'visits');

      // 쿼리 조건을 설정합니다.
      // 1. isBreakVisit이 false 이거나 존재하지 않는 (수업 중 방문) 요청
      // 2. 최종 확정(confirmed)되지 않은 요청
      const baseConditions = [
        where('isBreakVisit', '!=', true), // isBreakVisit이 true가 아닌 모든 문서 (false 또는 필드 없음)
        where('confirmed', '==', false)    // 아직 최종 승인되지 않은 요청
      ];

      if (role === ROLES.HOMEROOM) { // 담임교사인 경우
        // 자신의 학년/반 학생들의 요청 중, 담임 승인(status.homeroom)이 '대기'인 요청
        q = query(visitsCollectionRef,
          ...baseConditions,
          where('grade', '==', userInfo.grade),
          where('class', '==', userInfo.class),
          where('status.homeroom', '==', '대기')
        );
      } else if (role === ROLES.SUBJECT) { // 교과교사인 경우
        // 모든 요청 중 (학년/반 무관), 교과 승인(status.subject)이 '대기'인 요청
        // 추가적으로, 교과교사는 자신이 담당하는 수업 시간의 요청만 봐야 할 수 있습니다.
        // 이 부분은 현재 시간과 요청의 'time'(교시)을 비교하는 로직이 필요하며,
        // Firestore 쿼리만으로는 복잡할 수 있어 클라이언트 측 필터링 또는 백엔드 로직이 필요할 수 있습니다.
        // 여기서는 일단 모든 '대기' 상태의 교과 승인 요청을 가져옵니다.
        q = query(visitsCollectionRef,
          ...baseConditions,
          where('status.subject', '==', '대기')
        );
      } else { // 그 외 역할은 이 화면을 사용할 수 없음 (또는 다른 로직)
        setError('승인 권한이 없는 역할입니다.');
        setIsLoading(false);
        setRequests([]);
        return;
      }

      const querySnapshot = await getDocs(q);
      const fetchedRequests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Firestore 타임스탬프를 JavaScript Date 객체로 변환 (표시용)
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
      }));
      setRequests(fetchedRequests);
    } catch (err) {
      console.error("방문 요청 목록 로드 중 오류:", err);
      setError('요청 목록을 불러오는 중 오류가 발생했습니다.');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [role, userInfo]); // role 또는 userInfo가 변경될 때마다 함수를 재생성합니다.

  // 컴포넌트 마운트 시 또는 fetchRequests 함수가 변경될 때 방문 요청 목록을 불러옵니다.
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  /**
   * 특정 방문 요청의 승인 상태를 업데이트하는 비동기 함수입니다.
   * @param {string} requestId - 업데이트할 방문 요청 문서의 ID
   * @param {'승인됨' | '반려됨'} approvalStatus - 새로운 승인 상태
   */
  const handleApproval = async (requestId, approvalStatus) => {
    setIsLoading(true); // UI 업데이트 전 로딩 상태로 변경
    try {
      const requestDocRef = doc(db, 'visits', requestId);
      const requestToUpdate = requests.find(req => req.id === requestId);

      if (!requestToUpdate) {
        throw new Error("요청 정보를 찾을 수 없습니다.");
      }

      // 업데이트할 필드를 담는 객체입니다.
      const updateData = {
        // 현재 교사의 역할에 따라 해당 역할의 승인 상태를 업데이트합니다.
        [`status.${role}`]: approvalStatus,
        // 승인/반려 시각을 기록합니다. (예: status.homeroomApprovedAt)
        [`status.${role}ApprovedAt`]: serverTimestamp(),
        // 승인/반려한 교사 정보를 기록합니다.
        [`status.${role}ApproverName`]: userInfo.name,
        [`status.${role}ApproverUid`]: userInfo.uid,
      };

      // 두 역할(담임, 교과)의 승인 상태를 확인합니다.
      const currentHomeroomStatus = role === ROLES.HOMEROOM ? approvalStatus : requestToUpdate.status.homeroom;
      const currentSubjectStatus = role === ROLES.SUBJECT ? approvalStatus : requestToUpdate.status.subject;

      // 모든 필수 승인이 '승인됨' 상태인지 확인합니다.
      if (currentHomeroomStatus === '승인됨' && currentSubjectStatus === '승인됨') {
        updateData.confirmed = true; // 모든 승인이 완료되면 confirmed를 true로 설정
        updateData.confirmedAt = serverTimestamp(); // 최종 확정 시각 기록
      } else if (approvalStatus === '반려됨') {
        // 한쪽이라도 반려되면 최종 상태를 '반려됨'으로 간주하고 confirmed는 false로 유지하거나,
        // 혹은 별도의 'rejected' 상태를 관리할 수 있습니다.
        // 여기서는 confirmed는 false로 두고, 각 역할의 반려 상태만 기록합니다.
        // 필요하다면, confirmed를 'rejected'와 같은 문자열로 설정하여 구분할 수도 있습니다.
        updateData.confirmed = false; // 반려 시 최종 확정은 아님
      }


      await updateDoc(requestDocRef, updateData);
      alert(`요청이 ${approvalStatus} 처리되었습니다.`);
      // 목록을 새로고침하여 변경사항을 반영합니다.
      fetchRequests();
    } catch (err) {
      console.error("승인 처리 중 오류:", err);
      alert('승인 처리 중 오류가 발생했습니다.');
      setIsLoading(false); // 오류 발생 시 로딩 상태 해제
    }
    // setIsLoading(false)는 fetchRequests() 내부의 finally에서 처리되므로 여기서는 생략 가능
  };

  // 로딩 중일 때 표시할 UI
  if (isLoading) {
    return <div className="p-4 text-center">요청 목록을 불러오는 중입니다...</div>;
  }

  // 오류 발생 시 표시할 UI
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  // 승인 대기 중인 요청이 없을 때 표시할 UI
  if (requests.length === 0) {
    return <div className="p-4 text-center text-gray-500">새로운 방문 요청이 없습니다.</div>;
  }

  // 방문 요청 목록 및 승인/반려 버튼을 포함한 UI 렌더링
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">
        {role === ROLES.HOMEROOM ? '담임 승인 대기 목록' : '교과 승인 대기 목록'}
      </h2>
      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 text-sm">
              <p><strong>학생:</strong> {req.grade}학년 {req.class}반 {req.name}</p>
              <p><strong>방문 장소:</strong> {req.type}</p>
              <p><strong>요청 교시:</strong> {req.time}</p>
            </div>
            <p className="text-sm mb-1"><strong>사유:</strong> {req.reason}</p>
            <p className="text-xs text-gray-500 mb-3">
              요청 시각: {req.createdAt.toLocaleString('ko-KR')}
            </p>
            {/* 다른 교사의 승인 상태 표시 (참고용) */}
            <div className="text-xs mb-3 space-y-1">
              {role !== ROLES.HOMEROOM && req.status?.homeroom && (
                <p>담임 승인: <span className={`font-semibold ${req.status.homeroom === '승인됨' ? 'text-green-600' : req.status.homeroom === '반려됨' ? 'text-red-600' : 'text-yellow-600'}`}>{req.status.homeroom}</span>
                {req.status.homeroomApproverName && ` (by ${req.status.homeroomApproverName})`}
                </p>
              )}
              {role !== ROLES.SUBJECT && req.status?.subject && (
                <p>교과 승인: <span className={`font-semibold ${req.status.subject === '승인됨' ? 'text-green-600' : req.status.subject === '반려됨' ? 'text-red-600' : 'text-yellow-600'}`}>{req.status.subject}</span>
                {req.status.subjectApproverName && ` (by ${req.status.subjectApproverName})`}
                </p>
              )}
            </div>

            {/* 승인/반려 버튼 */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleApproval(req.id, '승인됨')}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                disabled={isLoading} // 처리 중 비활성화
              >
                승인
              </button>
              <button
                onClick={() => handleApproval(req.id, '반려됨')}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                disabled={isLoading} // 처리 중 비활성화
              >
                반려
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
