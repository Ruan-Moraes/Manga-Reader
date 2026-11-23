import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Modal } from '../Modal';

// jsdom does not implement HTMLDialogElement methods; must set open attr manually
beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
    });
});

const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: 'Título do modal',
    children: <p>Conteúdo</p>,
};

/** O dialog externo (primeiro) — o confirmClose renderiza um segundo dialog aninhado. */
const getDialog = () => document.querySelector('dialog')!;

const cancelEvent = () => new Event('cancel', { bubbles: false, cancelable: true });

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

    it('renders description when provided and links it via aria-describedby', () => {
        render(<Modal {...defaultProps} description="Subtítulo do modal" />);
        const description = screen.getByText(/subtítulo do modal/i);
        expect(getDialog()).toHaveAttribute('aria-describedby', description.id);
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
        const dialog = getDialog();
        const labelledBy = dialog.getAttribute('aria-labelledby')!;
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy)).toHaveTextContent('Título do modal');
    });

    it('generates unique ids when two modals are mounted', () => {
        render(
            <>
                <Modal {...defaultProps} title="Primeiro" />
                <Modal {...defaultProps} title="Segundo" />
            </>,
        );
        const [a, b] = Array.from(document.querySelectorAll('dialog'));
        expect(a.getAttribute('aria-labelledby')).not.toBe(b.getAttribute('aria-labelledby'));
    });

    it('calls showModal when open=true', () => {
        render(<Modal {...defaultProps} open />);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });

    it.each([
        ['sm', 'max-w-[420px]'],
        ['md', 'max-w-[520px]'],
        ['lg', 'max-w-[680px]'],
        ['xl', 'max-w-[960px]'],
        ['full', 'max-w-[min(1400px,95vw)]'],
    ] as const)('applies size class for %s', (size, expected) => {
        render(<Modal {...defaultProps} size={size} />);
        expect(getDialog().className).toContain(expected);
    });

    it('closes on overlay click by default', () => {
        const onClose = vi.fn();
        render(<Modal {...defaultProps} onClose={onClose} />);
        fireEvent.click(getDialog());
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ignores overlay click when closeOnOverlay=false', () => {
        const onClose = vi.fn();
        render(<Modal {...defaultProps} onClose={onClose} closeOnOverlay={false} />);
        fireEvent.click(getDialog());
        expect(onClose).not.toHaveBeenCalled();
    });

    it('closes on Escape (native cancel) by default', () => {
        const onClose = vi.fn();
        render(<Modal {...defaultProps} onClose={onClose} />);
        fireEvent(getDialog(), cancelEvent());
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ignores Escape when closeOnEscape=false', () => {
        const onClose = vi.fn();
        render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);
        fireEvent(getDialog(), cancelEvent());
        expect(onClose).not.toHaveBeenCalled();
    });

    it('blocks all close paths while loading', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<Modal {...defaultProps} onClose={onClose} loading />);

        expect(screen.getByRole('button', { name: /fechar/i })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: /fechar/i }));
        fireEvent.click(getDialog());
        fireEvent(getDialog(), cancelEvent());

        expect(onClose).not.toHaveBeenCalled();
    });

    describe('confirmClose (alterações não salvas)', () => {
        it('shows confirmation instead of closing, and keeps editing', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<Modal {...defaultProps} onClose={onClose} confirmClose />);

            fireEvent.click(getDialog());
            expect(onClose).not.toHaveBeenCalled();
            expect(screen.getByRole('heading', { name: /descartar alterações/i })).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /continuar editando/i }));
            expect(onClose).not.toHaveBeenCalled();
        });

        it('discards and closes when confirmed', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<Modal {...defaultProps} onClose={onClose} confirmClose />);

            fireEvent(getDialog(), cancelEvent());
            await user.click(screen.getByRole('button', { name: /^descartar$/i }));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it('has no axe violations', async () => {
        const { container } = render(<Modal {...defaultProps} description="Descrição acessível" footer={<button>Ok</button>} />);
        expect(await axe(container)).toHaveNoViolations();
    });
});
