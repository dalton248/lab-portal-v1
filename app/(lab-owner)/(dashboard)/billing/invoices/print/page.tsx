'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Pencil, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

interface PrintableCase {
  id: string;
  caseNumber: string;
  patientName: string;
  dueDate: string;
  createdAt: string;
  price: number;
  type: string;
  shade?: string;
  unn?: string;
  notes?: string;
  lineItems?: any[];
}

interface LabDetails {
  name: string;
  address: string;
  email: string;
  logo?: string;
}

interface OfficeDetails {
  office_name: string;
  dentist_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
}

// Editable field: shows text normally, switches to input on edit mode
function EditableField({
  value,
  onChange,
  isEditing,
  className = '',
  placeholder = '',
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  isEditing: boolean;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  if (!isEditing) return <span className={className}>{value || placeholder}</span>;
  if (multiline) {
    return (
      <textarea
        className={`border border-blue-300 rounded px-1.5 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400 bg-blue-50/40 resize-none ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
      />
    );
  }
  return (
    <input
      type="text"
      className={`border border-blue-300 rounded px-1.5 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400 bg-blue-50/40 ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export default function PrintInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const invoiceId = searchParams.get('invoice_id');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [caseData, setCaseData] = useState<PrintableCase | null>(null);
  const [lab, setLab] = useState<LabDetails | null>(null);
  const [office, setOffice] = useState<OfficeDetails | null>(null);

  // Editable overrides
  const [editLabName, setEditLabName] = useState('');
  const [editLabAddress, setEditLabAddress] = useState('');
  const [editLabEmail, setEditLabEmail] = useState('');
  const [editOfficeName, setEditOfficeName] = useState('');
  const [editDentistName, setEditDentistName] = useState('');
  const [editAddress1, setEditAddress1] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editZip, setEditZip] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTerms, setEditTerms] = useState('Net 30');
  const [editFooter, setEditFooter] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    if (!caseId && !invoiceId) {
      setError('No invoice_id or case_id provided in query parameters.');
      setIsLoading(false);
      return;
    }

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        if (invoiceId) {
          // NEW INVOICE TABLE FLOW
          const { data: dbInv, error: invErr } = await supabase
            .from('Invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

          if (invErr) throw new Error(`Failed to load invoice: ${invErr.message}`);
          if (!dbInv) throw new Error('Invoice not found.');

          let parsedLineItems: any[] = [];
          if (dbInv.line_items) {
            parsedLineItems = Array.isArray(dbInv.line_items)
              ? dbInv.line_items
              : typeof dbInv.line_items === 'string'
                ? JSON.parse(dbInv.line_items)
                : [];
          }

          const formattedCase: PrintableCase = {
            id: dbInv.id,
            caseNumber: dbInv.invoice_number || 'N/A',
            patientName: dbInv.patient_names || 'Multiple Patients',
            dueDate: dbInv.due_date || dbInv.created_at,
            createdAt: dbInv.created_at,
            price: dbInv.total_amount !== null && dbInv.total_amount !== undefined ? Number(dbInv.total_amount) : 0,
            type: 'Lab Statement',
            shade: 'N/A',
            unn: 'N/A',
            notes: '',
            lineItems: parsedLineItems,
          };

          setCaseData(formattedCase);
          setEditDate(new Date(formattedCase.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
          setEditDueDate(formattedCase.dueDate ? new Date(formattedCase.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Upon Receipt');

          if (dbInv.lab_id) {
            const { data: dbLab, error: labErr } = await supabase
              .from('Labs')
              .select('*')
              .eq('id', dbInv.lab_id)
              .single();

            if (!labErr && dbLab) {
              const labDetails = {
                name: dbLab.name,
                address: dbLab.address || 'N/A',
                email: dbLab.email || 'N/A',
                logo: dbLab.logo,
              };
              setLab(labDetails);
              setEditLabName(dbLab.name || '');
              setEditLabAddress(dbLab.address || '');
              setEditLabEmail(dbLab.email || '');
              setEditFooter(dbInv.footer || `Please remit payment within 30 days of the invoice date. Direct billing enquiries to ${dbLab.email || ''}.`);
              if (dbInv.notes) setEditTerms(dbInv.notes);
            }
          }

          if (dbInv.dentist_id || dbInv.office_id) {
            let dbOffice: any = null;
            if (dbInv.office_id) {
              const { data } = await supabase
                .from('user_offices')
                .select('*')
                .eq('id', dbInv.office_id)
                .single();
              dbOffice = data;
            } else if (dbInv.dentist_id) {
              const { data } = await supabase
                .from('user_offices')
                .select('*')
                .eq('user_id', dbInv.dentist_id)
                .single();
              dbOffice = data;
            }

            const { data: dbUser } = await supabase
              .from('Users')
              .select('full_name')
              .eq('id', dbInv.dentist_id || dbOffice?.user_id)
              .single();

            const officeDetails: OfficeDetails = {
              office_name: dbOffice?.office_name || 'N/A',
              dentist_name: dbUser?.full_name || 'N/A',
              address_line1: dbOffice?.address_line1 || 'No address registered',
              address_line2: dbOffice?.address_line2,
              city: dbOffice?.city || '',
              state: dbOffice?.state || '',
              zip_code: dbOffice?.zip_code || '',
              phone: dbOffice?.phone || '',
            };
            setOffice(officeDetails);
            setEditOfficeName(officeDetails.office_name);
            setEditDentistName(officeDetails.dentist_name);
            setEditAddress1(officeDetails.address_line1);
            setEditCity(officeDetails.city);
            setEditState(officeDetails.state);
            setEditZip(officeDetails.zip_code);
            setEditPhone(officeDetails.phone);
          }
        } else {
          // LEGACY CASE INVOICE FLOW
          const { data: dbCase, error: caseErr } = await supabase
            .from('Cases')
            .select('*')
            .eq('id', caseId)
            .single();

          if (caseErr) throw new Error(`Failed to load case: ${caseErr.message}`);
          if (!dbCase) throw new Error('Case not found.');

          let parsedLineItems: any[] = [];
          if (dbCase.line_items) {
            parsedLineItems = Array.isArray(dbCase.line_items)
              ? dbCase.line_items
              : typeof dbCase.line_items === 'string'
                ? JSON.parse(dbCase.line_items)
                : [];
          }

          const formattedCase: PrintableCase = {
            id: dbCase.id,
            caseNumber: dbCase.Case_number || 'N/A',
            patientName: dbCase.FirstName_LastName || 'N/A',
            dueDate: dbCase.due_date || dbCase.created_at,
            createdAt: dbCase.created_at,
            price: dbCase.price !== null && dbCase.price !== undefined ? Number(dbCase.price) : 0,
            type: dbCase.Type || 'N/A',
            shade: dbCase.Shade || 'N/A',
            unn: dbCase.UNN || 'N/A',
            notes: dbCase.hold_reason || '',
            lineItems: parsedLineItems,
          };

          setCaseData(formattedCase);
          setEditDate(new Date(formattedCase.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
          setEditDueDate(formattedCase.dueDate ? new Date(formattedCase.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Upon Receipt');

          if (dbCase.lab_id) {
            const { data: dbLab, error: labErr } = await supabase
              .from('Labs')
              .select('*')
              .eq('id', dbCase.lab_id)
              .single();

            if (!labErr && dbLab) {
              const labDetails = {
                name: dbLab.name,
                address: dbLab.address || 'N/A',
                email: dbLab.email || 'N/A',
                logo: dbLab.logo,
              };
              setLab(labDetails);
              setEditLabName(dbLab.name || '');
              setEditLabAddress(dbLab.address || '');
              setEditLabEmail(dbLab.email || '');
              setEditFooter(`Please remit payment within 30 days of the invoice date. Direct billing enquiries to ${dbLab.email || ''}.`);
            }
          }

          if (dbCase.dentist_id) {
            const { data: dbOffice } = await supabase
              .from('user_offices')
              .select('*')
              .eq('user_id', dbCase.dentist_id)
              .single();

            const { data: dbUser } = await supabase
              .from('Users')
              .select('full_name')
              .eq('id', dbCase.dentist_id)
              .single();

            const officeDetails: OfficeDetails = {
              office_name: dbOffice?.office_name || 'N/A',
              dentist_name: dbUser?.full_name || 'N/A',
              address_line1: dbOffice?.address_line1 || 'No address registered',
              address_line2: dbOffice?.address_line2,
              city: dbOffice?.city || '',
              state: dbOffice?.state || '',
              zip_code: dbOffice?.zip_code || '',
              phone: dbOffice?.phone || '',
            };
            setOffice(officeDetails);
            setEditOfficeName(officeDetails.office_name);
            setEditDentistName(officeDetails.dentist_name);
            setEditAddress1(officeDetails.address_line1);
            setEditCity(officeDetails.city);
            setEditState(officeDetails.state);
            setEditZip(officeDetails.zip_code);
            setEditPhone(officeDetails.phone);
          }
        }
      } catch (err: any) {
        console.error('Error loading print page data:', err);
        setError(err.message || 'An error occurred while loading case data.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [caseId, invoiceId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Preparing statement details...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
        <h2 className="text-lg font-bold text-red-800">Unable to generate statement</h2>
        <p className="text-sm text-red-700">{error || 'Case could not be retrieved.'}</p>
        <Button onClick={() => router.push('/billing')} className="w-full bg-red-600 hover:bg-red-700 text-white">
          Back to Billing
        </Button>
      </div>
    );
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (invoiceId) {
        const response = await fetch('/api/invoices/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            id: invoiceId,
            patient_names: caseData.patientName,
            line_items: caseData.lineItems,
            total_amount: caseData.price,
            due_date: editDueDate,
            notes: editTerms,
            footer: editFooter,
          }),
        });

        if (!response.ok) {
          const resErr = await response.json().catch(() => ({}));
          throw new Error(resErr.error || 'Failed to save invoice');
        }
      }

      setSaveMessage('Saved successfully');
      setIsEditing(false);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      alert(err.message || 'Error saving invoice changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const printStatement = () => {
    setIsEditing(false);
    setTimeout(() => window.print(), 100);
  };

  const createdDate = new Date(caseData.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const dueDateFormatted = caseData.dueDate
    ? new Date(caseData.dueDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Upon Receipt';

  return (
    <div className="min-h-screen bg-slate-50/50 print:bg-white pb-12 print:pb-0">

      {/* Top Action Bar */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/billing')}
            className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Billing
          </button>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <div className="flex items-center text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 font-medium animate-fade-in">
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-600" />
                {saveMessage}
              </div>
            )}
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className={`font-semibold flex items-center px-4 py-2.5 shadow-sm border transition-colors ${
                isEditing
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isEditing ? <X className="h-4 w-4 mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
              {isEditing ? 'Cancel Edit' : 'Edit Invoice'}
            </Button>
            {isEditing && (
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center px-4 py-2.5 shadow-sm"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            )}
            <Button
              onClick={printStatement}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center px-5 py-2.5 shadow-sm"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Statement
            </Button>
          </div>
        </div>

        {/* Edit mode hint */}
        {isEditing && (
          <div className="max-w-[800px] mx-auto mt-2">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center font-medium">
              ✏️ Edit mode active — click any field in the invoice below to change it. Changes only affect this printout.
            </p>
          </div>
        )}
      </div>

      {/* Printable Invoice Container */}
      <div
        className={`max-w-[800px] mx-auto my-8 print:my-0 p-8 md:p-12 bg-white print:p-0 shadow-md print:shadow-none border print:border-none rounded-2xl print:rounded-none transition-all ${
          isEditing ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200'
        }`}
        onDoubleClick={() => !isEditing && setIsEditing(true)}
        title={isEditing ? '' : 'Double-click to edit'}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { background: white !important; color: black !important; }
            .print\\:hidden { display: none !important; }
            header, aside, footer, nav, [role="navigation"] { display: none !important; }
            main { display: block !important; height: auto !important; overflow: visible !important; }
            html, body { height: auto; font-size: 12pt; line-height: 1.5; }
            @page { size: letter; margin: 0.5in; }
          }
        `}} />

        {/* ── Invoice Header: Lab info LEFT | STATEMENT + Bill To RIGHT ── */}
        <div className="flex flex-col md:flex-row md:justify-between items-start border-b border-slate-200 pb-8 gap-6">

          {/* LEFT: Lab branding */}
          <div className="space-y-3">
            <div className="h-10 w-10 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {(editLabName || lab?.name || 'LB').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <EditableField
                value={editLabName}
                onChange={setEditLabName}
                isEditing={isEditing}
                className="text-xl font-bold text-slate-900 block"
                placeholder="Lab Name"
              />
              <EditableField
                value={editLabAddress}
                onChange={setEditLabAddress}
                isEditing={isEditing}
                className="text-sm text-slate-500 block mt-1"
                placeholder="Lab Address"
              />
              <EditableField
                value={editLabEmail}
                onChange={setEditLabEmail}
                isEditing={isEditing}
                className="text-sm text-slate-500 block mt-1"
                placeholder="Lab Email"
              />
            </div>
          </div>

          {/* RIGHT: STATEMENT title + invoice meta + Bill To stacked */}
          <div className="text-left md:text-right space-y-4 md:self-stretch flex flex-col justify-between min-w-[220px]">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">STATEMENT</h2>
              <div className="space-y-1 text-sm text-slate-600 mt-2">
                <p><span className="font-semibold text-slate-800">Invoice Number:</span> {caseData.caseNumber}</p>
                <p>
                  <span className="font-semibold text-slate-800">Date:</span>{' '}
                  <EditableField
                    value={editDate}
                    onChange={setEditDate}
                    isEditing={isEditing}
                    className="inline"
                    placeholder={createdDate}
                  />
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Due Date:</span>{' '}
                  <EditableField
                    value={editDueDate}
                    onChange={setEditDueDate}
                    isEditing={isEditing}
                    className="inline"
                    placeholder={dueDateFormatted}
                  />
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Terms:</span>{' '}
                  <EditableField
                    value={editTerms}
                    onChange={setEditTerms}
                    isEditing={isEditing}
                    className="inline"
                    placeholder="Net 30"
                  />
                </p>
              </div>
            </div>

            {/* Bill To — right-aligned below the statement meta */}
            <div className="text-left md:text-right mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">BILL TO:</h3>
              <div className="text-slate-800 space-y-0.5 text-sm">
                <EditableField
                  value={editOfficeName}
                  onChange={setEditOfficeName}
                  isEditing={isEditing}
                  className="font-bold text-base text-slate-900 block"
                  placeholder="Office Name"
                />
                <p>
                  Attn: Dr.{' '}
                  <EditableField
                    value={editDentistName}
                    onChange={setEditDentistName}
                    isEditing={isEditing}
                    className="inline"
                    placeholder="Dentist Name"
                  />
                </p>
                <EditableField
                  value={editAddress1}
                  onChange={setEditAddress1}
                  isEditing={isEditing}
                  className="block"
                  placeholder="Street Address"
                />
                {(editCity || isEditing) && (
                  <p>
                    <EditableField value={editCity} onChange={setEditCity} isEditing={isEditing} className="inline w-20" placeholder="City" />
                    {', '}
                    <EditableField value={editState} onChange={setEditState} isEditing={isEditing} className="inline w-10" placeholder="ST" />
                    {' '}
                    <EditableField value={editZip} onChange={setEditZip} isEditing={isEditing} className="inline w-16" placeholder="Zip" />
                  </p>
                )}
                {(editPhone || isEditing) && (
                  <p className="text-slate-500">
                    Phone:{' '}
                    <EditableField
                      value={editPhone}
                      onChange={setEditPhone}
                      isEditing={isEditing}
                      className="inline"
                      placeholder="Phone"
                    />
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Line Items Table ── */}
        <div className="my-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-left">
                <th className="py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Service Description</th>
                <th className="py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Teeth</th>
                <th className="py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Prep Type</th>
                <th className="py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Base Price</th>
                <th className="py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {caseData.lineItems && caseData.lineItems.length > 0 ? (
                caseData.lineItems.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-slate-100 text-slate-700 text-sm">
                    <td className="py-4 text-slate-900">
                      {item.patientName && (
                        <span className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                          Patient: {item.patientName}
                        </span>
                      )}
                      <span className="font-semibold">{item.serviceName}</span>
                      {item.notes && (
                        <span className="block text-xs font-normal text-slate-400 italic mt-0.5">
                          "{item.notes}"
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center text-slate-500">
                      {Array.isArray(item.teeth) && item.teeth.length > 0
                        ? item.teeth.map((t: string) => `#${t}`).join(', ')
                        : 'N/A'}
                    </td>
                    <td className="py-4 text-center capitalize text-slate-500">{item.prepType || 'N/A'}</td>
                    <td className="py-4 text-right text-slate-500">${Number(item.basePrice || 0).toFixed(2)}</td>
                    <td className="py-4 text-right font-semibold text-slate-900">${Number(item.totalPrice || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-slate-100 text-slate-700 text-sm">
                  <td className="py-4 font-semibold text-slate-900">{caseData.type}</td>
                  <td className="py-4 text-center text-slate-500">{caseData.unn || 'N/A'}</td>
                  <td className="py-4 text-center capitalize text-slate-500">N/A</td>
                  <td className="py-4 text-right text-slate-500">${Number(caseData.price).toFixed(2)}</td>
                  <td className="py-4 text-right font-semibold text-slate-900">${Number(caseData.price).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex flex-col items-end my-8 pt-4 border-t border-slate-200">
          <div className="w-full md:w-1/2 space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">${caseData.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Taxes & Fees</span>
              <span className="font-semibold text-slate-900">$0.00</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-950 pt-3 border-t-2 border-slate-900">
              <span>Grand Total Due</span>
              <span>${caseData.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 mt-12 pt-8 text-center text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-500">Thank you for your partnership and trust in our lab.</p>
          <EditableField
            value={editFooter}
            onChange={setEditFooter}
            isEditing={isEditing}
            className="block text-xs text-slate-400 text-center"
            placeholder="Footer note..."
            multiline
          />
        </div>

      </div>
    </div>
  );
}
