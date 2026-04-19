import { useTranslation } from 'react-i18next';

import Accordion from '@/shared/component/Accordion';
import useInView from '@/shared/hook/useInView';

export default function FAQ() {
    const { t } = useTranslation();
    const { ref, inView } = useInView();

    const items = t('faq.items', { returnObjects: true }) as Array<{
        question: string;
        answer: string;
    }>;

    return (
        <section
            id="faq"
            className={`py-24 px-4 ${inView ? 'animate-fade-up' : 'animate-hidden'}`}
            ref={ref}
        >
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-white mb-12">
                    {t('faq.title')}
                </h2>
                <Accordion items={items} />
            </div>
        </section>
    );
}
