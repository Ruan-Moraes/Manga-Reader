import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

import PricingCard from '../PricingCard';

import type { PlanView } from '@/shared/data/landing';

i18n.changeLanguage('pt-BR');

const BASE_PLAN: PlanView = {
    name: 'Mensal',
    price: 'R$ 14,90',
    period: '/mês',
    description: 'Assinatura mensal com acesso completo.',
    features: ['Feature X'],
};

function renderCard(props: Partial<Parameters<typeof PricingCard>[0]> = {}) {
    const defaultProps = {
        plan: BASE_PLAN,
        ctaLabel: 'Assinar Mensal',
        onSelect: vi.fn(),
        ...props,
    };

    return {
        ...render(
            <I18nextProvider i18n={i18n}>
                <PricingCard {...defaultProps} />
            </I18nextProvider>,
        ),
        onSelect: defaultProps.onSelect,
    };
}

describe('PricingCard', () => {
    it('renders plan price', () => {
        const { container } = renderCard({
            plan: { ...BASE_PLAN, price: 'R$ 19,90' },
        });

        expect(screen.getByText(/19,90/)).toBeInTheDocument();
        expect(container.querySelector('strong')?.parentElement).toHaveClass(
            'grid-cols-[minmax(0,1fr)_4.5rem]',
            '@max-[300px]:grid-cols-[minmax(0,1fr)_3.25rem]',
        );
    });

    it('renders features list', () => {
        renderCard({ plan: { ...BASE_PLAN, features: ['Feature X'] } });

        expect(screen.getByText('Feature X')).toBeInTheDocument();
    });

    it('renders the description returned by the API', () => {
        renderCard();

        expect(
            screen.getByText('Assinatura mensal com acesso completo.'),
        ).toBeInTheDocument();
    });

    it('shows the ribbon label when provided', () => {
        renderCard({ accent: true, ribbonLabel: 'Mais popular' });

        expect(screen.getByText('Mais popular')).toBeInTheDocument();
    });

    it('does not show ribbon when no label given', () => {
        renderCard();

        expect(screen.queryByText('Mais popular')).not.toBeInTheDocument();
    });

    it('calls onSelect when button clicked', async () => {
        const user = userEvent.setup();

        const { onSelect } = renderCard();

        await user.click(screen.getByRole('button'));

        expect(onSelect).toHaveBeenCalled();
    });
});
