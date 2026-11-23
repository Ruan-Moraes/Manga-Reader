import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTestQueryClient, TestProviders } from '@/test/helpers/renderWithProviders';
import { CHAPTER_STORE_KEY, chapterAdminGateway } from '@entities/chapter';

import ChapterFormModal from '../ChapterFormModal';

const renderModal = (props: Partial<React.ComponentProps<typeof ChapterFormModal>> = {}) =>
    render(
        <TestProviders client={createTestQueryClient()}>
            <ChapterFormModal isOpen onClose={vi.fn()} chapterId={null} presetTitleId="1" presetTitleName="Reino de Aço" onSaved={vi.fn()} {...props} />
        </TestProviders>,
    );

describe('ChapterFormModal', () => {
    beforeEach(() => {
        localStorage.removeItem(CHAPTER_STORE_KEY);
    });

    it('desabilita salvar enquanto os campos obrigatórios não estão preenchidos', async () => {
        renderModal();

        const save = screen.getByRole('button', { name: 'Salvar' });
        expect(save).toBeDisabled();

        await userEvent.type(screen.getByPlaceholderText('Ex.: O Despertar da Forja'), 'Capítulo especial');
        await userEvent.type(screen.getByPlaceholderText('12.5'), '999');

        await waitFor(() => expect(save).toBeEnabled(), { timeout: 5000 });
    });

    it('mostra erro inline de numeração duplicada (mesma regra do gateway)', async () => {
        // Semeia a obra 1 para existirem números ocupados.
        await chapterAdminGateway.list({ page: 0, size: 1, titleId: '1' });
        renderModal();

        await userEvent.type(screen.getByPlaceholderText('Ex.: O Despertar da Forja'), 'Duplicado');
        await userEvent.type(screen.getByPlaceholderText('12.5'), '1');

        expect(await screen.findByText('Já existe o capítulo 1 nesta obra.', {}, { timeout: 5000 })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    });

    it('mostra erro inline de numeração inválida', async () => {
        renderModal();

        await userEvent.type(screen.getByPlaceholderText('12.5'), '1.2.3');

        expect(await screen.findByText(/Numeração inválida/)).toBeInTheDocument();
    });

    it('agendamento com data passada mostra erro e bloqueia submit', async () => {
        renderModal();

        await userEvent.type(screen.getByPlaceholderText('Ex.: O Despertar da Forja'), 'Agendado');
        await userEvent.type(screen.getByPlaceholderText('12.5'), '998');
        // Select do DS é um dropdown custom: abre pelo combobox e clica na opção.
        await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Agendado' }));

        expect(await screen.findByText('O agendamento exige uma data futura.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    });

    it('criação válida persiste no gateway e chama onSaved', async () => {
        const onSaved = vi.fn();
        renderModal({ onSaved });

        await userEvent.type(screen.getByPlaceholderText('Ex.: O Despertar da Forja'), 'Novo capítulo válido');
        await userEvent.type(screen.getByPlaceholderText('12.5'), '997');

        const save = screen.getByRole('button', { name: 'Salvar' });
        await waitFor(() => expect(save).toBeEnabled(), { timeout: 5000 });
        await userEvent.click(save);

        await waitFor(() => expect(onSaved).toHaveBeenCalled(), { timeout: 5000 });
        const created = (await chapterAdminGateway.list({ page: 0, size: 100, titleId: '1', search: 'Novo capítulo válido' })).content;
        expect(created).toHaveLength(1);
        expect(created[0].status).toBe('draft');
    });

    it('edição carrega os dados do capítulo existente', async () => {
        await chapterAdminGateway.list({ page: 0, size: 1 });
        const existing = await chapterAdminGateway.create({ titleId: '1', title: 'Para editar', number: '996' });

        renderModal({ chapterId: existing.id });

        await waitFor(() => expect(screen.getByPlaceholderText('Ex.: O Despertar da Forja')).toHaveValue('Para editar'), { timeout: 5000 });
        expect(screen.getByPlaceholderText('12.5')).toHaveValue('996');
    });
});
