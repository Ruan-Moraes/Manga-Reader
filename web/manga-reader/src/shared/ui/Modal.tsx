import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, type LucideIcon } from 'lucide-react';

import { IconButton } from './IconButton';
import { Button } from './Button';
import { FloatingPortalContext } from './FloatingPortalContext';
import { cn } from '@shared/lib/cn';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    eyebrow?: string;
    /** Ícone opcional no cabeçalho — usar somente quando agregar contexto. */
    icon?: LucideIcon;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    hideClose?: boolean;
    /** Operação em andamento — bloqueia todos os caminhos de fechamento. */
    loading?: boolean;
    /** Fechar ao clicar no overlay (padrão: true). */
    closeOnOverlay?: boolean;
    /** Fechar com Escape (padrão: true). */
    closeOnEscape?: boolean;
    /** Pede confirmação antes de fechar — ligar quando houver alterações não salvas. */
    confirmClose?: boolean;
    children: ReactNode;
    footer?: ReactNode;
    /** Título em tom destrutivo (coral) — para confirmações de exclusão/ban. */
    danger?: boolean;
    /** Classes extras no contêiner de conteúdo (ex.: `min-h-[60vh]` para um modal mais alto). */
    bodyClassName?: string;
}

const ModalRequestCloseContext = createContext<(() => void) | null>(null);

/**
 * Fechamento "educado" para botões Cancelar/Fechar dentro do Modal — passa pelo
 * mesmo caminho do X/overlay/Escape, respeitando `loading` e `confirmClose`.
 * Fora de um Modal, retorna null.
 */
export const useModalRequestClose = () => useContext(ModalRequestCloseContext);

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-[420px] w-[90vw]',
    md: 'max-w-[520px] w-[90vw]',
    lg: 'max-w-[680px] w-[90vw]',
    xl: 'max-w-[960px] w-[94vw]',
    full: 'max-w-[min(1400px,95vw)] w-[95vw]',
};

export const Modal = ({
    open,
    onClose,
    title,
    description,
    eyebrow,
    icon: Icon,
    size = 'md',
    hideClose,
    loading,
    closeOnOverlay = true,
    closeOnEscape = true,
    confirmClose,
    children,
    footer,
    danger,
    bodyClassName,
}: ModalProps) => {
    const { t } = useTranslation('common');
    const titleId = useId();
    const descriptionId = useId();
    const confirmTitleId = useId();

    // State (não ref) para os consumidores do contexto re-renderizarem quando o elemento existir.
    const [dialogEl, setDialogEl] = useState<HTMLDialogElement | null>(null);
    const confirmRef = useRef<HTMLDialogElement>(null);
    const [confirmVisible, setConfirmVisible] = useState(false);

    useEffect(() => {
        if (!dialogEl) {
            return;
        }

        if (open && !dialogEl.open) {
            dialogEl.showModal();
        }

        if (!open && dialogEl.open) {
            dialogEl.close();
        }
    }, [open, dialogEl]);

    useEffect(() => {
        if (!open) {
            setConfirmVisible(false);
        }
    }, [open]);

    useEffect(() => {
        const el = confirmRef.current;

        if (!el) {
            return;
        }

        if (confirmVisible && !el.open) {
            el.showModal();
        }

        if (!confirmVisible && el.open) {
            el.close();
        }
    }, [confirmVisible]);

    /** Caminho único de fechamento — X, overlay e Escape passam por aqui. */
    const requestClose = useCallback(() => {
        if (loading) {
            return;
        }

        if (confirmClose) {
            setConfirmVisible(true);

            return;
        }

        onClose();
    }, [loading, confirmClose, onClose]);

    return (
        <dialog
            ref={setDialogEl}
            onClose={e => {
                // `close` dispara em qualquer fechamento nativo; mantém o estado do pai em sincronia.
                // O check de target ignora o close do dialog de confirmação aninhado (React propaga o evento).
                if (e.target === e.currentTarget && open) onClose();
            }}
            onCancel={e => {
                // Escape: o cancel nativo fecharia direto — intercepta para respeitar loading/confirmClose.
                if (e.target !== e.currentTarget) return;
                e.preventDefault();
                if (closeOnEscape) requestClose();
            }}
            onClick={e => {
                if (e.target === e.currentTarget && closeOnOverlay) requestClose();
            }}
            className={cn(
                'm-auto p-0 open:flex flex-col max-h-[85vh] overflow-hidden',
                sizeMap[size],
                'rounded-mr-lg border border-mr-border bg-mr-surface text-mr-fg shadow-mr-black animate-mr-fade-in',
                '[&::backdrop]:bg-[rgba(22,22,22,0.75)] [&::backdrop]:backdrop-blur-mr',
            )}
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
        >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-mr-border-subtle p-4 sm:px-6 sm:py-5">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    {Icon && (
                        <span
                            className={cn(
                                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-mr-sm',
                                danger ? 'bg-mr-danger-15 text-mr-danger' : 'bg-mr-accent-10 text-mr-accent',
                            )}
                            aria-hidden="true"
                        >
                            <Icon className="size-5" />
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        {eyebrow && <div className="mr-label text-mr-accent mb-1">{eyebrow}</div>}
                        <h2 id={titleId} className={`text-mr-body! sm:text-mr-h3! font-mr-extrabold! ${danger ? 'text-mr-danger' : 'text-mr-fg'}`}>
                            {title}
                        </h2>
                        {description && (
                            <p id={descriptionId} className="mt-1 text-mr-small text-mr-fg-subtle">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {!hideClose && <IconButton icon={X} aria-label={t('modal.close', 'Fechar')} disabled={loading} onClick={requestClose} />}
            </header>

            <FloatingPortalContext.Provider value={dialogEl}>
                <ModalRequestCloseContext.Provider value={requestClose}>
                    <div className={`min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 ${bodyClassName ?? ''}`}>{children}</div>

                    {footer && (
                        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-mr-border-subtle bg-mr-surface-muted p-4 sm:px-6">{footer}</footer>
                    )}
                </ModalRequestCloseContext.Provider>
            </FloatingPortalContext.Provider>

            {confirmClose && (
                <dialog
                    ref={confirmRef}
                    onClose={() => setConfirmVisible(false)}
                    className="m-auto max-w-[420px] w-[90vw] overflow-hidden rounded-mr-lg border border-mr-border bg-mr-surface p-0 text-mr-fg shadow-mr-black animate-mr-fade-in [&::backdrop]:bg-[rgba(22,22,22,0.6)] [&::backdrop]:backdrop-blur-mr"
                    aria-labelledby={confirmTitleId}
                >
                    <div className="p-5">
                        <h3 id={confirmTitleId} className="text-mr-h4! font-mr-extrabold! text-mr-fg">
                            {t('modal.unsavedTitle', 'Descartar alterações?')}
                        </h3>
                        <p className="mt-1.5 text-mr-small leading-relaxed text-mr-fg-subtle">
                            {t('modal.unsavedBody', 'Há alterações não salvas. Se você fechar agora, elas serão perdidas.')}
                        </p>
                    </div>
                    <footer className="flex items-center justify-end gap-2 border-t border-mr-border-subtle bg-mr-surface-muted p-4 sm:px-5">
                        <Button variant="ghost" onClick={() => setConfirmVisible(false)}>
                            {t('modal.unsavedKeepEditing', 'Continuar editando')}
                        </Button>
                        <Button
                            danger
                            onClick={() => {
                                setConfirmVisible(false);
                                onClose();
                            }}
                        >
                            {t('modal.unsavedDiscard', 'Descartar')}
                        </Button>
                    </footer>
                </dialog>
            )}
        </dialog>
    );
};

export default Modal;
