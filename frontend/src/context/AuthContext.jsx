import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const login = async (email, password, requestedRole) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, role: requestedRole }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Map backend role 'job_provider' to frontend role 'client'
      let mappedRole = data.role;
      if (mappedRole === 'job_provider') {
        mappedRole = 'client';
      }

      const userData = {
        id: data.user_ID,
        name: data.name,
        role: mappedRole,
        email: email,
      };

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout.php`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (data) => {
    setLoading(true);
    try {
      // Map frontend role 'client' to backend role 'job_provider'
      const backendRole = data.role === 'client' ? 'job_provider' : data.role;

      const payload = {
        name: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: backendRole,
        nic: data.nic || '',
        business_reg_no: data.businessReg || '',
        year: data.year || '',
        degree: data.degree || '',
        bio: data.bio || '',
        languages: data.languages || '',
        skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error);
      }

      return resData;
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify_otp.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      console.error('OTP Verification error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forget_password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Network error sending OTP');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (err) {
      console.error('Forgot password error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, otp, newPassword, confirmPassword) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/reset_password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp, 
          new_password: newPassword, 
          confirm_password: confirmPassword 
        }),
      });

      if (!response.ok) {
        throw new Error('Network error resetting password');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (err) {
      console.error('Reset password error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, register, verifyOtp, forgotPassword, resetPassword, loading, 
      isLoginModalOpen, setIsLoginModalOpen,
      isRegisterModalOpen, setIsRegisterModalOpen,
      isContactModalOpen, setIsContactModalOpen
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
