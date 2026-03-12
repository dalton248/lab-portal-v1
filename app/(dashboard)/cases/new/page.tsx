'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function NewCasePage() {
  const router = useRouter();
  const [patientName, setPatientName] = useState('');
  const [caseType, setCaseType] = useState('crown');
  const [shade, setShade] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const { t } = useLanguage();

  const caseTypeOptions = [
    { value: 'crown', label: t('caseTypes.crown') },
    { value: 'bridge', label: t('caseTypes.bridge') },
    { value: 'denture', label: t('caseTypes.denture') },
    { value: 'implant', label: t('caseTypes.implant') },
    { value: 'veneer', label: t('caseTypes.veneer') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  const handleSaveDraft = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('cases.newCaseTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('cases.newCaseSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">{t('cases.infoTitle')}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t('cases.patientLabel')}
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder={t('cases.patientPlaceholder')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('cases.typeLabel')}
                options={caseTypeOptions}
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
              />

              <Input
                label={t('cases.shadeLabel')}
                type="text"
                value={shade}
                onChange={(e) => setShade(e.target.value)}
                placeholder={t('cases.shadePlaceholder')}
              />
            </div>

            <Input
              label={t('cases.dueDateLabel')}
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <Textarea
              label={t('cases.instructionsLabel')}
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('cases.instructionsPlaceholder')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">{t('cases.filesTitle')}</h2>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-slate-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-900">
                {t('cases.dropFiles')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t('cases.supports')}
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="mt-4 inline-flex cursor-pointer"
              >
                <Button type="button" variant="secondary">
                  {t('cases.selectFiles')}
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveDraft}
          >
            {t('cases.saveDraft')}
          </Button>
          <Button type="submit" variant="primary">
            {t('cases.submitCase')}
          </Button>
        </div>
      </form>
    </div>
  );
}
