import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import SectionTitle from '@shared/component/title/SectionTitle';
import TextSection from '@shared/component/paragraph/TextSection';

import { useAuth } from '@feature/auth';

const Dashboard = () => {
    const { user } = useAuth();

    const role = user?.role ?? 'user';
    const isAdmin = role === 'admin';
    const isPoster = role === 'poster' || role === 'admin';

    const posterCards = [
        {
            title: 'Minhas publicações',
            description:
                'Gerencie capítulos enviados, status e histórico de revisão.',
        },
        {
            title: 'Fila de envio',
            description:
                'Acompanhe os conteúdos pendentes e os próximos agendamentos.',
        },
        {
            title: 'Métricas de leitura',
            description:
                'Visualize alcance, retenção e curtidas dos seus lançamentos.',
        },
    ];

    const adminOnlyCards = [
        {
            title: 'Moderação global',
            description: 'Aprove/reprove publicações, comentários e denúncias.',
        },
        {
            title: 'Gestão de usuários',
            description:
                'Promova postadores, suspenda contas e revise permissões.',
        },
        {
            title: 'Configuração da plataforma',
            description:
                'Ajuste destaques, eventos e parâmetros gerais do sistema.',
        },
    ];

    const dashboardCards = isAdmin
        ? [...posterCards, ...adminOnlyCards]
        : posterCards;

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <TextSection>
                    <SectionTitle
                        titleStyleClasses="text-lg"
                        title={`Dashboard ${
                            isAdmin ? 'Admin' : isPoster ? 'Postador' : ''
                        }`.trim()}
                    />

                    <p className="mb-4 text-sm text-tertiary">
                        {isAdmin
                            ? 'Você possui acesso completo ao painel (incluindo tudo do Postador).'
                            : 'Você possui acesso ao painel de conteúdo e publicação.'}
                    </p>

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
