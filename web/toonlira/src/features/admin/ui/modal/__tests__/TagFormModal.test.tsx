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
        render(<TagFormModal isOpen onClose={() => {}} onSubmit={() => {}} isSubmitting={false} tag={{ value: 1, slug: 'DRAMA', label: { 'pt-BR': 'Drama' } }} />);
        expect(screen.getByRole('textbox')).toHaveValue('Drama');
    });

    it('guarda alterações não salvas: fechar pede confirmação e "continuar editando" preserva o valor', () => {
        const onClose = vi.fn();
        render(<TagFormModal isOpen onClose={onClose} onSubmit={() => {}} isSubmitting={false} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Aventura' } });
        fireEvent.click(screen.getByLabelText('Fechar'));

        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByText('Descartar alterações?')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Continuar editando'));
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole('textbox')).toHaveValue('Aventura');

        fireEvent.click(screen.getByLabelText('Fechar'));
        fireEvent.click(screen.getByText('Descartar'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('fecha direto sem confirmação quando o formulário está intocado', () => {
        const onClose = vi.fn();
        render(<TagFormModal isOpen onClose={onClose} onSubmit={() => {}} isSubmitting={false} />);

        fireEvent.click(screen.getByLabelText('Fechar'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
