// src/components/ui/ReasonPresetChips.jsx
// 방문 유형(type)별 자주 쓰는 사유를 pill 버튼으로 보여주고 선택 시 값을 채워준다.
// '기타' 선택 시에는 입력칸을 비워 직접 입력을 유도한다.

import React from 'react';
import { REASON_PRESETS } from '../../utils/reasonPresets';

export default function ReasonPresetChips({ type, value, onSelect }) {
  const presets = REASON_PRESETS[type];
  if (!presets || presets.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map(preset => {
        const isOther = preset === '기타';
        const active = !isOther && value === preset;
        return (
          <button
            type="button"
            key={preset}
            onClick={() => onSelect(isOther ? '' : preset)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              active
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {preset}
          </button>
        );
      })}
    </div>
  );
}
