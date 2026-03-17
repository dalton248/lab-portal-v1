'use client';

import React from 'react';
import { Upload, Truck, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface CaseInputMethodProps {
  method: 'upload' | 'pickup' | 'shipping';
  setMethod: (method: 'upload' | 'pickup' | 'shipping') => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const CaseInputMethod: React.FC<CaseInputMethodProps> = ({
  method,
  setMethod,
  files,
  onFilesChange,
}) => {
  const { t } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesChange([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">{t('cases.inputMethodTitle')}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setMethod('upload')}
          className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
            method === 'upload' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-opacity-10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Upload className={`h-8 w-8 mb-2 ${method === 'upload' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className={`text-sm font-medium ${method === 'upload' ? 'text-blue-700' : 'text-slate-600'}`}>
            {t('cases.uploadFiles')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('pickup')}
          className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
            method === 'pickup' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-opacity-10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Package className={`h-8 w-8 mb-2 ${method === 'pickup' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className={`text-sm font-medium ${method === 'pickup' ? 'text-blue-700' : 'text-slate-600'}`}>
            {t('cases.labPickup')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('shipping')}
          className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
            method === 'shipping' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-opacity-10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Truck className={`h-8 w-8 mb-2 ${method === 'shipping' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className={`text-sm font-medium ${method === 'shipping' ? 'text-blue-700' : 'text-slate-600'}`}>
            {t('cases.clinicShipping')}
          </span>
        </button>
      </div>

      {method === 'upload' && (
        <div className="mt-4 p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 transition-all hover:bg-white hover:border-blue-400">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="multi-file-upload"
          />
          <label htmlFor="multi-file-upload" className="cursor-pointer flex flex-col items-center">
            <Upload className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-900">{t('cases.dropFiles')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('cases.supports')}</p>
            <Button type="button" variant="secondary" className="mt-4">
              {t('cases.selectFiles')}
            </Button>
          </label>

          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white border rounded shadow-sm">
                  <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                  <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
