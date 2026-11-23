import Button from '@/shared/component/Button';
import Icon from '@/shared/component/Icon';
import type { PlanView } from '@/shared/data/landing';

interface PricingCardProps {
    plan: PlanView;
    accent?: boolean;
    ribbonLabel?: string;
    ctaLabel: string;
    onSelect?: () => void;
}

export default function PricingCard({
    plan,
    accent = false,
    ribbonLabel,
    ctaLabel,
    onSelect,
}: PricingCardProps) {
    return (
        <article
            className={`@container relative flex h-full flex-col rounded-[14px] border border-border-strong bg-secondary px-6 pt-[30px] pb-6 transition-[border-color,translate,box-shadow] duration-[180ms] hover:-translate-y-[3px] hover:border-accent-border/50 hover:shadow-[-4px_5px_0_rgb(221_218_42_/_16%)] ${accent ? 'border-accent-border/70 bg-[linear-gradient(180deg,var(--color-accent-5),var(--color-secondary)_50%)] shadow-[-4px_5px_0_rgb(221_218_42_/_20%)]' : ''}`}
        >
            {ribbonLabel ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-[13px] py-[5px] text-[0.65rem] font-black uppercase tracking-[0.1em] text-on-accent">
                    {ribbonLabel}
                </span>
            ) : null}
            <p className="m-0 text-[0.8125rem] font-black uppercase tracking-[0.1em] text-accent-fg">
                {plan.name}
            </p>
            <div className="mt-3 grid w-full grid-cols-[minmax(0,1fr)_4.5rem] items-baseline gap-2 @max-[300px]:grid-cols-[minmax(0,1fr)_3.25rem] @max-[300px]:[&>strong]:text-[1.65rem] @max-[300px]:[&>strong]:tracking-[-0.02em] @max-[300px]:[&>span]:text-xs [&>strong]:whitespace-nowrap [&>strong]:text-[clamp(2rem,4vw,2.5rem)] [&>strong]:leading-none [&>strong]:text-fg [&>strong]:tabular-nums [&>span]:whitespace-nowrap [&>span]:text-copy-muted">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
            </div>
            <p className="mt-3 min-h-12 text-sm leading-6 text-copy-muted">
                {plan.description}
            </p>
            <ul className="my-6 grid flex-1 content-start gap-3 p-0 list-none">
                {plan.features.map((feature, index) => (
                    <li
                        className="flex items-start gap-2.5 text-[0.875rem] leading-[1.5] text-copy [&>svg]:mt-0.5 [&>svg]:shrink-0 [&>svg]:text-accent-fg"
                        key={`${feature}-${index}`}
                    >
                        <Icon name="check" size={16} stroke={3} />
                        {feature}
                    </li>
                ))}
            </ul>
            <Button
                className="w-full"
                size="lg"
                variant={accent ? 'primary' : 'secondary'}
                onClick={onSelect}
            >
                {ctaLabel}
            </Button>
        </article>
    );
}
