'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login');
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar currentUser={currentUser} labName={mockLab.name} />
        <MobileSidebar
          currentUser={currentUser}
          labName={mockLab.name}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden print:h-auto print:overflow-visible print:block">
        <div className="print:hidden">
          <Header
            currentUser={currentUser}
            onMenuClick={() => setMobileMenuOpen(true)}
          />
        </div>

        <main className="flex-1 overflow-y-auto print:h-auto print:overflow-visible print:block">
          <div className="py-6 print:py-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:mx-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
