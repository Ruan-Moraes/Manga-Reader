import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import Reveal from '@/shared/component/Reveal';

export function PlansTrustBar() {
    const { t } = useTranslation();
    const trust = t('plans.trust', { returnObjects: true }) as string[];

    if (!Array.isArray(trust) || trust.length === 0) return null;

    return (
        <Reveal
            delay={120}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2 [&>span]:text-[0.8125rem] [&>span]:font-bold [&>span]:text-copy-muted [&>span>svg]:text-accent-fg"
        >
            {trust.map((item, index) => (
                <span key={index}>
                    <Icon name="shield" size={16} />
                    {item}
                </span>
            ))}
        </Reveal>
    );
}
