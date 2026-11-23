import { useTranslation } from 'react-i18next';
import { BadgeCheck, Edit2, UserPlus } from 'lucide-react';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';

import { type ProfileData, useProfileSettingsModal } from '@entities/user';

type UserProfileHeaderProps = {
    profile: ProfileData;
    isOwn: boolean;
    following: boolean;
    onFollowToggle: () => void;
    onShowFollowers?: () => void;
    onShowFollowing?: () => void;
};

const UserProfileHeader = ({ profile, isOwn, following, onFollowToggle, onShowFollowers, onShowFollowing }: UserProfileHeaderProps) => {
    const { t } = useTranslation('user');
    const { openProfileSettings } = useProfileSettingsModal();

    return (
        <Card variant="default" className="mb-6 overflow-hidden">
            <div className="h-[160px] w-full bg-ui-banner-gradient" />

            <div className="relative px-4 pb-5 md:px-6">
                <div className="-mt-10 mb-3">
                    <Avatar name={profile.name} size={96} />
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="inline-flex items-center gap-2 text-ui-h2 font-ui-extrabold tracking-mr text-ui-fg">
                            {profile.name}
                            {profile.verified && (
                                <BadgeCheck className="size-5 text-ui-accent-fg" aria-label={t('profile.header.verified', { defaultValue: 'Verificado' })} />
                            )}
                        </h1>
                        <p className="mb-2 text-ui-small text-ui-fg-muted">{profile.handle}</p>
                        <p className="mb-3 max-w-[500px] text-ui-small leading-relaxed text-ui-fg-muted line-clamp-2 md:line-clamp-none">{profile.bio}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.genres.map(g => (
                                <Badge key={g}>{g}</Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {isOwn ? (
                            <Button variant="raised" icon={Edit2} onClick={() => openProfileSettings('informacoes')}>
                                {t('profile.header.edit')}
                            </Button>
                        ) : (
                            <>
                                <Button variant={following ? 'raised' : 'primary'} icon={UserPlus} onClick={onFollowToggle}>
                                    {following ? t('profile.header.following') : t('profile.header.follow')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <dl className="mt-4 flex flex-wrap gap-5">
                    {[
                        {
                            label: t('profile.stats.reading'),
                            value: profile.worksRead,
                        },
                        {
                            label: t('profile.stats.ratings'),
                            value: profile.reviews,
                        },
                        {
                            label: t('profile.stats.followers'),
                            value: profile.followers,
                            onClick: onShowFollowers,
                        },
                        {
                            label: t('profile.stats.following'),
                            value: profile.following,
                            onClick: onShowFollowing,
                        },
                    ].map(s => (
                        <div key={s.label}>
                            {s.onClick ? (
                                <button
                                    type="button"
                                    onClick={s.onClick}
                                    className="ui-focus-ring block cursor-pointer border-0 bg-transparent p-0 text-left"
                                >
                                    <dd className="text-ui-h3 font-ui-extrabold text-ui-fg">{s.value.toLocaleString()}</dd>
                                    <dt className="text-ui-tiny text-ui-fg-subtle underline-offset-2 hover:underline">{s.label}</dt>
                                </button>
                            ) : (
                                <>
                                    <dd className="text-ui-h3 font-ui-extrabold text-ui-fg">{s.value.toLocaleString()}</dd>
                                    <dt className="text-ui-tiny text-ui-fg-subtle">{s.label}</dt>
                                </>
                            )}
                        </div>
                    ))}
                </dl>
            </div>
        </Card>
    );
};

export default UserProfileHeader;
