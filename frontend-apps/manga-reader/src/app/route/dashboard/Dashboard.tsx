import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import SectionTitle from '@shared/component/title/SectionTitle';
import TextSection from '@shared/component/paragraph/TextSection';

import { useAuth } from '@feature/auth';

const Dashboard = () => {
    const { t } = useTranslation('admin');
    const { user } = useAuth();

    const role = user?.role ?? 'user';
    const isAdmin = role === 'admin';
    const isPoster = role === 'poster' || role === 'admin';

    const posterCards = [
        {
            title: t('dashboard.home.cards.publications.title'),
            description: t('dashboard.home.cards.publications.description'),
        },
        {
            title: t('dashboard.home.cards.queue.title'),
            description: t('dashboard.home.cards.queue.description'),
        },
        {
            title: t('dashboard.home.cards.metrics.title'),
            description: t('dashboard.home.cards.metrics.description'),
        },
    ];

    const adminOnlyCards = [
        {
            title: t('dashboard.home.cards.moderation.title'),
            description: t('dashboard.home.cards.moderation.description'),
        },
        {
            title: t('dashboard.home.cards.userManagement.title'),
            description: t('dashboard.home.cards.userManagement.description'),
        },
        {
            title: t('dashboard.home.cards.platformConfig.title'),
            description: t('dashboard.home.cards.platformConfig.description'),
        },
    ];

    const dashboardCards = isAdmin
        ? [...posterCards, ...adminOnlyCards]
        : posterCards;

    const title = isAdmin
        ? t('dashboard.home.titleAdmin')
        : isPoster
          ? t('dashboard.home.titlePoster')
          : t('dashboard.home.titleDefault');

    const description = isAdmin
        ? t('dashboard.home.adminDescription')
        : t('dashboard.home.posterDescription');

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <TextSection>
                    <SectionTitle titleStyleClasses="text-lg" title={title} />

                    <p className="mb-4 text-sm text-tertiary">{description}</p>

                    <div className="grid gap-3 md:grid-cols-2">
                        {dashboardCards.map(card => (
                            <article
                                key={card.title}
                                className="p-3 border rounded-xs border-tertiary bg-secondary/50"
                            >
                                <h3 className="mb-1 text-sm font-semibold">
                                    {card.title}
                                </h3>
                                <p className="text-xs text-tertiary">
                                    {card.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </TextSection>
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default Dashboard;
