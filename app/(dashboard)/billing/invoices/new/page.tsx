'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, Send, FileText, Plus, ShoppingCart, Trash2, User } from 'lucide-react';
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
}

export default function InvoiceGeneratorPage() {
  const router = useRouter();
  const { profile } = useAuth();
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
    return !!patientName.trim() && lineItems.length > 0;
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
      // 1. Prepare multi-item data
      const invoiceData = {
        patientName,
        invoiceId: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        items: lineItems,
        totalAmount: grandTotal,
        labId: profile?.lab_id,
        dentistId: profile?.id,
        recipient_id: recipientId || null,
        recipient_email: externalEmail || null,
        createdAt: new Date().toISOString(),
      };

      const formData = new FormData();
      Object.entries(invoiceData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      files.forEach((file) => {
        formData.append('files', file, file.name);
      });

      console.log('[Invoice Generator] Sending payload to proxy route...');
      const response = await fetch('/api/cases/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Submission failed with status: ${response.status}`);
      }

      console.log('[Invoice Generator] Invoice/Case generated successfully');
      router.push('/dashboard');
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
                <h2 className="text-lg font-bold text-slate-800">1. Select Patient & General Info</h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <PatientSearch
                    value={patientName}
                    onChange={setPatientName}
                    labId={profile?.lab_id}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 shadow-sm ring-2 ring-blue-500 ring-opacity-10">
              <CardHeader className="bg-blue-50 border-b border-blue-100 py-4 flex flex-row items-center justify-between">
                <h2 className="text-lg font-bold text-blue-900">2. Add Line Item</h2>
                <div className="px-3 py-1 bg-white rounded-full text-xs font-bold text-blue-600 shadow-sm">
                  Item Pricing: ${price}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Select
                    label="Service Type"
                    options={whatNeededOptions}
                    value={whatNeeded}
                    onChange={(e) => handleWhatNeededChange(e.target.value)}
                  />
                  <Select
                    label="Prep Type"
                    options={prepTypeOptions}
                    value={prepType}
                    onChange={(e) => setPrepType(e.target.value as PrepType)}
                  />
                  <Input
                    label="Calculated Price ($)"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="font-bold text-blue-600 bg-blue-50/50"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm font-semibold text-slate-700 mb-4">Tooth Selection (Pricing Drive)</p>
                  <ToothChart 
                    selectedTeeth={selectedTeeth} 
                    onToggleTooth={handleToggleTooth} 
                    onSelectArch={handleSelectArch} 
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
                />

                <Button
                  type="button"
                  onClick={addToInvoice}
                  disabled={!whatNeeded}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Invoice
                </Button>
              </CardContent>
            </Card>

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
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-800 text-sm truncate pr-2">{item.serviceName}</span>
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

              <div className="w-full flex flex-col gap-3">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid()}
                  className="w-full bg-slate-900 hover:bg-black text-white py-6"
                >
                  {isSubmitting ? (
                    'Generating...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create & Send Invoice
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
