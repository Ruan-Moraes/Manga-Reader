import { useTranslation } from 'react-i18next';

import useInView from '@/shared/hook/useInView';

export default function FooterCTA() {
    const { t } = useTranslation();
    const { ref, inView } = useInView();

    return (
        <section
            className={`py-24 px-4 bg-secondary ${inView ? 'animate-fade-up' : 'animate-hidden'}`}
            ref={ref}
        >
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-4xl font-extrabold text-white mb-4">
                    {t('footer_cta.headline')}
                </h2>
                <p className="text-tertiary mb-10">
                    {t('footer_cta.subheadline')}
                </p>
                <a
                    href="#plans"
                    className="inline-block rounded-lg bg-accent px-10 py-4 font-bold text-lg text-primary hover:bg-accent-hover transition-colors"
                >
                    {t('footer_cta.cta')}
                </a>
            </div>
        </section>
    );
}
