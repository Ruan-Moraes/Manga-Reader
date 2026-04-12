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

    it('hides answers by default', () => {
        render(<Accordion items={ITEMS} />);

        const answer = screen.getByText('Answer 1.');

        expect(answer.closest('.grid')).toHaveClass('grid-rows-[0fr]');
    });

    it('expands answer on click', async () => {
        const user = userEvent.setup();

        render(<Accordion items={ITEMS} />);

        const button = screen.getByText('Question 1?').closest('button')!;

        await user.click(button);

        expect(button).toHaveAttribute('aria-expanded', 'true');

        const answer = screen.getByText('Answer 1.');

        expect(answer.closest('.grid')).toHaveClass('grid-rows-[1fr]');
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
