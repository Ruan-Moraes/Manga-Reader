import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { buildAdminChapter, adminChapterPresets } from '@/test/factories/admin';

import AdminChapterList from '../AdminChapterList';

const noop = vi.fn;

const baseProps = {
    page: 0,
    totalPages: 1,
    isLoading: false,
    onPageChange: noop(),
    onEdit: noop(),
    onDuplicate: noop(),
    onDelete: noop(),
    sort: 'number' as const,
    direction: 'asc' as const,
    onSortChange: noop(),
    selectedKeys: new Set<string>(),
    onToggleRow: noop(),
    onToggleAll: noop(),
    onBulkStatus: noop(),
    onBulkDelete: noop(),
    onClearSelection: noop(),
};

describe('AdminChapterList', () => {
    it('renderiza colunas principais: número, título, status, páginas e leituras', () => {
        const chapter = buildAdminChapter({ number: '42', title: 'Batalha Final', titleName: 'Reino de Aço', pagesCount: 18, readyPagesCount: 18, reads: 1234 });
        render(<AdminChapterList {...baseProps} chapters={[chapter]} />);

        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Batalha Final')).toBeInTheDocument();
        expect(screen.getByText('Reino de Aço')).toBeInTheDocument();
        expect(screen.getByText('Publicado')).toBeInTheDocument();
        expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('mostra progresso de páginas quando nem todas estão prontas', () => {
        const chapter = buildAdminChapter({ pagesCount: 10, readyPagesCount: 4 });
        render(<AdminChapterList {...baseProps} chapters={[chapter]} />);
        expect(screen.getByText('4/10')).toBeInTheDocument();
    });

    it('estado vazio', () => {
        render(<AdminChapterList {...baseProps} chapters={[]} />);
        expect(screen.getByText('Nenhum capítulo encontrado.')).toBeInTheDocument();
    });

    it('estado de erro com retry', () => {
        const onRetry = vi.fn();
        render(<AdminChapterList {...baseProps} chapters={[]} isError onRetry={onRetry} />);

        expect(screen.getByText('Erro ao carregar capítulos')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /tentar/i }));
        expect(onRetry).toHaveBeenCalled();
    });

    it('barra de ações em lote aparece só com seleção e dispara callbacks', () => {
        const chapters = [buildAdminChapter(), buildAdminChapter()];
        const onBulkStatus = vi.fn();
        const onBulkDelete = vi.fn();

        const { rerender } = render(<AdminChapterList {...baseProps} chapters={chapters} onBulkStatus={onBulkStatus} onBulkDelete={onBulkDelete} />);
        expect(screen.queryByText(/selecionados/)).not.toBeInTheDocument();

        rerender(<AdminChapterList {...baseProps} chapters={chapters} selectedKeys={new Set([chapters[0].id])} onBulkStatus={onBulkStatus} onBulkDelete={onBulkDelete} />);
        expect(screen.getByText('1 selecionados')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Alterar status' }));
        expect(onBulkStatus).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Excluir selecionados' }));
        expect(onBulkDelete).toHaveBeenCalled();
    });

    it('ações de linha: editar, duplicar e excluir', () => {
        const chapter = adminChapterPresets.draft();
        const onEdit = vi.fn();
        const onDuplicate = vi.fn();
        const onDelete = vi.fn();

        render(<AdminChapterList {...baseProps} chapters={[chapter]} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />);

        fireEvent.click(screen.getByLabelText('Editar capítulo'));
        expect(onEdit).toHaveBeenCalledWith(chapter);

        fireEvent.click(screen.getByLabelText('Duplicar capítulo como rascunho'));
        expect(onDuplicate).toHaveBeenCalledWith(chapter);

        fireEvent.click(screen.getByLabelText('Excluir capítulo'));
        expect(onDelete).toHaveBeenCalledWith(chapter);
    });

    it('ordenação server-side: clicar em coluna ordenável dispara onSortChange', () => {
        const onSortChange = vi.fn();
        render(<AdminChapterList {...baseProps} chapters={[buildAdminChapter()]} onSortChange={onSortChange} />);

        fireEvent.click(screen.getByText('Leituras'));
        expect(onSortChange).toHaveBeenCalledWith('reads', 'asc');
    });
});
