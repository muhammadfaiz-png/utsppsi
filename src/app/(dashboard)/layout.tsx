import React from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <Sidebar />
      <div className="pl-64 flex flex-col flex-1">
        <main className="w-full pt-16 bg-surface min-h-[calc(100vh-4rem)] flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

