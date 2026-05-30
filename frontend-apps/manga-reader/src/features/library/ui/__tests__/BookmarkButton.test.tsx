import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import BookmarkButton from '../BookmarkButton';

describe('BookmarkButton', () => {
    it('mostra rótulo "Salvar na biblioteca" quando isSaved=false', () => {
        render(<BookmarkButton isSaved={false} onClick={() => {}} />);

        expect(screen.getByRole('button', { name: /salvar na biblioteca/i })).toBeInTheDocument();
    });

    it('mostra rótulo "Na biblioteca" quando isSaved=true', () => {
        render(<BookmarkButton isSaved={true} onClick={() => {}} />);

        expect(screen.getByRole('button', { name: /na biblioteca/i })).toBeInTheDocument();
    });

    it('chama onClick ao clicar', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(<BookmarkButton isSaved={false} onClick={onClick} />);

        await user.click(screen.getByRole('button'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('mostra estado loading com "..." quando isLoading=true', () => {
        render(<BookmarkButton isSaved={false} onClick={() => {}} isLoading={true} />);

        expect(screen.getByText('...')).toBeInTheDocument();
    });
});
