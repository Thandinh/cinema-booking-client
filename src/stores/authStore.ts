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
  user: UserInfo | null;
  permissions: string[];
  login: (token: string, user: UserInfo, permissions?: string[]) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(LS_KEYS.ACCESS_TOKEN),
  user: JSON.parse(localStorage.getItem(LS_KEYS.USER_INFO) || 'null'),
  permissions: JSON.parse(localStorage.getItem(LS_KEYS.PERMISSIONS) || '[]'),

  login: (token, user, permissions = []) => {
    localStorage.setItem(LS_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(LS_KEYS.USER_INFO, JSON.stringify(user));
    localStorage.setItem(LS_KEYS.PERMISSIONS, JSON.stringify(permissions));
    set({ token, user, permissions });
  },

  logout: () => {
    localStorage.removeItem(LS_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(LS_KEYS.USER_INFO);
    localStorage.removeItem(LS_KEYS.PERMISSIONS);
    set({ token: null, user: null, permissions: [] });
    // Bắn event hoặc chuyển trang nếu cần
    window.location.href = '/login';
  },

  hasPermission: (perm: string) => {
    return get().permissions.includes(perm) || get().permissions.includes('ALL'); // giả sử ADMIN có ALL
  }
}));
