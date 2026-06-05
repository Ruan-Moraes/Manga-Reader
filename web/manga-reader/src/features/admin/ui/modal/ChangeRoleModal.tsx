import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RadioGroup } from '@ui/Radio';
import AdminModal from './AdminModal';

type ChangeRoleModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (role: string) => void;
    userName: string;
    currentRole: string;
    isSubmitting: boolean;
};

const ROLES = ['MEMBER', 'MODERATOR', 'ADMIN'] as const;

const ChangeRoleModal = ({ isOpen, onClose, onConfirm, userName, currentRole, isSubmitting }: ChangeRoleModalProps) => {
    const { t } = useTranslation('admin');
    const [selectedRole, setSelectedRole] = useState(currentRole);

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-4 p-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold">{t('changeRole.title', { name: userName })}</h3>
                    <p className="text-xs text-tertiary">
                        {t('changeRole.currentRole')} <span className="font-semibold">{t(`changeRole.roles.${currentRole}`, currentRole)}</span>
                    </p>
                </div>

                <RadioGroup
                    name="role"
                    layout="vertical"
                    value={selectedRole}
                    onChange={setSelectedRole}
                    options={ROLES.map(role => ({
                        value: role,
                        label: t(`changeRole.roles.${role}`, role),
                    }))}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30">
                        {t('changeRole.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(selectedRole)}
                        disabled={selectedRole === currentRole || isSubmitting}
                        className="px-3 py-1.5 text-sm font-semibold border rounded-xs bg-quaternary-opacity-25 border-quaternary-default hover:bg-quaternary-opacity-50 disabled:opacity-50"
                    >
                        {isSubmitting ? t('changeRole.confirming') : t('changeRole.confirm')}
                    </button>
                </div>
            </div>
        </AdminModal>
    );
};

export default ChangeRoleModal;
