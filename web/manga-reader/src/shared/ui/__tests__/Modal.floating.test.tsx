import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Modal } from '../Modal';
import { Select } from '../Select';
import { DropdownMenu } from '../DropdownMenu';

/**
 * O <dialog> nativo vive na top layer do navegador — qualquer conteúdo portalado
 * para document.body fica ATRÁS dele, por maior que seja o z-index.
 *
 * jsdom não tem modelo de paint/top-layer, então não dá para assertar "renderiza
 * acima" — o que estes testes verificam é o MECANISMO que garante o empilhamento:
 * o conteúdo flutuante é portalado para DENTRO do próprio dialog
 * (FloatingPortalContext), onde participa do stacking context do modal.
 * Empilhamento visual real, flip perto das bordas e reposição em scroll são
 * verificação manual no browser.
 */
beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
    });
});

const modalProps = {
    open: true,
    onClose: vi.fn(),
    title: 'Formulário',
};

describe('conteúdo flutuante dentro do Modal', () => {
    it('Select portala o menu de opções para dentro do <dialog>', async () => {
        const user = userEvent.setup();
        render(
            <Modal {...modalProps}>
                <Select
                    aria-label="Status"
                    value=""
                    onChange={() => {}}
                    options={[
                        { value: 'draft', label: 'Rascunho' },
                        { value: 'published', label: 'Publicado' },
                    ]}
                />
            </Modal>,
        );

        await user.click(screen.getByRole('combobox', { name: /status/i }));

        const menu = await screen.findByRole('menu');
        const dialog = document.querySelector('dialog')!;
        expect(dialog.contains(menu)).toBe(true);
    });

    it('opção do Select continua clicável e atualiza o select nativo', async () => {
        const user = userEvent.setup();
        const received: string[] = [];
        // Captura o value no momento do evento — o select controlado é resetado pelo re-render.
        const onChange = vi.fn((e: React.ChangeEvent<HTMLSelectElement>) => received.push(e.target.value));
        render(
            <Modal {...modalProps}>
                <Select
                    aria-label="Status"
                    value=""
                    onChange={onChange}
                    options={[
                        { value: 'draft', label: 'Rascunho' },
                        { value: 'published', label: 'Publicado' },
                    ]}
                />
            </Modal>,
        );

        await user.click(screen.getByRole('combobox', { name: /status/i }));
        await user.click(await screen.findByRole('menuitem', { name: /publicado/i }));

        await waitFor(() => expect(onChange).toHaveBeenCalled());
        expect(received[0]).toBe('published');
    });

    it('Select fora de Modal continua portalando para o body', async () => {
        const user = userEvent.setup();
        render(<Select aria-label="Status" value="" onChange={() => {}} options={[{ value: 'a', label: 'Opção A' }]} />);

        await user.click(screen.getByRole('combobox', { name: /status/i }));

        const menu = await screen.findByRole('menu');
        expect(document.querySelector('dialog')).toBeNull();
        expect(document.body.contains(menu)).toBe(true);
    });

    it('DropdownMenu portala o conteúdo para dentro do <dialog>', async () => {
        const user = userEvent.setup();
        render(
            <Modal {...modalProps}>
                <DropdownMenu trigger={<button>Ações</button>} items={[{ label: 'Editar', onSelect: () => {} }]} />
            </Modal>,
        );

        await user.click(screen.getByRole('button', { name: /ações/i }));

        const menu = await screen.findByRole('menu');
        const dialog = document.querySelector('dialog')!;
        expect(dialog.contains(menu)).toBe(true);
    });
});
