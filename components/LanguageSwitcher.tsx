'use client';

import React from 'react';
import { useLanguage } from './providers/LanguageProvider';
import { Button } from './ui/Button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-slate-500" />
      <div className="flex p-1 bg-slate-100 rounded-md">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
            language === 'en'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('common.english')}
        </button>
        <button
          onClick={() => setLanguage('zh')}
          className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
            language === 'zh'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('common.mandarin')}
        </button>
      </div>
    </div>
  );
}
