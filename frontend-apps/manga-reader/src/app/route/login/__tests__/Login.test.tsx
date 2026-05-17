import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

const loginMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('@feature/auth/hook/useAuth', () => ({
    default: () => ({ login: loginMock, register: vi.fn(), user: null }),
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

vi.mock('@app/layout/Header', () => ({ default: () => null }));
vi.mock('@app/layout/Footer', () => ({ default: () => null }));
vi.mock('@/app/layout/Main', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import Login from '../Login';

const emailInput = (c: HTMLElement) =>
    c.querySelector('input[name="email"]') as HTMLInputElement;
const passwordInput = (c: HTMLElement) =>
    c.querySelector('input[name="password"]') as HTMLInputElement;

describe('Login form (zod + react-hook-form)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('bloqueia submit e mostra erros quando vazio', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        await user.click(screen.getByRole('button', { name: /entrar/i }));

        expect(
            await screen.findByText(/email é obrigatório/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
        expect(loginMock).not.toHaveBeenCalled();
    });

    it('mostra erro de formato de email inválido', async () => {
        const user = userEvent.setup();
        const { container } = renderWithProviders(<Login />);

        // 'a@b' passa na validação nativa do <input type="email"> mas
        // falha no regex do zod — exercita a regra de schema.
        await user.type(emailInput(container), 'a@b');
        await user.click(screen.getByRole('button', { name: /entrar/i }));

        expect(
            await screen.findByText(/formato de email inválido/i),
        ).toBeInTheDocument();
        expect(loginMock).not.toHaveBeenCalled();
    });

    it('chama login com credenciais válidas (trim aplicado)', async () => {
        loginMock.mockResolvedValueOnce(undefined);
        const user = userEvent.setup();
        const { container } = renderWithProviders(<Login />);

        await user.type(emailInput(container), '  user@example.com  ');
        await user.type(passwordInput(container), 'secret123');
        await user.click(screen.getByRole('button', { name: /entrar/i }));

        await waitFor(() =>
            expect(loginMock).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'secret123',
            }),
        );
    });
});
