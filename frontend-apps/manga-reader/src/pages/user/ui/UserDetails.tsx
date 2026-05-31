import { useState } from 'react';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { PageShell } from '@widgets/layouts';

import ImageLightbox from '@ui/ImageLightbox';
import AppLink from '@ui/AppLink';
import { SOCIAL_MEDIA_COLORS } from '@shared/constant/SOCIAL_MEDIA_COLORS';
import { formatDate } from '@shared/lib/formatters';

import { useAuth } from '@features/auth';
import { useUserDetails } from '@entities/user';

type SocialMediaName = keyof typeof SOCIAL_MEDIA_COLORS;

const UserDetails = () => {
    const { t } = useTranslation('user');
    const { userId } = useParams();
    const { user: currentUser } = useAuth();

    const [isPhotoExpanded, setIsPhotoExpanded] = useState<boolean>(false);
    const { user, isLoading: loading } = useUserDetails(userId);

    const targetUser = user ?? currentUser;

    if (loading) {
        return (
            <PageShell footerShowLinks>
                <section className="flex flex-col gap-4">
                    <p className="text-sm text-tertiary">{t('details.loadingProfile')}</p>
                </section>
            </PageShell>
        );
    }

    if (!targetUser) {
        return (
            <PageShell footerShowLinks>
                <section className="flex flex-col gap-4">
                    <h2 className="font-bold text-lg">{t('details.notFoundTitle')}</h2>
                    <p className="text-sm text-tertiary">{t('details.notFoundMessage')}</p>
                </section>
            </PageShell>
        );
    }

    const dateOptions = {
        year: 'numeric' as const,
        month: 'long' as const,
    };

    const roleLabel =
        targetUser.role === 'admin' ? t('details.roles.admin') : targetUser.role === 'poster' ? t('details.roles.poster') : t('details.roles.reader');

    return (
        <PageShell footerShowLinks>
            <section className="flex flex-col gap-4">
                <h2 className="font-bold text-lg">{t('details.profileTitle', { name: targetUser.name })}</h2>

                <div className="grid gap-4 md:grid-cols-[240px_1fr]">
                    <div className="space-y-3">
                        <button type="button" onClick={() => setIsPhotoExpanded(true)} className="overflow-hidden border rounded-xs border-tertiary">
                            <img
                                src={targetUser.photo}
                                alt={t('details.photoAlt', {
                                    name: targetUser.name,
                                })}
                                className="object-cover w-full h-full min-h-56"
                            />
                        </button>

                        <div className="p-3 border rounded-xs border-tertiary bg-secondary/40">
                            <h4 className="mb-2 text-sm font-semibold">{t('details.accountSection')}</h4>
                            <ul className="space-y-1 text-xs text-tertiary">
                                <li>
                                    <span className="font-semibold text-primary-default">{t('details.roleLabel')}</span> {roleLabel}
                                </li>
                                {targetUser.member?.isMember && (
                                    <li>
                                        <span className="font-semibold text-primary-default">{t('details.memberSince')}</span>{' '}
                                        {formatDate(targetUser.member.since, dateOptions)}
                                    </li>
                                )}
                                {targetUser.moderator?.isModerator && (
                                    <li>
                                        <span className="font-semibold text-primary-default">{t('details.moderatorSince')}</span>{' '}
                                        {formatDate(targetUser.moderator.since, dateOptions)}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-lg font-bold">{targetUser.name}</h3>
                            {targetUser.bio && <p className="mt-1 text-sm text-tertiary">{targetUser.bio}</p>}
                        </div>

                        <div className="grid gap-2 text-xs sm:grid-cols-3">
                            <div className="p-2 border rounded-xs border-tertiary bg-secondary/40">
                                {targetUser.statistics?.comments ?? 0} {t('details.commentsLabel')}
                            </div>
                            <div className="p-2 border rounded-xs border-tertiary bg-secondary/40">
                                {targetUser.statistics?.likes ?? 0} {t('details.likesLabel')}
                            </div>
                            <div className="p-2 border rounded-xs border-tertiary bg-secondary/40">
                                {targetUser.statistics?.dislikes ?? 0} {t('details.dislikesLabel')}
                            </div>
                        </div>

                        {targetUser.socialMediasLinks && targetUser.socialMediasLinks.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-sm font-semibold">{t('details.socialMediaSection')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {targetUser.socialMediasLinks.map(socialMedia => (
                                        <div
                                            key={socialMedia.link}
                                            className="flex items-center justify-center p-2 border border-tertiary text-shadow-default"
                                            style={{
                                                backgroundColor: SOCIAL_MEDIA_COLORS[socialMedia.name as SocialMediaName],
                                            }}
                                        >
                                            <AppLink className="text-xs leading-none" link={socialMedia.link} text={socialMedia.name} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {targetUser.recommendedTitles && targetUser.recommendedTitles.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-sm font-semibold">{t('details.recommendedSection')}</h4>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {targetUser.recommendedTitles.map(title => (
                                        <Link
                                            key={title.link}
                                            to={`${WEB_BASE_URL}${title.link}`}
                                            className="overflow-hidden border rounded-xs border-tertiary"
                                        >
                                            <img src={title.image} alt={t('details.recommendedAlt')} className="object-cover w-full h-36" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <ImageLightbox
                isOpen={isPhotoExpanded}
                onClose={() => setIsPhotoExpanded(false)}
                src={targetUser.photo}
                alt={t('details.photoAlt', { name: targetUser.name })}
            />
        </PageShell>
    );
};

export default UserDetails;
