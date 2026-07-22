import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../../api/authApi';
import RegisterPage from './RegisterPage';
import { renderWithProviders } from '../../test/render';

vi.mock('../../api/authApi', () => ({
  authApi: {
    register: vi.fn(),
  },
}));

const mockedAuthApi = vi.mocked(authApi);

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates password with product-grade rules before calling API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { initialEntries: ['/register'] });

    await user.type(screen.getByPlaceholderText('nguyenan'), 'user1');
    await user.type(screen.getByPlaceholderText('email@example.com'), 'user1@example.com');
    const passwordInputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    await user.type(passwordInputs[0], 'weak');
    await user.type(passwordInputs[1], 'weak');
    await user.click(screen.getByRole('button', { name: /t\u1ea1o/i }));

    expect(await screen.findByText(/\u00edt nh\u1ea5t 8 k\u00fd t\u1ef1/i)).toBeInTheDocument();
    expect(mockedAuthApi.register).not.toHaveBeenCalled();
  });

  it('shows a Vietnamese message when username and email already exist', async () => {
    const user = userEvent.setup();
    mockedAuthApi.register.mockRejectedValueOnce({
      response: { data: { message: 'Email already exists Username already exists' } },
    });

    renderWithProviders(<RegisterPage />, { initialEntries: ['/register'] });

    await user.type(screen.getByPlaceholderText('nguyenan'), 'user1');
    await user.type(screen.getByPlaceholderText('email@example.com'), 'user1@example.com');
    const passwordInputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    await user.type(passwordInputs[0], 'Password@123');
    await user.type(passwordInputs[1], 'Password@123');
    await user.click(screen.getByRole('button', { name: /t\u1ea1o/i }));

    expect(await screen.findByText(/T\u00ean \u0111\u0103ng nh\u1eadp v\u00e0 email \u0111\u00e3 t\u1ed3n t\u1ea1i/i)).toBeInTheDocument();
  });
});
