import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server } from 'lucide-react';
import Cookies from 'js-cookie';
import { Calendar } from './components/Calendar';
import { LoginModal } from './components/LoginModal';
import { FloatingPanel } from './components/FloatingPanel';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './context/ThemeContext';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { isDark, toggle } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <ThemeToggle isDark={isDark} toggle={toggle} />
      {user && <FloatingPanel />}
      {user ? <Calendar /> : <LoginModal />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;