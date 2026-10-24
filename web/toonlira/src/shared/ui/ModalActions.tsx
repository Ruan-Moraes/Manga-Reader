import type { ReactNode } from 'react';

import { Button } from './Button';
import { useModalRequestClose } from './Modal';

export interface ModalActionsProps {
    cancelLabel: string;
    /** Fallback quando renderizado fora de um Modal; dentro, o fechamento passa pelo caminho guardado do Modal. */
    onCancel?: () => void;
    submitLabel: string;
    onSubmit: () => void;
    submitDisabled?: boolean;
    submitting?: boolean;
    /** Ação principal destrutiva (excluir/banir). */
    danger?: boolean;
    /** Ação extra alinhada à esquerda (ex.: botão excluir em formulários de edição). */
    leftAction?: ReactNode;
}

/** Rodapé padrão de Modal: ação secundária + primária consistentes, com loading no botão e envio único. */
export const ModalActions = ({ cancelLabel, onCancel, submitLabel, onSubmit, submitDisabled, submitting, danger, leftAction }: ModalActionsProps) => {
    const requestClose = useModalRequestClose();
    const handleCancel = requestClose ?? onCancel;

    return (
        <div className="flex w-full flex-wrap items-center justify-between gap-2.5">
            <div>{leftAction}</div>
            <div className="flex gap-2.5">
                <Button variant="ghost" size="sm" disabled={submitting} onClick={handleCancel}>
                    {cancelLabel}
                </Button>
                <Button variant="primary" size="sm" danger={danger} disabled={submitDisabled || submitting} loading={submitting} onClick={onSubmit}>
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
};

export default ModalActions;
