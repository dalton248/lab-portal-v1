'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Edit3, 
  X, 
  Check, 
  Loader2, 
  Compass, 
  HeartHandshake, 
  Sparkles,
  FileText,
  Printer
} from 'lucide-react';
import { ServiceCatalog } from '@/components/billing/ServiceCatalog';

interface Office {
  id: string;
  user_id: string;
  office_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  dentist_name: string;
  dentist_email: string;
  created_at?: string;
}

function BillingContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const { profile } = useAuth();
  
  // Tabs: 'offices' | 'services'
  const [activeTab, setActiveTab] = useState<'offices' | 'services'>('offices');
  
  // Offices State
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoadingOffices, setIsLoadingOffices] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing Office State
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [formData, setFormData] = useState({
    office_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invoice History State
  const [selectedOfficeForHistory, setSelectedOfficeForHistory] = useState<Office | null>(null);
  const [officeInvoices, setOfficeInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [voidingInvoiceId, setVoidingInvoiceId] = useState<string | null>(null);

  // Fetch offices list
  const fetchOffices = async () => {
    try {
      setIsLoadingOffices(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch('/api/offices', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setOffices(data);
      } else {
        console.error('Failed to fetch offices list');
      }
    } catch (err) {
      console.error('Error fetching offices:', err);
    } finally {
      setIsLoadingOffices(false);
    }
  };

  const fetchOfficeInvoices = async (office: Office) => {
    setLoadingInvoices(true);
    try {
      // 1. Fetch from Payments
      const { data: paymentsData } = await supabase
        .from('Payments')
        .select(`
          id,
          case_id,
          invoice_id,
          office_id,
          patient_name,
          amount,
          status,
          created_at,
          Cases (
            Case_number,
            FirstName_LastName,
            status,
            line_items
          ),
          Invoices (
            id,
            invoice_number,
            patient_names,
            status
          )
        `)
        .eq('office_id', office.user_id)
        .order('created_at', { ascending: false });

      // 2. Fetch directly from Invoices
      const { data: directInvoices } = await supabase
        .from('Invoices')
        .select('*')
        .or(`office_id.eq.${office.user_id},dentist_id.eq.${office.user_id}`)
        .order('created_at', { ascending: false });

      // Map directInvoices to uniform structure
      const knownInvoiceIds = new Set((paymentsData || []).map(p => p.invoice_id).filter(Boolean));
      const formattedDirectInvoices = (directInvoices || [])
        .filter(inv => !knownInvoiceIds.has(inv.id))
        .map(inv => ({
          id: `inv-direct-${inv.id}`,
          case_id: null,
          invoice_id: inv.id,
          office_id: inv.office_id || inv.dentist_id,
          patient_name: inv.patient_names || 'Office Invoice',
          amount: inv.total_amount || 0,
          status: inv.status || 'invoiced',
          created_at: inv.created_at,
          Cases: null,
          Invoices: {
            id: inv.id,
            invoice_number: inv.invoice_number,
            patient_names: inv.patient_names,
            status: inv.status,
          },
        }));

      const combined = [...(paymentsData || []), ...formattedDirectInvoices].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOfficeInvoices(combined);
    } catch (err) {
      console.error('Error fetching office invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleVoidInvoice = async (id: string, isInvoiceId?: boolean) => {
    if (!window.confirm('Are you sure you want to void this invoice? This will revert the case status back to completed and delete all associated payment records.')) {
      return;
    }
    setVoidingInvoiceId(id);
    try {
      // Always refresh first to get a guaranteed valid token
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      const token = refreshed?.session?.access_token;
      if (refreshError || !token) {
        alert('Your session has expired. Please sign out and sign back in, then try again.');
        setVoidingInvoiceId(null);
        return;
      }
      const response = await fetch('/api/invoices/void', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(isInvoiceId ? { invoiceId: id } : { caseId: id }),
      });
      if (response.ok) {
        alert('Invoice voided successfully.');
        if (selectedOfficeForHistory) {
          await fetchOfficeInvoices(selectedOfficeForHistory);
        }
      } else {
        const resData = await response.json();
        alert(resData.error || 'Failed to void invoice.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while voiding the invoice.');
    } finally {
      setVoidingInvoiceId(null);
    }
  };

  const openInvoiceHistory = (office: Office) => {
    setEditingOffice(null);
    setSelectedOfficeForHistory(office);
    fetchOfficeInvoices(office);
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  // Set up edit form fields
  const startEdit = (office: Office) => {
    setSelectedOfficeForHistory(null);
    setEditingOffice(office);
    setFormData({
      office_name: office.office_name || '',
      address_line1: office.address_line1 || '',
      address_line2: office.address_line2 || '',
      city: office.city || '',
      state: office.state || '',
      zip_code: office.zip_code || '',
      phone: office.phone || '',
    });
    setMessage(null);
  };

  // Submit updated address info
  const handleUpdateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffice) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch('/api/offices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: editingOffice.id,
          ...formData,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update office address.');
      }

      setMessage({ type: 'success', text: 'Office address saved successfully.' });
      setTimeout(() => {
        setEditingOffice(null);
        setMessage(null);
      }, 1500);

      // Refresh list
      fetchOffices();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered offices list
  const filteredOffices = offices.filter(office => {
    const term = searchQuery.toLowerCase();
    return (
      (office.office_name || '').toLowerCase().includes(term) ||
      (office.dentist_name || '').toLowerCase().includes(term) ||
      (office.dentist_email || '').toLowerCase().includes(term) ||
      (office.address_line1 || '').toLowerCase().includes(term) ||
      (office.city || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-6 py-4">
      {/* Premium Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1 tracking-wide uppercase">
            <Sparkles className="h-4 w-4" />
            Lab Operations Center
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Billing & Office Manager
          </h1>
          <p className="text-slate-500 mt-1.5 text-base max-w-2xl">
            Manage your partner dental offices, customize shipping addresses/contacts, and issue professional print-ready statements directly.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/billing/invoices/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 shadow-md flex items-center transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('billing.createInvoice')}
          </Button>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex border-b border-slate-200/80 p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('offices')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeTab === 'offices'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="inline-block h-4 w-4 mr-2 -mt-0.5" />
          Office Directory
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeTab === 'services'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="inline-block h-4 w-4 mr-2 -mt-0.5" />
          Service Catalog
        </button>
      </div>

      {activeTab === 'offices' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Directory Table/Cards */}
          <div className="lg:col-span-2 space-y-5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search offices by name, dentist, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm placeholder-slate-400 bg-white transition-all shadow-sm"
              />
            </div>

            {isLoadingOffices ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
                <span className="text-sm font-semibold text-slate-500">Loading directory...</span>
              </div>
            ) : filteredOffices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-sm px-6">
                <HeartHandshake className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="font-bold text-lg text-slate-800">No offices found</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  We couldn't find any offices matching your criteria. Try adjusting your search query or invite a new dentist first.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOffices.map((office) => (
                  <div
                    key={office.id}
                    className="p-5 md:p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">
                            {office.office_name || 'Unnamed Office'}
                          </h4>
                          <span className="inline-flex items-center text-xs font-semibold text-slate-500">
                            Dr. {office.dentist_name}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-500 pt-1 border-t border-slate-50">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">
                            {office.address_line1 || 'No address registered'}
                            {office.address_line2 && `, ${office.address_line2}`}
                            {office.city && <span className="block">{`${office.city}, ${office.state} ${office.zip_code}`}</span>}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{office.phone || 'No phone recorded'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[200px]">{office.dentist_email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2.5 md:w-auto w-full pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <Button
                        onClick={() => startEdit(office)}
                        variant="secondary"
                        className="flex-1 md:flex-initial text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 font-bold text-xs py-2 flex items-center justify-center"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                        Edit Details
                      </Button>
                      <Button
                        onClick={() => openInvoiceHistory(office)}
                        variant="secondary"
                        className="flex-1 md:flex-initial text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 font-bold text-xs py-2 flex items-center justify-center"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                        Invoices
                      </Button>
                      <Button
                        onClick={() => 
                          router.push(
                            `/billing/invoices/new?office_id=${office.id}&dentist_id=${office.user_id}&office_name=${encodeURIComponent(office.office_name)}`
                          )
                        }
                        className="flex-1 md:flex-initial bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 hover:border-blue-300 font-bold text-xs py-2 flex items-center justify-center shadow-none transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Create Invoice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Inline Edit Sidebar Card */}
          <div className="lg:col-span-1">
            {editingOffice ? (
              <Card className="border border-blue-100 shadow-lg sticky top-6">
                <CardHeader className="bg-blue-50/50 border-b border-blue-50 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center">
                      <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                      Edit Office Details
                    </CardTitle>
                    <button 
                      onClick={() => setEditingOffice(null)}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <CardDescription>
                    Updating Dr. {editingOffice.dentist_name}'s clinic record.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <form onSubmit={handleUpdateOffice} className="space-y-4">
                    <Input
                      label="Office Name"
                      required
                      value={formData.office_name}
                      onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                      placeholder="e.g. Oakridge Dental Care"
                    />

                    <Input
                      label="Street Address Line 1"
                      required
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      placeholder="e.g. 100 Main St"
                    />

                    <Input
                      label="Suite / Unit (Line 2)"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      placeholder="e.g. Suite 250"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="City"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                      />
                      <Input
                        label="State"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Zip Code"
                        required
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        placeholder="Zip Code"
                      />
                      <Input
                        label="Phone Number"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Phone Number"
                      />
                    </div>

                    {message && (
                      <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                        message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {message.type === 'success' ? <Check className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <X className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        <span>{message.text}</span>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingOffice(null)}
                        className="text-slate-600 font-bold"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center min-w-[80px]"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : selectedOfficeForHistory ? (
              <Card className="border border-blue-100 shadow-lg sticky top-6">
                <CardHeader className="bg-blue-50/50 border-b border-blue-50 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      Invoice History
                    </CardTitle>
                    <button 
                      onClick={() => setSelectedOfficeForHistory(null)}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <CardDescription>
                    {selectedOfficeForHistory.office_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5 max-h-[500px] overflow-y-auto space-y-4">
                  {loadingInvoices ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin mb-2" />
                      <span className="text-xs text-slate-500 font-medium">Fetching invoices...</span>
                    </div>
                  ) : officeInvoices.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <p className="text-sm font-semibold">No invoices found</p>
                      <p className="text-xs mt-1">This office does not have any invoice history yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {officeInvoices.map((invoice) => {
                        const targetId = invoice.invoice_id || invoice.case_id;
                        const isInv = !!invoice.invoice_id;
                        const invNumber = invoice.Invoices?.invoice_number || invoice.Cases?.Case_number || 'N/A';
                        const printUrl = isInv ? `/billing/invoices/print?invoice_id=${targetId}` : `/billing/invoices/print?case_id=${targetId}`;

                        return (
                          <div key={invoice.id} className="p-3 border border-slate-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/10 transition-all duration-200 flex flex-col gap-2 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 truncate">{invoice.patient_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">
                                  Invoice #: {invNumber}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {new Date(invoice.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <span className="text-xs font-black text-slate-900 ml-2">${Number(invoice.amount).toFixed(2)}</span>
                            </div>
                            <div className="flex gap-2 pt-1.5 border-t border-slate-100">
                              <a
                                href={printUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1 px-2 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-100 text-center flex items-center justify-center gap-1 transition-colors"
                              >
                                <Printer className="h-3 w-3" />
                                Statement
                              </a>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 py-0.5 px-2 text-[10px] font-bold text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200 hover:border-red-300 flex items-center justify-center"
                                onClick={() => handleVoidInvoice(targetId, isInv)}
                                disabled={voidingInvoiceId === targetId}
                              >
                                {voidingInvoiceId === targetId ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-red-600" />
                                ) : (
                                  <X className="h-3 w-3 text-red-600 mr-0.5" />
                                )}
                                Void
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200/50 rounded-2xl text-center space-y-3 sticky top-6">
                <Building2 className="h-10 w-10 text-slate-400" />
                <h4 className="font-bold text-slate-700">Office Inspector</h4>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Click "Edit Details" on any office card to modify its physical coordinates, or click "Invoices" to view and void statements.
                </p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <ServiceCatalog />
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
