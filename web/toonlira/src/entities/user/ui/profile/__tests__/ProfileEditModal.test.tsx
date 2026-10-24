import { useEffect } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ProfileSettingsModalProvider, useProfileSettingsModal } from '../../../model/ProfileSettingsModalContext';
import ProfileEditModal from '../ProfileEditModal';

vi.mock('@shared/service/util/toastService');

vi.mock('@entities/catalog-filter/@x/user', () => ({
    useTagsFetch: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock('../../../api/userService', () => ({
    getMyEnrichedProfile: vi.fn().mockResolvedValue({
        id: 'u1',
        name: 'Leitor BR',
        bio: 'Bio de teste',
        photoUrl: '',
        role: 'user',
        socialLinks: [],
        stats: { comments: 0, ratings: 0, libraryTotal: 0, lendo: 0, queroLer: 0, concluido: 0 },
        recommendations: [],
        recentComments: null,
        recentViewHistory: null,
        favoriteGenres: [],
        privacySettings: {
            commentVisibility: 'PUBLIC',
            viewHistoryVisibility: 'PRIVATE',
            adultContentPreference: 'BLUR',
        },
        isOwner: true,
    }),
    getEnrichedProfile: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    updatePrivacySettings: vi.fn().mockResolvedValue(undefined),
    removeRecommendation: vi.fn().mockResolvedValue(undefined),
    getMyGroups: vi.fn().mockResolvedValue({ linked: [], available: [] }),
    joinGroup: vi.fn().mockResolvedValue(undefined),
    leaveGroup: vi.fn().mockResolvedValue(undefined),
    deleteMyAccount: vi.fn().mockResolvedValue(undefined),
}));

const Opener = () => {
    const { openProfileSettings } = useProfileSettingsModal();

    useEffect(() => {
        openProfileSettings();
    }, [openProfileSettings]);

    return null;
};

const renderModal = () =>
    render(
        <MemoryRouter>
            <ProfileSettingsModalProvider>
                <Opener />
                <ProfileEditModal />
            </ProfileSettingsModalProvider>
        </MemoryRouter>,
    );

describe('ProfileEditModal', () => {
    it('renders the modal heading', () => {
        renderModal();
        expect(screen.getByRole('heading')).toBeTruthy();
    });

    it('loads and pre-fills the profile name', async () => {
        renderModal();
        expect(await screen.findByDisplayValue('Leitor BR')).toBeTruthy();
    });

    it('loads and pre-fills the bio', async () => {
        renderModal();
        expect(await screen.findByDisplayValue('Bio de teste')).toBeTruthy();
    });
});
