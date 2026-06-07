import type { ReactNode } from 'react';
import { MessageSquare } from 'lucide-react';

/**
 * Barra de ação unificada — VotePill à esquerda, ações à direita.
 * Reusada por comentários e resenhas. As ações de dono (editar/excluir)
 * entram via `extra`.
 */
export interface ActionBarProps {
    /** Normalmente um <VotePill />. */
    vote?: ReactNode;
    onReply?: () => void;
    replyLabel?: string;
    /** Ações adicionais (editar/excluir do dono, etc.). */
    extra?: ReactNode;
}

export const ActionBar = ({ vote, onReply, replyLabel = 'Responder', extra }: ActionBarProps) => (
    <div className="flex flex-wrap items-center gap-2">
        {vote}
        {onReply && (
            <button
                type="button"
                onClick={onReply}
                aria-label={replyLabel}
                className="inline-flex py-1.5 items-center gap-1.5 rounded-mr-full border border-mr-chip-border bg-mr-chip px-[13px] text-[12.5px] font-mr-bold text-mr-fg-subtle transition-all hover:border-mr-accent-50 hover:text-mr-fg mr-focus-ring max-md:w-8 max-md:justify-center max-md:gap-0 max-md:px-0"
            >
                <MessageSquare className="size-[15px]" aria-hidden="true" />
                <span className="hidden md:inline">{replyLabel}</span>
            </button>
        )}
        {extra && <div className="ml-auto flex items-center gap-1">{extra}</div>}
    </div>
);

export default ActionBar;
