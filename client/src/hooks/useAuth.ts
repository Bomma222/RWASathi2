import { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface AuthUser extends User {
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  // Demo users for role switching
  const demoUsers = [
    { phoneNumber: '+919876543210', role: 'admin', name: 'Admin User' },
    { phoneNumber: '+919876543211', role: 'resident', name: 'Resident User' },
    { phoneNumber: '+919876543212', role: 'watchman', name: 'Watchman User' },
  ];

  const switchUser = async (userIndex: number) => {
    if (userIndex >= 0 && userIndex < demoUsers.length) {
      setLoading(true);
      try {
        const selectedUser = demoUsers[userIndex];
        const response = await fetch(`/api/users/phone/${selectedUser.phoneNumber}`);
        
        if (response.ok) {
          const userData = await response.json();
          const newUser = {
            ...userData,
            isAuthenticated: true,
          } as AuthUser;
          
          setUser(newUser);
          setCurrentUserIndex(userIndex);
          localStorage.setItem('rwaSathiUser', JSON.stringify(userData));
          localStorage.setItem('currentUserIndex', userIndex.toString());
        }
      } catch (error) {
        console.error('User switch failed:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Check for saved user session first
    const savedUser = localStorage.getItem('rwaSathiUser');
    const savedUserIndex = localStorage.getItem('currentUserIndex');
    
    if (savedUser && savedUserIndex) {
      try {
        const userData = JSON.parse(savedUser);
        const userIndex = parseInt(savedUserIndex);
        setUser({ ...userData, isAuthenticated: true });
        setCurrentUserIndex(userIndex);
        setLoading(false);
        return;
      } catch (error) {
        localStorage.removeItem('rwaSathiUser');
        localStorage.removeItem('currentUserIndex');
      }
    }

    // Auto-login with first demo user for development
    switchUser(0);

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && firebaseUser.phoneNumber) {
        try {
          // Check if user exists in our database
          const response = await fetch(`/api/users/phone/${firebaseUser.phoneNumber}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser({ ...userData, isAuthenticated: true });
            localStorage.setItem('rwaSathiUser', JSON.stringify(userData));
          } else {
            // User not found in database but authenticated with Firebase
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const initializeRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });
    }
  };

  const sendOTP = async (phoneNumber: string) => {
    try {
      initializeRecaptcha();
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      return { success: true };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return { success: false, error: error.message };
    }
  };

  const verifyOTP = async (otp: string, userData: { name: string; flatNumber: string; tower?: string }) => {
    // Demo mode: Check if this is a demo phone number from the previous step
    const currentPhoneNumber = window.demoPhoneNumber || auth.currentUser?.phoneNumber;
    
    if (otp === '123456' && (currentPhoneNumber === "+919876543210" || currentPhoneNumber === "+919876543211" || currentPhoneNumber === "+919876543212" || currentPhoneNumber === "+919876543213")) {
      try {
        // Direct login for demo users
        const response = await apiRequest('POST', '/api/auth/login', {
          phoneNumber: currentPhoneNumber,
          ...userData,
        });

        const user = await response.json();
        setUser({ ...user.user, isAuthenticated: true });
        // Clean up demo state
        delete window.demoPhoneNumber;
        return { success: true, user: user.user };
      } catch (error: any) {
        console.error('Demo login error:', error);
        return { success: false, error: 'Demo login failed' };
      }
    }

    if (!confirmationResult) {
      return { success: false, error: 'Use demo numbers for testing: +919876543210 (admin) or +919876543211 (resident)' };
    }

    try {
      const result = await confirmationResult.confirm(otp);
      const userPhoneNumber = result.user.phoneNumber;

      if (userPhoneNumber) {
        // Register or login user in our database
        const response = await apiRequest('POST', '/api/auth/login', {
          phoneNumber: userPhoneNumber,
          ...userData,
        });

        const user = await response.json();
        setUser({ ...user.user, isAuthenticated: true });
        return { success: true, user: user.user };
      }

      return { success: false, error: 'Phone number not found' };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setConfirmationResult(null);
      localStorage.removeItem('rwaSathiUser');
      
      // Clear recaptcha
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signOut = logout; // Alias for compatibility

  return {
    user,
    loading,
    sendOTP,
    verifyOTP,
    logout,
    signOut,
    switchUser,
    currentUserIndex,
    demoUsers,
    isAuthenticated: !!user?.isAuthenticated,
    isAdmin: user?.role === 'admin',
  };
};

// Extend Window interface for recaptcha
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}
