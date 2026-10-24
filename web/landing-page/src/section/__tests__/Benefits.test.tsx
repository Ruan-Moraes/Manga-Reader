import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import Benefits from '../Benefits';
import i18n from '@/i18n/config';
import { TestProviders } from '@/test/testUtils';

describe('Benefits', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('pt-BR');
    });

    it('renders benefit cards', () => {
        const { container } = render(
            <TestProviders>
                <Benefits />
            </TestProviders>,
        );

        expect(screen.getByText(/Biblioteca vasta/i)).toBeInTheDocument();
        expect(screen.getByText(/Atualizações diárias/i)).toBeInTheDocument();
        expect(screen.getByText(/Modo offline/i)).toBeInTheDocument();
        expect(screen.getByText(/Sem anúncios/i)).toBeInTheDocument();
        expect(screen.getByText('Leitura no seu idioma')).toBeInTheDocument();
        expect(container.querySelectorAll('#benefits ol > li')).toHaveLength(
            11,
        );
        expect(screen.getByText('01')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();
        expect(container.querySelector('#benefits ol')).toHaveClass(
            'text-left',
            'md:auto-rows-fr',
        );
        expect(
            screen.getByText('Biblioteca vasta').closest('article'),
        ).toHaveClass('text-left');
    });

    it('renders section with benefits id', () => {
        const { container } = render(
            <TestProviders>
                <Benefits />
            </TestProviders>,
        );

        expect(container.querySelector('#benefits')).toBeInTheDocument();
    });

    it('restarts every card animation when the language changes', async () => {
        render(
            <TestProviders>
                <Benefits />
            </TestProviders>,
        );
        const mobileFirstBefore = screen
            .getByText('Mobile-first')
            .closest('li');

        await act(async () => {
            await i18n.changeLanguage('en-US');
        });

        const mobileFirstAfter = screen.getByText('Mobile-first').closest('li');
        expect(mobileFirstAfter).not.toBe(mobileFirstBefore);
        expect(
            screen.getByText(/interface designed for the phone first/i),
        ).toBeInTheDocument();
    });
});
