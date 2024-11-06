"use client";
import ChatScreen from '@/components/ChatScreen/page';
import Header from '@/components/common/Header/page';
import SidebarSection from '@/components/common/Sidebar/page';
import { useState } from 'react';

export default function Chat() {
  const [isOpen, setIsOpen] = useState<any>(true);
  return (
    <section className='xl:h-full lg:h-full md:h-full sm:h-[90vh] h-[90vh] flex  bg-black '>
      <div className='flex'>
        <Header setIsOpen={setIsOpen} isOpen={isOpen} />
        <div className='xl:sticky lg:sticky md:sticky sm:fixed fixed top-0 z-50 h-screen bg-black '>
          <SidebarSection setIsOpen={setIsOpen} isOpen={isOpen} />
        </div>
      </div>
      <ChatScreen />
    </section>
  );
}
