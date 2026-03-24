'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Clock, 
  Zap, 
  TrendingUp, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2,
  Users2,
  BarChart3,
  Search,
  PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">Lab Portal</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            <a href="#trust" className="hover:text-blue-600 transition-colors">Network</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="hidden sm:flex border-slate-300">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 blur-[120px] rounded-full opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 blur-[120px] rounded-full opacity-60"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Break Through the <br className="hidden lg:block" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Scaling Ceiling.</span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              Stop juggling 7 different software portals. Consolidate your clinical, administrative, and logistical workflows into one automated powerhouse. Join the elite network of founders and operators.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
              <Link href="/pricing">
                <Button variant="primary" size="lg" className="px-8 py-6 text-lg rounded-xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all font-bold">
                  Get Early Access
                </Button>
              </Link>
              <Link href="/schedule">
                <Button variant="ghost" size="lg" className="px-8 py-6 text-lg rounded-xl text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2 font-semibold">
                  <PhoneCall className="h-5 w-5" />
                  Book a 15-min Call
                </Button>
              </Link>
              <div className="text-sm font-medium text-slate-500 flex flex-col items-start sm:items-center">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Zero Long-Term Contracts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Simple, Transparent Pricing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Built for Clinical Excellence</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Modern tools for modern practices. We automate the friction so you can focus on the patient.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users2 className="h-6 w-6 text-blue-600" />,
                  title: "Direct Specialist Access",
                  description: "Get a lab technician in your operatory in under 60 seconds for real-time consultation.",
                },
                {
                  icon: <Search className="h-6 w-6 text-indigo-600" />,
                  title: "AI Quality Control",
                  description: "Automate your quality control with AI that catches bad scans before they hit the bench.",
                },
                {
                  icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
                  title: "Predictable Scaling",
                  description: "Scale your case volume without adding staff overhead through intelligent workflow automation.",
                }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Social Proof Section */}
        <section id="trust" className="py-24 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-slate-400 font-semibold tracking-widest uppercase text-sm mb-12">The Industry Standard for Digital Workflows</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center justify-center font-bold text-2xl text-slate-800 italic">DENTALCORE</div>
              <div className="flex items-center justify-center font-bold text-2xl text-slate-800 tracking-tighter">PRECISELAB</div>
              <div className="flex items-center justify-center font-bold text-2xl text-slate-800 underline decoration-blue-600 underline-offset-4">SCANSTREAM</div>
              <div className="flex items-center justify-center font-bold text-2xl text-slate-800">ORTHOFlow</div>
            </div>
          </div>
        </section>
      </main>

      {/* Basic Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-slate-900 tracking-tight">Lab Portal</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-500 font-medium">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
              <Link href="/schedule" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">Book a Call</Link>
              <a href="#" className="hover:text-slate-900 transition-colors">Contact Support</a>
            </div>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Lab Portal Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

