import { useTranslation } from 'react-i18next';
import Button from '@/shared/component/Button';
import Icon, { type IconName } from '@/shared/component/Icon';
import PlatformBadge from '@/shared/component/PlatformBadge';
import Reveal from '@/shared/component/Reveal';
import { goToSection } from '@/shared/util/smoothScroll';

export default function Final() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const labels = t('finalCta.badges', { returnObjects: true }) as string[];
    const badges: { icon: IconName; label: string; accent?: boolean }[] = [
        { icon: 'smartphone', label: labels[0], accent: true },
        { icon: 'smartphone', label: labels[1] },
        { icon: 'globe', label: labels[2] },
        { icon: 'wifiOff', label: labels[3], accent: true },
        { icon: 'noAds', label: labels[4] },
    ];
    return (
        <section
            key={locale}
            id="final"
            className="relative isolate overflow-clip bg-primary py-[clamp(72px,10vw,120px)]"
        >
            <div
                className="pointer-events-none absolute -z-10 inset-0 bg-[linear-gradient(180deg,var(--color-primary)_0%,transparent_22%,transparent_78%,var(--color-primary)_100%),radial-gradient(ellipse_82%_72%_at_50%_48%,rgb(221_218_42_/_13%)_0%,rgb(221_218_42_/_8%)_36%,rgb(221_218_42_/_3%)_62%,transparent_100%)]"
                aria-hidden="true"
            />
            <div className="relative mx-auto w-full max-w-[800px] px-[clamp(20px,4vw,32px)] text-center">
                <Reveal
                    as="h2"
                    className="m-0 text-balance text-[clamp(2rem,6vw,3.5rem)] font-black leading-[1.05] tracking-[-0.04em] text-fg"
                >
                    {t('finalCta.title')}
                </Reveal>
                <Reveal
                    delay={70}
                    as="p"
                    className="mx-auto mt-[18px] max-w-[560px] text-[clamp(1rem,2.5vw,1.125rem)] leading-[1.7] text-copy"
                >
                    {t('finalCta.sub')}
                </Reveal>
                <Reveal delay={130} className="mt-8">
                    <Button
                        size="lg"
                        className="motion-safe:after:pointer-events-none motion-safe:after:absolute motion-safe:after:inset-0 motion-safe:after:rounded-[inherit] motion-safe:after:animate-cta-pulse"
                        iconAfter={<Icon name="arrowR" size={19} />}
                        onClick={() => goToSection('plans')}
                    >
                        {t('cta.subscribe')}
                    </Button>
                </Reveal>
                <Reveal
                    delay={180}
                    className="mt-6 flex flex-wrap justify-center gap-2"
                >
                    {badges.map(badge => (
                        <PlatformBadge key={badge.label} {...badge} />
                    ))}
                </Reveal>
                <Reveal
                    delay={220}
                    className="mt-5 flex items-center justify-center gap-2 text-[0.8125rem] text-tertiary [&>svg]:text-accent-fg"
                >
                    <Icon name="shield" size={15} />
                    {t('finalCta.note')}
                </Reveal>
            </div>
        </section>
    );
}
