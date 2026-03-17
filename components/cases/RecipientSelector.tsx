'use client';

import React, { useEffect, useState } from 'react';
import { Search, Mail, User } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface RecipientSelectorProps {
  recipientId: string;
  setRecipientId: (id: string) => void;
  externalEmail: string;
  setExternalEmail: (email: string) => void;
}

interface LabUser {
  id: string;
  full_name: string;
  email: string;
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  recipientId,
  setRecipientId,
  externalEmail,
  setExternalEmail,
}) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<LabUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('Users')
        .select('id, full_name, email')
        .eq('role', 'lab_admin');

      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">{t('cases.sendToTitle')}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">{t('cases.selectRecipient')}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search LabOps users..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!!externalEmail}
            />
          </div>
          
          <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg divide-y bg-white">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading users...</div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setRecipientId(user.id);
                    setExternalEmail('');
                  }}
                  className={`w-full text-left p-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    recipientId === user.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{user.full_name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                  {recipientId === user.id && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">No users found</div>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">OR</span>
          </div>
        </div>

        <div>
          <Input
            label={t('cases.externalEmail')}
            type="email"
            placeholder="example@email.com"
            value={externalEmail}
            onChange={(e) => {
              setExternalEmail(e.target.value);
              setRecipientId('');
            }}
            disabled={!!recipientId}
          />
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <Mail className="h-3 w-3 mr-1" />
            <span>Case details will be sent to this email</span>
          </div>
        </div>
      </div>
    </div>
  );
};
