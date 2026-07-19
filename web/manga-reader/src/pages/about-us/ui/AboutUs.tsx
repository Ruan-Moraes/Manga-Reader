import { useTranslation } from 'react-i18next';
import { Bookmark, Compass, Globe, Heart, Library, MessagesSquare, Plus, Sparkles, Star, Users, type LucideIcon } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { Button } from '@ui/Button';
import { Avatar } from '@ui/Avatar';
import Illustration from '@ui/Illustration';

const FEATURES: { key: string; icon: LucideIcon }[] = [
    { key: 'catalog', icon: Library },
    { key: 'library', icon: Bookmark },
    { key: 'reviews', icon: Star },
    { key: 'forum', icon: MessagesSquare },
    { key: 'groups', icon: Users },
    { key: 'free', icon: Sparkles },
];

// Avatares decorativos (iniciais/cores) dos "papéis" da comunidade.
const ROLES: { key: string; avatars: { initials: string; color: string }[] }[] = [
    { key: 'readers', avatars: [{ initials: 'AK', color: 'var(--mr-accent)' }, { initials: 'JS', color: 'var(--mr-danger)' }, { initials: 'LM', color: '#7aa2ff' }] },
    { key: 'translators', avatars: [{ initials: 'TR', color: '#7ad1a8' }, { initials: 'PV', color: 'var(--mr-accent)' }] },
    { key: 'fans', avatars: [{ initials: 'FN', color: 'var(--mr-danger)' }, { initials: 'DG', color: '#c98cff' }, { initials: 'BK', color: 'var(--mr-accent)' }] },
];

const AboutUs = () => {
    const { t } = useTranslation('common');
    const navigate = useAppNavigate();

    return (
        <PageContainer asMain size="default" paddingY="md">
            {/* Hero */}
            <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                    <p className="text-mr-tiny font-mr-extrabold uppercase tracking-[0.16em] text-mr-accent-fg">{t('aboutUs.hero.eyebrow')}</p>
                    <h1 className="mt-3 text-[clamp(2rem,6vw,3.25rem)] font-mr-extrabold leading-tight text-mr-fg text-balance">
                        {t('aboutUs.hero.titleBefore')} <em className="not-italic text-mr-accent-fg">{t('aboutUs.hero.titleHighlight')}</em>
                        {t('aboutUs.hero.titleAfter')}
                    </h1>
                    <p className="mt-4 max-w-[52ch] text-mr-body leading-relaxed text-mr-fg-muted">{t('aboutUs.hero.lead')}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {[
                            { icon: Heart, label: t('aboutUs.hero.chips.free') },
                            { icon: Sparkles, label: t('aboutUs.hero.chips.noAds') },
                            { icon: Globe, label: t('aboutUs.hero.chips.study') },
                        ].map(({ icon: Icon, label }) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-2 rounded-mr-full border border-mr-border bg-mr-surface px-3.5 py-2 text-mr-small font-mr-bold text-mr-fg-muted"
                            >
                                <Icon className="size-3.5 text-mr-accent-fg" aria-hidden="true" />
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="relative flex justify-center rounded-mr-md border border-mr-border bg-mr-surface p-6 shadow-mr-default">
                    <Illustration type="feliz" alt="" width={240} height={240} className="max-w-full" />
                </div>
            </section>

            {/* Missão */}
            <section className="mt-12 rounded-mr-md border border-mr-border border-l-[3px] border-l-mr-accent bg-mr-surface p-6 sm:p-8" aria-label={t('aboutUs.mission.eyebrow')}>
                <p className="text-mr-tiny font-mr-extrabold uppercase tracking-[0.16em] text-mr-accent-fg">{t('aboutUs.mission.eyebrow')}</p>
                <p className="mt-3 text-[clamp(1.375rem,3vw,1.875rem)] font-mr-extrabold leading-snug text-mr-fg text-balance">
                    {t('aboutUs.mission.statementBefore')} <em className="not-italic text-mr-accent-fg">{t('aboutUs.mission.statementHighlight')}</em>
                    {t('aboutUs.mission.statementAfter')}
                </p>
                <p className="mt-4 max-w-[60ch] text-mr-body leading-relaxed text-mr-fg-muted">{t('aboutUs.mission.body')}</p>
            </section>

            {/* O que oferecemos */}
            <section className="mt-12" aria-label={t('aboutUs.offer.title')}>
                <h2 className="text-[24px] font-mr-extrabold text-mr-fg">{t('aboutUs.offer.title')}</h2>
                <p className="mt-2 max-w-[58ch] text-mr-body text-mr-fg-subtle">{t('aboutUs.offer.subtitle')}</p>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map(({ key, icon: Icon }) => (
                        <article
                            key={key}
                            className="rounded-mr-md border border-mr-border bg-mr-surface p-5 transition-all hover:-translate-y-0.5 hover:border-mr-accent-50 hover:shadow-mr-default"
                        >
                            <span className="inline-flex size-11 items-center justify-center rounded-mr-sm bg-mr-accent-25 text-mr-accent-fg">
                                <Icon className="size-[22px]" aria-hidden="true" />
                            </span>
                            <h3 className="mt-3 text-[17px] font-mr-extrabold text-mr-fg">{t(`aboutUs.features.${key}.title`)}</h3>
                            <p className="mt-1.5 text-mr-small leading-relaxed text-mr-fg-subtle">{t(`aboutUs.features.${key}.desc`)}</p>
                        </article>
                    ))}
                </div>
            </section>

            {/* Comunidade */}
            <section className="mt-12 grid gap-8 rounded-mr-md border border-mr-border bg-mr-surface-muted p-7 sm:p-9 lg:grid-cols-2" aria-label={t('aboutUs.community.title')}>
                <div>
                    <h2 className="text-[24px] font-mr-extrabold text-mr-fg">{t('aboutUs.community.title')}</h2>
                    <p className="mt-3 text-mr-body leading-relaxed text-mr-fg-muted">{t('aboutUs.community.body')}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Button variant="primary" icon={MessagesSquare} onClick={() => navigate(ROUTES.FORUM)}>
                            {t('aboutUs.community.forumCta')}
                        </Button>
                        <Button variant="raised" icon={Users} onClick={() => navigate(ROUTES.GROUPS)}>
                            {t('aboutUs.community.groupsCta')}
                        </Button>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    {ROLES.map(role => (
                        <div key={role.key} className="flex items-center gap-3 rounded-mr-sm border border-mr-border bg-mr-surface p-3">
                            <div className="flex -space-x-2">
                                {role.avatars.map((a, i) => (
                                    <span key={i} className="rounded-mr-full ring-2 ring-mr-surface">
                                        <Avatar initials={a.initials} color={a.color} size={36} />
                                    </span>
                                ))}
                            </div>
                            <div className="min-w-0">
                                <strong className="block text-mr-small font-mr-extrabold text-mr-fg">{t(`aboutUs.roles.${role.key}.label`)}</strong>
                                <span className="text-mr-tiny text-mr-fg-subtle">{t(`aboutUs.roles.${role.key}.desc`)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA final */}
            <section
                className="mt-12 grid items-center gap-6 overflow-hidden rounded-mr-md border border-mr-accent-50 bg-[radial-gradient(circle_at_100%_0%,var(--mr-accent-25),transparent_60%)] p-8 sm:p-11 lg:grid-cols-[1fr_auto]"
                aria-label={t('aboutUs.cta.title')}
            >
                <div>
                    <h2 className="text-[24px] font-mr-extrabold text-mr-fg">{t('aboutUs.cta.title')}</h2>
                    <p className="mt-2 text-mr-body text-mr-fg-muted">{t('aboutUs.cta.body')}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Button variant="primary" icon={Plus} onClick={() => navigate(ROUTES.SIGN_UP)}>
                            {t('aboutUs.cta.signUpCta')}
                        </Button>
                        <Button variant="raised" icon={Compass} onClick={() => navigate(ROUTES.CATALOG)}>
                            {t('aboutUs.cta.exploreCta')}
                        </Button>
                    </div>
                </div>
                <Illustration type="surpresa" alt="" width={160} height={160} className="hidden justify-self-end lg:block" />
            </section>
        </PageContainer>
    );
};

export default AboutUs;
