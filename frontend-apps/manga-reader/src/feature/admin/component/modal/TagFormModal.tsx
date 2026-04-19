import { useState, useEffect } from 'react';

import BaseInput from '@shared/component/input/BaseInput';
import BaseModal from '@shared/component/modal/base/BaseModal';

import type { AdminTag } from '../type/admin.types';

type TagFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (label: string) => void;
    tag?: AdminTag | null;
    isSubmitting: boolean;
};

const TagFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    tag,
    isSubmitting,
}: TagFormModalProps) => {
    const [label, setLabel] = useState('');

    useEffect(() => {
        setLabel(tag?.label ?? '');
    }, [tag, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = label.trim();
        if (trimmed) {
            onSubmit(trimmed);
        }
    };

    return (
        <BaseModal isModalOpen={isOpen} closeModal={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-2">
                <h3 className="text-sm font-bold">
                    {tag ? 'Editar Tag' : 'Nova Tag'}
                </h3>
                <BaseInput
                    label="Nome da tag"
                    variant="outlined"
                    type="text"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="Nome da tag"
                    maxLength={60}
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !label.trim()}
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default TagFormModal;
