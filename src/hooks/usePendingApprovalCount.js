// src/hooks/usePendingApprovalCount.js
// 오늘 날짜 visits 컬렉션을 실시간 구독해 role 기준 승인 대기 건수를 계산한다.
// 담임: 본인 반 기준 개인화된 건수 / 교과: 시간표 데이터가 없어 학교 전체 미승인 건수.

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { isPendingHomeroom, isPendingSubject } from '../utils/visitFilters';

export function usePendingApprovalCount(role, userInfo) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (role !== 'homeroom' && role !== 'subject') {
      setCount(0);
      return;
    }

    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const q = query(
      collection(db, 'visits'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end))
    );

    const unsubscribe = onSnapshot(q, snap => {
      const items = snap.docs.map(d => d.data());
      const n = role === 'homeroom'
        ? items.filter(item => isPendingHomeroom(item, userInfo)).length
        : items.filter(isPendingSubject).length;
      setCount(n);
    });

    return unsubscribe;
  }, [role, userInfo]);

  return count;
}
