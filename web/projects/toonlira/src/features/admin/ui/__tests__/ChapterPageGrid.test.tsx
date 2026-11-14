import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { buildChapterPage, chapterPagePresets } from '@/test/factories/admin';

import ChapterPageGrid from '../parts/ChapterPageGrid';

const noop = vi.fn;

const baseProps = {
    isSubmitting: false,
    onAddPages: noop(),
    onRemovePage: noop(),
    onRemovePages: noop(),
    onReplacePage: noop(),
    onReorder: noop(),
    onMovePage: noop(),
    onRetryPage: noop(),
};

describe('ChapterPageGrid', () => {
    it('estado vazio orienta a adicionar páginas', () => {
        render(<ChapterPageGrid {...baseProps} pages={[]} />);
        expect(screen.getByText('Sem páginas')).toBeInTheDocument();
    });

    it('renderiza páginas ordenadas com número/posição e contagem', () => {
        const pages = [buildChapterPage({ order: 2 }), buildChapterPage({ order: 1 })];
        render(<ChapterPageGrid {...baseProps} pages={pages} />);

        expect(screen.getByText('2 páginas')).toBeInTheDocument();
        const positions = screen.getAllByLabelText(/Posição da página/).map(el => (el as HTMLInputElement).value);
        expect(positions).toEqual(['1', '2']);
    });

    it('página com erro exibe badge e botão de retry', () => {
        const broken = chapterPagePresets.error();
        const onRetryPage = vi.fn();
        render(<ChapterPageGrid {...baseProps} pages={[broken]} onRetryPage={onRetryPage} />);

        expect(screen.getByText('Erro')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
        expect(onRetryPage).toHaveBeenCalledWith(broken.id);
    });

    it('página em processamento mostra o estágio do pipeline', () => {
        render(<ChapterPageGrid {...baseProps} pages={[chapterPagePresets.uploading(), chapterPagePresets.processing()]} />);
        expect(screen.getByText('Enviando')).toBeInTheDocument();
        expect(screen.getByText('Processando')).toBeInTheDocument();
    });

    it('mudança manual de posição aplica no blur (não a cada dígito)', () => {
        const pages = [buildChapterPage({ order: 1 }), buildChapterPage({ order: 2 }), buildChapterPage({ order: 3 })];
        const onMovePage = vi.fn();
        render(<ChapterPageGrid {...baseProps} pages={pages} onMovePage={onMovePage} />);

        const first = screen.getByLabelText('Posição da página 1');
        fireEvent.change(first, { target: { value: '3' } });
        expect(onMovePage).not.toHaveBeenCalled();

        fireEvent.blur(first);
        expect(onMovePage).toHaveBeenCalledWith(pages[0].id, 3);
    });

    it('seleção múltipla remove várias páginas de uma vez', () => {
        const pages = [buildChapterPage({ order: 1 }), buildChapterPage({ order: 2 })];
        const onRemovePages = vi.fn();
        render(<ChapterPageGrid {...baseProps} pages={pages} onRemovePages={onRemovePages} />);

        fireEvent.click(screen.getByLabelText('Selecionar página 1'));
        fireEvent.click(screen.getByLabelText('Selecionar página 2'));
        fireEvent.click(screen.getByRole('button', { name: 'Remover 2' }));

        expect(onRemovePages).toHaveBeenCalledWith([pages[0].id, pages[1].id]);
    });

    it('upload múltiplo mockado: selecionar arquivos dispara onAddPages com os nomes', () => {
        const onAddPages = vi.fn();
        render(<ChapterPageGrid {...baseProps} pages={[]} onAddPages={onAddPages} />);

        const input = screen.getByTestId('add-pages-input');
        const files = [new File(['a'], 'pg01.jpg', { type: 'image/jpeg' }), new File(['b'], 'pg02.png', { type: 'image/png' })];
        fireEvent.change(input, { target: { files } });

        expect(onAddPages).toHaveBeenCalledWith([{ originalFilename: 'pg01.jpg' }, { originalFilename: 'pg02.png' }]);
    });

    it('substituir página usa o arquivo selecionado', () => {
        const page = buildChapterPage({ order: 1 });
        const onReplacePage = vi.fn();
        render(<ChapterPageGrid {...baseProps} pages={[page]} onReplacePage={onReplacePage} />);

        fireEvent.click(screen.getByLabelText('Substituir página 1'));
        fireEvent.change(screen.getByTestId('replace-page-input'), { target: { files: [new File(['x'], 'nova.webp', { type: 'image/webp' })] } });

        expect(onReplacePage).toHaveBeenCalledWith(page.id, { originalFilename: 'nova.webp' });
    });

    it('prévia ampliada abre lightbox com a imagem da página', () => {
        const page = buildChapterPage({ order: 1, originalFilename: 'capa.jpg' });
        render(<ChapterPageGrid {...baseProps} pages={[page]} />);

        fireEvent.click(screen.getByLabelText('Ampliar página 1'));

        expect(screen.getByRole('dialog', { name: 'capa.jpg' })).toBeInTheDocument();
    });
});
