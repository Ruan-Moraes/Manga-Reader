import { useState } from 'react';

import BaseInput from '@shared/component/input/BaseInput';
import BaseModal from '@shared/component/modal/base/BaseModal';

type GrantSubscriptionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userId: string, planId: string) => void;
    isSubmitting: boolean;
};

const GrantSubscriptionModal = ({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
}: GrantSubscriptionModalProps) => {
    const [userId, setUserId] = useState('');
    const [planId, setPlanId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userId.trim() && planId.trim()) {
            onSubmit(userId.trim(), planId.trim());
        }
    };

    return (
        <BaseModal isModalOpen={isOpen} closeModal={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-2">
                <h3 className="text-sm font-bold">Conceder Assinatura</h3>

                <BaseInput
                    label="User ID (UUID)"
                    variant="outlined"
                    type="text"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />

                <BaseInput
                    label="Plan ID (UUID)"
                    variant="outlined"
                    type="text"
                    value={planId}
                    onChange={e => setPlanId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
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
                        disabled={
                            isSubmitting || !userId.trim() || !planId.trim()
                        }
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Concedendo...' : 'Conceder'}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default GrantSubscriptionModal;
