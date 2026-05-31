import { ROUTES } from '@shared/constant/ROUTES';
import { useTranslation } from 'react-i18next';
import { Edit2, UserPlus } from 'lucide-react';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';

import type { ProfileData } from '@mock/userProfile';

type UserProfileHeaderProps = {
    profile: ProfileData;
    isOwn: boolean;
    following: boolean;
    onFollowToggle: () => void;
};

const UserProfileHeader = ({ profile, isOwn, following, onFollowToggle }: UserProfileHeaderProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('user');

    return (
        <Card variant="default" className="mb-6 overflow-hidden">
            <div
                className="h-[160px] w-full"
                style={{
                    background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d, #1a1a1a)',
                }}
            />

            <div className="relative px-4 pb-5 md:px-6">
                <div className="-mt-10 mb-3">
                    <Avatar name={profile.name} size={96} />
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-mr-h2 font-mr-extrabold tracking-mr text-mr-fg">{profile.name}</h1>
                        <p className="mb-2 text-mr-small text-mr-fg-muted">{profile.handle}</p>
                        <p className="mb-3 max-w-[500px] text-mr-small leading-relaxed text-mr-fg-muted line-clamp-2 md:line-clamp-none">{profile.bio}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.genres.map(g => (
                                <Badge key={g}>{g}</Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {isOwn ? (
                            <Button variant="raised" icon={Edit2} onClick={() => navigate(ROUTES.PROFILE_EDIT)}>
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
                            label: t('profile.stats.comments'),
                            value: profile.followers,
                        },
                        {
                            label: t('profile.stats.total'),
                            value: profile.following,
                        },
                    ].map(s => (
                        <div key={s.label}>
                            <dd className="text-mr-h3 font-mr-extrabold text-mr-fg">{s.value.toLocaleString()}</dd>
                            <dt className="text-mr-tiny text-mr-fg-subtle">{s.label}</dt>
                        </div>
                    ))}
                </dl>
            </div>
        </Card>
    );
};

export default UserProfileHeader;
