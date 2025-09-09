import { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      const storedToken = localStorage.getItem("token");
      // Validate token format (basic check)
      if (storedToken && storedToken.length > 10) {
        return storedToken;
      }
      return null;
    } catch (error) {
      console.warn("Failed to read token from localStorage:", error);
      return null;
    }
  });

  const login = (newToken: string) => {
    try {
      setToken(newToken);
      localStorage.setItem("token", newToken);
    } catch (error) {
      console.error("Failed to save token to localStorage:", error);
    }
  };

  const logout = () => {
    try {
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
