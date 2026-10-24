import { beforeEach, describe, expect, it, vi } from 'vitest';

import { pushToast } from '@ui/toast/toastStore';
import { showErrorToast, showInfoToast, showSuccessToast, showWarningToast } from '../toastService';

vi.mock('@ui/toast/toastStore', () => ({
    pushToast: vi.fn(cfg => cfg?.id),
}));

const mockedPush = vi.mocked(pushToast);

describe('toastService → toast unificado', () => {
    beforeEach(() => mockedPush.mockClear());

    it('mapeia cada tipo para o tom correto', () => {
        showSuccessToast('ok');
        showErrorToast('falhou');
        showInfoToast('fyi');
        showWarningToast('cuidado');

        const tones = mockedPush.mock.calls.map(([c]) => c.tone);
        expect(tones).toEqual(['success', 'danger', 'neutral', 'accent']);
    });

    it('warning usa ícone de alerta; demais não forçam ícone', () => {
        showWarningToast('cuidado');
        showSuccessToast('ok');

        expect(mockedPush.mock.calls[0][0].icon).toBeTruthy();
        expect(mockedPush.mock.calls[1][0].icon).toBeUndefined();
    });

    it('usa toastId como id estável quando fornecido, senão deriva de tipo:mensagem', () => {
        showSuccessToast('Salvo', { toastId: 'save-success' });
        showErrorToast('Erro X');

        expect(mockedPush.mock.calls[0][0].id).toBe('save-success');
        expect(mockedPush.mock.calls[1][0].id).toBe('error:Erro X');
    });

    it('repassa position quando fornecido; senão fica undefined (padrão do store é bottom)', () => {
        showWarningToast('cuidado', { position: 'top' });
        showSuccessToast('ok');

        expect(mockedPush.mock.calls[0][0].position).toBe('top');
        expect(mockedPush.mock.calls[1][0].position).toBeUndefined();
    });
});
