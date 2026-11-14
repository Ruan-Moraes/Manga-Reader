import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { axeComponent } from '@/test/helpers/axe';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';

import RelatedWorkCard from '../card/RelatedWorkCard';

const work = {
    id: 'vagabond',
    name: 'Vagabond',
    cover: 'vagabond.jpg',
    type: 'MANGA',
    status: 'ONGOING',
    adult: false,
    roles: ['AUTHOR', 'ARTIST'] as const,
};

describe('RelatedWorkCard', () => {
    it('abre a obra, mostra metadados e não tem violações axe', async () => {
        const onOpen = vi.fn();
        const { container } = renderWithProviders(<RelatedWorkCard work={{ ...work, roles: [...work.roles] }} showRoles onOpen={onOpen} />);

        expect(screen.getByText('MANGA · ONGOING')).toBeInTheDocument();
        expect(screen.getByText(/autor/i)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /vagabond/i }));

        expect(onOpen).toHaveBeenCalledOnce();
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('mantém animações restritas a dispositivos sem redução de movimento', () => {
        renderWithProviders(<RelatedWorkCard work={{ ...work, roles: [...work.roles] }} onOpen={vi.fn()} />);

        expect(screen.getByRole('button', { name: /vagabond/i })).toHaveClass('motion-safe:hover:-translate-y-1');
    });
});
