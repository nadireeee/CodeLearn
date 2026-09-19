import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens and user
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async signup(credentials: SignupCredentials): Promise<User> {
    try {
      console.log('🚀 Signup request starting...');
      console.log('📡 API URL:', api.defaults.baseURL);
      console.log('📝 Credentials:', { ...credentials, password: '[HIDDEN]' });
      
      const response = await api.post('/user', credentials);
      console.log('✅ Signup successful:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Signup failed:');
      console.error('❌ Error:', error);
      console.error('❌ Response:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/signout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.log('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/user/profile');
      const user = response.data;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      const { accessToken, refreshToken: newRefreshToken, user } = response.data;
      
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', newRefreshToken],
        ['user', JSON.stringify(user)],
      ]);

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/google', { token: idToken });
      const { user, accessToken, refreshToken } = response.data;
      
      // Store tokens
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService(); 