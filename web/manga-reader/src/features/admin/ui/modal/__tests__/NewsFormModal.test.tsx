import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import NewsFormModal from '../NewsFormModal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_k: string, fallback?: string) => fallback ?? _k,
    }),
}));

describe('NewsFormModal', () => {
    it('emits payload with titleI18n on submit', () => {
        const onSubmit = vi.fn();
        render(<NewsFormModal isOpen onClose={() => {}} onSubmit={onSubmit} isSubmitting={false} />);

        const inputs = screen.getAllByRole('textbox');
        // titleI18n pt-BR is first textbox
        fireEvent.change(inputs[0], { target: { value: 'Notícia X' } });
        fireEvent.click(screen.getByText('Salvar'));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        const call = onSubmit.mock.calls[0][0];
        expect(call.title).toEqual({ 'pt-BR': 'Notícia X' });
        expect(call.category).toBeDefined();
    });

    it('disables submit when title empty', () => {
        render(<NewsFormModal isOpen onClose={() => {}} onSubmit={() => {}} isSubmitting={false} />);
        expect((screen.getByText('Salvar') as HTMLButtonElement).disabled).toBe(true);
    });
});
