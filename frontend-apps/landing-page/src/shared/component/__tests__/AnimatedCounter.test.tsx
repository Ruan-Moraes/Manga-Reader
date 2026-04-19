import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AnimatedCounter from '../AnimatedCounter';

describe('AnimatedCounter', () => {
    it('renders with target value eventually', async () => {
        render(<AnimatedCounter target={100} />);

        expect(screen.getByText(/0/)).toBeInTheDocument();
    });

    it('renders suffix after the number', () => {
        render(<AnimatedCounter target={50} suffix="+" />);

        expect(screen.getByText(/\+/)).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(
            <AnimatedCounter target={10} className="text-accent" />,
        );

        const span = container.firstChild as HTMLElement;
        expect(span.className).toContain('text-accent');
    });
});
