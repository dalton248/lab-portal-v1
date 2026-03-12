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
  const { t, language } = useLanguage();

  if (currentUser?.role !== 'lab_admin') {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">{t('team.accessDenied')}</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900">{t('team.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('team.subtitle')}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {t('team.inviteButton')}
        </Button>
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

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">{t('team.dentistsTitle')}</h2>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.name')}</TableHead>
                <TableHead>{t('table.email')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.joined')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTeamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-slate-500">{member.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {t(`status.${member.status}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {formatDate(member.joinedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
