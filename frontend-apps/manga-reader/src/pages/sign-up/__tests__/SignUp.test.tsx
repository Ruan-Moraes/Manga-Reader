import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

const registerMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('@features/auth/hook/useAuth', () => ({
    default: () => ({
        login: vi.fn(),
        register: registerMock,
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

import SignUp from '../SignUp';

const fillForm = async (
    user: ReturnType<typeof userEvent.setup>,
    overrides: Partial<{
        name: string;
        email: string;
        password: string;
        accept: boolean;
    }> = {},
) => {
    const { name = 'João', email = 'joao@test.com', password = 'Senha123!', accept = true } = overrides;
    if (name) await user.type(screen.getByPlaceholderText(/como podemos te chamar/i), name);
    if (email) await user.type(screen.getByPlaceholderText(/voce@email.com/i), email);
    if (password) await user.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), password);
    if (accept) await user.click(screen.getByRole('checkbox'));
};

describe('SignUp', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        registerMock.mockResolvedValue(undefined);
    });

    it('renders all 3 fields', () => {
        renderWithProviders(<SignUp />);
        expect(screen.getByPlaceholderText(/como podemos te chamar/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/voce@email.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/mínimo 8 caracteres/i)).toBeInTheDocument();
    });

    it('renders Criar conta button', () => {
        renderWithProviders(<SignUp />);
        expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
    });

    it('shows error when name is empty', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SignUp />);
        await user.click(screen.getByRole('button', { name: /criar conta/i }));
        await waitFor(() => {
            expect(screen.getByText(/diga como podemos te chamar/i)).toBeInTheDocument();
        });
    });

    it('shows error when email is invalid', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SignUp />);
        await user.type(screen.getByPlaceholderText(/como podemos te chamar/i), 'Ana');
        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'invalido');
        await user.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), 'Senha123!');
        await user.click(screen.getByRole('button', { name: /criar conta/i }));
        await waitFor(() => {
            expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument();
        });
    });

    it('shows error when password is too short', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SignUp />);
        await user.type(screen.getByPlaceholderText(/como podemos te chamar/i), 'Ana');
        await user.type(screen.getByPlaceholderText(/voce@email.com/i), 'ana@test.com');
        await user.type(screen.getByPlaceholderText(/mínimo 8 caracteres/i), '1234');
        await user.click(screen.getByRole('button', { name: /criar conta/i }));
        await waitFor(() => {
            expect(screen.getByText(/pelo menos 8 caracteres/i)).toBeInTheDocument();
        });
    });

    it('shows error when terms not accepted', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SignUp />);
        await fillForm(user, { accept: false });
        await user.click(screen.getByRole('button', { name: /criar conta/i }));
        await waitFor(() => {
            expect(screen.getByText(/preciso aceitar os termos/i)).toBeInTheDocument();
        });
    });

    it('submits successfully with valid data', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SignUp />);
        await fillForm(user);
        await user.click(screen.getByRole('button', { name: /criar conta/i }));
        await waitFor(() => {
            expect(registerMock).toHaveBeenCalledWith({
                name: 'João',
                email: 'joao@test.com',
                password: 'Senha123!',
            });
        });
        expect(navigateMock).toHaveBeenCalled();
    });

    it('strength label updates as password changes', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SignUp />);
        const pwInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i);
        await user.type(pwInput, 'abc'); // weak — too short, no conditions
        expect(screen.getByText('Fraca')).toBeInTheDocument();
    });

    it('shows Forte label for strong password', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SignUp />);
        const pwInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i);
        await user.type(pwInput, 'AbcDef1!'); // 8 chars + uppercase + number + special
        expect(screen.getByText(/ótima|forte/i)).toBeInTheDocument();
    });

    it('renders terms links', () => {
        renderWithProviders(<SignUp />);
        expect(screen.getByText(/termos de uso/i)).toBeInTheDocument();
        expect(screen.getByText(/política de privacidade/i)).toBeInTheDocument();
    });
});
