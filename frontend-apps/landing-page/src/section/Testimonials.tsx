import { useTranslation } from 'react-i18next';

import useInView from '@/shared/hook/useInView';

export default function Testimonials() {
    const { t } = useTranslation();
    const { ref, inView } = useInView();

    const items = t('testimonials.items', { returnObjects: true }) as Array<{
        name: string;
        text: string;
    }>;

    return (
        <section
            id="testimonials"
            className="py-24 px-4 bg-secondary"
            ref={ref}
        >
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-white mb-16">
                    {t('testimonials.title')}
                </h2>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                    {items.map((item, i) => (
                        <blockquote
                            key={item.name}
                            className={`rounded-2xl bg-primary border border-tertiary p-6 flex flex-col gap-4 ${inView ? `animate-fade-up animate-fade-up-delay-${i + 1}` : 'animate-hidden'}`}
                        >
                            <p className="text-tertiary text-sm leading-relaxed italic">
                                &ldquo;{item.text}&rdquo;
                            </p>
                            <footer className="text-sm font-bold text-white">
                                — {item.name}
                            </footer>
                        </blockquote>
                    ))}
                </div>
            </div>
        </section>
    );
}
