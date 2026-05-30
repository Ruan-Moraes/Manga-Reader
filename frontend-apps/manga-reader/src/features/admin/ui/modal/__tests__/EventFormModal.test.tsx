import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import EventFormModal from '../EventFormModal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_k: string, fallback?: string) => fallback ?? _k,
    }),
}));

describe('EventFormModal', () => {
    it('emits payload with titleI18n + dates on submit', () => {
        const onSubmit = vi.fn();
        render(<EventFormModal isOpen onClose={() => {}} onSubmit={onSubmit} isSubmitting={false} />);

        const textboxes = screen.getAllByRole('textbox');
        fireEvent.change(textboxes[0], { target: { value: 'Anime Friends' } });

        const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
        const startInput = dateInputs[0];
        const endInput = dateInputs[1];
        fireEvent.change(startInput, { target: { value: '2026-12-01T10:00' } });
        fireEvent.change(endInput, { target: { value: '2026-12-03T22:00' } });

        fireEvent.click(screen.getByText('Salvar'));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        const call = onSubmit.mock.calls[0][0];
        expect(call.title).toEqual({ 'pt-BR': 'Anime Friends' });
        expect(call.startDate).toBe('2026-12-01T10:00');
        expect(call.endDate).toBe('2026-12-03T22:00');
    });
});
