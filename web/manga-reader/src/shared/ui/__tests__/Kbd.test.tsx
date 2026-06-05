import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Kbd } from '../Kbd';

describe('Kbd', () => {
    it('renderiza como kbd element', () => {
        const { container } = render(<Kbd>Enter</Kbd>);
        expect(container.querySelector('kbd')).toBeInTheDocument();
    });

    it('exibe texto da tecla', () => {
        render(<Kbd>Esc</Kbd>);
        expect(screen.getByText('Esc')).toBeInTheDocument();
    });

    it('size sm aplica classes menores', () => {
        const { container } = render(<Kbd size="sm">K</Kbd>);
        expect(container.querySelector('kbd')).toHaveClass('text-[10px]');
    });

    it('size md é padrão', () => {
        const { container } = render(<Kbd>K</Kbd>);
        expect(container.querySelector('kbd')).toHaveClass('text-mr-tiny');
    });

    it('aceita className extra', () => {
        const { container } = render(<Kbd className="custom-class">S</Kbd>);
        expect(container.querySelector('kbd')).toHaveClass('custom-class');
    });
});
