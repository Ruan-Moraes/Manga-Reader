import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GroupFormModal from '../GroupFormModal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_k: string, fallback?: string) => fallback ?? _k,
    }),
}));

describe('GroupFormModal', () => {
    it('emits payload with nameI18n on submit', () => {
        const onSubmit = vi.fn();
        render(<GroupFormModal isOpen onClose={() => {}} onSubmit={onSubmit} isSubmitting={false} />);

        const inputs = screen.getAllByRole('textbox');
        fireEvent.change(inputs[0], { target: { value: 'Scan Brasil' } });
        fireEvent.click(screen.getByText('Salvar'));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        const call = onSubmit.mock.calls[0][0];
        expect(call.name).toEqual({ 'pt-BR': 'Scan Brasil' });
    });
});
