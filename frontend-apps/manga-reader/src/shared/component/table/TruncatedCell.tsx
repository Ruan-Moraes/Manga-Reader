import { useState } from 'react';

import { Modal } from '@ui/Modal';

type TruncatedCellProps = {
    content: string;
    maxLength?: number;
    title?: string;
};

const TruncatedCell = ({ content, maxLength = 80, title = 'Detalhes' }: TruncatedCellProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!content || content.length <= maxLength) {
        return <span className="text-xs text-tertiary">{content || '—'}</span>;
    }

    return (
        <>
            <span className="text-xs text-tertiary">
                {content.slice(0, maxLength)}…{' '}
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                    className="inline-flex text-xs font-semibold transition-colors text-quaternary-default hover:text-quaternary-opacity-75"
                >
                    Ver mais
                </button>
            </span>

            <Modal open={isOpen} onClose={() => setIsOpen(false)} title={title}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            </Modal>
        </>
    );
};

export default TruncatedCell;
