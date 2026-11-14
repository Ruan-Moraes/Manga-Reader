import { useTranslation } from 'react-i18next';

import SelectStatusModal from '../parts/SelectStatusModal';

type ChangeGroupRoleModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (role: string) => void;
    memberName: string;
    currentRole: string | null;
    isSubmitting: boolean;
};

const GROUP_ROLES = ['LIDER', 'TRADUTOR', 'REVISOR', 'QC', 'CLEANER', 'TYPESETTER'] as const;

const ChangeGroupRoleModal = ({ isOpen, onClose, onConfirm, memberName, currentRole, isSubmitting }: ChangeGroupRoleModalProps) => {
    const { t } = useTranslation('admin');

    return (
        <SelectStatusModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={t('changeGroupRole.title', { name: memberName })}
            fieldLabel={t('changeGroupRole.fieldLabel', { name: memberName })}
            options={GROUP_ROLES.map(role => ({ value: role, label: t(`changeGroupRole.roles.${role}`, role) }))}
            currentValue={currentRole ?? GROUP_ROLES[0]}
            confirmLabel={t('changeGroupRole.confirm')}
            cancelLabel={t('changeGroupRole.cancel')}
            isSubmitting={isSubmitting}
        />
    );
};

export default ChangeGroupRoleModal;
