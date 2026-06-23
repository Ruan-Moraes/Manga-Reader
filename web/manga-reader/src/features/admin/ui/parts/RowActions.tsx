import { Pencil, Trash2 } from 'lucide-react';

import { cn } from '@shared/lib/cn';

type RowActionsProps = {
    onEdit?: () => void;
    onDelete?: () => void;
    editLabel: string;
    deleteLabel: string;
};

const baseBtn = 'flex size-8 items-center justify-center rounded-mr-xs border transition-colors';

/** Botões de ação de linha (32px) — editar (hover accent) + excluir (danger). */
const RowActions = ({ onEdit, onDelete, editLabel, deleteLabel }: RowActionsProps) => (
    <div className="flex items-center justify-end gap-1.5">
        {onEdit && (
            <button
                type="button"
                aria-label={editLabel}
                onClick={e => {
                    e.stopPropagation();
                    onEdit();
                }}
                className={cn(baseBtn, 'border-mr-border text-mr-fg-muted hover:border-mr-accent-50 hover:bg-mr-accent-25 hover:text-mr-accent')}
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
                className={cn(baseBtn, 'border-[rgba(255,120,79,0.4)] text-mr-danger hover:bg-mr-danger-15')}
            >
                <Trash2 size={15} />
            </button>
        )}
    </div>
);

export default RowActions;
