'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChatLayout } from '@/components/chat';

export default function SeekerMessagesPage() {
  return (
    <DashboardLayout>
      <div className='h-[calc(100vh-4rem)]'>
        <ChatLayout className='h-full' />
      </div>
    </DashboardLayout>
  );
}
