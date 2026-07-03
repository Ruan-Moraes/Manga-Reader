import { useTranslation } from 'react-i18next';
import { BadgeCheck } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { Avatar } from '@ui/Avatar';
import { Modal } from '@ui/Modal';
import { Skeleton } from '@ui/Skeleton';

import { useFollowList, type FollowListKind } from '@entities/user';

type FollowListModalProps = {
    userId: string | undefined;
    kind: FollowListKind | null;
    onClose: () => void;
};

/**
 * Lista de seguidores/seguindo do perfil (DT-48). Busca só com o modal aberto.
 */
const FollowListModal = ({ userId, kind, onClose }: FollowListModalProps) => {
    const { t } = useTranslation('user');
    const navigate = useAppNavigate();

    const open = kind !== null;
    const { users, isLoading } = useFollowList(userId, kind ?? 'followers', open);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={kind === 'following' ? t('profile.follow.followingTitle') : t('profile.follow.followersTitle')}
            size="sm"
        >
            <div className="flex flex-col gap-1 p-2">
                {isLoading &&
                    Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton variant="rect" width={40} height={40} className="rounded-full" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    ))}

                {!isLoading && users.length === 0 && <p className="p-3 text-mr-small text-mr-fg-muted">{t('profile.follow.empty')}</p>}

                {users.map(user => (
                    <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                            onClose();
                            navigate(ROUTES.USER_DETAIL(user.id));
                        }}
                        className="mr-focus-ring flex cursor-pointer items-center gap-3 rounded-mr-xs border-0 bg-transparent p-2 text-left hover:bg-mr-accent-10"
                    >
                        <Avatar src={user.photoUrl ?? undefined} name={user.name} size={40} />
                        <span className="min-w-0">
                            <span className="flex items-center gap-1.5 truncate text-mr-small font-mr-bold text-mr-fg">
                                {user.name}
                                {user.verified && <BadgeCheck className="size-3.5 shrink-0 text-mr-accent" aria-label={t('profile.header.verified')} />}
                            </span>
                            {user.username && <span className="block truncate text-mr-tiny text-mr-fg-subtle">@{user.username}</span>}
                        </span>
                    </button>
                ))}
            </div>
        </Modal>
    );
};

export default FollowListModal;
