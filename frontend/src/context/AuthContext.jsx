import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student Account Session (Linked via Email)
  const [studentAccount, setStudentAccount] = useState(() => {
    const saved = localStorage.getItem('msc_student_account');
    return saved ? JSON.parse(saved) : null;
  });

  const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 day (24 hours) session limit

  const verifyToken = async () => {
    const token = localStorage.getItem('msc_quiz_token');
    const tokenTime = localStorage.getItem('msc_quiz_token_time');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Check if 1 day (24h) has elapsed since login
    if (tokenTime) {
      const elapsed = Date.now() - parseInt(tokenTime, 10);
      if (elapsed > ONE_DAY_MS) {
        console.warn('Admin session expired after 1 day (24 hours). Requiring re-login.');
        localStorage.removeItem('msc_quiz_token');
        localStorage.removeItem('msc_quiz_token_time');
        setUser(null);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.get('/api/auth/verify');
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('msc_quiz_token');
        localStorage.removeItem('msc_quiz_token_time');
        setUser(null);
      }
    } catch (error) {
      console.warn('Token validation failed or expired:', error.message);
      localStorage.removeItem('msc_quiz_token');
      localStorage.removeItem('msc_quiz_token_time');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Cross-portal SSO URL query parameter check on initial mount
  useEffect(() => {
    verifyToken();

    const params = new URLSearchParams(window.location.search);
    const ssoEmail = params.get('sso_email') || params.get('email');
    const ssoName = params.get('sso_name') || params.get('name');
    const ssoToken = params.get('sso_token') || params.get('token');

    if (ssoEmail || ssoToken) {
      api.post('/api/student/sso-verify', { email: ssoEmail, name: ssoName, token: ssoToken })
        .then(res => {
          if (res.data.success && res.data.user) {
            setStudentAccount(res.data.user);
            localStorage.setItem('msc_student_account', JSON.stringify(res.data.user));
          }
        })
        .catch(err => console.warn('SSO Token verification error:', err.message));
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('msc_quiz_token', token);
      localStorage.setItem('msc_quiz_token_time', Date.now().toString());
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('msc_quiz_token');
    localStorage.removeItem('msc_quiz_token_time');
    setUser(null);
  };

  const studentLogin = async (email, password) => {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    if (!cleanEmail || !password) {
      return { success: false, error: 'Email Address and Password are both required.' };
    }

    try {
      const res = await api.post('/api/student/login', { email: cleanEmail, password });
      if (res.data && res.data.user) {
        setStudentAccount(res.data.user);
        localStorage.setItem('msc_student_account', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data?.error || 'Login failed.' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid credentials or server connection error.';
      return { success: false, error: errorMsg };
    }
  };

  const studentRegister = async (name, email, password, username) => {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanName = name || (cleanEmail ? cleanEmail.split('@')[0] : 'Student');

    if (!cleanEmail || !password || !cleanName) {
      return { success: false, error: 'Full Name, Email Address, and Password are required.' };
    }

    try {
      const res = await api.post('/api/student/register', { name: cleanName, email: cleanEmail, password, username });
      if (res.data && res.data.user) {
        setStudentAccount(res.data.user);
        localStorage.setItem('msc_student_account', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user, verificationPortalUrl: res.data.verificationPortalUrl };
      }
      return { success: false, error: res.data?.error || 'Registration failed.' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Check network connection.';
      return { success: false, error: errorMsg };
    }
  };

  const studentLogout = () => {
    localStorage.removeItem('msc_student_account');
    setStudentAccount(null);
  };

  // Issue Certificate & Digital Badge (Syncs to API & Verification Portal)
  const issueStudentCertificate = async ({ courseTitle, score, passingScore, badgeTitle, name, email }) => {
    const targetEmail = email || studentAccount?.email;
    const targetName = name || studentAccount?.name || targetEmail?.split('@')[0] || 'Student';

    if (!targetEmail) return null;

    try {
      const res = await api.post('/api/student/issue-certificate', {
        email: targetEmail,
        name: targetName,
        courseTitle,
        score,
        passingScore,
        badgeTitle
      });
      return res.data.certificate;
    } catch (err) {
      console.error('Certificate issue error:', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      verifyToken,
      studentAccount,
      studentLogin,
      studentRegister,
      studentLogout,
      issueStudentCertificate
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
