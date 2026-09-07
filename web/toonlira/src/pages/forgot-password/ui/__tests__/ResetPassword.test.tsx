import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

const resetPasswordHookMock = vi.fn();

vi.mock('@features/auth', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/auth')>();
    return { ...actual, useResetPassword: () => resetPasswordHookMock() };
});

import ResetPassword from '../ResetPassword';

describe('ResetPassword route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('mostra mensagem de link inválido quando token ausente', () => {
        resetPasswordHookMock.mockReturnValue({
            token: '',
            password: '',
            confirmPassword: '',
            isLoading: false,
            errors: {},
            handlePasswordChange: vi.fn(),
            handleConfirmPasswordChange: vi.fn(),
            handleSubmit: vi.fn(),
        });

        renderWithProviders(<ResetPassword />);

        expect(screen.getByRole('heading', { name: /link inválido/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /solicitar novo link/i })).toBeInTheDocument();
    });

    it('mostra formulário quando token presente', () => {
        resetPasswordHookMock.mockReturnValue({
            token: 'valid-token',
            password: '',
            confirmPassword: '',
            isLoading: false,
            errors: {},
            handlePasswordChange: vi.fn(),
            handleConfirmPasswordChange: vi.fn(),
            handleSubmit: vi.fn(),
        });

        renderWithProviders(<ResetPassword />);

        expect(screen.getByPlaceholderText(/mínimo 8 caracteres/i)).toBeInTheDocument();
        expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(1);
    });
});
