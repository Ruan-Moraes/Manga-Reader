import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MangaCard } from '../MangaCard';
import type { Manga } from '../MangaCard';

const manga: Manga = {
    id: '1',
    title: 'Berserk',
    author: 'K. Miura',
    rating: 4.9,
    chapter: 370,
};

describe('MangaCard', () => {
    it('renders manga title', () => {
        render(<MangaCard manga={manga} />);
        expect(screen.getByText('Berserk')).toBeInTheDocument();
    });

    it('renders author', () => {
        render(<MangaCard manga={manga} />);
        expect(screen.getByText('K. Miura')).toBeInTheDocument();
    });

    it('renders chapter number', () => {
        render(<MangaCard manga={manga} />);
        expect(screen.getByText(/cap\. 370/i)).toBeInTheDocument();
    });

    it('calls onClick when card clicked', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<MangaCard manga={manga} onClick={onClick} />);
        await user.click(screen.getByText('Berserk'));
        expect(onClick).toHaveBeenCalled();
    });

    it('shows bookmark button when onToggleLibrary provided', () => {
        render(<MangaCard manga={manga} onToggleLibrary={vi.fn()} />);
        expect(screen.getByRole('button', { name: /adicionar à biblioteca/i })).toBeInTheDocument();
    });

    it('shows remove label when inLibrary=true', () => {
        render(<MangaCard manga={manga} onToggleLibrary={vi.fn()} inLibrary />);
        expect(screen.getByRole('button', { name: /remover da biblioteca/i })).toBeInTheDocument();
    });

    it('calls onToggleLibrary when bookmark clicked', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();
        render(<MangaCard manga={manga} onToggleLibrary={onToggle} />);
        await user.click(screen.getByRole('button', { name: /adicionar à biblioteca/i }));
        expect(onToggle).toHaveBeenCalled();
    });

    it('renders tag slot', () => {
        render(<MangaCard manga={manga} tag={<span>Novo</span>} />);
        expect(screen.getByText('Novo')).toBeInTheDocument();
    });

    it('does not show author when not provided', () => {
        render(<MangaCard manga={{ id: '2', title: 'Solo' }} />);
        expect(screen.queryByText('K. Miura')).not.toBeInTheDocument();
    });
});
