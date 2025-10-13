'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChatLayout } from '@/components/chat';

export default function AdminMessagesPage() {
  return (
    <DashboardLayout>
      <div className='h-[calc(100vh-8rem)] max-h-[600px]'>
        <ChatLayout className='h-full' />
      </div>
    </DashboardLayout>
  );
}
