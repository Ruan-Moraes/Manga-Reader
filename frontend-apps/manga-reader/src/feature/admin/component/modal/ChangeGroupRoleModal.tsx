import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseRadioGroup from '@shared/component/input/BaseRadioGroup';
import AdminModal from './AdminModal';

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
    const { t } = useTranslation('admin');
    const [selectedRole, setSelectedRole] = useState(
        currentRole ?? GROUP_ROLES[0],
    );

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-4 p-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold">
                        {t('changeGroupRole.title', { name: memberName })}
                    </h3>
                    <p className="text-xs text-tertiary">
                        {t('changeGroupRole.currentRole')}{' '}
                        <span className="font-semibold">
                            {currentRole
                                ? t(
                                      `changeGroupRole.roles.${currentRole}`,
                                      currentRole,
                                  )
                                : '—'}
                        </span>
                    </p>
                </div>

                <div className="max-h-64 overflow-y-auto">
                    <BaseRadioGroup
                        name="group-role"
                        orientation="vertical"
                        value={selectedRole}
                        onChange={setSelectedRole}
                        options={GROUP_ROLES.map(role => ({
                            value: role,
                            label: t(`changeGroupRole.roles.${role}`, role),
                        }))}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30"
                    >
                        {t('changeGroupRole.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(selectedRole)}
                        disabled={selectedRole === currentRole || isSubmitting}
                        className="px-3 py-1.5 text-sm font-semibold border rounded-xs bg-quaternary-opacity-25 border-quaternary-default hover:bg-quaternary-opacity-50 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('changeGroupRole.confirming')
                            : t('changeGroupRole.confirm')}
                    </button>
                </div>
            </div>
        </AdminModal>
    );
};

export default ChangeGroupRoleModal;
