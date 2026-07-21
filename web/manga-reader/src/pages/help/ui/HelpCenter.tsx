import { useState } from 'react';
import { MessageCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { Card } from '@ui/Card';
import { Button } from '@ui/Button';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { illustrationUrl } from '@shared/lib/illustrations';

import HelpSearch from './parts/HelpSearch';
import HelpArticlesSection from './parts/HelpArticlesSection';
import HelpFaqSection from './parts/HelpFaqSection';
import HelpStatusSection from './parts/HelpStatusSection';

export default function HelpCenter() {
    const navigate = useAppNavigate();
    const { t } = useTranslation('help');
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    return (
        <div>
            <HelpSearch query={query} onQueryChange={setQuery} />

            <PageContainer asMain paddingY="lg">
                <HelpArticlesSection
                    query={query}
                    activeCategory={activeCategory}
                    onCategoryToggle={slug => setActiveCategory(c => (c === slug ? null : slug))}
                />

                <HelpFaqSection />

                <section className="mb-12">
                    <Card variant="flat" className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left sm:py-6">
                        <img src={illustrationUrl('pensando')} alt="" className="h-20 w-auto sm:h-16" />
                        <div className="flex-1">
                            <p className="mr-label mb-1 text-mr-accent-fg">{t('contact.eyebrow')}</p>
                            <h3 className="text-mr-h3 font-mr-extrabold tracking-mr text-mr-fg">{t('contact.title')}</h3>
                            <p className="mt-1 text-mr-small text-mr-fg-muted">
                                {t('contact.responseTime')} <strong className="text-mr-fg">{t('contact.responseTimeValue')}</strong>
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button variant="primary" icon={MessageCircle} onClick={() => navigate(ROUTES.LEGAL_CONTACT)}>
                                {t('contact.openTicket')}
                            </Button>
                            <Button variant="ghost" icon={MessageSquare} onClick={() => navigate(ROUTES.FORUM)}>
                                {t('contact.askForum')}
                            </Button>
                            <Button variant="ghost" danger icon={AlertTriangle} onClick={() => navigate(ROUTES.LEGAL_CONTACT)}>
                                {t('contact.priority')}
                            </Button>
                        </div>
                    </Card>
                </section>

                <HelpStatusSection />
            </PageContainer>
        </div>
    );
}
