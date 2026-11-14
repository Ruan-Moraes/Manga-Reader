import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

import { ReaderRails } from '../ReaderRails';

describe('ReaderRails', () => {
    it('advances with the right button in RTL mode', async () => {
        const user = userEvent.setup();
        const onNext = vi.fn();
        const onPrev = vi.fn();

        renderWithProviders(<ReaderRails direction="rtl" onNext={onNext} onPrev={onPrev} />);

        await user.click(screen.getByRole('button', { name: /próxima página/i }));

        expect(onNext).toHaveBeenCalledOnce();
        expect(onPrev).not.toHaveBeenCalled();
    });
});
