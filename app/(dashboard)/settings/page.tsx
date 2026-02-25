'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/mock-data';

export default function SettingsPage() {
  const currentUser = getCurrentUser();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            type="text"
            defaultValue={currentUser.name}
          />
          <Input
            label="Email"
            type="email"
            defaultValue={currentUser.email}
          />
          <Input
            label="Role"
            type="text"
            defaultValue={currentUser.role.replace('_', ' ')}
            disabled
            className="bg-slate-50"
          />
          <div className="flex justify-end">
            <Button variant="primary">Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current Password"
            type="password"
          />
          <Input
            label="New Password"
            type="password"
          />
          <Input
            label="Confirm New Password"
            type="password"
          />
          <div className="flex justify-end">
            <Button variant="primary">Update Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Email Notifications</p>
              <p className="text-sm text-slate-500">Receive email updates about case status changes</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Case Updates</p>
              <p className="text-sm text-slate-500">Get notified when cases are updated</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">New Messages</p>
              <p className="text-sm text-slate-500">Receive notifications for new messages</p>
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
