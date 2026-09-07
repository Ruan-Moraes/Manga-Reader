import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Modal } from '../../Modal';
import { ToastProvider } from '../ToastProvider';
import { dismissToast, getToastsSnapshot, pushToast } from '../toastStore';

beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
    });
});

beforeEach(() => {
    getToastsSnapshot().forEach(toast => dismissToast(toast.id));
});

const renderToastWithModal = (open: boolean, confirmClose = false) =>
    render(
        <ToastProvider>
            <Modal open={open} onClose={() => {}} title="Formulário" confirmClose={confirmClose}>
                Conteúdo
            </Modal>
        </ToastProvider>,
    );

describe('ToastProvider na top layer', () => {
    it('portaliza o toast dentro do modal ativo', async () => {
        renderToastWithModal(true);

        act(() => {
            pushToast({ title: 'Falha ao salvar', tone: 'danger', duration: 0 });
        });

        const toast = await screen.findByRole('alert');
        expect(document.querySelector('dialog')?.contains(toast)).toBe(true);
    });

    it('retorna o toast para o body depois que o modal fecha', async () => {
        const view = renderToastWithModal(true);

        act(() => {
            pushToast({ title: 'Falha ao salvar', tone: 'danger', duration: 0 });
        });
        await screen.findByRole('alert');

        view.rerender(
            <ToastProvider>
                <Modal open={false} onClose={() => {}} title="Formulário">
                    Conteúdo
                </Modal>
            </ToastProvider>,
        );

        await waitFor(() => {
            const toast = screen.getByRole('alert');
            expect(toast.parentElement?.parentElement).toBe(document.body);
        });
    });

    it('prioriza o diálogo de confirmação quando ele está aberto', async () => {
        renderToastWithModal(true, true);

        fireEvent.click(document.querySelector('dialog')!);
        expect(document.querySelectorAll('dialog')).toHaveLength(2);

        act(() => {
            pushToast({ title: 'Falha ao salvar', tone: 'danger', duration: 0 });
        });

        const toast = await screen.findByRole('alert');
        const dialogs = document.querySelectorAll('dialog');
        expect(dialogs[1].contains(toast)).toBe(true);
    });
});
