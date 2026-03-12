'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';

export default function SettingsPage() {
  const { profile } = useAuth();
  
  // Create a compatible user object from the profile
  const currentUser = profile ? {
    id: profile.id,
    email: profile.email,
    role: profile.role === 'lab_admin' ? 'lab_admin' : 'dentist',
    name: profile.full_name || profile.email.split('@')[0],
    officeName: profile.office_name || 'N/A',
  } : null;
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('settings.subtitle')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">{t('settings.profileTitle')}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={t('settings.nameLabel')}
            type="text"
            defaultValue={currentUser?.name || ''}
          />
          <Input
            label={t('settings.emailLabel')}
            type="email"
            defaultValue={currentUser?.email || ''}
          />
          <Input
            label={t('settings.roleLabel')}
            type="text"
            defaultValue={currentUser?.role ? t(`roles.${currentUser.role}`) : ''}
            disabled
            className="bg-slate-50"
          />
          <div className="flex justify-end">
            <Button variant="primary">{t('settings.saveChanges')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">{t('settings.passwordTitle')}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={t('settings.currentPasswordLabel')}
            type="password"
          />
          <Input
            label={t('settings.newPasswordLabel')}
            type="password"
          />
          <Input
            label={t('settings.confirmPasswordLabel')}
            type="password"
          />
          <div className="flex justify-end">
            <Button variant="primary">{t('settings.updatePassword')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">{t('settings.notificationsTitle')}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">{t('settings.emailNotificationsLabel')}</p>
              <p className="text-sm text-slate-500">{t('settings.emailNotificationsDesc')}</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">{t('settings.caseUpdatesLabel')}</p>
              <p className="text-sm text-slate-500">{t('settings.caseUpdatesDesc')}</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">{t('settings.newMessagesLabel')}</p>
              <p className="text-sm text-slate-500">{t('settings.newMessagesDesc')}</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
