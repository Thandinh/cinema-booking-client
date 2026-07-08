import { create } from 'zustand';

interface UserInfo {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
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
  token: localStorage.getItem('access_token'),
  user: JSON.parse(localStorage.getItem('user_info') || 'null'),
  permissions: JSON.parse(localStorage.getItem('permissions') || '[]'),

  login: (token, user, permissions = []) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
    localStorage.setItem('permissions', JSON.stringify(permissions));
    set({ token, user, permissions });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('permissions');
    set({ token: null, user: null, permissions: [] });
    // Bắn event hoặc chuyển trang nếu cần
    window.location.href = '/login';
  },

  hasPermission: (perm: string) => {
    return get().permissions.includes(perm) || get().permissions.includes('ALL'); // giả sử ADMIN có ALL
  }
}));
