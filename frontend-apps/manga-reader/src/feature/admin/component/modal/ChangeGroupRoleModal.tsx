import { useState } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';

type ChangeGroupRoleModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (role: string) => void;
    memberName: string;
    currentRole: string | null;
    isSubmitting: boolean;
};

const GROUP_ROLES = [
    'LIDER',
    'TRADUTOR',
    'REVISOR',
    'QC',
    'CLEANER',
    'TYPESETTER',
] as const;

const ChangeGroupRoleModal = ({
    isOpen,
    onClose,
    onConfirm,
    memberName,
    currentRole,
    isSubmitting,
}: ChangeGroupRoleModalProps) => {
    const [selectedRole, setSelectedRole] = useState(
        currentRole ?? GROUP_ROLES[0],
    );

    return (
        <BaseModal isModalOpen={isOpen} closeModal={onClose}>
            <h3 className="text-sm font-bold">Alterar role de {memberName}</h3>
            <p className="text-xs text-tertiary">
                Role atual:{' '}
                <span className="font-semibold">{currentRole ?? '—'}</span>
            </p>

            <div className="flex flex-col gap-2 mt-2 max-h-64 overflow-y-auto">
                {GROUP_ROLES.map(role => (
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
                            name="group-role"
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

export default ChangeGroupRoleModal;
