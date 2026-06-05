import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageCircle } from 'lucide-react';
import { Footer } from '../Footer';
import type { FooterColumn, FooterSocialLink } from '../Footer';

const columns: FooterColumn[] = [
    {
        title: 'Produto',
        links: [
            { label: 'Início', href: '/home' },
            { label: 'Categorias', href: '/categories' },
        ],
    },
    {
        title: 'Legal',
        links: [{ label: 'Termos', href: '/legal/terms' }],
    },
];

describe('Footer', () => {
    it('renders footer landmark', () => {
        render(<Footer columns={columns} />);
        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('renders wordmark', () => {
        render(<Footer columns={columns} />);
        expect(screen.getByText('Reader')).toBeInTheDocument();
    });

    it('renders column titles in both accordion and desktop views', () => {
        render(<Footer columns={columns} />);
        expect(screen.getAllByText('Produto').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Legal').length).toBeGreaterThan(0);
    });

    it('renders column links', () => {
        render(<Footer columns={columns} />);
        expect(screen.getByRole('link', { name: /início/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /termos/i })).toBeInTheDocument();
    });

    it('renders nav landmark for columns', () => {
        render(<Footer columns={columns} />);
        expect(screen.getByRole('navigation', { name: /rodapé/i })).toBeInTheDocument();
    });

    it('renders provided copyright', () => {
        render(<Footer columns={columns} copyright="© 2025 Manga Reader" />);
        expect(screen.getByText(/© 2025 manga reader/i)).toBeInTheDocument();
    });

    it('renders default copyright when not provided', () => {
        render(<Footer columns={columns} />);
        expect(screen.getByText(/manga reader/i)).toBeInTheDocument();
    });

    it('renders newsletter form by default', () => {
        render(<Footer columns={columns} />);
        expect(screen.getByPlaceholderText(/seu@email/i)).toBeInTheDocument();
    });

    it('calls onSubscribe with email and swaps to success state', async () => {
        const user = userEvent.setup();
        const onSubscribe = vi.fn();
        render(<Footer columns={columns} onSubscribe={onSubscribe} />);
        await user.type(screen.getByPlaceholderText(/seu@email/i), 'test@test.com');
        await user.click(screen.getByRole('button', { name: /inscrever/i }));
        expect(onSubscribe).toHaveBeenCalledWith('test@test.com');
        expect(await screen.findByText(/Pronto!/i)).toBeInTheDocument();
    });

    it('renders socials with aria labels', () => {
        const socials: FooterSocialLink[] = [{ name: 'discord', href: 'https://d', icon: MessageCircle, ariaLabel: 'Discord' }];
        render(<Footer columns={columns} socials={socials} />);
        expect(screen.getByRole('link', { name: /discord/i })).toBeInTheDocument();
    });

    it('renders legacy preferences slot', () => {
        render(<Footer columns={columns} preferences={<button>Idioma</button>} />);
        expect(screen.getByRole('button', { name: /idioma/i })).toBeInTheDocument();
    });

    it('toggles accordion button aria-expanded', async () => {
        const user = userEvent.setup();
        render(<Footer columns={columns} />);
        const buttons = screen.getAllByRole('button', { expanded: true });
        expect(buttons.length).toBeGreaterThan(0);
        await user.click(buttons[0]!);
        expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    });
});
