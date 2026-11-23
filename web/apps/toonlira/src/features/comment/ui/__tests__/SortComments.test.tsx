import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const setSortTypeMock = vi.fn();
let currentSortType: string | null = null;

vi.mock('@entities/comment', () => ({
    useCommentSortContext: () => ({
        sortType: currentSortType,
        setSortType: setSortTypeMock,
    }),
}));

import SortComments from '../SortComments';

describe('SortComments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentSortType = null;
    });

    it('renderiza título e 5 botões de ordenação', () => {
        render(<SortComments title="Ordenar por" />);

        expect(screen.getByText('Ordenar por')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(5);
    });

    it('chama setSortType(null) ao clicar no botão default', async () => {
        const user = userEvent.setup();
        render(<SortComments title="x" />);

        await user.click(screen.getAllByRole('button')[0]);

        expect(setSortTypeMock).toHaveBeenCalledWith(null);
    });

    it('toggle: clica likes quando ativo → setSortType(null) + (likes)', async () => {
        currentSortType = 'likes';
        const user = userEvent.setup();
        render(<SortComments title="x" />);

        // likes é o 3o botão (default, dislikes, likes, oldest, newest)
        await user.click(screen.getAllByRole('button')[2]);

        expect(setSortTypeMock).toHaveBeenCalledWith(null);
    });

    it('clica likes quando inativo → setSortType("likes")', async () => {
        currentSortType = null;
        const user = userEvent.setup();
        render(<SortComments title="x" />);

        await user.click(screen.getAllByRole('button')[2]);

        expect(setSortTypeMock).toHaveBeenCalledWith('likes');
    });
});
