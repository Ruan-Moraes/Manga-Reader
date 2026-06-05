import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Star } from 'lucide-react';
import { Badge } from '../Badge';

describe('Badge', () => {
    it('renderiza texto', () => {
        render(<Badge>Mangá</Badge>);
        expect(screen.getByText('Mangá')).toBeInTheDocument();
    });

    it('variant accent por padrão', () => {
        const { container } = render(<Badge>Accent</Badge>);
        expect(container.firstChild).toHaveClass('bg-mr-accent-25');
    });

    it('variant neutral', () => {
        const { container } = render(<Badge variant="neutral">Neutral</Badge>);
        expect(container.firstChild).toHaveClass('bg-mr-gray-800');
    });

    it('variant danger', () => {
        const { container } = render(<Badge variant="danger">Danger</Badge>);
        expect(container.firstChild).toHaveClass('text-mr-danger');
    });

    it('renderiza ícone quando passado', () => {
        const { container } = render(<Badge icon={Star}>Rating</Badge>);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
