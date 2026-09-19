import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { User, LoginCredentials, SignupCredentials, AuthResponse } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthData: (authData: AuthResponse) => Promise<void>;
  forceLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        // Token yoksa direkt logout
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const storedUser = await authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          // Try to fetch user from server
          await refreshUser();
        }
      } else {
        // Token geçersizse logout
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.log('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const authResponse = await authService.login(credentials);
      setUser(authResponse.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      setIsLoading(true);
      await authService.signup(credentials);
      
      // Auto login after signup
      await login({ 
        email: credentials.email, 
        password: credentials.password 
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Force logout without API call (for token expiration)
  const forceLogout = async () => {
    try {
      // Clear all auth data from storage
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      console.log('[AuthContext] Force logout - tokens cleared');
    } catch (error) {
      console.error('[AuthContext] Error clearing tokens:', error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const userProfile = await authService.getCurrentUser();
      setUser(userProfile);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('Refresh user error:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const setAuthData = async (authData: AuthResponse) => {
    // Tokens are already stored by the authService
    setUser(authData.user);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshUser,
    setAuthData,
    forceLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Global reference to force logout function
let globalForceLogout: (() => void) | null = null;

export const setGlobalForceLogout = (forceLogoutFn: () => void) => {
  globalForceLogout = forceLogoutFn;
};

export const getGlobalForceLogout = () => globalForceLogout; 