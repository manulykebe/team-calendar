import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface User {
  id: string;
  login: string;
  email: string;
  roles: string[];
  country: string;
  sites: string[];
}

interface AuthContextType {
  user: User | null;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/user', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data.user);
        } catch (error) {
          Cookies.remove('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (login: string, password: string) => {
    const response = await axios.post('http://localhost:5000/api/login', {
      login,
      password,
    });
    const { token, user } = response.data;
    Cookies.set('token', token, { expires: 1 });
    setUser(user);
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);