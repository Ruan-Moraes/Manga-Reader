import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Star } from 'lucide-react';
import { Icon } from '../Icon';

describe('Icon', () => {
    it('renderiza ícone decorativo (aria-hidden)', () => {
        const { container } = render(<Icon icon={Star} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('renderiza ícone não-decorativo com role img', () => {
        const { container } = render(<Icon icon={Star} decorative={false} aria-label="Estrela" />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('role', 'img');
        expect(svg).not.toHaveAttribute('aria-hidden');
    });

    it('aplica tamanho correto', () => {
        const { container } = render(<Icon icon={Star} size={24} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', '24');
        expect(svg).toHaveAttribute('height', '24');
    });

    it('aplica className extra', () => {
        const { container } = render(<Icon icon={Star} className="text-mr-accent" />);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('class')).toContain('text-mr-accent');
    });
});
