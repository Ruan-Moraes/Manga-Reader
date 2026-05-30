import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

const { requestResetMock, navigateMock } = vi.hoisted(() => ({
    requestResetMock: vi.fn(),
    navigateMock: vi.fn(),
}));

vi.mock('@features/auth/service/authService', () => ({
    requestPasswordReset: requestResetMock,
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

import ForgotPassword from '../ForgotPassword';

describe('ForgotPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requestResetMock.mockResolvedValue('ok');
    });

    it('renders form state by default', () => {
        renderWithProviders(<ForgotPassword />);
        expect(screen.getByText(/esqueceu a senha/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enviar link/i })).toBeInTheDocument();
    });

    it('shows validation error for invalid email', async () => {
        const user = userEvent.setup();
        renderWithProviders(<ForgotPassword />);
        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'invalido');
        await user.click(screen.getByRole('button', { name: /enviar link/i }));
        await waitFor(() => {
            expect(screen.getByText(/e-mail válido/i)).toBeInTheDocument();
        });
    });

    it('transitions to sent state after valid submit', async () => {
        const user = userEvent.setup();
        renderWithProviders(<ForgotPassword />);
        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'user@test.com');
        await user.click(screen.getByRole('button', { name: /enviar link/i }));
        await waitFor(() => {
            expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/user@test.com/i)).toBeInTheDocument();
    });

    it('shows link with sent email in success state', async () => {
        const user = userEvent.setup();
        renderWithProviders(<ForgotPassword />);
        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'meu@email.com');
        await user.click(screen.getByRole('button', { name: /enviar link/i }));
        await waitFor(() => {
            expect(screen.getByText(/meu@email.com/i)).toBeInTheDocument();
        });
    });

    it('transitions back to form state when Tentar de novo clicked', async () => {
        const user = userEvent.setup();
        renderWithProviders(<ForgotPassword />);
        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'user@test.com');
        await user.click(screen.getByRole('button', { name: /enviar link/i }));
        await waitFor(() => {
            expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
        });
        await user.click(screen.getByText(/tentar de novo/i));
        await waitFor(() => {
            expect(screen.getByText(/esqueceu a senha/i)).toBeInTheDocument();
        });
    });

    it('shows success state even when service throws (no enumeration)', async () => {
        requestResetMock.mockRejectedValue(new Error('Not found'));
        const user = userEvent.setup();
        renderWithProviders(<ForgotPassword />);
        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'nao@existe.com');
        await user.click(screen.getByRole('button', { name: /enviar link/i }));
        await waitFor(() => {
            expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
        });
    });

    it('renders Voltar ao login link', () => {
        renderWithProviders(<ForgotPassword />);
        expect(screen.getByText(/voltar ao login/i)).toBeInTheDocument();
    });

    it('shows next steps list in success state', async () => {
        const user = userEvent.setup();
        renderWithProviders(<ForgotPassword />);
        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'u@t.com');
        await user.click(screen.getByRole('button', { name: /enviar link/i }));
        await waitFor(() => {
            expect(screen.getByText(/próximos passos/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/redefinir senha/i)).toBeInTheDocument();
    });
});
