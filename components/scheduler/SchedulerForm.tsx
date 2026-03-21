'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, ChevronRight, Phone, Mail, User, Info } from 'lucide-react';

interface SchedulerFormProps {
  onComplete: (data: any) => void;
}

export function SchedulerForm({ onComplete }: SchedulerFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bottleneck: '',
    monthlyCases: '',
    scanner: '',
    name: '',
    email: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (step < 2) setStep(step + 1);
    else onComplete(formData);
  };

  const isStep1Valid = formData.bottleneck && formData.monthlyCases && formData.scanner;
  const isStep2Valid = formData.name && formData.email && formData.phone;

  return (
    <Card className="max-w-xl mx-auto p-8 shadow-2xl border-slate-200 bg-white/80 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
          Step {step} of 2
        </p>
      </div>

      {step === 1 ? (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tell us about your practice</h2>
            <p className="text-slate-500">We customize every demo based on your specific workflow.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              What is your current biggest bottleneck with labs?
            </label>
            <Select 
              name="bottleneck"
              value={formData.bottleneck}
              onChange={handleChange}
              className="w-full"
              options={[
                { value: "", label: "Select a bottleneck..." },
                { value: "Phone tag", label: "Phone tag" },
                { value: "Lost cases", label: "Lost cases" },
                { value: "Late deliveries", label: "Late deliveries" },
                { value: "Quality consistency", label: "Quality consistency" },
                { value: "Invoicing issues", label: "Invoicing issues" },
                { value: "Other", label: "Other" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              How many cases does your office process monthly?
            </label>
            <Input 
              type="number" 
              name="monthlyCases"
              placeholder="e.g. 50"
              value={formData.monthlyCases}
              onChange={handleChange}
              className="bg-white border-slate-200"
            />
            <p className="text-[10px] text-slate-400 italic">This helps us calculate your projected ROI.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              What scanner/software are you currently using?
            </label>
            <Select 
              name="scanner"
              value={formData.scanner}
              onChange={handleChange}
              className="w-full"
              options={[
                { value: "", label: "Select your platform..." },
                { value: "3Shape", label: "3Shape" },
                { value: "iTero", label: "iTero" },
                { value: "Medit", label: "Medit" },
                { value: "Dentsply Sirona", label: "Dentsply Sirona (CEREC)" },
                { value: "Other", label: "Other / Multiple" },
                { value: "None", label: "Currently using traditional impressions" },
              ]}
            />
          </div>

          <Button 
            variant="primary" 
            className="w-full py-6 text-lg rounded-xl shadow-lg mt-4"
            disabled={!isStep1Valid}
            onClick={nextStep}
          >
            Next: Contact Details
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Final Step</h2>
            <p className="text-slate-500">Where should we send your custom integration audit?</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Full Name
            </label>
            <Input 
              name="name"
              placeholder="Dr. Jane Doe"
              value={formData.name}
              onChange={handleChange}
              className="bg-white border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              Email Address
            </label>
            <Input 
              type="email"
              name="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={handleChange}
              className="bg-white border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              Phone Number
            </label>
            <Input 
              type="tel"
              name="phone"
              placeholder="(555) 000-0000"
              value={formData.phone}
              onChange={handleChange}
              className="bg-white border-slate-200"
            />
          </div>

          <Button 
            variant="primary" 
            className="w-full py-6 text-lg rounded-xl shadow-lg mt-4"
            disabled={!isStep2Valid}
            onClick={nextStep}
          >
            Show Scheduling Options
            <CheckCircle2 className="ml-2 h-5 w-5" />
          </Button>

          <Button 
            variant="ghost" 
            className="w-full text-slate-400 hover:text-slate-600"
            onClick={() => setStep(1)}
          >
            Back to practice details
          </Button>
        </div>
      )}
    </Card>
  );
}
