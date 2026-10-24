import { useTranslation } from 'react-i18next';

import { SOCIAL_MEDIA_COLORS } from '@shared/constant/SOCIAL_MEDIA_COLORS';

import AppLink from '@ui/AppLink';

import { type User } from '../model/user.types';

type SocialMediaName = keyof typeof SOCIAL_MEDIA_COLORS;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-2">
        <h4 className="ui-label text-ui-fg-subtle">{title}</h4>
        {children}
    </section>
);

const Skeleton = () => (
    <div className="flex flex-col gap-4" aria-hidden="true">
        <div className="h-3 w-24 rounded-ui-xs bg-ui-surface-muted" />
        <div className="h-12 w-full rounded-ui-xs bg-ui-surface-muted" />
        <div className="h-3 w-20 rounded-ui-xs bg-ui-surface-muted" />
        <div className="flex gap-2">
            <div className="h-24 w-20 rounded-ui-sm bg-ui-surface-muted" />
            <div className="h-24 w-20 rounded-ui-sm bg-ui-surface-muted" />
            <div className="h-24 w-20 rounded-ui-sm bg-ui-surface-muted" />
        </div>
    </div>
);

/** Corpo do modal: bio, redes, estatísticas e recomendados — todos vindos de dados reais. */
const UserModalBody = ({ user, loading }: { user: User | null; loading: boolean }) => {
    const { t } = useTranslation('user');

    if (loading) return <Skeleton />;

    if (!user) return null;

    const stats = user.statistics;
    const recommended = user.recommendedTitles ?? [];
    const social = user.socialMediasLinks ?? [];

    const hasStats = !!stats && (stats.comments != null || stats.likes != null || stats.dislikes != null);

    return (
        <div className="flex flex-col gap-4">
            {user.bio && (
                <Section title={t('modal.body.bio')}>
                    <p className="text-ui-small leading-relaxed text-ui-fg-muted">{user.bio}</p>
                </Section>
            )}

            {social.length > 0 && (
                <Section title={t('modal.body.socialMedia')}>
                    <div className="flex flex-wrap gap-2">
                        {social.map(socialMedia => (
                            <div
                                key={socialMedia.link}
                                className="flex items-center justify-center rounded-ui-xs px-2 py-1 text-shadow-default"
                                style={{ backgroundColor: SOCIAL_MEDIA_COLORS[socialMedia.name as SocialMediaName] }}
                            >
                                <AppLink className="text-ui-tiny font-ui-bold leading-none" link={socialMedia.link} text={socialMedia.name} />
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {hasStats && (
                <Section title={t('modal.body.statistics')}>
                    <ul className="flex flex-wrap gap-2">
                        <li className="rounded-ui-full bg-ui-accent-25 px-3 py-1 text-ui-small font-ui-bold text-ui-fg">
                            {t('modal.body.commentsCount', { count: stats!.comments ?? 0 })}
                        </li>
                        <li className="rounded-ui-full bg-ui-accent-25 px-3 py-1 text-ui-small font-ui-bold text-ui-fg">
                            {t('modal.body.likesCount', { count: stats!.likes ?? 0 })}
                        </li>
                        <li className="rounded-ui-full bg-ui-accent-25 px-3 py-1 text-ui-small font-ui-bold text-ui-fg">
                            {t('modal.body.dislikesCount', { count: stats!.dislikes ?? 0 })}
                        </li>
                    </ul>
                </Section>
            )}

            {recommended.length > 0 && (
                <Section title={t('modal.body.recommendedWorks')}>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
                        {recommended.map(title => (
                            <AppLink key={title.link} link={title.link} className="h-32 w-24 shrink-0">
                                <img src={title.image} alt={t('modal.body.workAlt')} className="size-full rounded-ui-sm border border-ui-border object-cover" />
                            </AppLink>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

export default UserModalBody;
