import { useTranslation } from 'react-i18next';
import { ShieldCheck, Star } from 'lucide-react';

type CommentBadgesProps = {
    isMember: boolean;
    isModerator: boolean;
    wasEdited: boolean;
};

const CHIP = 'inline-flex items-center gap-1 rounded-mr-full bg-mr-accent-25 px-2 py-0.5 text-mr-tiny font-mr-bold text-mr-fg';

/** Chips de papel do comentário: membro / moderador / "editado". */
const CommentBadges = ({ isMember, isModerator, wasEdited }: CommentBadgesProps) => {
    const { t } = useTranslation('comment');

    return (
        <>
            {isMember && (
                <span className={CHIP} title={t('user.memberBadge')}>
                    <Star className="size-3" aria-hidden="true" />
                    {t('user.memberBadge')}
                </span>
            )}
            {isModerator && (
                <span className={CHIP} title={t('user.moderatorBadge')}>
                    <ShieldCheck className="size-3" aria-hidden="true" />
                    {t('user.moderatorBadge')}
                </span>
            )}
            {wasEdited && <span className="text-mr-tiny text-mr-fg-subtle">({t('metadata.edited')})</span>}
        </>
    );
};

export default CommentBadges;
