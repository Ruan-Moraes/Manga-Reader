import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StoreBadge from '../StoreBadge';

describe('StoreBadge', () => {
    it('does not create a fake link without a configured store URL', () => {
        render(<StoreBadge kind="apple" line1="Baixar na" line2="App Store" />);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(
            screen.getByText('App Store').closest('[aria-disabled="true"]'),
        ).toBeInTheDocument();
    });

    it('adds pointer and hover feedback when the badge has a store URL', () => {
        render(
            <StoreBadge
                kind="apple"
                line1="Baixar na"
                line2="App Store"
                href="https://example.com/app-store"
            />,
        );

        expect(screen.getByRole('link', { name: /app store/i })).toHaveClass(
            'cursor-pointer',
            'transition-[border-color,background-color,translate,scale,box-shadow]',
            'hover:-translate-y-0.5',
            'active:scale-[0.985]',
        );
    });
});
