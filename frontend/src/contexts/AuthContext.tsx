import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, AuthContextType, RegisterData, ApiResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        loading: false,
        isAuthenticated: true,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set axios defaults on mount
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    }
  }, []);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const response = await axios.get<ApiResponse<{ user: User }>>('/api/auth/me');
          if (response.data.success && response.data.user) {
            dispatch({ type: 'SET_USER', payload: response.data.user });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          console.error('Failed to load user:', error);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUser();
  }, [state.token]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.post<ApiResponse>('/api/auth/login', {
        email,
        password,
      });

      if (response.data.success && response.data.token && response.data.user) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        toast.success(response.data.message || 'Login successful!');
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.post<ApiResponse>('/api/auth/register', userData);

      if (response.data.success && response.data.token && response.data.user) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        toast.success(response.data.message || 'Registration successful!');
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const registerRestaurantOwner = async (userData: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.post<ApiResponse>('/api/auth/register-restaurant-owner', userData);

      if (response.data.success && response.data.token && response.data.user) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        toast.success(response.data.message || 'Restaurant owner registration successful!');
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = (): void => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    login,
    register,
    registerRestaurantOwner,
    logout,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 