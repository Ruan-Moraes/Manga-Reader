import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Badge from '@/shared/component/Badge';
import useInView from '@/shared/hook/useInView';

function Icon({ d }: { d: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-4 h-4"
            aria-hidden="true"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
    );
}

const FEATURE_ICONS: Record<string, ReactNode> = {
    web: (
        <Icon d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.733-3.559" />
    ),
    ios: (
        <Icon d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    ),
    android: (
        <Icon d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    ),
    offline: (
        <Icon d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    ),
    no_ads: (
        <Icon d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
    ),
    hd: (
        <Icon d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    ),
};

export default function Features() {
    const { t } = useTranslation();
    const { ref, inView } = useInView();

    const keys = ['web', 'ios', 'android', 'offline', 'no_ads', 'hd'] as const;

    return (
        <section id="features" className="py-24 px-4" ref={ref}>
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-white mb-12">
                    {t('features.title')}
                </h2>
                <div className="flex flex-wrap gap-4 justify-center">
                    {keys.map((key, i) => (
                        <Badge
                            key={key}
                            icon={FEATURE_ICONS[key]}
                            label={t(`features.badges.${key}`)}
                            className={
                                inView
                                    ? `animate-fade-up animate-fade-up-delay-${Math.min(i + 1, 5)}`
                                    : 'animate-hidden'
                            }
                            variant={
                                key === 'offline' || key === 'no_ads'
                                    ? 'highlight'
                                    : 'default'
                            }
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
