'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar, PhoneCall, CheckCircle2, ArrowRight } from 'lucide-react';

export function BriefingOptions() {
  const [showPhone, setShowPhone] = React.useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-semibold mb-4 mx-auto">
          <CheckCircle2 className="h-3 w-3" />
          <span>Profile Verified Successfully</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
          How would you like to <br /> <span className="text-blue-600">Schedule your Briefing?</span>
        </h2>
        <p className="text-slate-600 text-lg max-w-xl mx-auto">
          Your practice qualifies for a founding member audit. Choose the path that fits your schedule right now.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Option A: Book for Later */}
        <Card className="p-8 border-slate-200 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:bg-blue-50 transition-colors">
            <Calendar className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Option A: Book for Later</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Planning your week? Lock in a specific slot that works for you. Best for those currently between patients.
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Syncs with your calendar
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Confirmation & Reminders sent
            </li>
          </ul>
          <Button 
            variant="outline" 
            className="w-full py-6 text-lg rounded-xl border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all"
            onClick={() => window.open('https://calendly.com/daltonshepler/30min', '_blank')}
          >
            Open Scheduler
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>

        {/* Option B: Talk to the Founder Now */}
        <Card className="p-8 border-blue-100 bg-blue-50/30 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">
            The Instant Path
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
            <PhoneCall className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Option B: Talk Now</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Have a free moment? Bridge the gap immediately. If the founder is available, you'll be connected in seconds.
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              Immediate connection
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              No waiting for email threads
            </li>
          </ul>
          
          {showPhone ? (
            <div className="animate-in zoom-in duration-300">
              <a 
                href="tel:5024828356" 
                className="flex flex-col items-center justify-center w-full py-4 px-6 rounded-xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
              >
                <span className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Click to call</span>
                <span className="text-2xl font-black tracking-tighter">(502) 482-8356</span>
              </a>
              <button 
                onClick={() => setShowPhone(false)}
                className="w-full text-center mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Go back
              </button>
            </div>
          ) : (
            <Button 
              variant="primary" 
              className="w-full py-6 text-lg rounded-xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all font-bold group"
              onClick={() => setShowPhone(true)}
            >
              Start Instant Call
              <PhoneCall className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
