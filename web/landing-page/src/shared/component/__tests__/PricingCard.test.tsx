import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

import PricingCard from '../PricingCard';
import { buildPlan } from '@/test/factories/planFactory';

i18n.changeLanguage('pt-BR');

function renderCard(props: Partial<Parameters<typeof PricingCard>[0]> = {}) {
    const defaultProps = {
        plan: buildPlan(),
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
        renderCard({ plan: buildPlan({ priceInCents: 1990 }) });

        expect(screen.getByText(/19,90/)).toBeInTheDocument();
    });

    it('renders features list', () => {
        renderCard({
            plan: buildPlan({
                features: [{ key: 'x', label: 'Feature X' }],
            }),
        });

        expect(screen.getByText('Feature X')).toBeInTheDocument();
    });

    it('shows "Mais Popular" badge when highlighted', () => {
        renderCard({ isHighlighted: true });

        expect(screen.getByText('Mais Popular')).toBeInTheDocument();
    });

    it('does not show badge when not highlighted', () => {
        renderCard({ isHighlighted: false });

        expect(screen.queryByText('Mais Popular')).not.toBeInTheDocument();
    });

    it('calls onSelect with plan when button clicked', async () => {
        const user = userEvent.setup();

        const plan = buildPlan();

        const { onSelect } = renderCard({ plan });

        await user.click(screen.getByRole('button'));

        expect(onSelect).toHaveBeenCalledWith(plan);
    });
});
