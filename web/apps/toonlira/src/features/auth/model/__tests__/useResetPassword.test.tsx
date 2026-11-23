import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import useResetPassword from '../useResetPassword';

vi.mock('@shared/service/util/toastService', () => ({
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
}));

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/reset-password?token=tok-1']}>{children}</MemoryRouter>;

const changeField = (fn: (e: React.ChangeEvent<HTMLInputElement>) => void, value: string) =>
    fn({ target: { value } } as unknown as React.ChangeEvent<HTMLInputElement>);

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent<HTMLFormElement>;

describe('useResetPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('mostra toast de validacao local quando senhas nao conferem (nao passa pelo interceptor)', async () => {
        const { result } = renderHook(() => useResetPassword(), { wrapper });

        act(() => {
            changeField(result.current.handlePasswordChange, 'senha123');
            changeField(result.current.handleConfirmPasswordChange, 'outraSenha');
        });

        await act(async () => {
            await result.current.handleSubmit(submitEvent());
        });

        expect(showErrorToast).toHaveBeenCalledWith('Corrija os erros no formulário.', expect.objectContaining({ toastId: 'reset-password-validation' }));
    });

    it('nao dispara toast de erro local quando a API falha (delegado ao interceptor Axios)', async () => {
        server.use(http.post(`*${API_URLS.AUTH_RESET_PASSWORD}`, () => new HttpResponse(null, { status: 500 })));

        const { result } = renderHook(() => useResetPassword(), { wrapper });

        act(() => {
            changeField(result.current.handlePasswordChange, 'senha123');
            changeField(result.current.handleConfirmPasswordChange, 'senha123');
        });

        await act(async () => {
            await result.current.handleSubmit(submitEvent());
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showSuccessToast).not.toHaveBeenCalled();
        // O toast local fixo ("validation.unexpectedError") não deve mais ser disparado —
        // o interceptor Axios (httpInterceptors.ts) já mostra a mensagem real do backend.
        expect(showErrorToast).not.toHaveBeenCalledWith('Ocorreu um erro inesperado. Tente novamente.', expect.anything());
    });

    it('mostra toast de sucesso quando a API responde ok', async () => {
        server.use(http.post(`*${API_URLS.AUTH_RESET_PASSWORD}`, () => HttpResponse.json({ success: true, data: 'Senha redefinida.' })));

        const { result } = renderHook(() => useResetPassword(), { wrapper });

        act(() => {
            changeField(result.current.handlePasswordChange, 'senha123');
            changeField(result.current.handleConfirmPasswordChange, 'senha123');
        });

        await act(async () => {
            await result.current.handleSubmit(submitEvent());
        });

        await waitFor(() => expect(showSuccessToast).toHaveBeenCalledWith('Senha redefinida.'));
    });
});
