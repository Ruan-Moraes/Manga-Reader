import { useState } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';

type TruncatedCellProps = {
    content: string;
    maxLength?: number;
    title?: string;
};

const TruncatedCell = ({
    content,
    maxLength = 80,
    title = 'Detalhes',
}: TruncatedCellProps) => {
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

            <BaseModal isModalOpen={isOpen} closeModal={() => setIsOpen(false)}>
                <div className="flex flex-col gap-3 p-2">
                    <h3 className="text-sm font-bold">{title}</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {content}
                    </p>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </BaseModal>
        </>
    );
};

export default TruncatedCell;
