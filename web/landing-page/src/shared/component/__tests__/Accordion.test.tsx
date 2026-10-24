import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Accordion from '../Accordion';

const ITEMS = [
    { question: 'Question 1?', answer: 'Answer 1.' },
    { question: 'Question 2?', answer: 'Answer 2.' },
];

describe('Accordion', () => {
    it('renders all questions', () => {
        render(<Accordion items={ITEMS} />);

        expect(screen.getByText('Question 1?')).toBeInTheDocument();
        expect(screen.getByText('Question 2?')).toBeInTheDocument();
    });

    it('keeps answers collapsed by default so the transition can run', () => {
        render(<Accordion items={ITEMS} />);

        const panel = document.getElementById('faq-panel-0');

        expect(panel).toHaveAttribute('aria-hidden', 'true');
        expect(panel).toHaveClass('grid-rows-[0fr]', 'opacity-0');
    });

    it('expands answer on click', async () => {
        const user = userEvent.setup();

        render(<Accordion items={ITEMS} />);

        const button = screen.getByText('Question 1?').closest('button')!;

        await user.click(button);

        expect(button).toHaveAttribute('aria-expanded', 'true');

        expect(
            screen.getByRole('region', { name: 'Question 1?' }),
        ).toBeVisible();
        expect(screen.getByRole('region', { name: 'Question 1?' })).toHaveClass(
            'grid-rows-[1fr]',
            'opacity-100',
        );
    });

    it('collapses answer on second click', async () => {
        const user = userEvent.setup();

        render(<Accordion items={ITEMS} />);

        const button = screen.getByText('Question 1?').closest('button')!;

        await user.click(button);
        await user.click(button);

        expect(button).toHaveAttribute('aria-expanded', 'false');
    });
});
