import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

import { ReaderTopbar } from '../ReaderTopbar';

const createProps = (): ComponentProps<typeof ReaderTopbar> => ({
    title: 'Obra de teste',
    chapter: 12,
    page: 3,
    total: 27,
    hidden: false,
    saved: false,
    chaptersOpen: false,
    commentsOpen: false,
    settingsOpen: false,
    chaptersList: [{ num: 11, title: 'Capítulo anterior', when: '', isCurrent: false }],
    onBack: vi.fn(),
    onToggleChapters: vi.fn(),
    onPickChapter: vi.fn(),
    onToggleSaved: vi.fn(),
    onToggleComments: vi.fn(),
    onToggleSettings: vi.fn(),
});

describe('ReaderTopbar', () => {
    it('renders without status and preserves title, chapter and the supplied page total', () => {
        const { container } = renderWithProviders(<ReaderTopbar {...createProps()} />);

        expect(screen.getByText('Obra de teste')).toBeInTheDocument();
        expect(screen.getByText('Cap. 12')).toBeInTheDocument();
        expect(screen.getByText('03 / 27')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Obra de teste.*Cap\. 12/ })).toHaveAttribute('aria-expanded', 'false');
        expect(container.querySelector('.reader-title-meta')).not.toBeInTheDocument();
    });

    it('preserves the accessible navigation and action callbacks', async () => {
        const user = userEvent.setup();
        const props = createProps();
        renderWithProviders(<ReaderTopbar {...props} />);

        await user.click(screen.getByRole('button', { name: 'Voltar' }));
        await user.click(screen.getByRole('button', { name: /Obra de teste.*Cap\. 12/ }));
        await user.click(screen.getByRole('button', { name: 'Salvar' }));
        await user.click(screen.getByRole('button', { name: 'Comentários' }));
        await user.click(screen.getByRole('button', { name: 'Configurações' }));

        expect(props.onBack).toHaveBeenCalledOnce();
        expect(props.onToggleChapters).toHaveBeenCalledOnce();
        expect(props.onToggleSaved).toHaveBeenCalledOnce();
        expect(props.onToggleComments).toHaveBeenCalledOnce();
        expect(props.onToggleSettings).toHaveBeenCalledOnce();
        expect(props.onPickChapter).not.toHaveBeenCalled();
    });

    it('preserves chapter selection and expanded state', async () => {
        const user = userEvent.setup();
        const props = createProps();
        renderWithProviders(<ReaderTopbar {...props} chaptersOpen />);

        expect(screen.getByRole('button', { name: /Obra de teste.*Cap\. 12/ })).toHaveAttribute('aria-expanded', 'true');
        await user.click(screen.getByRole('button', { name: /Capítulo anterior/ }));
        expect(props.onPickChapter).toHaveBeenCalledExactlyOnceWith(11);
    });
});
