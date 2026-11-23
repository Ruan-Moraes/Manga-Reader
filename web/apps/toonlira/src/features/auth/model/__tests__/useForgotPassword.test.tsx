import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import useForgotPassword from '../useForgotPassword';

vi.mock('@shared/service/util/toastService', () => ({
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
}));

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

const changeEmail = (value: string) =>
    ({ target: { value } }) as unknown as React.ChangeEvent<HTMLInputElement>;

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent<HTMLFormElement>;

describe('useForgotPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('mostra toast de validacao local quando email invalido (nao passa pelo interceptor)', async () => {
        const { result } = renderHook(() => useForgotPassword());

        act(() => {
            result.current.handleEmailChange(changeEmail('invalido'));
        });

        await act(async () => {
            await result.current.handleSubmit(submitEvent());
        });

        expect(showErrorToast).toHaveBeenCalledWith('Corrija os erros no formulário.', expect.objectContaining({ toastId: 'forgot-password-validation' }));
    });

    it('nao dispara toast de erro local quando a API falha (delegado ao interceptor Axios)', async () => {
        server.use(http.post(`*${API_URLS.AUTH_FORGOT_PASSWORD}`, () => new HttpResponse(null, { status: 500 })));

        const { result } = renderHook(() => useForgotPassword());

        act(() => {
            result.current.handleEmailChange(changeEmail('user@example.com'));
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

    it('mostra toast de sucesso e marca como enviado quando a API responde ok', async () => {
        server.use(
            http.post(`*${API_URLS.AUTH_FORGOT_PASSWORD}`, () =>
                HttpResponse.json({ success: true, data: { message: 'Email enviado.', expiresInSeconds: 1800 } }),
            ),
        );

        const { result } = renderHook(() => useForgotPassword());

        act(() => {
            result.current.handleEmailChange(changeEmail('user@example.com'));
        });

        await act(async () => {
            await result.current.handleSubmit(submitEvent());
        });

        await waitFor(() => expect(result.current.isSubmitted).toBe(true));

        expect(showSuccessToast).toHaveBeenCalledWith('Email enviado.');
    });
});
