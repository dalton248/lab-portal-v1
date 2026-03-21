'use client';

import React, { useState } from 'react';
import { SchedulerForm } from '@/components/scheduler/SchedulerForm';
import { BriefingOptions } from '@/components/scheduler/BriefingOptions';
import { Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SchedulePage() {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleComplete = async (data: any) => {
    setLoading(true);
    try {
      // Send data to our new API route
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save lead');
      
      setCompleted(true);
    } catch (error) {
      console.error('Error saving lead:', error);
      // Even if API fails, we show options to not block the user
      setCompleted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-slate-900 tracking-tight">Lab Portal</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </header>

      <main className="py-12 sm:py-20 relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center justify-center">
        {/* Decorative Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[50%] h-[50%] bg-blue-50/50 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-0 w-[50%] h-[50%] bg-indigo-50/50 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 w-full">
          {!completed ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SchedulerForm onComplete={handleComplete} />
              {loading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-50 rounded-2xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-blue-600 animate-pulse">Processing your details...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <BriefingOptions />
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-8 border-t border-slate-50 text-center">
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Safe & Secure Lead Processing • Lab Portal Inc.
        </p>
      </footer>
    </div>
  );
}
