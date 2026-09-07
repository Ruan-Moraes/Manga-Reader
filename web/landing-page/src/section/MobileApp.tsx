import { useTranslation } from 'react-i18next';
import { PhoneFrame } from '@/shared/component/DeviceFrames';
import Icon from '@/shared/component/Icon';
import MarketingSection, {
    SectionEyebrow,
} from '@/shared/component/MarketingSection';
import { LibraryScreen, ReaderScreen } from '@/shared/component/mock-screen';
import Reveal from '@/shared/component/Reveal';
import StoreBadge from '@/shared/component/StoreBadge';

export default function MobileApp() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const features = t('mobile.features', { returnObjects: true }) as string[];
    return (
        <MarketingSection key={locale} id="app" tone="raised">
            <div className="grid grid-cols-1 items-center gap-[clamp(42px,7vw,72px)] md:grid-cols-[0.95fr_1.05fr]">
                <Reveal
                    y={26}
                    className="relative flex min-h-[430px] items-center justify-center before:absolute before:inset-0 before:bg-[radial-gradient(circle,rgb(221_218_42_/_9%),transparent_62%)]"
                >
                    <div className="relative z-[2] motion-safe:animate-float-b">
                        <PhoneFrame w={224} label={t('hero.phonePreviewLabel')}>
                            <LibraryScreen />
                        </PhoneFrame>
                    </div>
                    <PhoneFrame
                        w={176}
                        className="absolute! right-[8%] bottom-0 z-[1]! hidden opacity-[0.88] min-[480px]:block motion-safe:animate-float-a"
                        label={t('hero.phonePreviewLabel')}
                    >
                        <ReaderScreen />
                    </PhoneFrame>
                </Reveal>
                <div>
                    <Reveal>
                        <SectionEyebrow>{t('mobile.eyebrow')}</SectionEyebrow>
                    </Reveal>
                    <Reveal
                        delay={60}
                        as="h2"
                        className="m-0 max-w-[650px] text-balance text-[clamp(1.9rem,4.5vw,2.6rem)] font-black leading-[1.12] tracking-[-0.03em] text-fg"
                    >
                        {t('mobile.title')}
                    </Reveal>
                    <Reveal
                        delay={110}
                        as="p"
                        className="m-[16px_0_0] max-w-[520px] text-base leading-[1.7] text-copy-muted"
                    >
                        {t('mobile.sub')}
                    </Reveal>
                    <ul className="m-[26px_0_0] grid list-none gap-3 p-0">
                        {features.map((feature, index) => (
                            <Reveal
                                key={feature}
                                delay={140 + index * 45}
                                as="li"
                                className="flex items-center gap-3 text-[0.9375rem] font-bold text-fg"
                            >
                                <span className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-full border border-accent-muted bg-accent-subtle text-accent-fg">
                                    <Icon name="check" size={14} stroke={3} />
                                </span>
                                {feature}
                            </Reveal>
                        ))}
                    </ul>
                    <Reveal
                        delay={240}
                        className="mt-[30px] flex flex-wrap gap-3"
                    >
                        <StoreBadge
                            kind="apple"
                            line1={t('mobile.appStore')}
                            line2={t('mobile.appStoreName')}
                        />
                        <StoreBadge
                            kind="play"
                            line1={t('mobile.googlePlay')}
                            line2={t('mobile.googlePlayName')}
                        />
                    </Reveal>
                </div>
            </div>
        </MarketingSection>
    );
}
