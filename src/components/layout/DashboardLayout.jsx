import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar dashboard />
      <div className="flex flex-1">
        <Sidebar role={user?.role} />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
