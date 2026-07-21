import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, ShieldCheck, Star } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { formatDate } from '@shared/lib/formatters';

import { useUserModalContext } from '../model/useUserModalContext';
import { type User } from '../model/user.types';

export type UserModalHeaderUser = Pick<User, 'id' | 'name' | 'photo' | 'moderator' | 'member'>;

const DATE_OPTIONS = { year: 'numeric', month: 'long' } as const;

/** Cabeçalho do modal: avatar grande + selos (mod/membro) + atalho para o perfil completo. */
const UserModalHeader = ({ user }: { user: UserModalHeaderUser | null }) => {
    const { t } = useTranslation('user');
    const navigate = useNavigate();

    const { closeUserModal } = useUserModalContext();

    if (!user) return null;

    const isModerator = !!user.moderator?.isModerator;
    const isMember = !!user.member?.isMember;

    const handleGoToProfile = () => {
        closeUserModal();
        navigate(`${WEB_BASE_URL}${ROUTES.USER_DETAIL(user.id)}`);
    };

    return (
        <div className="flex gap-4">
            <button
                type="button"
                onClick={handleGoToProfile}
                aria-label={t('modal.openProfileAria', { name: user.name })}
                className="size-20 shrink-0 overflow-hidden rounded-mr-sm border border-mr-border bg-mr-surface-muted transition-colors hover:border-mr-accent-50 mr-focus-ring"
            >
                {user.photo ? (
                    <img src={user.photo} alt={t('modal.photoAlt', { name: user.name })} className="size-full object-cover" />
                ) : (
                    <span className="grid size-full place-items-center text-mr-h3 font-mr-extrabold text-mr-fg-subtle">{user.name.charAt(0).toUpperCase()}</span>
                )}
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
                {(isModerator || isMember) && (
                    <ul className="flex flex-wrap gap-1.5">
                        {isModerator && (
                            <li className="inline-flex items-center gap-1 rounded-mr-full border border-mr-accent-50 bg-mr-accent-25 px-2 py-0.5 text-mr-tiny font-mr-extrabold uppercase tracking-wide text-mr-accent-fg">
                                <ShieldCheck className="size-3" aria-hidden="true" />
                                {t('modal.badges.moderator')}
                            </li>
                        )}
                        {isMember && (
                            <li className="inline-flex items-center gap-1 rounded-mr-full border border-mr-border bg-mr-surface-muted px-2 py-0.5 text-mr-tiny font-mr-extrabold uppercase tracking-wide text-mr-fg-muted">
                                <Star className="size-3" aria-hidden="true" />
                                {t('modal.badges.member')}
                            </li>
                        )}
                    </ul>
                )}

                {(isModerator || isMember) && (
                    <div className="flex flex-col gap-0.5 text-mr-small text-mr-fg-subtle">
                        {isModerator && <span>{t('modal.moderatorSince', { date: formatDate(user.moderator!.since, DATE_OPTIONS) })}</span>}
                        {isMember && <span>{t('modal.memberSince', { date: formatDate(user.member!.since, DATE_OPTIONS) })}</span>}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleGoToProfile}
                    className="inline-flex items-center gap-1.5 self-start text-mr-small font-mr-bold text-mr-accent-fg hover:underline mr-focus-ring"
                >
                    {t('modal.viewProfile')}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

export default UserModalHeader;
