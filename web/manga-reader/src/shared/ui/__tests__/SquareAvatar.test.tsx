import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SquareAvatar } from '../SquareAvatar';

describe('SquareAvatar', () => {
    it('exibe logo quando fornecido', () => {
        const { container } = render(<SquareAvatar name="Scan X" logo="/logo.png" size={48} />);
        expect(container.querySelector('img')).toHaveAttribute('src', '/logo.png');
    });

    it('deriva iniciais do name quando sem logo nem initials', () => {
        render(<SquareAvatar name="Carlos Silva" size={48} />);
        expect(screen.getByText('CS')).toBeInTheDocument();
    });

    it('initials sobrescreve name', () => {
        render(<SquareAvatar name="Carlos Silva" initials="RM" size={48} />);
        expect(screen.getByText('RM')).toBeInTheDocument();
    });

    it('fonte proporcional (0.36 * size) quando fontSize omitido', () => {
        render(<SquareAvatar initials="RM" color="#fff" size={50} />);
        expect(screen.getByText('RM')).toHaveStyle({ fontSize: '18px' });
    });

    it('fontSize explícito sobrescreve o proporcional', () => {
        render(<SquareAvatar initials="RM" color="#fff" size={50} fontSize={28} />);
        expect(screen.getByText('RM')).toHaveStyle({ fontSize: '28px' });
    });
});
