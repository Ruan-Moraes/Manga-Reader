import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

const loginMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('@feature/auth/hook/useAuth', () => ({
    default: () => ({
        login: loginMock,
        register: vi.fn(),
        logout: vi.fn(),
        user: null,
        isLoggedIn: false,
    }),
}));

vi.mock('@shared/service/util/toastService', () => ({
    showErrorToast: vi.fn(),
    showInfoToast: vi.fn(),
    showSuccessToast: vi.fn(),
}));

vi.mock('react-router-dom', async orig => {
    const actual = await orig<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => navigateMock };
});

import Login from '../Login';

describe('Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        loginMock.mockResolvedValue(undefined);
    });

    it('renders email and password fields', () => {
        renderWithProviders(<Login />);
        expect(screen.getByPlaceholderText(/voce@email.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    });

    it('renders Entrar submit button', () => {
        renderWithProviders(<Login />);
        expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
    });

    it('submits with valid credentials and navigates', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'user@test.com');
        await user.type(screen.getByPlaceholderText(/••••••••/i), 'senha123');
        await user.click(screen.getByRole('button', { name: /^entrar$/i }));

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith({
                email: 'user@test.com',
                password: 'senha123',
            });
        });
        expect(navigateMock).toHaveBeenCalled();
    });

    it('shows error on invalid credentials', async () => {
        loginMock.mockRejectedValue(new Error('Unauthorized'));
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'wrong@test.com');
        await user.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpass');
        await user.click(screen.getByRole('button', { name: /^entrar$/i }));

        await waitFor(() => {
            expect(screen.getByText(/e-mail ou senha incorretos/i)).toBeInTheDocument();
        });
    });

    it('fills demo credentials on Preencher click', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        const emailInput = screen.getByPlaceholderText(/voce@email.com/i) as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText(/••••••••/i) as HTMLInputElement;

        expect(emailInput.value).toBe('');
        await user.click(screen.getByRole('button', { name: /preencher/i }));
        expect(emailInput.value).toBe('admin@mangareader.com');
        expect(passwordInput.value).toBe('12345');
    });

    it('shows loading state while submitting', async () => {
        loginMock.mockImplementation(() => new Promise(() => {}));
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'a@b.com');
        await user.type(screen.getByPlaceholderText(/••••••••/i), 'pass1234');
        await user.click(screen.getByRole('button', { name: /^entrar$/i }));

        await waitFor(() => {
            expect(screen.getByText(/carregando/i)).toBeInTheDocument();
        });
    });

    it('renders Esqueci a senha link', () => {
        renderWithProviders(<Login />);
        expect(screen.getByText(/esqueci a senha/i)).toBeInTheDocument();
    });

    it('renders Crie uma agora footer link', () => {
        renderWithProviders(<Login />);
        expect(screen.getByText(/crie uma agora/i)).toBeInTheDocument();
    });
});
