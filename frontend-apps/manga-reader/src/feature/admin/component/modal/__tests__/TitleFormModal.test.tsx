import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TitleFormModal from '../TitleFormModal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_k: string, fallback?: string) => fallback ?? _k,
    }),
}));

describe('TitleFormModal', () => {
    it('emits payload with nameI18n + synopsisI18n', () => {
        const onSubmit = vi.fn();
        render(
            <TitleFormModal
                isOpen
                onClose={() => {}}
                onSubmit={onSubmit}
                isSubmitting={false}
            />,
        );

        const inputs = screen.getAllByRole('textbox');
        // first textbox = LocalizedTextInput (nameI18n) pt-BR slot
        fireEvent.change(inputs[0], { target: { value: 'Solo Leveling' } });
        fireEvent.click(screen.getByText('Salvar'));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        const call = onSubmit.mock.calls[0][0];
        expect(call.name).toEqual({ 'pt-BR': 'Solo Leveling' });
    });

    it('disables submit when name empty', () => {
        render(
            <TitleFormModal
                isOpen
                onClose={() => {}}
                onSubmit={() => {}}
                isSubmitting={false}
            />,
        );
        expect((screen.getByText('Salvar') as HTMLButtonElement).disabled).toBe(true);
    });
});
