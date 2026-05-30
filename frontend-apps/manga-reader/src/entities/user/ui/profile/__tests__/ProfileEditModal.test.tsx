import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileEditModal from '../ProfileEditModal';
import type { EnrichedProfile } from '../../../model/user.types';

const profile: EnrichedProfile = {
    id: 'u1',
    name: 'Leitor BR',
    bio: 'Bio de teste',
    photoUrl: '',
    bannerUrl: '',
    role: 'user',
    socialLinks: [],
    isOwner: true,
    stats: {
        comments: 0,
        ratings: 0,
        libraryTotal: 0,
        lendo: 0,
        queroLer: 0,
        concluido: 0,
    },
    recommendations: [],
    recentComments: null,
    recentViewHistory: null,
    privacySettings: null,
};

const defaultProps = {
    profile,
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
};

describe('ProfileEditModal', () => {
    it('renders nothing when closed', () => {
        render(<ProfileEditModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders modal heading when open', () => {
        render(<ProfileEditModal {...defaultProps} />);
        expect(screen.getByRole('heading', { name: /editar perfil/i })).toBeInTheDocument();
    });

    it('renders name input pre-filled', () => {
        render(<ProfileEditModal {...defaultProps} />);
        const input = screen.getByDisplayValue('Leitor BR');
        expect(input).toBeInTheDocument();
    });

    it('renders bio textarea pre-filled', () => {
        render(<ProfileEditModal {...defaultProps} />);
        expect(screen.getByDisplayValue('Bio de teste')).toBeInTheDocument();
    });

    it('renders save button', () => {
        render(<ProfileEditModal {...defaultProps} />);
        expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
    });

    it('calls onClose when X button clicked', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<ProfileEditModal {...defaultProps} onClose={onClose} />);
        await user.click(screen.getByRole('button', { name: 'X' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('adds social link row on "+ Adicionar" click', async () => {
        const user = userEvent.setup();
        render(<ProfileEditModal {...defaultProps} />);
        const addBtn = screen.getByRole('button', { name: /adicionar/i });
        await user.click(addBtn);
        expect(screen.getAllByPlaceholderText(/plataforma/i).length).toBe(1);
    });

    it('removes social link row', async () => {
        const user = userEvent.setup();
        render(<ProfileEditModal {...defaultProps} />);
        await user.click(screen.getByRole('button', { name: /adicionar/i }));
        expect(screen.getAllByPlaceholderText(/plataforma/i).length).toBe(1);
        // each link row has an X button; filter to find the remove one
        const removeBtn = screen.getAllByRole('button', { name: 'X' })[1];
        await user.click(removeBtn);
        expect(screen.queryByPlaceholderText(/plataforma/i)).not.toBeInTheDocument();
    });

    it('calls onSave with form data on submit', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(<ProfileEditModal {...defaultProps} onSave={onSave} />);
        await user.click(screen.getByRole('button', { name: /salvar/i }));
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Leitor BR', bio: 'Bio de teste' }));
    });

    it('renders with pre-existing social links', () => {
        const profileWithLinks: EnrichedProfile = {
            ...profile,
            socialLinks: [{ id: 's1', platform: 'Twitter', url: 'https://x.com/test' }],
        };
        render(<ProfileEditModal {...defaultProps} profile={profileWithLinks} />);
        expect(screen.getByDisplayValue('Twitter')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://x.com/test')).toBeInTheDocument();
    });
});
