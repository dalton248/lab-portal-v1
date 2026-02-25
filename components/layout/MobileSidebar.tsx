'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LayoutDashboard, FileText, Users, Settings, Building2 } from 'lucide-react';
import { User } from '@/lib/types';

interface MobileSidebarProps {
  currentUser: User;
  labName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ currentUser, labName, isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Cases', href: '/cases', icon: FileText, show: true },
    { name: 'Team', href: '/team', icon: Users, show: currentUser.role === 'lab_admin' },
    { name: 'Settings', href: '/settings', icon: Settings, show: true },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900 bg-opacity-75 z-40 md:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-slate-900 z-50 md:hidden">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-500" />
            <h1 className="ml-3 text-xl font-bold text-white">LabOps</h1>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-5 pb-4">
          <div className="px-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{labName}</p>
                <p className="text-xs text-slate-400">Laboratory</p>
              </div>
            </div>
          </div>

          <nav className="px-2 space-y-1">
            {navigation.map((item) =>
              item.show ? (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive(item.href) ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  {item.name}
                </Link>
              ) : null
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
