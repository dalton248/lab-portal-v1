'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Scan, Truck, Shield, CheckCircle2, PhoneCall, ArrowRight, X, Loader2 } from 'lucide-react';
import ProfitRecoveryCalculator from '@/components/shared/ProfitRecoveryCalculator';

export default function DoctorHome() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => setIsConnectModalOpen(true);
    window.addEventListener('openConnectScannerModal', handleOpenModal);
    return () => window.removeEventListener('openConnectScannerModal', handleOpenModal);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          phone, 
          officeName: selectedMethod === 'Physical Impressions' ? officeName : undefined,
          address: selectedMethod === 'Physical Impressions' ? address : undefined,
          method: selectedMethod 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to submit');
      
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert('There was an error saving your instructions request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsConnectModalOpen(false);
    setTimeout(() => {
      setSelectedMethod(null);
      setIsSuccess(false);
      setEmail('');
      setPhone('');
      setOfficeName('');
      setAddress('');
    }, 300);
  };
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LabOps Dental Lab Logo" className="w-10 h-10 object-contain rounded-lg" />
            <span className="text-2xl font-black text-slate-900 tracking-tighter">LabOps<span className="text-blue-600 font-medium">dentallab</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:flex text-slate-600 hover:text-blue-600 font-medium">
                Log in
              </Button>
            </Link>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20"
              onClick={() => setIsConnectModalOpen(true)}
            >
              Connect Scanner
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8 max-w-5xl mx-auto">
              The Precision You Felt, <br />
              <span className="text-blue-600">Scaled to Your Entire Practice.</span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-xl text-slate-600 leading-relaxed mb-12">
              You received our dental case example because we know the pressure of a perfect fit. Stop worrying about margins and start tracking every case in real-time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 font-bold rounded-xl transition-all hover:-translate-y-0.5"
                onClick={() => setIsConnectModalOpen(true)}
              >
                Connect Your Scanner
                <ArrowRight className="w-5 h-5" />
              </Button>
              <a href="/LabOps_Pricing_and_Materials.pdf" download="LabOps_Pricing_and_Materials.pdf" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-semibold rounded-xl transition-all">
                  View Pricing & Materials
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-12 border-y border-slate-100 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Seamless Digital Compatibility</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale">
              <div className="text-2xl font-black italic tracking-tighter">3Shape <span className="text-red-500">TRIOS</span></div>
              <div className="text-2xl font-bold tracking-tight">Medit</div>
              <div className="text-2xl font-serif font-semibold">iTero</div>
              <div className="text-2xl font-bold uppercase tracking-widest">Dentsply Sirona</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Focus on Dentistry. Leave the Logistics to Us.</h2>
              <p className="text-lg text-slate-600">Our digital-first workflow eliminates operational friction between your operatory and our bench.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">
              <div className="p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-6 mx-auto md:mx-0">
                  <Scan className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Seamless Integration</h3>
                <p className="text-slate-600 leading-relaxed">
                  Send cases directly from your 3Shape or preferred intraoral scanner. We automatically ingest your digital impressions without manual data entry.
                </p>
              </div>

              <div className="p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 mx-auto md:mx-0">
                  <Shield className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Global Quality, Local Support</h3>
                <p className="text-slate-600 leading-relaxed">
                  Partnered with premier labs, we guarantee high-end Zirconia and PFM crowns with uncompromised aesthetic and structural integrity.
                </p>
              </div>

              <div className="p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-14 h-14 rounded-xl bg-cyan-50 flex items-center justify-center mb-6 mx-auto md:mx-0">
                  <Truck className="w-7 h-7 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time Tracking</h3>
                <p className="text-slate-600 leading-relaxed">
                  Full transparency. Watch your case status update instantly from 'Scanned' to 'In Production' to 'Shipping', right up to the moment it's 'Seated'.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Profit Recovery Calculator */}
        <ProfitRecoveryCalculator />

        {/* CTA Section */}
        <section className="py-24 bg-blue-600 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold mb-6">Ready to Upgrade Your Lab Experience?</h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join hundreds of practices who have already modernized their restorative workflows.
            </p>
            <Button 
              size="lg" 
              className="px-10 py-7 text-lg !bg-white !text-blue-600 hover:bg-slate-50 font-bold rounded-xl shadow-2xl"
              onClick={() => setIsConnectModalOpen(true)}
            >
              Connect Your Scanner Now
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <img src="/logo.png" alt="LabOps Dental Lab Logo" className="w-8 h-8 object-contain rounded-md" />
               <span className="text-xl font-bold text-white tracking-tighter">LabOps<span className="text-blue-500 font-medium">dentallab</span></span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-slate-400 font-medium">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Materials Guide</a>
            </div>
            
            <div className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-semibold cursor-pointer">
              <PhoneCall className="w-4 h-4" />
              <span>Contact Lab Tech</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-900 text-center text-sm text-slate-600">
            © {new Date().getFullYear()} LabOps Dental Lab. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Connect Scanner Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                {isSuccess ? "Request Received" : selectedMethod ? `Connect via ${selectedMethod}` : "Connect Your Office"}
              </h3>
              <button 
                onClick={closeModal}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Request Received</h4>
                  <p className="text-slate-600 mb-8">
                    You will receive a call and email about further instructions for {selectedMethod} in the next few minutes. Please wait while we get one of our representatives to contact you.
                  </p>
                  <Button onClick={closeModal} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                    Close Window
                  </Button>
                </div>
              ) : selectedMethod ? (
                <form onSubmit={handleSubmit} className="animate-in slide-in-from-right-4 duration-300">
                  <p className="text-sm text-slate-600 mb-6 font-medium">To provide the exact pairing credentials, please confirm your contact details:</p>
                  
                  <div className="space-y-4 mb-8">
                    {selectedMethod === 'Physical Impressions' && (
                      <>
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Office Name</label>
                          <input 
                            type="text" 
                            required 
                            value={officeName}
                            onChange={(e) => setOfficeName(e.target.value)}
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                            placeholder="Smile Dental Care"
                          />
                        </div>
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Physical Address</label>
                          <textarea 
                            required 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                            placeholder="123 Dental St, Suite 101, City, State, ZIP"
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                        placeholder="doctor@practice.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setSelectedMethod(null)} className="w-full">
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Instructions"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="animate-in slide-in-from-left-4 duration-300">
                  <p className="text-sm text-slate-600 mb-6 font-medium">Select your primary impression method:</p>
                  
                  <div className="space-y-3">
                    <button onClick={() => setSelectedMethod('3Shape')} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 group transition-all text-left">
                      <span className="font-semibold text-slate-800 group-hover:text-blue-700">Connect 3Shape</span>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                    </button>
                    
                    <button onClick={() => setSelectedMethod('iTero')} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 group transition-all text-left">
                      <span className="font-semibold text-slate-800 group-hover:text-blue-700">Connect iTero</span>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                    </button>
                    
                    <button onClick={() => setSelectedMethod('Medit')} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 group transition-all text-left">
                      <span className="font-semibold text-slate-800 group-hover:text-indigo-700">Connect Medit</span>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                    </button>

                    <div className="py-2 flex items-center gap-4">
                      <div className="flex-1 border-t border-slate-100"></div>
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Other Methods</span>
                      <div className="flex-1 border-t border-slate-100"></div>
                    </div>

                    <button onClick={() => setSelectedMethod('Email STLs')} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 group transition-all text-left">
                      <span className="font-medium text-slate-700 group-hover:text-slate-900">Sending STLs via Email</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </button>

                    <button onClick={() => setSelectedMethod('Physical Impressions')} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 group transition-all text-left">
                      <span className="font-medium text-slate-700 group-hover:text-slate-900">Sending Physical Impressions</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
