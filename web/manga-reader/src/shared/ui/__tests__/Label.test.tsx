import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from '../Label';

describe('Label', () => {
    it('renderiza texto', () => {
        render(<Label>Email</Label>);
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renderiza asterisco quando required', () => {
        render(<Label required>Senha</Label>);
        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('sem required, sem asterisco', () => {
        render(<Label>Campo</Label>);
        expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('aplica htmlFor ao element label', () => {
        render(<Label htmlFor="meu-input">Label</Label>);
        const label = screen.getByText('Label').closest('label');
        expect(label).toHaveAttribute('for', 'meu-input');
    });

    it('contém classe mr-label', () => {
        const { container } = render(<Label>X</Label>);
        expect(container.querySelector('label')).toHaveClass('mr-label');
    });
});
