import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F8F8] text-gray-900 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#F8F8F8] p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
