// src/pages/TeacherManagementPage.jsx
// 관리자 전용: 등록된 교사 명단 조회 및 전출 교사 삭제
// 주의: Firestore의 users 문서만 삭제되며 Google 로그인 자체는 막지 못한다.
// 삭제된 교사가 다시 로그인하면 RoleRegisterForm을 통해 재등록될 수 있다.

import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

const ROLE_LABELS = {
  homeroom: '담임교사',
  subject: '교과교사',
  nurse: '보건교사',
  counselor: '상담교사',
  welfare: '교육복지사',
  gatekeeper: '정문관리자',
};

export default function TeacherManagementPage({ currentUid }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
      setTeachers(list);
    } catch (err) {
      console.error('교사 명단 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleDelete = async teacher => {
    if (
      !window.confirm(
        `${teacher.name}(${teacher.email}) 선생님을 명단에서 삭제할까요?\n` +
        `Google 로그인 자체는 막을 수 없어, 다시 로그인하면 재등록될 수 있습니다.`
      )
    ) return;
    try {
      await deleteDoc(doc(db, 'users', teacher.id));
      setTeachers(prev => prev.filter(t => t.id !== teacher.id));
    } catch (err) {
      console.error('교사 삭제 오류:', err);
      alert('❌ 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-2 text-center">교사 관리</h2>
      <p className="text-xs text-gray-500 text-center mb-4">
        전출 등으로 더 이상 사용하지 않는 계정을 명단에서 제거합니다. (Google 로그인 자체는 막지 않습니다)
      </p>

      {loading ? (
        <p className="text-center text-sm text-gray-500">불러오는 중...</p>
      ) : teachers.length === 0 ? (
        <p className="text-center text-sm text-gray-500">등록된 교사가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {teachers.map(t => {
            const isSelf = t.id === currentUid;
            const roleLabel = ROLE_LABELS[t.role] || t.role || '역할 미지정';
            const classInfo = t.role === 'homeroom' && t.grade && t.class
              ? ` · ${t.grade}학년 ${t.class}반`
              : '';
            return (
              <li key={t.id} className="bg-white shadow rounded-xl p-3 text-sm flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {t.name} {isSelf && <span className="text-xs text-blue-500">(본인)</span>}
                  </div>
                  <div className="text-gray-600 text-xs">
                    {t.email} · {roleLabel}{classInfo}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(t)}
                  disabled={isSelf}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-300 text-xs px-2 py-1 border border-red-200 disabled:border-gray-200 rounded shrink-0"
                >
                  삭제
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
