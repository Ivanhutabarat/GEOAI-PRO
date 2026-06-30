import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  requireAuth: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(true); // Show on first load

  useEffect(() => {
    // Check local storage for existing session
    const storedEmail = localStorage.getItem('geoai_user_email');
    if (storedEmail) {
      setIsAuthenticated(true);
      setUserEmail(storedEmail);
      setShowLoginModal(false); // Hide if already logged in
    }
  }, []);

  const login = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem('geoai_user_email', email);
    setShowLoginModal(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
    localStorage.removeItem('geoai_user_email');
    setShowLoginModal(true);
  };

  const requireAuth = (callback: () => void) => {
    if (isAuthenticated) {
      callback();
    } else {
      alert("Please log in if you wish to use the menu.");
      setShowLoginModal(true);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout, showLoginModal, setShowLoginModal, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
