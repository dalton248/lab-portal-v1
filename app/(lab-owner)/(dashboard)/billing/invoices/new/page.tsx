'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, Send, FileText, Plus, ShoppingCart, Trash2, User, CreditCard, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ToothChart } from '@/components/ui/ToothChart';
import { PatientSearch } from '@/components/cases/PatientSearch';
import { RecipientSelector } from '@/components/cases/RecipientSelector';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { getLabServices } from '@/lib/services';
import { PrepType, WhatNeeded } from '@/lib/types';

interface LineItem {
  id: string;
  serviceId: string;
  serviceName: string;
  prepType: string;
  teeth: string[];
  basePrice: number;
  totalPrice: number;
  notes?: string;
  patientName?: string;
  caseId?: string;
}

export default function InvoiceGeneratorPage() {
  const router = useRouter();
  const { profile, session } = useAuth();
  const { t } = useLanguage();

  // Services State
  const [services, setServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoading] = useState(false);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [prepType, setPrepType] = useState<PrepType | ''>('');
  const [whatNeeded, setWhatNeeded] = useState<WhatNeeded | string>('crown');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [price, setPrice] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [offices, setOffices] = useState<any[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  
  // Unpaid Cases & Payments States
  const [unpaidCases, setUnpaidCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [markAsPaid, setMarkAsPaid] = useState<boolean>(false);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(false);

  // Available unpaid cases that haven't been added to the invoice yet
  const availableUnpaidCases = unpaidCases.filter(
    (c) => !lineItems.some((item) => item.caseId === c.id)
  );
  
  // Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to select and auto-populate a case's data
  const selectCase = (caseObj: any) => {
    if (!caseObj) {
      setSelectedCaseId('');
      setSelectedCase(null);
      setPrepType('traditional');
      setSelectedTeeth([]);
      setNotes('');
      if (services.length > 0) {
        setWhatNeeded(services[0].id);
        setBasePrice(Number(services[0].base_price));
        setPrice(Number(services[0].base_price).toFixed(2));
      } else {
        setWhatNeeded('crown');
        setPrice('0');
        setBasePrice(0);
      }
      return;
    }
    setSelectedCaseId(caseObj.id);
    setSelectedCase(caseObj);
    
    let parsedLineItems: LineItem[] = [];
    if (caseObj.line_items) {
      try {
        parsedLineItems = Array.isArray(caseObj.line_items)
          ? (caseObj.line_items as any[])
          : JSON.parse(caseObj.line_items as string);
      } catch (e) {
        console.error('Error parsing line items JSON:', e);
      }
    }
    if (!parsedLineItems || parsedLineItems.length === 0) {
      // Derive
      const derivedTeeth = caseObj.UNN && caseObj.UNN !== 'N/A'
        ? caseObj.UNN.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
      const derivedBasePrice = caseObj.price !== null && caseObj.price !== undefined
        ? Number(caseObj.price) / (derivedTeeth.length || 1)
        : 0;
      parsedLineItems = [{
        id: `derived-${caseObj.id}`,
        serviceId: 'custom',
        serviceName: caseObj.Type || 'Dental Service',
        prepType: 'traditional',
        teeth: derivedTeeth,
        basePrice: derivedBasePrice,
        totalPrice: caseObj.price !== null ? Number(caseObj.price) : 0,
        notes: caseObj.hold_reason || ''
      }];
    }

    const mainItem = parsedLineItems[0];
    if (mainItem) {
      setPrepType((mainItem.prepType as PrepType) || 'traditional');
      setPrice(String(mainItem.totalPrice));
      setBasePrice(Number(mainItem.basePrice));
      setSelectedTeeth(mainItem.teeth || []);
      setNotes(mainItem.notes || caseObj.hold_reason || '');
      setWhatNeeded(mainItem.serviceId || 'crown');
    } else {
      setPrepType('traditional');
      setPrice(caseObj.price !== null ? String(caseObj.price) : '0');
      setBasePrice(caseObj.price !== null ? Number(caseObj.price) : 0);
      setSelectedTeeth([]);
      setNotes(caseObj.hold_reason || '');
    }
  };

  const autoSelectNextCase = (currentLineItems: LineItem[], currentUnpaidCases: any[]) => {
    const nextCase = currentUnpaidCases.find(c => !currentLineItems.some(item => item.caseId === c.id));
    if (nextCase) {
      selectCase(nextCase);
    } else {
      selectCase(null);
    }
  };

  const addSelectedCaseToInvoice = () => {
    if (!selectedCase) return;

    let parsedLineItems: LineItem[] = [];
    if (selectedCase.line_items) {
      try {
        parsedLineItems = Array.isArray(selectedCase.line_items)
          ? (selectedCase.line_items as any[])
          : JSON.parse(selectedCase.line_items as string);
      } catch (e) {
        console.error('Error parsing line items JSON:', e);
      }
    }

    if (!parsedLineItems || parsedLineItems.length === 0) {
      // Derive
      const derivedTeeth = selectedCase.UNN && selectedCase.UNN !== 'N/A'
        ? selectedCase.UNN.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
      const derivedBasePrice = selectedCase.price !== null && selectedCase.price !== undefined
        ? Number(selectedCase.price) / (derivedTeeth.length || 1)
        : 0;
      parsedLineItems = [{
        id: `derived-${selectedCase.id}`,
        serviceId: whatNeeded,
        serviceName: services.find(s => s.id === whatNeeded)?.name || selectedCase.Type || 'Dental Service',
        prepType: prepType || 'traditional',
        teeth: derivedTeeth,
        basePrice: derivedBasePrice,
        totalPrice: selectedCase.price !== null ? Number(selectedCase.price) : 0,
        notes: notes || selectedCase.hold_reason || ''
      }];
    }

    // Attach patientName and caseId to each line item
    const itemsWithPatient = parsedLineItems.map(item => ({
      ...item,
      patientName: selectedCase.FirstName_LastName,
      caseId: selectedCase.id
    }));

    const nextLineItems = [...lineItems, ...itemsWithPatient];
    setLineItems(nextLineItems);

    // Append to the invoice patientName field
    setPatientName(prev => {
      const currentNames = prev.split(',').map(n => n.trim()).filter(Boolean);
      if (!currentNames.includes(selectedCase.FirstName_LastName)) {
        currentNames.push(selectedCase.FirstName_LastName);
      }
      return currentNames.join(', ');
    });

    // Clear selection so they can add another case
    setSelectedCaseId('');
    setSelectedCase(null);

    // Reset item form inputs
    setPrepType('traditional');
    setSelectedTeeth([]);
    setNotes('');
    if (services.length > 0) {
      setWhatNeeded(services[0].id);
      setBasePrice(Number(services[0].base_price));
      setPrice(Number(services[0].base_price).toFixed(2));
    } else {
      setWhatNeeded('crown');
      setPrice('0');
      setBasePrice(0);
    }

    // Auto-select the next available case
    autoSelectNextCase(nextLineItems, unpaidCases);
  };

  // Fetch lab services on mount
  React.useEffect(() => {
    async function loadServices() {
      if (profile?.lab_id) {
        setIsLoading(true);
        try {
          const data = await getLabServices(profile.lab_id);
          setServices(data || []);
          if (data && data.length > 0 && !selectedCaseId) {
            setWhatNeeded(data[0].id);
            setBasePrice(Number(data[0].base_price));
            setPrice(Number(data[0].base_price).toFixed(2));
          }
        } catch (err) {
          console.error('Error loading services:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadServices();
  }, [profile?.lab_id, selectedCaseId]);

  // Sync whatNeeded and prepType when selectedCase or services load
  React.useEffect(() => {
    if (selectedCase && services.length > 0) {
      const matchedService = services.find(s => s.name.toLowerCase() === (selectedCase.Type || '').toLowerCase());
      if (matchedService) {
        setWhatNeeded(matchedService.id);
      } else {
        setWhatNeeded(selectedCase.Type || 'custom');
      }
    }
  }, [selectedCase, services]);

  // Fetch offices on mount (dependent on session auth)
  React.useEffect(() => {
    async function loadOffices() {
      if (!session) return;
      try {
        const response = await fetch('/api/offices', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setOffices(data);
          
          // Read query parameters
          const params = new URLSearchParams(window.location.search);
          const qDentistId = params.get('dentist_id');
          const qOfficeId = params.get('office_id');
          const qPatient = params.get('patient_name');
          const qCaseId = params.get('case_id');
          
          if (qPatient) {
            setPatientName(qPatient);
          }
          
          if (qDentistId) {
            const matchedOffice = data.find((o: any) => o.user_id === qDentistId);
            if (matchedOffice) {
              setSelectedOfficeId(matchedOffice.id);
              setRecipientId(qDentistId);
            }
          } else if (qOfficeId) {
            const matchedOffice = data.find((o: any) => o.id === qOfficeId);
            if (matchedOffice) {
              setSelectedOfficeId(matchedOffice.id);
              setRecipientId(matchedOffice.user_id);
            }
          }

          if (qCaseId) {
            const { data: cData, error: cErr } = await supabase
              .from('Cases')
              .select('*')
              .eq('id', qCaseId)
              .single();
            if (cData && !cErr) {
              const matchedOffice = data.find((o: any) => o.user_id === cData.dentist_id);
              if (matchedOffice) {
                setSelectedOfficeId(matchedOffice.id);
                setRecipientId(cData.dentist_id);
              }
              selectCase(cData);
            }
          }
        }
      } catch (err) {
        console.error('Error loading offices:', err);
      }
    }
    loadOffices();
  }, [session]);

  // Fetch unpaid cases when recipientId changes
  React.useEffect(() => {
    async function loadUnpaidCases() {
      if (!recipientId || !profile?.lab_id) {
        setUnpaidCases([]);
        return;
      }
      setIsLoadingCases(true);
      try {
        // 1. Fetch cases for the selected dentist and lab
        const { data: casesData, error: casesError } = await supabase
          .from('Cases')
          .select('*')
          .eq('dentist_id', recipientId)
          .eq('lab_id', profile.lab_id);

        if (casesError) throw casesError;

        if (!casesData || casesData.length === 0) {
          setUnpaidCases([]);
          return;
        }

        // 2. Fetch payments for those cases to find which ones are already paid
        const caseIds = casesData.map(c => c.id);
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('Payments')
          .select('case_id')
          .in('case_id', caseIds);

        if (paymentsError) throw paymentsError;

        const paidCaseIds = new Set(paymentsData?.map(p => p.case_id) || []);

        // 3. Filter cases to include only unpaid ones
        const unpaid = casesData.filter(c => !paidCaseIds.has(c.id));
        setUnpaidCases(unpaid);
        
        // Auto-select the first unpaid case if none is selected
        autoSelectNextCase(lineItems, unpaid);
      } catch (err: any) {
        console.error('Error loading unpaid cases:', err);
        setError(err.message || 'Failed to load unpaid cases');
      } finally {
        setIsLoadingCases(false);
      }
    }

    loadUnpaidCases();
  }, [recipientId, profile?.lab_id, selectedCaseId]);

  const handleOfficeChange = (officeId: string) => {
    setSelectedOfficeId(officeId);
    setPatientName('');
    setLineItems([]);
    selectCase(null);
    const office = offices.find(o => o.id === officeId);
    if (office) {
      setRecipientId(office.user_id); // dentist_id is user_id
    } else {
      setRecipientId('');
    }
  };

  const handleCaseChange = (caseId: string) => {
    if (!caseId) {
      selectCase(null);
      return;
    }
    const caseObj = unpaidCases.find(c => c.id === caseId);
    selectCase(caseObj);
  };

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
    const selectedService = services.find(s => s.id === value);
    if (selectedService) {
      const bPrice = Number(selectedService.base_price);
      setBasePrice(bPrice);
      updateCalculatedPrice(bPrice, selectedTeeth);
    }
  };

  const updateCalculatedPrice = (bPrice: number, teeth: string[]) => {
    const multiplier = teeth.length > 0 ? teeth.length : 1;
    setPrice((bPrice * multiplier).toFixed(2));
  };

  const handleToggleTooth = (tooth: string) => {
    setSelectedTeeth(prev => {
      const next = prev.includes(tooth) ? prev.filter(t => t !== tooth) : [...prev, tooth];
      updateCalculatedPrice(basePrice, next);
      return next;
    });
  };

  const handleSelectArch = (arch: 'upper' | 'lower') => {
    const teeth = arch === 'upper' 
      ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16']
      : ['17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'];
    
    setSelectedTeeth(prev => {
      const otherArchTeeth = prev.filter(t => !teeth.includes(t));
      const allSelected = teeth.every(t => prev.includes(t));
      const next = allSelected ? otherArchTeeth : [...otherArchTeeth, ...teeth];
      updateCalculatedPrice(basePrice, next);
      return next;
    });
  };

  const addToInvoice = () => {
    const serviceName = services.find(s => s.id === whatNeeded)?.name || whatNeeded;
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId: whatNeeded,
      serviceName,
      prepType,
      teeth: [...selectedTeeth],
      basePrice,
      totalPrice: Number(price),
      notes
    };

    setLineItems([...lineItems, newItem]);
    
    // Reset item form
    setWhatNeeded('crown');
    setPrepType('');
    setSelectedTeeth([]);
    setPrice('0');
    setBasePrice(0);
    setNotes('');
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const grandTotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const isFormValid = () => {
    return !!patientName.trim() && lineItems.length > 0 && !!selectedOfficeId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('Please select an office, enter a patient name, and add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const invoiceData = {
        patientName,
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        items: lineItems,
        totalAmount: grandTotal,
        labId: profile?.lab_id,
        dentistId: recipientId || profile?.id,
        officeId: selectedOfficeId || null,
        markAsPaid,
      };

      console.log('[Invoice Generator] Calling /api/invoices/create...');
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Submission failed with status: ${response.status}`);
      }

      const responseData = await response.json();
      const invoiceId = responseData.invoiceId;
      console.log('[Invoice Generator] Invoice generated successfully:', invoiceId);

      router.push(`/billing/invoices/print?invoice_id=${invoiceId}`);
    } catch (err: any) {
      console.error('Error in invoice generation flow:', err);
      setError(err.message || 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="max-w-[1400px] px-4 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <FileText className="h-8 w-8 mr-3 text-blue-600" />
            Smart Billing Engine
          </h1>
          <p className="mt-2 text-slate-500">
            Generate complex, multi-item invoices with automated pricing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            <Card className="border-slate-200 shadow-sm relative overflow-visible">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                <h2 className="text-lg font-bold text-slate-800">1. Select Office & Patient</h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Select Office / Dentist *</label>
                    <select
                      value={selectedOfficeId}
                      onChange={(e) => handleOfficeChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm bg-white"
                      required
                    >
                      <option value="">-- Choose Office --</option>
                      {offices.map((office) => (
                        <option key={office.id} value={office.id}>
                          {office.office_name} ({office.dentist_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Patient Name *</label>
                    <PatientSearch
                      value={patientName}
                      onChange={setPatientName}
                      labId={profile?.lab_id}
                      dentistId={recipientId}
                      required
                    />
                  </div>

                  {selectedOfficeId && (
                    <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                      <label className="text-sm font-medium text-slate-700 block mb-2 flex items-center justify-between">
                        <span>Unpaid Patient Case (Optional)</span>
                        {isLoadingCases && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Checking cases...
                          </span>
                        )}
                      </label>
                      {unpaidCases.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No unpaid cases found for this office. Proceed with manual invoice entry.</p>
                      ) : availableUnpaidCases.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-green-600 font-medium">All unpaid cases for this office have been added to the invoice.</p>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                          <select
                            value={selectedCaseId}
                            onChange={(e) => handleCaseChange(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm bg-white"
                          >
                            <option value="">-- Choose Unpaid Case --</option>
                            {availableUnpaidCases.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.FirstName_LastName} - {c.Type || 'Service'} (Tooth: {c.UNN || 'N/A'}, Price: ${c.price || 'Not Set'})
                              </option>
                            ))}
                          </select>
                          {selectedCaseId && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleCaseChange('')}
                              className="text-xs font-bold text-slate-600 hover:text-slate-800"
                            >
                              Deselect Case
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedCaseId && (
                    <div className="md:col-span-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs">
                      <strong>Automated Billing Mode:</strong> Case details and tooth selections are locked from the patient records. Manual adding of line items is disabled to preserve database consistency. If you need to make changes, please edit the case record directly.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={`overflow-hidden border-slate-200 shadow-sm ${selectedCaseId ? 'bg-slate-50/40 opacity-95' : 'ring-2 ring-blue-500 ring-opacity-10'}`}>
              <CardHeader className={`${selectedCaseId ? 'bg-slate-100 border-slate-200' : 'bg-blue-50 border-blue-100'} border-b py-4 flex flex-row items-center justify-between`}>
                <h2 className={`text-lg font-bold ${selectedCaseId ? 'text-slate-700' : 'text-blue-900'}`}>
                  {selectedCaseId ? '2. Case Detail (Imported)' : '2. Add Line Item'}
                </h2>
                <div className="px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-200">
                  Item Price: ${price}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {selectedCaseId && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
                    <span className="font-semibold">Automated Case Mode:</span>
                    <span>These details are imported from the patient's case record and cannot be modified.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Select
                    label="Service Type"
                    options={whatNeededOptions}
                    value={whatNeeded}
                    onChange={(e) => handleWhatNeededChange(e.target.value)}
                    disabled={!!selectedCaseId}
                  />
                  <Select
                    label="Prep Type"
                    options={prepTypeOptions}
                    value={prepType}
                    onChange={(e) => setPrepType(e.target.value as PrepType)}
                    disabled={!!selectedCaseId}
                  />
                  <Input
                    label="Calculated Price ($)"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`font-bold ${selectedCaseId ? 'text-slate-600 bg-slate-100' : 'text-blue-600 bg-blue-50/50'}`}
                    disabled={!!selectedCaseId}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm font-semibold text-slate-700 mb-4">Tooth Selection (Pricing Drive)</p>
                  <ToothChart 
                    selectedTeeth={selectedTeeth} 
                    onToggleTooth={handleToggleTooth} 
                    onSelectArch={handleSelectArch} 
                    disabled={!!selectedCaseId}
                  />
                  <p className="mt-2 text-xs text-slate-500 italic">
                    Base: ${basePrice} × {selectedTeeth.length || 1} teeth = ${price}
                  </p>
                </div>

                <Textarea
                  label="Item Specific Notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes for this specific item..."
                  disabled={!!selectedCaseId}
                />

                <Button
                  type="button"
                  onClick={selectedCaseId ? addSelectedCaseToInvoice : addToInvoice}
                  disabled={!whatNeeded}
                  className={`w-full text-white py-6 text-lg font-bold shadow-md transition-all ${selectedCaseId ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {selectedCaseId ? 'Add Patient Case to Invoice' : 'Add Line Item'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar: Current Order */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 border-slate-200 shadow-lg h-fit flex flex-col min-h-[500px]">
            <CardHeader className="bg-slate-900 text-white rounded-t-xl py-4 flex flex-row items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                <h2 className="font-bold">Current Order</h2>
              </div>
              <span className="bg-blue-600 px-2 py-0.5 rounded text-xs font-bold">
                {lineItems.length} Items
              </span>
            </CardHeader>
            <CardContent className="p-4 flex-grow space-y-4">
              {lineItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                  <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm">Your invoice is empty.<br/>Add your first item to begin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lineItems.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 group relative">
                      <button 
                        onClick={() => removeLineItem(item.id)}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 shadow-sm z-10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-800 text-sm truncate pr-2">
                          {item.patientName ? `${item.patientName}: ` : ''}{item.serviceName}
                        </span>
                        <span className="font-bold text-blue-600 text-sm">${item.totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.teeth.map(t => (
                          <span key={t} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500">
                            #{t}
                          </span>
                        ))}
                      </div>
                      {item.notes && <p className="text-[10px] text-slate-400 truncate italic">"{item.notes}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-200 p-6 rounded-b-xl flex flex-col space-y-4">
              <div className="w-full space-y-2">
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>Subtotal</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-xl pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full py-2 border-t border-slate-200">
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={markAsPaid}
                    onChange={(e) => setMarkAsPaid(e.target.checked)}
                    className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">Mark as Paid</span>
                    <span className="text-[10px] text-slate-400">Record payment in Payments table upon saving</span>
                  </div>
                </label>
              </div>

              <div className="w-full flex flex-col gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 font-semibold rounded-lg shadow flex items-center justify-center"
                >
                  {isSubmitting ? (
                    'Saving & Generating Invoice...'
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save & Print Invoice
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/billing')}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
