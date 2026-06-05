import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axeComponent } from '@/test/helpers/axe';
import { Drawer } from '../Drawer';

describe('Drawer a11y', () => {
    it('exposes a labelled modal dialog with no axe violations', async () => {
        const { container } = render(
            <Drawer open onClose={() => {}} title="Filtros">
                <button type="button">Aplicar</button>
            </Drawer>,
        );

        const dialog = screen.getByRole('dialog', { name: 'Filtros' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('moves focus into the drawer on open', () => {
        render(
            <Drawer open onClose={() => {}} title="Filtros">
                <button type="button">Aplicar</button>
            </Drawer>,
        );

        // First focusable inside the panel is the close (X) button.
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fechar' }));
    });

    it('closes on Escape', () => {
        let closed = false;
        render(
            <Drawer open onClose={() => (closed = true)} title="Filtros">
                <button type="button">Aplicar</button>
            </Drawer>,
        );

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(closed).toBe(true);
    });
});
