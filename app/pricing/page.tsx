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
              One Payment. Zero Headaches. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Lifetime Lab Efficiency.</span>
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-12">
              Stop losing hours to "phone tag" with labs. Join the LabOps Founder’s Program and get lifetime access to the world’s first AI-driven dental portal for a single, one-time investment.
            </p>

            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
              {/* Badge for limited seats */}
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-2xl font-bold text-sm">
                29 SEATS LEFT
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-6 text-center">
                  <div className="text-slate-500 line-through text-lg">Regularly $5,000 / year</div>
                  <div className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full inline-block mt-1">
                    Pays for itself in 5 months compared to our standard Enterprise plan
                  </div>
                </div>
                <div className="text-6xl font-black text-slate-900 mb-2">$1,997</div>
                <div className="text-sm font-bold text-blue-600 tracking-widest uppercase mb-8">One-Time Lifetime Access</div>
                
                <Link href="/login?tab=signup" className="w-full">
                  <Button variant="primary" size="lg" className="w-full py-8 text-xl rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all">
                    Claim 1 of 50 Founder Seats – $1,997
                  </Button>
                </Link>

                <div className="mt-8 flex flex-col gap-4 w-full text-left">
                  <div className="flex items-center gap-3 text-slate-700 font-medium">
                    <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Full clinical & administrative suite access</span>
                  </div>
                  <div className="flex flex-col gap-1 ml-8">
                    <div className="flex items-center gap-3 text-slate-700 font-medium ml-[-32px]">
                      <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
                      <span>Unlimited case processing with AI QC</span>
                    </div>
                    <span className="text-xs text-slate-500 font-normal">Native 3Shape & Medit integration for instant scan-to-bench workflows.</span>
                  </div>
                  {[
                    "Dedicated onboarding specialist",
                    "Priority feature request access",
                    "No monthly subscription — ever"
                  ].map((perk, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
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
