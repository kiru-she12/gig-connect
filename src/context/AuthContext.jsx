import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const login = (email, password, requestedRole) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple mock authentication logic
        if (password.includes('123')) {
          let role = requestedRole || 'student';
          if (email.toLowerCase().includes('admin')) role = 'admin';
          else if (email.toLowerCase().includes('business') || email.toLowerCase().includes('client')) role = 'client';
          else if (email.toLowerCase().includes('student') || email.toLowerCase().includes('std')) role = 'student';

          const userData = {
            id: role === 'admin' ? 'adm_1' : (role === 'student' ? 'std_1' : 'cli_1'),
            email,
            role,
            name: role === 'admin' ? 'Platform Admin' : (role === 'student' ? 'Kirushika Thavanesan' : 'Badulla Tech Solutions'),
          };
          setUser(userData);
          setLoading(false);
          resolve(userData);
        } else {
          setLoading(false);
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
  };

  const register = (data) => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = { ...data, id: `user_${Date.now()}` };
        setUser(newUser);
        setLoading(false);
        resolve(newUser);
      }, 1000);
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, register, loading, 
      isLoginModalOpen, setIsLoginModalOpen,
      isRegisterModalOpen, setIsRegisterModalOpen 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
