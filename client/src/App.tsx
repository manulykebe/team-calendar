import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server } from 'lucide-react';
import Cookies from 'js-cookie';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './context/ThemeContext';

function AppContent() {
  const { isDark, toggle } = useTheme();
  const [serverMessage, setServerMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState(Cookies.get('token') || '');

  const login = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/login');
      const newToken = response.data.token;
      Cookies.set('token', newToken, { expires: 1 }); // Expires in 1 day
      setToken(newToken);
    } catch (err) {
      setError('Login failed');
    }
  };

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        if (!token) {
          await login();
          return;
        }

        const response = await axios.get('http://localhost:5000/api/greeting', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServerMessage(response.data.message);
        setLoading(false);
      } catch (err) {
        setError('Failed to connect to server');
        setLoading(false);
      }
    };

    fetchGreeting();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <ThemeToggle isDark={isDark} toggle={toggle} />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-8">
              <Server className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
              Full Stack Application
            </h1>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Server Status
              </h2>
              {loading ? (
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              ) : error ? (
                <p className="text-red-500 dark:text-red-400">{error}</p>
              ) : (
                <p className="text-green-600 dark:text-green-400">{serverMessage}</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;