import { useTranslation } from 'react-i18next';
import Icon, { type IconName } from '@/shared/component/Icon';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import Reveal from '@/shared/component/Reveal';
import { BENEFITS_META, type BenefitText } from '@/shared/data/landing';

function BenefitCard({
    icon,
    index,
    title,
    description,
}: {
    icon: IconName;
    index: number;
    title: string;
    description: string;
}) {
    return (
        <article className="grid h-full grid-cols-[auto_1fr] gap-4 border-b border-border px-1 py-5 text-left md:block md:rounded-[14px] md:border md:border-transparent md:bg-card md:px-[22px] md:py-6 md:transition-[translate,border-color,box-shadow] md:duration-[180ms] md:hover:-translate-y-[3px] md:hover:border-accent-muted md:hover:shadow-[-4px_5px_0_rgb(221_218_42_/_18%)]">
            <div
                className="grid justify-items-center gap-[7px] md:block"
                aria-hidden="true"
            >
                <span className="inline-flex size-[42px] items-center justify-center rounded-full border border-accent-muted bg-accent-subtle text-accent-fg md:size-[46px] md:rounded-[10px]">
                    <Icon name={icon} size={22} />
                </span>
                <span className="text-[0.625rem] font-black leading-none tracking-[0.12em] text-accent-fg md:hidden">
                    {String(index + 1).padStart(2, '0')}
                </span>
            </div>
            <div className="min-w-0 pt-px md:pt-4">
                <h3 className="m-[0_0_6px] text-[0.975rem] leading-[1.35] text-fg md:text-base">
                    {title}
                </h3>
                <p className="m-0 text-[0.8125rem] leading-[1.58] text-copy-muted md:leading-[1.6]">
                    {description}
                </p>
            </div>
        </article>
    );
}

export default function Benefits() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const items = t('benefits.items', { returnObjects: true }) as BenefitText[];
    return (
        <MarketingSection key={locale} id="benefits">
            <SectionHeading
                eyebrow={t('benefits.eyebrow')}
                title={t('benefits.title')}
            />
            <ol className="mt-10 grid list-none grid-cols-1 gap-4 p-0 text-left md:auto-rows-fr md:grid-cols-2 lg:grid-cols-4 [&>li]:h-full [&>li]:list-none">
                {items.map((item, index) => (
                    <Reveal key={item.t} as="li" delay={(index % 4) * 60}>
                        <BenefitCard
                            icon={BENEFITS_META[index]}
                            index={index}
                            title={item.t}
                            description={item.d}
                        />
                    </Reveal>
                ))}
            </ol>
        </MarketingSection>
    );
}
