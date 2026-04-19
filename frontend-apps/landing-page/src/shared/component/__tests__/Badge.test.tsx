import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Badge from '../Badge';

describe('Badge', () => {
    it('renders icon and label', () => {
        render(<Badge icon={<span data-testid="icon">★</span>} label="Test" />);

        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('applies default variant classes', () => {
        const { container } = render(<Badge icon="★" label="Default" />);

        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain('bg-secondary');
        expect(badge.className).toContain('border-tertiary');
    });

    it('applies highlight variant classes', () => {
        const { container } = render(
            <Badge icon="★" label="Highlighted" variant="highlight" />,
        );

        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain('bg-accent-subtle');
        expect(badge.className).toContain('border-accent');
    });
});
