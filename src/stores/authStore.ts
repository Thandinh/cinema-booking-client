import { create } from 'zustand';
import { LS_KEYS } from '../constants';

export interface UserInfo {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  permissions: string[];
  login: (token: string, user: UserInfo, permissions?: string[], refreshToken?: string | null) => void;
  updateTokens: (token: string, refreshToken?: string | null) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(LS_KEYS.ACCESS_TOKEN),
  refreshToken: localStorage.getItem(LS_KEYS.REFRESH_TOKEN),
  user: JSON.parse(localStorage.getItem(LS_KEYS.USER_INFO) || 'null'),
  permissions: JSON.parse(localStorage.getItem(LS_KEYS.PERMISSIONS) || '[]'),

  login: (token, user, permissions = [], refreshToken) => {
    const nextRefreshToken = refreshToken === undefined
      ? localStorage.getItem(LS_KEYS.REFRESH_TOKEN)
      : refreshToken;

    localStorage.setItem(LS_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(LS_KEYS.USER_INFO, JSON.stringify(user));
    localStorage.setItem(LS_KEYS.PERMISSIONS, JSON.stringify(permissions));

    if (nextRefreshToken) {
      localStorage.setItem(LS_KEYS.REFRESH_TOKEN, nextRefreshToken);
    } else {
      localStorage.removeItem(LS_KEYS.REFRESH_TOKEN);
    }

    set({ token, user, permissions, refreshToken: nextRefreshToken || null });
  },

  updateTokens: (token, refreshToken) => {
    const nextRefreshToken = refreshToken === undefined
      ? get().refreshToken
      : refreshToken;

    localStorage.setItem(LS_KEYS.ACCESS_TOKEN, token);
    if (nextRefreshToken) {
      localStorage.setItem(LS_KEYS.REFRESH_TOKEN, nextRefreshToken);
    } else if (refreshToken !== undefined) {
      localStorage.removeItem(LS_KEYS.REFRESH_TOKEN);
    }

    set({ token, refreshToken: nextRefreshToken || null });
  },

  logout: () => {
    localStorage.removeItem(LS_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(LS_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(LS_KEYS.USER_INFO);
    localStorage.removeItem(LS_KEYS.PERMISSIONS);
    set({ token: null, refreshToken: null, user: null, permissions: [] });
    window.location.href = '/login';
  },

  hasPermission: (perm: string) => {
    return get().permissions.includes(perm) || get().permissions.includes('ALL');
  },
}));