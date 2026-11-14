import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Footer from '../Footer';
import { TestProviders } from '@/test/testUtils';

describe('Footer', () => {
    it('keeps relevant links without rendering a language selector', () => {
        render(
            <TestProviders>
                <Footer />
            </TestProviders>,
        );

        expect(
            screen.queryByRole('group', { name: 'Idioma' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Acessar plataforma' }),
        ).toHaveAttribute('href', 'http://localhost:5173/');
        expect(
            screen.getByRole('link', { name: 'Central de ajuda' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Termos' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Privacidade' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Benefícios' }),
        ).not.toHaveClass('hover:bg-[rgb(255_255_255_/_4%)]');
        expect(
            screen.getByRole('button', { name: 'Voltar ao topo' }),
        ).toHaveClass(
            'shadow-[var(--shadow-floating)]',
            'transition-[border-color,color,background-color,box-shadow,translate,scale]',
        );
    });
});
