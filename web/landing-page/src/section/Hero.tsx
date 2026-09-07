import { useTranslation } from 'react-i18next';

import Button from '@/shared/component/Button';
import Icon, { type IconName } from '@/shared/component/Icon';
import PlatformBadge from '@/shared/component/PlatformBadge';
import Reveal from '@/shared/component/Reveal';
import HeroProductPreview from '@/section/hero/HeroProductPreview';
import { appHref } from '@/shared/config/appLinks';
import { goToSection } from '@/shared/util/smoothScroll';

export default function Hero() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const badges = t('hero.badges', { returnObjects: true }) as string[];
    const platforms: { icon: IconName; label: string; accent?: boolean }[] = [
        { icon: 'smartphone', label: badges[0], accent: true },
        { icon: 'smartphone', label: badges[1] },
        { icon: 'globe', label: badges[2] },
        { icon: 'wifiOff', label: badges[3], accent: true },
        { icon: 'noAds', label: badges[4] },
    ];

    return (
        <section
            key={locale}
            id="top"
            className="relative grid min-h-[max(720px,100svh)] items-center overflow-clip pt-[104px] pb-16"
        >
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_65%_45%,rgb(221_218_42_/_11%),transparent_42%)]"
                aria-hidden="true"
            />
            <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-[clamp(42px,7vw,96px)] px-[clamp(20px,4vw,32px)] md:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)] md:pt-3">
                <div className="min-w-0 text-center md:text-left">
                    <Reveal>
                        <span className="inline-flex items-center gap-2 rounded-full border border-accent-muted bg-accent-subtle px-3.5 py-[7px] text-[0.6875rem] font-black uppercase tracking-[0.13em] text-accent-fg">
                            <Icon name="zap" size={13} />
                            {t('hero.eyebrow')}
                        </span>
                    </Reveal>
                    <Reveal
                        delay={70}
                        as="h1"
                        className="mx-auto mt-[22px] max-w-[760px] text-balance text-[clamp(2.35rem,8.5vw,5rem)] font-black leading-[0.98] tracking-[-0.045em] text-fg md:mx-0 md:text-[clamp(3rem,5.1vw,4.75rem)] [&>span]:text-accent-fg [&>small]:mt-4 [&>small]:block [&>small]:text-[clamp(1rem,2.8vw,1.5rem)] [&>small]:font-bold [&>small]:leading-[1.25] [&>small]:tracking-[-0.015em] [&>small]:text-copy-muted"
                    >
                        {t('hero.title1')} <span>{t('hero.title2')}</span>
                        <small>{t('hero.titleTail')}</small>
                    </Reveal>
                    <Reveal
                        delay={130}
                        as="p"
                        className="mx-auto mt-5 max-w-[610px] text-[clamp(1rem,2vw,1.125rem)] leading-[1.7] text-copy-muted md:mx-0"
                    >
                        {t('hero.sub')}
                    </Reveal>
                    <Reveal
                        delay={190}
                        className="mt-[30px] grid justify-items-center gap-2 md:justify-items-start"
                    >
                        <div className="flex w-[min(100%,300px)] flex-col gap-3 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:flex-wrap lg:grid lg:w-full lg:max-w-[480px] lg:grid-cols-2">
                            <Button
                                size="lg"
                                className="motion-safe:after:pointer-events-none motion-safe:after:absolute motion-safe:after:inset-0 motion-safe:after:rounded-[inherit] motion-safe:after:animate-cta-pulse lg:w-full lg:px-3! lg:text-[0.875rem]! xl:px-5! xl:text-[0.9375rem]!"
                                iconAfter={<Icon name="arrowR" size={18} />}
                                onClick={() => goToSection('plans')}
                            >
                                {t('cta.start')}
                            </Button>
                            <Button
                                href={appHref('/')}
                                size="lg"
                                variant="secondary"
                                className="lg:w-full lg:px-3! lg:text-[0.875rem]! xl:px-5! xl:text-[0.9375rem]!"
                                icon={<Icon name="user" size={18} />}
                            >
                                {t('cta.access')}
                            </Button>
                        </div>
                        <Button
                            size="lg"
                            variant="outline"
                            className="mt-2 w-[min(100%,300px)] px-[18px] min-[480px]:w-auto"
                            icon={
                                <span
                                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-accent-muted bg-accent-subtle text-accent-fg"
                                    aria-hidden="true"
                                >
                                    <Icon name="play" size={14} />
                                </span>
                            }
                            onClick={() => goToSection('demo')}
                        >
                            {t('cta.demo')}
                        </Button>
                    </Reveal>
                    <Reveal
                        delay={230}
                        className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start"
                    >
                        {platforms.map(item => (
                            <PlatformBadge key={item.label} {...item} />
                        ))}
                    </Reveal>
                </div>
                <Reveal
                    delay={120}
                    y={28}
                    className="mx-auto w-[min(100%,980px)] min-w-0 min-[940px]:max-[1327px]:mx-0 min-[940px]:max-[1327px]:w-[calc(100%_-_88px)]"
                >
                    <HeroProductPreview />
                </Reveal>
            </div>
        </section>
    );
}
