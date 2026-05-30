import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TagFormModal from '../TagFormModal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_k: string, fallback?: string) => fallback ?? _k,
    }),
}));

describe('TagFormModal', () => {
    it('emits label + labelI18n on submit', () => {
        const onSubmit = vi.fn();
        render(<TagFormModal isOpen onClose={() => {}} onSubmit={onSubmit} isSubmitting={false} />);

        const ptInput = screen.getByRole('textbox');
        fireEvent.change(ptInput, { target: { value: 'Ação' } });
        fireEvent.click(screen.getByText('Salvar'));

        expect(onSubmit).toHaveBeenCalledWith({ 'pt-BR': 'Ação' });
    });

    it('disables submit when pt-BR empty', () => {
        const onSubmit = vi.fn();
        render(<TagFormModal isOpen onClose={() => {}} onSubmit={onSubmit} isSubmitting={false} />);

        const btn = screen.getByText('Salvar') as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
    });

    it('preloads label from existing tag', () => {
        render(<TagFormModal isOpen onClose={() => {}} onSubmit={() => {}} isSubmitting={false} tag={{ value: 1, label: { 'pt-BR': 'Drama' } }} />);
        expect(screen.getByRole('textbox')).toHaveValue('Drama');
    });
});
