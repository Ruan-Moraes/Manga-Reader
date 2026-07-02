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
    features: ['Feature X'],
};

function renderCard(props: Partial<Parameters<typeof PricingCard>[0]> = {}) {
    const defaultProps = {
        plan: BASE_PLAN,
        equivLabel: 'equivale a',
        saveLabel: 'economize',
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
        renderCard({ plan: { ...BASE_PLAN, price: 'R$ 19,90' } });

        expect(screen.getByText(/19,90/)).toBeInTheDocument();
    });

    it('renders features list', () => {
        renderCard({ plan: { ...BASE_PLAN, features: ['Feature X'] } });

        expect(screen.getByText('Feature X')).toBeInTheDocument();
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
