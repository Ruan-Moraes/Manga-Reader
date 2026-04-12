import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import useInView from '@/shared/hook/useInView';

const BENEFIT_ICONS: Record<string, ReactNode> = {
    library: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-8 h-8 text-accent"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
        </svg>
    ),
    updates: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-8 h-8 text-accent"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
            />
        </svg>
    ),
    multiplatform: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-8 h-8 text-accent"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z"
            />
        </svg>
    ),
    offline: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-8 h-8 text-accent"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
        </svg>
    ),
};

export default function Benefits() {
    const { t } = useTranslation();
    const { ref, inView } = useInView();

    const keys = ['library', 'updates', 'multiplatform', 'offline'] as const;

    return (
        <section id="benefits" className="py-24 px-4" ref={ref}>
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-white mb-16">
                    {t('benefits.title')}
                </h2>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {keys.map((key, i) => (
                        <div
                            key={key}
                            className={`rounded-2xl bg-secondary border border-tertiary p-6 flex flex-col gap-3 hover:border-accent-muted transition-colors ${inView ? `animate-fade-up animate-fade-up-delay-${i + 1}` : 'animate-hidden'}`}
                        >
                            <span aria-hidden="true">{BENEFIT_ICONS[key]}</span>
                            <h3 className="text-base font-bold text-white">
                                {t(`benefits.items.${key}.title`)}
                            </h3>
                            <p className="text-sm text-tertiary leading-relaxed">
                                {t(`benefits.items.${key}.description`)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
