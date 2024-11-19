import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server } from 'lucide-react';

function App() {
  const [serverMessage, setServerMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/greeting');
        setServerMessage(response.data.message);
        setLoading(false);
      } catch (err) {
        setError('Failed to connect to server');
        setLoading(false);
      }
    };

    fetchGreeting();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-8">
              <Server className="w-12 h-12 text-indigo-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
              Full Stack Application
            </h1>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Server Status
              </h2>
              {loading ? (
                <p className="text-gray-600">Loading...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <p className="text-green-600">{serverMessage}</p>
              )}
            </div>

            <div className="text-center text-gray-600">
              <p>Edit <code className="bg-gray-100 px-2 py-1 rounded">src/App.tsx</code> to get started</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;