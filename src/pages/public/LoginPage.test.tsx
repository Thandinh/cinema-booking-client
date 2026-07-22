import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../stores/authStore';
import LoginPage from './LoginPage';
import { renderWithProviders } from '../../test/render';

vi.mock('../../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    googleLogin: vi.fn(),
    getMyProfile: vi.fn(),
  },
}));

const mockedAuthApi = vi.mocked(authApi);

const LocationProbe = () => {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    localStorage.clear();
    useAuthStore.setState({ token: null, user: null, permissions: [] });
  });

  it('keeps the user on login page and shows Vietnamese error for invalid credentials', async () => {
    const user = userEvent.setup();
    mockedAuthApi.login.mockRejectedValueOnce({
      response: { data: { message: 'invalid credentials' } },
    });

    renderWithProviders(
      <>
        <LoginPage />
        <LocationProbe />
      </>,
      { initialEntries: ['/login'] },
    );

    await user.type(screen.getByPlaceholderText('nguyenvana'), 'wrong-user');
    const passwordInput = document.querySelector<HTMLInputElement>('input[type="password"]');
    expect(passwordInput).not.toBeNull();
    await user.type(passwordInput!, 'wrong-password');
    await user.click(screen.getByRole('button', { name: /\u0111\u0103ng nh\u1eadp/i }));

    expect(mockedAuthApi.login).toHaveBeenCalledWith({ username: 'wrong-user', password: 'wrong-password' });
    expect(await screen.findByText(/Sai t\u00ean \u0111\u0103ng nh\u1eadp ho\u1eb7c m\u1eadt kh\u1ea9u/i)).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });
});
