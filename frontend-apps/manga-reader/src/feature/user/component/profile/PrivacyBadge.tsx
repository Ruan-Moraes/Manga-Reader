import { useTranslation } from 'react-i18next';

type Props = {
    visibility: string;
};

const PrivacyBadge = ({ visibility }: Props) => {
    const { t } = useTranslation('user');

    const label =
        visibility === 'DO_NOT_TRACK'
            ? t('profile.privacy.doNotTrack')
            : t('profile.privacy.private');
    const color =
        visibility === 'DO_NOT_TRACK'
            ? 'bg-quinary-default/20 text-quinary-default'
            : 'bg-tertiary/20 text-tertiary';

    return (
        <span
            className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${color}`}
        >
            {label}
        </span>
    );
};

export default PrivacyBadge;
