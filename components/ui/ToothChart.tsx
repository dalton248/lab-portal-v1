'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface ToothChartProps {
  selectedTeeth: string[];
  onToggleTooth: (tooth: string) => void;
  onSelectArch: (arch: 'upper' | 'lower') => void;
  disabled?: boolean;
}

export const ToothChart: React.FC<ToothChartProps> = ({
  selectedTeeth,
  onToggleTooth,
  onSelectArch,
  disabled = false,
}) => {
  const { t } = useLanguage();

  // Simple representation for now, can be expanded with SVG paths
  const upperTeeth = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
  const lowerTeeth = ['17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'];

  const isSelected = (tooth: string) => selectedTeeth.includes(tooth);

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-slate-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-slate-900">{t('cases.toothSelectionTitle')}</h3>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => !disabled && onSelectArch('upper')}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              disabled 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {t('cases.upperArch')}
          </button>
          <button
            type="button"
            onClick={() => !disabled && onSelectArch('lower')}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              disabled 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {t('cases.lowerArch')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2 mb-4">
        {upperTeeth.map((tooth) => (
          <button
            key={tooth}
            type="button"
            onClick={() => !disabled && onToggleTooth(tooth)}
            disabled={disabled}
            className={`
              h-10 w-10 flex items-center justify-center rounded border text-xs font-bold transition-all
              ${isSelected(tooth) 
                ? 'bg-blue-600 border-blue-700 text-white transform scale-105 shadow-md' 
                : disabled
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'}
            `}
          >
            {tooth}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-8 gap-2">
        {lowerTeeth.map((tooth) => (
          <button
            key={tooth}
            type="button"
            onClick={() => !disabled && onToggleTooth(tooth)}
            disabled={disabled}
            className={`
              h-10 w-10 flex items-center justify-center rounded border text-xs font-bold transition-all
              ${isSelected(tooth) 
                ? 'bg-blue-600 border-blue-700 text-white transform scale-105 shadow-md' 
                : disabled
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'}
            `}
          >
            {tooth}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-xs text-slate-500">
          {t('cases.selectTeeth')}: {selectedTeeth.length > 0 ? selectedTeeth.sort((a,b) => parseInt(a)-parseInt(b)).join(', ') : 'None'}
        </p>
      </div>
    </div>
  );
};
