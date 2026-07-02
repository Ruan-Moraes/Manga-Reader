import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import type { Group } from '@entities/group';
import GroupProfile from '../GroupProfile';

const MOCK_GROUP: Group = {
    id: '1',
    name: 'Scan Brasileiro',
    username: 'scan-br',
    logo: '',
    banner: '',
    description: 'Grupo de tradução BR.',
    website: 'https://scan-br.example',
    totalTitles: 12,
    foundedYear: 2019,
    platformJoinedAt: '2020-01-01',
    status: 'active',
    members: [
        {
            id: 'm1',
            name: 'akira_scan',
            avatar: '',
            bio: '',
            role: 'Líder',
            joinedAt: '2020-01-01',
            groups: [{ id: '1', name: 'Scan Brasileiro' }],
            recentPosts: [],
        },
    ],
    supporters: [],
    genres: ['Ação'],
    focusTags: ['shonen'],
    rating: 4.7,
    popularity: 90,
    translatedWorks: [],
    translatedTitleIds: [],
};

vi.mock('@entities/group', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/group')>();
    return {
        ...actual,
        useGroupDetails: () => ({ group: MOCK_GROUP, isLoading: false }),
    };
});

const setup = () => renderWithProviders(<GroupProfile />);

describe('GroupProfile', () => {
    it('axe', async () => {
        const { container } = renderWithProviders(<GroupProfile />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders group name heading', () => {
        setup();
        expect(screen.getByRole('heading', { name: /scan brasileiro/i })).toBeInTheDocument();
    });

    it('shows group handle', () => {
        setup();
        expect(screen.getAllByText(/@scan-br/).length).toBeGreaterThan(0);
    });

    it('renders group tabs (sobre, obras, equipe)', () => {
        setup();
        expect(screen.getByRole('button', { name: /^sobre$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^obras$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^equipe$/i })).toBeInTheDocument();
    });

    it('switches to team tab', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByRole('button', { name: /^equipe$/i }));

        expect(screen.getByText('akira_scan')).toBeInTheDocument();
    });

    it('shows follow button', () => {
        setup();
        expect(screen.getByRole('button', { name: /seguir grupo/i })).toBeInTheDocument();
    });
});
