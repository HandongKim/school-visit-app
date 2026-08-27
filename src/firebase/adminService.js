// src/firebase/adminService.js
// 단일 관리자(meta/admin) 조회·이양 및 새학년 초기화(위험 동작) 관련 헬퍼

import { db } from './firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

// 최초 배포 시 관리자가 아무도 없을 때 자동으로 관리자가 되는 계정
const BOOTSTRAP_ADMIN_EMAIL = 'escafllowne@gmail.com';

const adminDocRef = () => doc(db, 'meta', 'admin');

// meta/admin 문서를 조회. 없고 로그인한 사용자가 부트스트랩 계정이면 자동 등록.
export async function loadOrBootstrapAdmin(firebaseUser) {
  const ref = adminDocRef();
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  if (firebaseUser?.email === BOOTSTRAP_ADMIN_EMAIL) {
    const data = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || '관리자',
      updatedAt: new Date(),
    };
    await setDoc(ref, data);
    return data;
  }
  return null;
}

// 관리자 권한을 다른 사용자에게 이양 (단일 관리자 모델 - 기존 관리자는 자동 해제됨)
export async function transferAdmin(newEmail) {
  const snap = await getDocs(
    query(collection(db, 'users'), where('email', '==', newEmail))
  );
  if (snap.empty) {
    throw new Error('해당 이메일로 등록된 사용자를 찾을 수 없습니다. 먼저 앱에 로그인/역할 등록이 되어 있어야 합니다.');
  }
  const target = snap.docs[0].data();
  const data = {
    uid: target.uid,
    email: target.email,
    name: target.name || '관리자',
    updatedAt: new Date(),
  };
  await setDoc(adminDocRef(), data);
  return data;
}

// Firestore 배치 삭제 한도(500) 회피를 위해 청크 단위로 커밋
async function deleteInBatches(docRefs) {
  const CHUNK = 400;
  for (let i = 0; i < docRefs.length; i += CHUNK) {
    const batch = writeBatch(db);
    docRefs.slice(i, i + CHUNK).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

async function deleteCollectionAll(collRef) {
  const snap = await getDocs(collRef);
  await deleteInBatches(snap.docs.map(d => d.ref));
  return snap.size;
}

// 방문/조퇴/외출/출결 기록 전체 삭제 (학생 명단·계정 role은 유지)
export async function resetVisitRecords() {
  const visitsCount = await deleteCollectionAll(collection(db, 'visits'));
  const leavesCount = await deleteCollectionAll(collection(db, 'leaves'));

  // attendanceSessions/{sid}/entries/* : 상위 세션 문서는 setDoc된 적이 없어
  // collection(db,'attendanceSessions')로는 목록을 알 수 없으므로 collectionGroup으로 탐색
  const entriesSnap = await getDocs(collectionGroup(db, 'entries'));
  await deleteInBatches(entriesSnap.docs.map(d => d.ref));

  // attendance/{date}/{grade}_{class}/* : 날짜 문서도 setDoc된 적이 없어
  // grade(1-3) x class(1-5) 조합의 collectionGroup으로 탐색
  let attendanceCount = 0;
  for (let g = 1; g <= 3; g++) {
    for (let c = 1; c <= 5; c++) {
      const snap = await getDocs(collectionGroup(db, `${g}_${c}`));
      await deleteInBatches(snap.docs.map(d => d.ref));
      attendanceCount += snap.size;
    }
  }

  return {
    visits: visitsCount,
    leaves: leavesCount,
    attendanceSessionEntries: entriesSnap.size,
    attendance: attendanceCount,
  };
}

// 학생 명단 전체 삭제 (students/{grade}/{class}/*)
export async function resetStudentRoster() {
  let total = 0;
  for (let g = 1; g <= 3; g++) {
    for (let c = 1; c <= 5; c++) {
      total += await deleteCollectionAll(collection(db, 'students', String(g), String(c)));
    }
  }
  return total;
}
