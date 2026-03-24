'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';

interface PatientSearchProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  labId?: string;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  value,
  onChange,
  required = false,
  labId
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentPatients, setRecentPatients] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        let query = supabase
          .from('Cases')
          .select('FirstName_LastName')
          .order('id', { ascending: false });
        
        if (labId) {
          query = query.eq('lab_id', labId);
        }

        const { data, error } = await query.limit(20);
        
        if (error) throw error;
        
        const uniqueRecents = Array.from(new Set(
          data
            .map(item => item.FirstName_LastName)
            .filter((name): name is string => !!name)
        )).slice(0, 5);
        
        setRecentPatients(uniqueRecents);
      } catch (err) {
        console.error('Error fetching recent patients:', err);
      }
    };

    fetchRecent();

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        // Search unique FirstName_LastName from Cases table
        let query = supabase
          .from('Cases')
          .select('FirstName_LastName')
          .ilike('FirstName_LastName', `%${value}%`);

        if (labId) {
          query = query.eq('lab_id', labId);
        }

        const { data, error } = await query.limit(10);

        if (error) throw error;

        // Get unique names, filter out nulls
        const uniqueNames = Array.from(new Set(
          data
            .map(item => item.FirstName_LastName)
            .filter((name): name is string => !!name)
        ));

        setSuggestions(uniqueNames);
        setIsOpen(uniqueNames.length > 0);
      } catch (err) {
        console.error('Error searching patients:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchPatients, 300);
    return () => clearTimeout(debounce);
  }, [value]);

  return (
    <div className="relative" ref={containerRef}>
      <Input
        label="Client / Patient Name"
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value.length >= 2) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search existing patients..."
        icon={<Search className="h-4 w-4 text-slate-400" />}
        className="text-lg py-6"
      />

      {value.length === 0 && recentPatients.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Recently Billed Patients
          </p>
          <div className="flex flex-wrap gap-2">
            {recentPatients.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all flex items-center shadow-sm"
              >
                <User className="h-3 w-3 mr-1.5 opacity-50" />
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-9">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((name, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                onChange(name);
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <User className="h-4 w-4 mr-2 text-slate-400" />
              <span className="font-medium text-slate-700">{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
