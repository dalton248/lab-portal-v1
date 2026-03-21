'use client';

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { mockTeamMembers } from '@/lib/mock-data';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { getLabPartnerships } from '@/lib/partnerships';
import { getLabDetails } from '@/lib/lab';
import { Partnership, Lab } from '@/lib/types';
import { useEffect } from 'react';

export default function TeamPage() {
  const { profile } = useAuth();
  
  // Create a compatible user object from the profile
  const currentUser = profile ? {
    id: profile.id,
    email: profile.email,
    role: profile.role === 'lab_admin' ? 'lab_admin' : 'dentist',
    name: profile.full_name || profile.email.split('@')[0],
    officeName: profile.office_name || 'N/A',
  } : null;
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [labInfo, setLabInfo] = useState<Lab | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      if (profile?.lab_id) {
        setIsLoading(true);
        if (profile.role === 'lab_admin') {
          const data = await getLabPartnerships(profile.lab_id);
          setPartnerships(data);
        } else {
          const data = await getLabDetails(profile.lab_id);
          setLabInfo(data);
        }
        setIsLoading(false);
      }
    }
    fetchData();
  }, [profile?.lab_id, profile?.role]);

  if (!profile) return null;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteEmail('');
    setInviteName('');
    setShowInviteForm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {profile.role === 'lab_admin' ? t('team.title') : t('team.myLaboratory')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile.role === 'lab_admin' ? t('team.subtitle') : t('team.labInfo')}
          </p>
        </div>
        {profile.role === 'lab_admin' && (
          <Button
            variant="primary"
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t('team.inviteButton')}
          </Button>
        )}
      </div>

      {showInviteForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">{t('team.inviteTitle')}</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('team.nameLabel')}
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                />
                <Input
                  label={t('team.emailLabel')}
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jane.smith@dental.com"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInviteForm(false)}
                >
                  {t('team.cancel')}
                </Button>
                <Button type="submit" variant="primary">
                  {t('team.sendInvitation')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {profile.role === 'lab_admin' ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">{t('team.partnershipsTitle')}</h2>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('team.officeName')}</TableHead>
                  <TableHead>{t('table.email')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('team.agreementStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : partnerships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      {t('team.noPartnerships')}
                    </TableCell>
                  </TableRow>
                ) : (
                  partnerships.map((partnership) => (
                    <TableRow key={partnership.id}>
                      <TableCell className="font-medium">{partnership.dentistName}</TableCell>
                      <TableCell className="text-slate-500">{partnership.officeName}</TableCell>
                      <TableCell className="text-slate-500">{partnership.dentistEmail}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            partnership.status.toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {partnership.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            partnership.agreementAccepted
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {partnership.agreementAccepted ? t('team.accepted') : t('team.notAccepted')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">{t('team.labInfo')}</h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-slate-500">Loading...</p>
            ) : labInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">{t('team.labName')}</h3>
                    <p className="mt-1 text-lg text-slate-900 font-semibold">{labInfo.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">{t('team.address')}</h3>
                    <p className="mt-1 text-slate-700">{labInfo.address || t('common.na')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-slate-500">No laboratory information available.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keep existing dentists list for now or replace it? User said "replace example data with real data" */}
      {/* Since mockTeamMembers is just for demo, I will remove it and keep the real partnerships */}
    </div>
  );
}
