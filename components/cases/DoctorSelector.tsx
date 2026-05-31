'use client';

import React, { useEffect, useState } from 'react';
import { Search, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface DoctorSelectorProps {
  selectedDoctorId: string;
  setSelectedDoctorId: (id: string) => void;
  selectedDoctorName: string;
  setSelectedDoctorName: (name: string) => void;
  labId?: string;
}

interface DentistUser {
  id: string;
  full_name: string | null;
  email: string;
  office_name: string | null;
}

export const DoctorSelector: React.FC<DoctorSelectorProps> = ({
  selectedDoctorId,
  setSelectedDoctorId,
  selectedDoctorName,
  setSelectedDoctorName,
  labId,
}) => {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState<DentistUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        // Query the Users table for dentists associated with the lab or all dentists as fallback
        let query = supabase
          .from('Users')
          .select('id, full_name, email, office_name')
          .eq('role', 'dentist');

        if (labId) {
          query = query.eq('lab_id', labId);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          setDoctors(data);
        } else {
          // If no dentists belong specifically to this lab yet, fetch all dentists as fallback
          const { data: allData, error: allError } = await supabase
            .from('Users')
            .select('id, full_name, email, office_name')
            .eq('role', 'dentist');

          if (!allError && allData) {
            setDoctors(allData);
          }
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [labId]);

  const filteredDoctors = doctors.filter(doc => {
    const term = searchTerm.toLowerCase();
    return (
      doc.full_name?.toLowerCase().includes(term) ||
      doc.email.toLowerCase().includes(term) ||
      doc.office_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">
        Assign to Dentist / Doctor
      </h3>
      
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">
          Select Doctor from Your Network
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors by name, email, or office..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg divide-y bg-white">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500">Loading dentists...</div>
          ) : filteredDoctors.length > 0 ? (
            filteredDoctors.map(doc => {
              const displayName = doc.full_name || doc.office_name || doc.email.split('@')[0];
              const displaySub = doc.office_name ? `${doc.office_name} (${doc.email})` : doc.email;
              const isSelected = selectedDoctorId === doc.id;

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setSelectedDoctorId(doc.id);
                    setSelectedDoctorName(displayName);
                  }}
                  className={`w-full text-left p-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center mr-3 text-blue-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                      <div className="text-xs text-slate-500">{displaySub}</div>
                    </div>
                  </div>
                  {isSelected && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">No dentists found</div>
          )}
        </div>
      </div>
    </div>
  );
};
