import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MangaCard } from '../MangaCard';
import type { Manga } from '../MangaCard';
import { setAdultContentPreference } from '@entities/user/@x/manga';

const manga: Manga = {
    id: '1',
    title: 'Berserk',
    author: 'K. Miura',
    rating: 4.9,
    chapter: 370,
};

describe('MangaCard', () => {
    afterEach(() => setAdultContentPreference('BLUR'));
    it('renders manga title', () => {
        render(<MangaCard manga={manga} />);
        expect(screen.getByText('Berserk')).toBeInTheDocument();
    });

    it('renders author', () => {
        render(<MangaCard manga={manga} />);
        expect(screen.getByText('K. Miura')).toHaveClass('text-mr-on-overlay/80');
    });

    it('renders chapter number', () => {
        render(<MangaCard manga={manga} />);
        expect(screen.getByText(/cap\. 370/i).parentElement).toHaveClass('text-mr-on-overlay/80');
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
        expect(screen.getByRole('button', { name: /salvar na biblioteca/i })).toHaveClass('!bg-mr-overlay-strong', '!text-mr-on-overlay');
    });

    it('shows remove label when inLibrary=true', () => {
        render(<MangaCard manga={manga} onToggleLibrary={vi.fn()} inLibrary />);
        expect(screen.getByRole('button', { name: /na biblioteca/i })).toHaveClass('!border-mr-accent', '!text-mr-accent');
    });

    it('calls onToggleLibrary when bookmark clicked', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();
        render(<MangaCard manga={manga} onToggleLibrary={onToggle} />);
        await user.click(screen.getByRole('button', { name: /salvar na biblioteca/i }));
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

    it('blurs adult content under BLUR until explicit reveal', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        setAdultContentPreference('BLUR');
        render(<MangaCard manga={{ ...manga, adult: true, cover: '/adult.jpg' }} onClick={onClick} />);

        await user.click(screen.getByRole('button', { name: /conteúdo adulto/i }));

        expect(screen.queryByRole('button', { name: /conteúdo adulto/i })).not.toBeInTheDocument();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('shows adult content normally under SHOW', () => {
        setAdultContentPreference('SHOW');
        render(<MangaCard manga={{ ...manga, adult: true, cover: '/adult.jpg' }} />);

        expect(screen.queryByRole('button', { name: /conteúdo adulto/i })).not.toBeInTheDocument();
    });
});
