// d:\school-visit-app\src\pages\AdminStudentUpload.jsx

import React, { useState } from 'react';
import { db } from '../firebase/firebaseConfig'; // Firebase Firestore 인스턴스 임포트
import { collection, doc, writeBatch, getDocs, query, deleteDoc } from 'firebase/firestore'; // Firestore 함수 임포트
import Papa from 'papaparse'; // CSV 파싱 라이브러리

/**
 * @file AdminStudentUpload.jsx
 * @description (관리자용) CSV 파일을 통해 학생 명단 정보를 Firestore에 일괄 업로드하거나,
 * 특정 학년/반의 학생 정보를 삭제하는 기능을 제공하는 페이지 컴포넌트입니다.
 * CSV 파일 형식: 학년,반,번호,이름 (예: 1,1,1,김철수)
 */

/**
 * AdminStudentUpload 컴포넌트
 * @returns {JSX.Element} 학생 정보 업로드/삭제 관리 페이지 UI
 */
export default function AdminStudentUpload() {
  // 업로드할 CSV 파일을 저장하는 상태입니다.
  const [csvFile, setCsvFile] = useState(null);
  // 업로드 진행 상태 메시지를 저장하는 상태입니다.
  const [uploadStatus, setUploadStatus] = useState('');
  // 로딩 상태 (업로드/삭제 중일 때 true)
  const [isLoading, setIsLoading] = useState(false);

  // 학생 정보 삭제를 위한 학년, 반 선택 상태
  const [deleteGrade, setDeleteGrade] = useState('');
  const [deleteClassNum, setDeleteClassNum] = useState('');
  // 삭제 진행 상태 메시지
  const [deleteStatus, setDeleteStatus] = useState('');


  /**
   * 파일 입력 변경 시 호출되는 핸들러 함수입니다.
   * @param {React.ChangeEvent<HTMLInputElement>} event - 파일 입력 변경 이벤트 객체
   */
  const handleFileChange = (event) => {
    setCsvFile(event.target.files[0]); // 선택된 첫 번째 파일을 상태에 저장
    setUploadStatus(''); // 이전 상태 메시지 초기화
  };

  /**
   * CSV 파일 업로드 및 Firestore 저장을 처리하는 비동기 함수입니다.
   */
  const handleFileUpload = async () => {
    if (!csvFile) {
      setUploadStatus('업로드할 CSV 파일을 선택해주세요.');
      return;
    }
    setIsLoading(true);
    setUploadStatus('CSV 파일을 처리 중입니다...');

    // PapaParse를 사용하여 CSV 파일 파싱
    Papa.parse(csvFile, {
      header: true, // 첫 번째 행을 헤더로 인식
      skipEmptyLines: true, // 빈 줄은 건너뜀
      complete: async (results) => {
        const studentsData = results.data; // 파싱된 데이터 배열
        if (studentsData.length === 0) {
          setUploadStatus('CSV 파일에 데이터가 없거나 형식이 올바르지 않습니다.');
          setIsLoading(false);
          return;
        }

        // Firestore에 일괄 쓰기를 위한 Batch 객체 생성
        const batch = writeBatch(db);
        let studentCount = 0;

        try {
          studentsData.forEach(student => {
            // CSV 헤더 이름이 '학년', '반', '번호', '이름' 이라고 가정합니다.
            // 실제 CSV 파일의 헤더에 맞게 키 이름을 조정해야 합니다.
            const grade = student['학년']?.trim();
            const classNum = student['반']?.trim();
            const number = student['번호']?.trim();
            const name = student['이름']?.trim();

            // 필수 데이터 유효성 검사
            if (grade && classNum && name) {
              // 학생 문서 ID는 '학년-반-번호' 또는 고유 ID로 생성할 수 있습니다.
              // 여기서는 학년, 반을 경로로 사용하고, 학생 이름을 문서 ID로 사용하거나,
              // 또는 Firestore가 자동으로 ID를 생성하도록 할 수 있습니다.
              // 예제: 'students/{학년}/{반}/{학생이름}' 또는 'students/{학년}/{반}/{학번}'
              // 여기서는 학생 이름을 문서 ID로 사용 (동명이인 문제 발생 가능성 있음, 고유 ID 권장)
              // 또는 Firestore 자동 ID를 사용하고, 학번 등을 필드로 저장
              
              // Firestore 경로: students/{학년}/{반}/{학생문서ID}
              // 학생 문서 ID를 학번으로 사용하거나, 이름+번호 조합, 또는 Firestore 자동 ID 사용 가능
              // 이 예제에서는 학생 이름을 문서 ID로 사용 (주의: 동명이인 시 덮어쓰기 문제)
              // 더 나은 방법: 고유한 학생 ID (학번 등)를 문서 ID로 사용하거나, Firestore 자동 ID 사용
              const studentDocRef = doc(db, 'students', grade, classNum, name); // 예시 경로
              
              batch.set(studentDocRef, {
                name: name,
                number: number || null, // 번호가 없으면 null
                grade: grade,
                class: classNum,
                // 추가적인 학생 정보 필드들...
              });
              studentCount++;
            } else {
              console.warn('누락된 데이터가 있는 행:', student);
            }
          });

          if (studentCount === 0) {
            setUploadStatus('유효한 학생 데이터가 없습니다. CSV 파일 내용을 확인해주세요.');
            setIsLoading(false);
            return;
          }

          await batch.commit(); // Batch 작업 실행 (일괄 쓰기)
          setUploadStatus(`✅ ${studentCount}명의 학생 정보가 성공적으로 업로드되었습니다.`);
        } catch (error) {
          console.error("학생 정보 업로드 중 오류:", error);
          setUploadStatus(`❌ 학생 정보 업로드 중 오류가 발생했습니다: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        console.error("CSV 파싱 중 오류:", error);
        setUploadStatus(`❌ CSV 파일 파싱 중 오류가 발생했습니다: ${error.message}`);
        setIsLoading(false);
      }
    });
  };

  /**
   * 특정 학년/반의 모든 학생 정보를 Firestore에서 삭제하는 비동기 함수입니다.
   */
  const handleDeleteClassStudents = async () => {
    if (!deleteGrade || !deleteClassNum) {
      setDeleteStatus('삭제할 학년과 반을 모두 선택해주세요.');
      return;
    }
    // 사용자에게 삭제 확인을 받는 것이 좋습니다.
    if (!window.confirm(`${deleteGrade}학년 ${deleteClassNum}반 학생 정보를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsLoading(true);
    setDeleteStatus(` ${deleteGrade}학년 ${deleteClassNum}반 학생 정보 삭제 중...`);
    try {
      const studentsCollectionRef = collection(db, 'students', deleteGrade, deleteClassNum);
      const q = query(studentsCollectionRef);
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setDeleteStatus('삭제할 학생 정보가 없습니다.');
        setIsLoading(false);
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref); // 각 학생 문서를 batch에 삭제 작업으로 추가
      });

      await batch.commit(); // Batch 작업 실행 (일괄 삭제)
      setDeleteStatus(`✅ ${deleteGrade}학년 ${deleteClassNum}반의 ${querySnapshot.size}명 학생 정보가 삭제되었습니다.`);
      setDeleteGrade(''); // 선택 초기화
      setDeleteClassNum(''); // 선택 초기화
    } catch (error) {
      console.error("학생 정보 삭제 중 오류:", error);
      setDeleteStatus(`❌ 학생 정보 삭제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  // 학생 정보 업로드/삭제 관리 페이지 UI를 렌더링합니다.
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">학생 정보 일괄 관리 (관리자)</h1>

      {/* 학생 정보 업로드 섹션 */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">CSV로 학생 명단 업로드</h2>
        <p className="text-sm text-gray-600 mb-3">
          CSV 파일 형식: 첫 행은 헤더(학년,반,번호,이름 순서 권장), 이후 각 행에 학생 정보 입력.
        </p>
        <div className="mb-4">
          <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-1">CSV 파일 선택</label>
          <input
            type="file"
            id="csvFile"
            accept=".csv" // .csv 파일만 선택 가능하도록 제한
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          onClick={handleFileUpload}
          disabled={isLoading || !csvFile}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow disabled:bg-blue-300"
        >
          {isLoading && uploadStatus.includes('처리 중') ? '업로드 중...' : '선택한 파일 업로드'}
        </button>
        {uploadStatus && (
          <p className={`mt-3 text-sm ${uploadStatus.includes('오류') || uploadStatus.includes('없습니다') ? 'text-red-600' : 'text-green-600'}`}>
            {uploadStatus}
          </p>
        )}
      </div>

      {/* 특정 학급 학생 정보 삭제 섹션 */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">특정 학급 학생 정보 전체 삭제</h2>
        <p className="text-sm text-red-600 mb-3">
          주의: 이 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="deleteGrade" className="block text-sm font-medium text-gray-700">삭제할 학년</label>
            <select
              id="deleteGrade"
              value={deleteGrade}
              onChange={(e) => setDeleteGrade(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">학년 선택</option>
              {[1, 2, 3].map(g => <option key={g} value={String(g)}>{g}학년</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="deleteClassNum" className="block text-sm font-medium text-gray-700">삭제할 반</label>
            <select
              id="deleteClassNum"
              value={deleteClassNum}
              onChange={(e) => setDeleteClassNum(e.target.value)}
              disabled={!deleteGrade}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">반 선택</option>
              {[...Array(12)].map((_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}반</option>)}
            </select>
          </div>
          <div className="sm:self-end">
            <button
              onClick={handleDeleteClassStudents}
              disabled={isLoading || !deleteGrade || !deleteClassNum}
              className="w-full bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow disabled:bg-red-300"
            >
              {isLoading && deleteStatus.includes('삭제 중') ? '삭제 중...' : '선택 학급 정보 삭제'}
            </button>
          </div>
        </div>
        {deleteStatus && (
          <p className={`mt-3 text-sm ${deleteStatus.includes('오류') ? 'text-red-600' : 'text-green-600'}`}>
            {deleteStatus}
          </p>
        )}
      </div>
    </div>
  );
}
