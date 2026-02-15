import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ENDPOINTS } from '../utils/constants';
import { apiService, setLogoutCallback, clearTokenCache } from '../services/api';
import oneSignalService from '../services/onesignal';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePic?: string;
  coverPhoto?: string;
  bio?: string;
  location?: string;
  website?: string;
  verified?: boolean;
  followerCount: number;
  followingCount: number;
  tweetCount: number;
  createdAt: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Persisted setter: keeps AsyncStorage in sync
  const setUser = (nextUser: User | null) => {
    setUserState(nextUser);
    if (nextUser) {
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.USER).catch(() => {});
    }
  };

  // Register automatic logout callback for API 401 errors
  useEffect(() => {
    setLogoutCallback(async () => {
      console.log('🔐 Auto-logout triggered by API');
      clearTokenCache();
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      setUserState(null);
      oneSignalService.removeUserId();
    });
  }, []);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      if (userData && token) {
        const u = JSON.parse(userData);
        setUserState(u);
        if (u?._id) {
          oneSignalService.setUserId(u._id);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      clearTokenCache();
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUserState(userData);
      if (userData._id) {
        oneSignalService.setUserId(userData._id);
      }
      console.log('✅ User logged in:', userData.username);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint (best effort)
      try {
        await apiService.post(ENDPOINTS.LOGOUT);
      } catch (e) {
        console.warn('⚠️ Logout API failed (continuing local logout):', e);
      }

      clearTokenCache();
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      setUserState(null);
      oneSignalService.removeUserId();
      console.log('✅ User logged out');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, login, logout, updateUser, isLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
