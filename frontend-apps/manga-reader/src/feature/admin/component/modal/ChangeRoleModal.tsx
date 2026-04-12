import { useState } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';

type ChangeRoleModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (role: string) => void;
    userName: string;
    currentRole: string;
    isSubmitting: boolean;
};

const ROLES = ['MEMBER', 'MODERATOR', 'ADMIN'] as const;

const ChangeRoleModal = ({
    isOpen,
    onClose,
    onConfirm,
    userName,
    currentRole,
    isSubmitting,
}: ChangeRoleModalProps) => {
    const [selectedRole, setSelectedRole] = useState(currentRole);

    return (
        <BaseModal isModalOpen={isOpen} closeModal={onClose}>
            <h3 className="text-sm font-bold">Alterar role de {userName}</h3>
            <p className="text-xs text-tertiary">
                Role atual: <span className="font-semibold">{currentRole}</span>
            </p>

            <div className="flex flex-col gap-2 mt-2">
                {ROLES.map(role => (
                    <label
                        key={role}
                        className={`flex items-center gap-2 p-2 text-sm border rounded-xs cursor-pointer transition-colors ${
                            selectedRole === role
                                ? 'border-quaternary-default bg-quaternary-opacity-25'
                                : 'border-tertiary hover:bg-tertiary/20'
                        }`}
                    >
                        <input
                            type="radio"
                            name="role"
                            value={role}
                            checked={selectedRole === role}
                            onChange={() => setSelectedRole(role)}
                            className="accent-quaternary-default"
                        />
                        {role}
                    </label>
                ))}
            </div>

            <div className="flex gap-2 mt-3">
                <button
                    onClick={onClose}
                    className="flex-1 p-2 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => onConfirm(selectedRole)}
                    disabled={selectedRole === currentRole || isSubmitting}
                    className="flex-1 p-2 text-sm font-semibold border rounded-xs bg-quaternary-opacity-25 border-quaternary-default hover:bg-quaternary-opacity-50 disabled:opacity-50"
                >
                    {isSubmitting ? 'Salvando...' : 'Confirmar'}
                </button>
            </div>
        </BaseModal>
    );
};

export default ChangeRoleModal;
