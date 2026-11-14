import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccordionItem } from '../Accordion';

describe('AccordionItem', () => {
    it('starts closed by default', () => {
        render(<AccordionItem title="Pergunta">Resposta</AccordionItem>);
        const trigger = screen.getByRole('button', { name: /pergunta/i });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('content is hidden when closed', () => {
        render(<AccordionItem title="Pergunta">Resposta</AccordionItem>);
        expect(screen.getByText('Resposta').closest('[hidden]')).toBeInTheDocument();
    });

    it('opens on click', async () => {
        const user = userEvent.setup();
        render(<AccordionItem title="Pergunta">Resposta</AccordionItem>);
        await user.click(screen.getByRole('button', { name: /pergunta/i }));
        expect(screen.getByRole('button', { name: /pergunta/i })).toHaveAttribute('aria-expanded', 'true');
    });

    it('content visible after open', async () => {
        const user = userEvent.setup();
        render(<AccordionItem title="Pergunta">Resposta</AccordionItem>);
        await user.click(screen.getByRole('button', { name: /pergunta/i }));
        expect(screen.getByText('Resposta').closest('[hidden]')).not.toBeInTheDocument();
    });

    it('closes again on second click', async () => {
        const user = userEvent.setup();
        render(<AccordionItem title="Pergunta">Resposta</AccordionItem>);
        const trigger = screen.getByRole('button', { name: /pergunta/i });
        await user.click(trigger);
        await user.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('starts open when defaultOpen=true', () => {
        render(
            <AccordionItem title="Pergunta" defaultOpen>
                Resposta
            </AccordionItem>,
        );
        expect(screen.getByRole('button', { name: /pergunta/i })).toHaveAttribute('aria-expanded', 'true');
    });

    it('aria-controls points to panel id', () => {
        render(<AccordionItem title="Pergunta">Resposta</AccordionItem>);
        const trigger = screen.getByRole('button', { name: /pergunta/i });
        const panelId = trigger.getAttribute('aria-controls');
        expect(panelId).toBeTruthy();
        expect(document.getElementById(panelId!)).toBeInTheDocument();
    });

    it('controlled mode: respects open prop', () => {
        render(
            <AccordionItem title="Pergunta" open={true} onOpenChange={vi.fn()}>
                Resposta
            </AccordionItem>,
        );
        expect(screen.getByRole('button', { name: /pergunta/i })).toHaveAttribute('aria-expanded', 'true');
    });

    it('controlled mode: calls onOpenChange on click', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        render(
            <AccordionItem title="Pergunta" open={false} onOpenChange={onOpenChange}>
                Resposta
            </AccordionItem>,
        );
        await user.click(screen.getByRole('button', { name: /pergunta/i }));
        expect(onOpenChange).toHaveBeenCalledWith(true);
    });
});
