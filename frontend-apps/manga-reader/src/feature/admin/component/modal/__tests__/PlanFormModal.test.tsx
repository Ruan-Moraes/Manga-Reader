import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PlanFormModal from '../PlanFormModal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_k: string, fallback?: string) => fallback ?? _k,
    }),
}));

describe('PlanFormModal', () => {
    it('emits descriptionI18n + featuresI18n on submit', () => {
        const onSubmit = vi.fn();
        render(
            <PlanFormModal
                isOpen
                onClose={() => {}}
                onSubmit={onSubmit}
                isSubmitting={false}
            />,
        );

        const priceInput = screen.getByRole('spinbutton');
        fireEvent.change(priceInput, { target: { value: '19.90' } });

        const textboxes = screen.getAllByRole('textbox');
        fireEvent.change(textboxes[0], { target: { value: 'Plano premium' } });

        fireEvent.click(screen.getByText('planForm.save'));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        const call = onSubmit.mock.calls[0][0];
        expect(call.description).toBe('Plano premium');
        expect(call.descriptionI18n).toEqual({ 'pt-BR': 'Plano premium' });
        expect(call.priceInCents).toBe(1990);
    });
});
