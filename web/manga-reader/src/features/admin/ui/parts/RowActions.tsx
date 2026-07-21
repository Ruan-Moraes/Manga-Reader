import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { cn } from '@shared/lib/cn';

type RowActionsProps = {
    onEdit?: () => void;
    onDelete?: () => void;
    editLabel: string;
    deleteLabel: string;
    /** Ações extras renderizadas antes de editar/excluir (ex.: gerenciar capítulos). */
    extra?: ReactNode;
};

const baseBtn = 'flex size-8 items-center justify-center rounded-mr-xs border transition-colors';

/** Classe base exportada p/ botões extras manterem o mesmo visual. */
export const rowActionBtnClass = cn(baseBtn, 'border-mr-border text-mr-fg-muted hover:border-mr-accent-50 hover:bg-mr-accent-25 hover:text-mr-accent-fg');

/** Botões de ação de linha (32px) — editar (hover accent) + excluir (danger). */
const RowActions = ({ onEdit, onDelete, editLabel, deleteLabel, extra }: RowActionsProps) => (
    <div className="flex items-center justify-end gap-1.5">
        {extra}
        {onEdit && (
            <button
                type="button"
                aria-label={editLabel}
                onClick={e => {
                    e.stopPropagation();
                    onEdit();
                }}
                className={cn(baseBtn, 'border-mr-border text-mr-fg-muted hover:border-mr-accent-50 hover:bg-mr-accent-25 hover:text-mr-accent-fg')}
            >
                <Pencil size={15} />
            </button>
        )}
        {onDelete && (
            <button
                type="button"
                aria-label={deleteLabel}
                onClick={e => {
                    e.stopPropagation();
                    onDelete();
                }}
                className={cn(baseBtn, 'border-mr-danger-border text-mr-danger hover:bg-mr-danger-15')}
            >
                <Trash2 size={15} />
            </button>
        )}
    </div>
);

export default RowActions;
