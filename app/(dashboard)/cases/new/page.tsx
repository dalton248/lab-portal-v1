'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

export default function NewCasePage() {
  const router = useRouter();
  const [patientName, setPatientName] = useState('');
  const [caseType, setCaseType] = useState('crown');
  const [shade, setShade] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const caseTypeOptions = [
    { value: 'crown', label: 'Crown' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'denture', label: 'Denture' },
    { value: 'implant', label: 'Implant Crown' },
    { value: 'veneer', label: 'Veneer' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  const handleSaveDraft = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Case</h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit a new case to the laboratory
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Case Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Patient Name"
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Case Type"
                options={caseTypeOptions}
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
              />

              <Input
                label="Shade"
                type="text"
                value={shade}
                onChange={(e) => setShade(e.target.value)}
                placeholder="e.g., A2, B1"
              />
            </div>

            <Input
              label="Due Date"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <Textarea
              label="Special Instructions"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any special instructions or notes for the lab..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Files</h2>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-slate-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-900">
                Drop files here or click to upload
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Supports: STL, PLY, JPEG, PNG, PDF
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="mt-4 inline-flex cursor-pointer"
              >
                <Button type="button" variant="secondary">
                  Select Files
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveDraft}
          >
            Save Draft
          </Button>
          <Button type="submit" variant="primary">
            Submit Case
          </Button>
        </div>
      </form>
    </div>
  );
}
