import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, MessagesSquare } from 'lucide-react';

import type { CommentWithChildren } from '@entities/comment';

type CommentRepliesProps = {
    replies: CommentWithChildren[];
    /** Nome do autor do comentário dono deste bloco (contexto da lista plana). */
    parentName: string;
    /** No limite de profundidade, mostra o link "continuar conversa" em vez de aninhar. */
    reachedMaxDepth: boolean;
    /** Render aninhado de cada resposta (delegado ao Comment pai — evita import circular). */
    renderReply: (reply: CommentWithChildren) => ReactNode;
    /** Render de folha (sem respostas próprias) para a lista plana além do teto. */
    renderLeaf: (node: CommentWithChildren, parentName: string) => ReactNode;
};

/** Conta todos os descendentes (para o contador do "continuar conversa"). */
const countDeep = (replies: CommentWithChildren[]): number => replies.reduce((acc, reply) => acc + 1 + countDeep(reply.children), 0);

/** Achata a subárvore em preorder, registrando o autor pai de cada nó (contexto "respondendo a"). */
const flattenDescendants = (nodes: CommentWithChildren[], parentName: string): { node: CommentWithChildren; parentName: string }[] =>
    nodes.flatMap(node => [{ node, parentName }, ...flattenDescendants(node.children, node.user.name)]);

/**
 * Bloco de respostas. Dentro do teto: aninha (rail + cotovelo). No teto: "continuar conversa" que,
 * ao expandir, mostra a subárvore restante **achatada** num único nível — evita indentação
 * ilimitada que quebra o layout (mobile e desktop).
 */
const CommentReplies = ({ replies, parentName, reachedMaxDepth, renderReply, renderLeaf }: CommentRepliesProps) => {
    const { t } = useTranslation('comment');
    const [open, setOpen] = useState(true);
    const [continued, setContinued] = useState(false);

    return (
        <div className="cs-replies">
            <button type="button" className="cs-collapse" onClick={() => setOpen(value => !value)}>
                <span className="bar" />
                {open ? t('thread.hide', { count: replies.length }) : t('thread.show', { count: replies.length })}
            </button>

            {open &&
                (reachedMaxDepth ? (
                    continued ? (
                        // Lista plana: cada folha em seu próprio `.cs-thread` irmão ⇒ indentação constante.
                        flattenDescendants(replies, parentName).map(({ node, parentName: pName }) => (
                            <div className="cs-thread" key={node.id}>
                                {renderLeaf(node, pName)}
                            </div>
                        ))
                    ) : (
                        <button type="button" className="cs-continue" onClick={() => setContinued(true)}>
                            <MessagesSquare className="size-3.5" aria-hidden="true" />
                            <span>{t('thread.continue', { count: countDeep(replies) })}</span>
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                        </button>
                    )
                ) : (
                    replies.map(reply => (
                        <div className="cs-thread" key={reply.id}>
                            {renderReply(reply)}
                        </div>
                    ))
                ))}
        </div>
    );
};

export default CommentReplies;
