'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Settings, Building2 } from 'lucide-react';
import { User } from '@/lib/types';

interface SidebarProps {
  currentUser: User;
  labName: string;
}

export function Sidebar({ currentUser, labName }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Cases', href: '/cases', icon: FileText, show: true },
    { name: 'Team', href: '/team', icon: Users, show: currentUser.role === 'lab_admin' },
    { name: 'Settings', href: '/settings', icon: Settings, show: true },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow bg-slate-900 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <Building2 className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <h1 className="text-xl font-bold text-white">LabOps</h1>
            </div>
          </div>

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

          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) =>
              item.show ? (
                <Link
                  key={item.name}
                  href={item.href}
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
    </div>
  );
}
