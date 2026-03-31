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
import { RecipientSelector } from '@/components/cases/RecipientSelector';
import { CaseInputMethod } from '@/components/cases/CaseInputMethod';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { getLabServices } from '@/lib/services';
import { PrepType, WhatNeeded, CaseInputMethod as InputMethodType } from '@/lib/types';

export default function NewCasePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { t } = useLanguage();

  // Services State
  const [services, setServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoading] = useState(false);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [shade, setShade] = useState('');
  const [prepType, setPrepType] = useState<PrepType | ''>('');
  const [whatNeeded, setWhatNeeded] = useState<WhatNeeded | string>('crown');
  const [price, setPrice] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [inputMethod, setInputMethod] = useState<InputMethodType>('upload');
  const [recipientId, setRecipientId] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  
  // Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch lab services on mount
  React.useEffect(() => {
    async function loadServices() {
      if (profile?.lab_id) {
        setIsLoading(true);
        try {
          const data = await getLabServices(profile.lab_id);
          setServices(data || []);
        } catch (err) {
          console.error('Error loading services:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadServices();
  }, [profile?.lab_id]);

  const prepTypeOptions = [
    { value: 'monolithic', label: 'Monolithic' },
    { value: 'layered', label: 'Layered' },
    { value: 'digital', label: 'Digital' },
    { value: 'traditional', label: 'Traditional' },
  ];

  const defaultWhatNeededOptions = [
    { value: 'crown', label: 'Crown' },
    { value: 'implant', label: 'Implant' },
    { value: 'denture', label: 'Denture' },
    { value: 'partial', label: 'Partial' },
    { value: 'nightguard', label: 'Nightguard' },
    { value: 'retainer', label: 'Retainer' },
    { value: 'custom', label: 'Custom' },
  ];

  // Dynamic whatNeeded options
  const whatNeededOptions = services.length > 0 
    ? services.map(s => ({ value: s.id, label: s.name }))
    : defaultWhatNeededOptions;

  const handleWhatNeededChange = (value: string) => {
    setWhatNeeded(value);
    
    // Auto-price logic
    const selectedService = services.find(s => s.id === value);
    if (selectedService) {
      setPrice(selectedService.base_price.toString());
    }
  };

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
      setError('Please fill in all mandatory fields (Patient Name is required)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Prepare case data
      const caseData = {
        patientName,
        caseId: `CS-${Math.floor(1000 + Math.random() * 9000)}`,
        caseType: services.find(s => s.id === whatNeeded)?.name || whatNeeded,
        shade,
        price: parseFloat(price) || null,
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

      // 2. Build multipart/form-data and proxy through /api/cases/submit
      //    This sends actual file binaries (not just metadata) to the n8n webhook
      //    server-side to avoid CORS restrictions.
      const formData = new FormData();

      // Append all case fields as strings
      Object.entries(caseData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
        }
      });

      // Append actual file binaries
      files.forEach((file) => {
        formData.append('files', file, file.name);
      });

      try {
        console.log('[Submission] Sending multipart payload to proxy route...');
        const response = await fetch('/api/cases/submit', {
          method: 'POST',
          body: formData,
          // Do NOT set Content-Type — browser sets it automatically with the correct boundary
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Submission failed with status: ${response.status}`);
        }

        console.log('[Submission] Case submitted successfully with files');
        router.push('/dashboard');
      } catch (webhookErr: any) {
        console.error('[Submission] Failed to submit case:', webhookErr);
        setError(`Submission failed: ${webhookErr.message}`);
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input
                  label={t('cases.shadeLabel')}
                  value={shade}
                  onChange={(e) => setShade(e.target.value)}
                  placeholder={t('cases.shadePlaceholder')}
                />
                <Select
                  label={t('cases.prepTypeLabel')}
                  options={[{ value: '', label: '—' }, ...prepTypeOptions]}
                  value={prepType}
                  onChange={(e) => setPrepType(e.target.value as PrepType)}
                />
                <Select
                  label={t('cases.whatNeededLabel')}
                  options={whatNeededOptions}
                  value={whatNeeded}
                  onChange={(e) => handleWhatNeededChange(e.target.value)}
                />
                <Input
                  label={t('cases.priceLabel')}
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="border-blue-50"
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

        {/* Section 3: File Upload */}
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
