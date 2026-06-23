import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

// jsdom does not implement HTMLDialogElement methods; must set open attr manually
beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute('open');
    });
});

const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: 'Título do modal',
    children: <p>Conteúdo</p>,
};

describe('Modal', () => {
    it('renders title', () => {
        render(<Modal {...defaultProps} />);
        expect(screen.getByRole('heading', { name: /título do modal/i })).toBeInTheDocument();
    });

    it('renders children', () => {
        render(<Modal {...defaultProps} />);
        expect(screen.getByText(/conteúdo/i)).toBeInTheDocument();
    });

    it('renders eyebrow when provided', () => {
        render(<Modal {...defaultProps} eyebrow="Destaque" />);
        expect(screen.getByText('Destaque')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        render(<Modal {...defaultProps} description="Subtítulo do modal" />);
        expect(screen.getByText(/subtítulo do modal/i)).toBeInTheDocument();
    });

    it('renders footer when provided', () => {
        render(<Modal {...defaultProps} footer={<button>Confirmar</button>} />);
        expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
    });

    it('shows close button by default', () => {
        render(<Modal {...defaultProps} />);
        expect(screen.getByRole('button', { name: /fechar/i })).toBeInTheDocument();
    });

    it('hides close button when hideClose=true', () => {
        render(<Modal {...defaultProps} hideClose />);
        expect(screen.queryByRole('button', { name: /fechar/i })).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<Modal {...defaultProps} onClose={onClose} />);
        await user.click(screen.getByRole('button', { name: /fechar/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('has aria-labelledby pointing to title', () => {
        render(<Modal {...defaultProps} />);
        const dialog = document.querySelector('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
        expect(document.getElementById('modal-title')).toBeInTheDocument();
    });

    it('calls showModal when open=true', () => {
        render(<Modal {...defaultProps} open />);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
});
