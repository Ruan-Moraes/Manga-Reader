import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

const registerMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('@feature/auth/hook/useAuth', () => ({
    default: () => ({ register: registerMock, login: vi.fn(), user: null }),
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

import SignUp from '../SignUp';

const byName = (c: HTMLElement, name: string) =>
    c.querySelector(`input[name="${name}"]`) as HTMLInputElement;

describe('SignUp form (zod + react-hook-form)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('exige termos e DMCA aceitos', async () => {
        const user = userEvent.setup();
        const { container } = renderWithProviders(<SignUp />);

        await user.type(byName(container, 'name'), 'Ruan');
        await user.type(byName(container, 'email'), 'ruan@example.com');
        await user.type(byName(container, 'password'), 'secret123');
        await user.type(byName(container, 'confirmPassword'), 'secret123');
        await user.click(screen.getByRole('button', { name: /cadastrar/i }));

        expect(
            await screen.findByText(
                /aceitar os termos de uso e a política dmca/i,
            ),
        ).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it('mostra erro quando senhas não coincidem', async () => {
        const user = userEvent.setup();
        const { container } = renderWithProviders(<SignUp />);

        await user.type(byName(container, 'name'), 'Ruan');
        await user.type(byName(container, 'email'), 'ruan@example.com');
        await user.type(byName(container, 'password'), 'secret123');
        await user.type(byName(container, 'confirmPassword'), 'different');
        await user.click(screen.getByRole('button', { name: /cadastrar/i }));

        expect(
            await screen.findByText(/as senhas não coincidem/i),
        ).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it('chama register quando válido com termos aceitos', async () => {
        registerMock.mockResolvedValueOnce(undefined);
        const user = userEvent.setup();
        const { container } = renderWithProviders(<SignUp />);

        await user.type(byName(container, 'name'), '  Ruan  ');
        await user.type(byName(container, 'email'), '  ruan@example.com  ');
        await user.type(byName(container, 'password'), 'secret123');
        await user.type(byName(container, 'confirmPassword'), 'secret123');

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        for (const cb of checkboxes) {
            await user.click(cb);
        }

        await user.click(screen.getByRole('button', { name: /cadastrar/i }));

        await waitFor(() =>
            expect(registerMock).toHaveBeenCalledWith({
                name: 'Ruan',
                email: 'ruan@example.com',
                password: 'secret123',
            }),
        );
    });
});
