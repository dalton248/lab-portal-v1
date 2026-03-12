'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/components/providers/AuthProvider';
import { mockLab } from '@/lib/mock-data';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return null; // Will be redirected by AuthProvider
  }

  // Create a user object compatible with the existing components for now
  const currentUser = {
    id: profile.id,
    email: profile.email,
    labId: profile.lab_id || 'lab-1',
    role: profile.role === 'lab_admin' ? 'lab_admin' : 'dentist',
    name: profile.full_name || profile.email.split('@')[0],
    officeName: profile.office_name || 'N/A',
  } as const;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar currentUser={currentUser} labName={mockLab.name} />
      <MobileSidebar
        currentUser={currentUser}
        labName={mockLab.name}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          currentUser={currentUser}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
