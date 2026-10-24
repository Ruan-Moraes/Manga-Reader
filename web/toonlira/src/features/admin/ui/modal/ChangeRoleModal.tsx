import { useTranslation } from 'react-i18next';

import SelectStatusModal from '../parts/SelectStatusModal';

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

    return (
        <SelectStatusModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={t('changeRole.title', { name: userName })}
            fieldLabel={t('changeRole.fieldLabel')}
            options={ROLES.map(role => ({ value: role, label: t(`changeRole.roles.${role}`, role) }))}
            currentValue={currentRole}
            confirmLabel={t('changeRole.save')}
            cancelLabel={t('changeRole.cancel')}
            isSubmitting={isSubmitting}
        />
    );
};

export default ChangeRoleModal;
