'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ChevronLeft, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  Zap,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PricingPage() {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Failed to initiate checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex-1 flex justify-center transform -translate-x-12">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-slate-900 tracking-tight">Lab Portal</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold mb-6">
              <Star className="h-3 w-3 fill-amber-700" />
              <span>LIMITED FOUNDER OPPORTUNITY</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
              The LabOps <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Founder’s Program</span>
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-12 italic">
              "We are building the first dental portal that actually thinks like an operator. Join us as a Founder and own the platform for life."
            </p>

            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden max-w-2xl mx-auto ring-4 ring-blue-50">
              {/* Urgency Badge */}
              <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-2 rounded-bl-2xl font-black text-sm tracking-widest animate-pulse">
                ONLY 29 SEATS REMAINING
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-6 text-center">
                  <div className="text-slate-400 line-through text-lg font-medium tracking-tight">Regularly $5,000 / year</div>
                  <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mt-2 uppercase tracking-wide">
                    Exclusive One-Time Investment
                  </div>
                </div>
                
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-slate-900 self-start mt-2">$</span>
                  <span className="text-7xl font-black text-slate-900">1,997</span>
                </div>
                <div className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-10">Lifetime Founder Access</div>
                
                <div className="w-full flex flex-col items-center gap-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full py-8 text-xl font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all bg-blue-600 border-none disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Claim Your Founder Seat'}
                  </Button>

                  <Link href="/demo" className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-semibold border-b border-transparent hover:border-blue-200 pb-0.5">
                    Not ready? Schedule a 15-minute demo with our founder.
                  </Link>
                </div>

                <div className="mt-12 flex flex-col gap-4 w-full text-left bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-700 font-bold">
                    <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                    <span>Full clinical & administrative suite access</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 text-slate-700 font-bold">
                      <Zap className="h-5 w-5 text-blue-600 shrink-0" />
                      <span>Unlimited case processing with AI QC</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium ml-8">Native 3Shape & Medit integration for instant scan-to-bench workflows.</span>
                  </div>
                  {[
                    "Dedicated onboarding specialist",
                    "Priority feature request access",
                    "No monthly subscription — ever"
                  ].map((perk, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof / Trust Bar */}
          <div className="mt-20 py-12 border-y border-slate-200">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-slate-500 font-bold text-center">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span>Integrated with 3Shape</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span>Trusted by Ohio’s Top Radiographers</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span>Built for High-Growth Practices</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Basic Footer */}
      <footer className="footer bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <span className="block text-xs font-bold text-blue-600 uppercase tracking-wider leading-none">Verified Professional Control</span>
                <span className="text-[10px] text-slate-500">Licensed Ohio Dental Radiographer | #GX-123456</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-900">Lab Portal</span>
          </div>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Lab Portal Inc. Built by dental operators for dental founders.</p>
        </div>
      </footer>
    </div>
  );
}
