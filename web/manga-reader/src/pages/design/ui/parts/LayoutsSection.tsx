import { useState } from 'react';
import { Bookmark, BookOpen, Calendar, Compass, Home, LogOut, Search, Star, User, Users } from 'lucide-react';

import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { Footer } from '@ui/Footer';
import { HeroSection } from '@ui/HeroSection';
import { MobileTabBar } from '@ui/MobileTabBar';
import { NavBar } from '@ui/NavBar';
import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { SideMenu } from '@ui/SideMenu';
import { StatusDot } from '@ui/StatusDot';
import { useToast } from '@ui/Toast';

import { PhaseHeader, Section, SubSection } from './showcaseShared';

export default function LayoutsSection() {
    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    const [navSearch, setNavSearch] = useState('');
    const [activeNavKey, setActiveNavKey] = useState('home');
    const { toast } = useToast();

    const DEMO_USER = {
        name: 'Ana Paula',
        handle: 'ana_paula',
        avatar: 'https://i.pravatar.cc/96?img=1',
        notificationCount: 3,
        libraryCount: 42,
    };

    const SIDE_SECTIONS = [
        {
            title: 'Descobrir',
            items: [
                {
                    key: 'home',
                    label: 'Início',
                    icon: Home,
                    onClick: () => setActiveNavKey('home'),
                },
                {
                    key: 'discover',
                    label: 'Descobrir',
                    icon: Compass,
                    onClick: () => setActiveNavKey('discover'),
                },
                {
                    key: 'events',
                    label: 'Eventos',
                    icon: Calendar,
                    onClick: () => setActiveNavKey('events'),
                },
            ],
        },
        {
            title: 'Comunidade',
            items: [
                {
                    key: 'groups',
                    label: 'Grupos',
                    icon: Users,
                    badge: 5,
                    onClick: () => setActiveNavKey('groups'),
                },
            ],
        },
    ];

    const NAV_LINKS = [
        {
            key: 'discover',
            label: 'Descobrir',
            onClick: () => setActiveNavKey('discover'),
        },
        {
            key: 'community',
            label: 'Comunidade',
            onClick: () => setActiveNavKey('community'),
        },
        {
            key: 'events',
            label: 'Atualizações',
            onClick: () => setActiveNavKey('events'),
        },
    ];

    const FOOTER_COLUMNS = [
        {
            title: 'Navegar',
            links: [
                { label: 'Início', href: '#' },
                { label: 'Descobrir', href: '#' },
                { label: 'Em alta', href: '#' },
            ],
        },
        {
            title: 'Comunidade',
            links: [
                { label: 'Grupos', href: '#' },
                { label: 'Fórum', href: '#' },
                { label: 'Eventos', href: '#' },
            ],
        },
        {
            title: 'Empresa',
            links: [
                { label: 'Sobre nós', href: '#' },
                { label: 'Contato', href: '#' },
                { label: 'Blog', href: '#' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { label: 'Termos de uso', href: '#' },
                { label: 'Privacidade', href: '#' },
                { label: 'DMCA', href: '#' },
            ],
        },
    ];

    return (
        <>
            <PhaseHeader title="Fase 3 — Layouts" />

            {/* NAVBAR */}
            <Section title="NavBar">
                <SubSection label="Com usuário logado (sticky acima)">
                    <div className="w-full -mx-6 border border-mr-border-subtle">
                        <NavBar
                            links={NAV_LINKS}
                            user={DEMO_USER}
                            activeKey={activeNavKey}
                            onMenuClick={() => setSideMenuOpen(true)}
                            searchValue={navSearch}
                            onSearchChange={setNavSearch}
                            onSearchSubmit={() => {}}
                        />
                    </div>
                </SubSection>
                <SubSection label="Sem usuário (deslogado)">
                    <div className="w-full -mx-6 border border-mr-border-subtle">
                        <NavBar links={NAV_LINKS} user={null} onMenuClick={() => setSideMenuOpen(true)} searchValue="" onSearchChange={() => {}} />
                    </div>
                </SubSection>
            </Section>

            {/* SIDE MENU */}
            <Section title="SideMenu">
                <SubSection label="Drawer da esquerda com navegação">
                    <Button variant="ghost" icon={Home} onClick={() => setSideMenuOpen(true)}>
                        Abrir SideMenu
                    </Button>
                    <SideMenu
                        open={sideMenuOpen}
                        onClose={() => setSideMenuOpen(false)}
                        sections={SIDE_SECTIONS}
                        user={DEMO_USER}
                        activeKey={activeNavKey}
                        footer={
                            <Button variant="ghost" icon={LogOut} danger block>
                                Sair
                            </Button>
                        }
                    />
                </SubSection>
            </Section>

            {/* PAGE CONTAINER */}
            <Section title="PageContainer">
                <SubSection label="Tamanhos (max-width)">
                    <div className="flex w-full flex-col gap-2">
                        {(['narrow', 'default', 'wide'] as const).map(s => (
                            <PageContainer
                                key={s}
                                size={s}
                                paddingY="sm"
                                className="border border-dashed border-mr-accent-50 text-mr-tiny text-mr-fg-muted text-center"
                            >
                                size=&quot;{s}&quot;
                            </PageContainer>
                        ))}
                    </div>
                </SubSection>
            </Section>

            {/* SECTION HEADER */}
            <Section title="SectionHeader">
                <SubSection label="Variações">
                    <div className="flex w-full flex-col gap-6">
                        <SectionHeader
                            eyebrow="Em alta esta semana"
                            title="Novos lançamentos"
                            action={
                                <Button variant="ghost" size="sm" iconRight={Star}>
                                    Ver tudo
                                </Button>
                            }
                        />
                        <SectionHeader title="Comentários" meta="247 comentários" size="sm" as="h3" />
                        <SectionHeader title="Configurações da conta" size="lg" />
                    </div>
                </SubSection>
            </Section>

            {/* HERO SECTION */}
            <Section title="HeroSection">
                <SubSection label="Com visual (poster) + ações">
                    <div className="w-full">
                        <HeroSection
                            eyebrow="Destaque da semana"
                            eyebrowIcon={Star}
                            title="Solo Leveling"
                            description="Sung Jin-Woo era o caçador mais fraco do mundo. Após uma missão quase fatal, ele desperta com habilidades únicas."
                            meta={
                                <>
                                    <Badge variant="neutral">Em andamento</Badge>
                                    <Badge variant="accent">Ação</Badge>
                                    <Badge variant="accent">Fantasia</Badge>
                                </>
                            }
                            actions={
                                <>
                                    <Button variant="primary" icon={BookOpen}>
                                        Começar a ler
                                    </Button>
                                    <Button variant="ghost" icon={Bookmark}>
                                        Salvar
                                    </Button>
                                </>
                            }
                            visual={
                                <div className="h-40 w-28 rounded-mr-sm bg-mr-gray-800 flex items-center justify-center text-mr-tiny text-mr-fg-muted">
                                    capa
                                </div>
                            }
                        />
                    </div>
                </SubSection>
            </Section>

            {/* MOBILE TAB BAR */}
            <Section title="MobileTabBar">
                <SubSection label="Preview (fixo em viewport real — visível em &lt;768px)">
                    <p className="text-mr-small text-mr-fg-muted">Visível apenas em mobile. Redimensione a janela para &lt;768px para ver.</p>
                    <MobileTabBar
                        activeKey={activeNavKey}
                        items={[
                            {
                                key: 'home',
                                label: 'Início',
                                icon: Home,
                                onClick: () => setActiveNavKey('home'),
                            },
                            {
                                key: 'discover',
                                label: 'Buscar',
                                icon: Search,
                                onClick: () => setActiveNavKey('discover'),
                            },
                            {
                                key: 'library',
                                label: 'Biblioteca',
                                icon: BookOpen,
                                badge: 3,
                                onClick: () => setActiveNavKey('library'),
                            },
                            {
                                key: 'profile',
                                label: 'Perfil',
                                icon: User,
                                onClick: () => setActiveNavKey('profile'),
                            },
                        ]}
                    />
                </SubSection>
            </Section>

            {/* FOOTER */}
            <Section title="Footer">
                <SubSection label="Full com colunas + status + newsletter">
                    <div className="w-full -mx-6">
                        <Footer
                            columns={FOOTER_COLUMNS}
                            onSubscribe={e => {
                                toast({
                                    title: 'Inscrito!',
                                    description: e,
                                    tone: 'accent',
                                });
                            }}
                            status={
                                <span className="flex items-center gap-2 text-mr-small">
                                    <StatusDot status="operating" />
                                    Todos os serviços operando normalmente
                                </span>
                            }
                            preferences={
                                <>
                                    <Button variant="ghost" size="sm">
                                        Termos
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        Privacidade
                                    </Button>
                                </>
                            }
                        />
                    </div>
                </SubSection>
            </Section>
        </>
    );
}
