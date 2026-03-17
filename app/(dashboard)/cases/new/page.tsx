'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, Send } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ToothChart } from '@/components/ui/ToothChart';
import { CaseInputMethod } from '@/components/cases/CaseInputMethod';
import { RecipientSelector } from '@/components/cases/RecipientSelector';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';
import { PrepType, WhatNeeded, CaseInputMethod as InputMethodType } from '@/lib/types';

export default function NewCasePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { t } = useLanguage();

  // Form State
  const [patientName, setPatientName] = useState('');
  const [shade, setShade] = useState('');
  const [prepType, setPrepType] = useState<PrepType | ''>('');
  const [whatNeeded, setWhatNeeded] = useState<WhatNeeded>('crown');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [inputMethod, setInputMethod] = useState<InputMethodType>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  
  // Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prepTypeOptions = [
    { value: 'monolithic', label: 'Monolithic' },
    { value: 'layered', label: 'Layered' },
    { value: 'digital', label: 'Digital' },
    { value: 'traditional', label: 'Traditional' },
  ];

  const whatNeededOptions = [
    { value: 'crown', label: 'Crown' },
    { value: 'implant', label: 'Implant' },
    { value: 'denture', label: 'Denture' },
    { value: 'partial', label: 'Partial' },
    { value: 'nightguard', label: 'Nightguard' },
    { value: 'retainer', label: 'Retainer' },
    { value: 'custom', label: 'Custom' },
  ];

  const handleToggleTooth = (tooth: string) => {
    setSelectedTeeth(prev => 
      prev.includes(tooth) ? prev.filter(t => t !== tooth) : [...prev, tooth]
    );
  };

  const handleSelectArch = (arch: 'upper' | 'lower') => {
    const teeth = arch === 'upper' 
      ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16']
      : ['17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'];
    
    setSelectedTeeth(prev => {
      const otherArchTeeth = prev.filter(t => !teeth.includes(t));
      const allSelected = teeth.every(t => prev.includes(t));
      return allSelected ? otherArchTeeth : [...otherArchTeeth, ...teeth];
    });
  };

  const isFormValid = () => {
    return !!patientName.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('Please fill in all mandatory fields (Shade and Prep Type are required)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Prepare case data
      const caseData = {
        patientName,
        caseId: `CS-${Math.floor(1000 + Math.random() * 9000)}`,
        caseType: whatNeeded,
        shade,
        prep_type: prepType,
        what_needed: whatNeeded,
        status: 'submitted',
        dueDate,
        dentistId: profile?.id,
        dentistName: profile?.full_name || 'Unknown Dentist',
        labId: profile?.lab_id,
        notes,
        teeth_numbers: selectedTeeth,
        input_method: inputMethod,
        recipient_id: recipientId || null,
        recipient_email: externalEmail || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 2. Send Webhook Notification DIRECTLY (Bypassing Supabase insertion for now)
      const webhookPayload = {
        ...caseData,
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      };

      try {
        console.log('[Submission] Sending direct webhook to n8n...');
        const response = await fetch('https://n8n-3shape-connection.onrender.com/webhook/b3a50e39-3352-45aa-9ec7-bc544489700c', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });
        
        if (!response.ok) {
          throw new Error(`Webhook failed with status: ${response.status}`);
        }
        
        console.log('[Submission] Webhook sent successfully');
        router.push('/dashboard');
      } catch (webhookErr: any) {
        console.error('[Submission] Failed to send webhook:', webhookErr);
        setError(`Webhook submission failed: ${webhookErr.message}`);
      }
    } catch (err: any) {
      console.error('Error in submission flow:', err);
      setError(err.message || 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('cases.newCaseTitle')}</h1>
        <p className="mt-2 text-slate-500">
          {t('cases.newCaseSubtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
          <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic & Clinical Information */}
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <h2 className="text-lg font-bold text-slate-800">{t('cases.clinicalDetails')}</h2>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('cases.patientLabel')}
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder={t('cases.patientPlaceholder')}
              />
              <Input
                label={t('cases.dueDateLabel')}
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label={t('cases.shadeLabelRequired')}
                required
                value={shade}
                onChange={(e) => setShade(e.target.value)}
                placeholder={t('cases.shadePlaceholder')}
                className="border-blue-100 focus:border-blue-500"
              />
              <Select
                label={t('cases.prepTypeLabelRequired')}
                options={prepTypeOptions}
                value={prepType}
                onChange={(e) => setPrepType(e.target.value as PrepType)}
                className="border-blue-100"
              />
              <Select
                label={t('cases.whatNeededLabel')}
                options={whatNeededOptions}
                value={whatNeeded}
                onChange={(e) => setWhatNeeded(e.target.value as WhatNeeded)}
              />
            </div>
            
            <Textarea
              label={t('cases.instructionsLabel')}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('cases.instructionsPlaceholder')}
            />
          </CardContent>
        </Card>

        {/* Section 2: Tooth Selection */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <ToothChart 
              selectedTeeth={selectedTeeth} 
              onToggleTooth={handleToggleTooth} 
              onSelectArch={handleSelectArch} 
            />
          </CardContent>
        </Card>

        {/* Section 3: Logistic / Input Method */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <CaseInputMethod 
              method={inputMethod} 
              setMethod={setInputMethod} 
              files={files} 
              onFilesChange={setFiles} 
            />
          </CardContent>
        </Card>

        {/* Section 4: Recipient Selection */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <RecipientSelector 
              recipientId={recipientId} 
              setRecipientId={setRecipientId} 
              externalEmail={externalEmail} 
              setExternalEmail={setExternalEmail} 
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-8 mt-8">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/dashboard')}
            className="flex items-center"
          >
            {t('common.back')}
          </Button>
          
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="secondary"
              className="flex items-center"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {t('cases.saveDraft')}
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className={`flex items-center px-8 ${!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubmitting || !isFormValid()}
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('cases.submitCase')}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
