import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface AuthState {
  token: string | null;
  user: Driver | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (token: string, user: Driver) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Driver) => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        setState({
          token,
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          token: null,
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
      setState({
        token: null,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (token: string, user: Driver) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
      ]);

      setState({
        token,
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Failed to save auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);

      setState({
        token: null,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      throw error;
    }
  };

  const updateUser = async (user: Driver) => {
    try {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      setState(prev => ({
        ...prev,
        user,
      }));
    } catch (error) {
      console.error('Failed to update user data:', error);
      throw error;
    }
  };

  return {
    ...state,
    login,
    logout,
    updateUser,
  } as AuthState & AuthActions;
});
