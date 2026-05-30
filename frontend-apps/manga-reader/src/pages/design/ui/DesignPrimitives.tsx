import { useState } from 'react';
import { Bookmark, Star, Search, Settings, Trash2, Plus, Bell, X, Heart, Eye, Mail, BookOpen, MoreVertical, Edit, Share } from 'lucide-react';
import { Button } from '@ui/Button';
import { IconButton } from '@ui/IconButton';
import { Icon } from '@ui/Icon';
import { Badge } from '@ui/Badge';
import { Avatar } from '@ui/Avatar';
import { Stars, StarsInput } from '@ui/Stars';
import { Input } from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import { Select } from '@ui/Select';
import { Checkbox } from '@ui/Checkbox';
import { RadioGroup } from '@ui/Radio';
import { Switch } from '@ui/Switch';
import { Label } from '@ui/Label';
import { Kbd } from '@ui/Kbd';
import { Card } from '@ui/Card';
import { Tooltip } from '@ui/Tooltip';
import { ProgressBar } from '@ui/ProgressBar';
import { StatusDot } from '@ui/StatusDot';
import { Skeleton } from '@ui/Skeleton';
import { SegmentedControl } from '@ui/SegmentedControl';
import { SearchField } from '@ui/SearchField';
import { EmptyState } from '@ui/EmptyState';
import { AccordionItem } from '@ui/Accordion';
import { Tabs } from '@ui/Tabs';
import { Pagination } from '@ui/Pagination';
import { Modal } from '@ui/Modal';
import { Drawer } from '@ui/Drawer';
import { useToast } from '@ui/Toast';
import { DropdownMenu } from '@ui/DropdownMenu';
import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { HeroSection } from '@ui/HeroSection';
import { MobileTabBar } from '@ui/MobileTabBar';
import { SideMenu } from '@ui/SideMenu';
import { NavBar } from '@ui/NavBar';
import { Footer } from '@ui/Footer';
import { Home, Users, Calendar, Compass, LogOut, User, Reply, Flag } from 'lucide-react';
import { MangaPoster } from '@ui/MangaPoster';
import { MangaCard } from '@ui/MangaCard';
import { ChapterListItem } from '@ui/ChapterListItem';
import { CommentBox } from '@ui/CommentBox';
import { ReviewCard } from '@ui/ReviewCard';
import { GroupCard } from '@ui/GroupCard';
import { EventCard } from '@ui/EventCard';
import { ForumTopicCard } from '@ui/ForumTopicCard';
import { NotificationItem } from '@ui/NotificationItem';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-10">
        <h2 className="mb-4 border-b border-mr-gray-700 pb-2 text-mr-h4 text-mr-fg-muted uppercase tracking-[0.1em]">{title}</h2>
        <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
);

const SubSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="w-full">
        <p className="mb-2 text-mr-tiny text-mr-fg-muted uppercase tracking-widest">{label}</p>
        <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
);

const GENRE_OPTIONS = [
    { value: 'action', label: 'Ação' },
    { value: 'romance', label: 'Romance' },
    { value: 'comedy', label: 'Comédia' },
    { value: 'horror', label: 'Terror', disabled: true },
];

const READING_OPTIONS = [
    { value: 'reading', label: 'Lendo', hint: 'Atualmente em progresso' },
    { value: 'completed', label: 'Completo' },
    { value: 'dropped', label: 'Abandonado', hint: 'Parei de ler' },
    { value: 'plan', label: 'Quero ler' },
];

export default function DesignPrimitives() {
    const [rating, setRating] = useState(3);
    const [radioValue, setRadioValue] = useState('reading');
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [search, setSearch] = useState('');
    const [segment, setSegment] = useState('all');
    const [activeTab, setActiveTab] = useState('overview');
    const [page, setPage] = useState(3);
    const [modalOpen, setModalOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
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
        <div className="mx-auto max-w-4xl px-6 py-10">
            <h1 className="mb-2 text-mr-h1">Design System — Primitivos</h1>
            <p className="mb-10 text-mr-fg-muted">Fase 1 — QA visual de componentes base</p>

            {/* BUTTON */}
            <Section title="Button">
                <SubSection label="Variantes">
                    <Button variant="primary">Primary</Button>
                    <Button variant="raised">Raised</Button>
                    <Button variant="ghost">Ghost</Button>
                </SubSection>
                <SubSection label="Tamanhos">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                </SubSection>
                <SubSection label="Com ícones">
                    <Button icon={Plus}>Adicionar</Button>
                    <Button iconRight={Bookmark}>Salvar</Button>
                    <Button icon={Search} iconRight={Search}>
                        Buscar
                    </Button>
                </SubSection>
                <SubSection label="Estados">
                    <Button loading>Carregando</Button>
                    <Button disabled>Desabilitado</Button>
                    <Button danger>Deletar</Button>
                    <Button danger variant="ghost">
                        Ghost Danger
                    </Button>
                </SubSection>
                <SubSection label="Block">
                    <Button block variant="primary">
                        Block Button
                    </Button>
                </SubSection>
            </Section>

            {/* ICON BUTTON */}
            <Section title="IconButton">
                <SubSection label="Variantes">
                    <IconButton icon={Settings} aria-label="Configurações" variant="primary" />
                    <IconButton icon={Bell} aria-label="Notificações" variant="raised" />
                    <IconButton icon={Heart} aria-label="Favoritar" variant="ghost" />
                </SubSection>
                <SubSection label="Tamanhos">
                    <IconButton icon={X} aria-label="Fechar" size="sm" />
                    <IconButton icon={X} aria-label="Fechar" size="md" />
                    <IconButton icon={X} aria-label="Fechar" size="lg" />
                </SubSection>
                <SubSection label="Danger / Disabled">
                    <IconButton icon={Trash2} aria-label="Deletar" danger />
                    <IconButton icon={Trash2} aria-label="Deletar" disabled />
                </SubSection>
            </Section>

            {/* ICON */}
            <Section title="Icon">
                <SubSection label="Tamanhos">
                    <Icon icon={Star} size={12} />
                    <Icon icon={Star} size={16} />
                    <Icon icon={Star} size={20} />
                    <Icon icon={Star} size={24} />
                    <Icon icon={Star} size={28} />
                </SubSection>
                <SubSection label="Colorido (className)">
                    <Icon icon={Heart} size={24} className="text-mr-accent" />
                    <Icon icon={Eye} size={24} className="text-mr-fg-muted" />
                    <Icon icon={Bell} size={24} className="text-mr-danger" />
                    <Icon icon={Bookmark} size={24} className="text-mr-fg" />
                </SubSection>
            </Section>

            {/* BADGE */}
            <Section title="Badge">
                <SubSection label="Variantes">
                    <Badge variant="accent">Accent</Badge>
                    <Badge variant="neutral">Neutral</Badge>
                    <Badge variant="danger">Danger</Badge>
                </SubSection>
                <SubSection label="Com ícone">
                    <Badge variant="accent" icon={Star}>
                        Em alta
                    </Badge>
                    <Badge variant="neutral" icon={Eye}>
                        Visualizações
                    </Badge>
                    <Badge variant="danger" icon={Trash2}>
                        Removido
                    </Badge>
                </SubSection>
                <SubSection label="Exemplos de uso">
                    <Badge variant="accent">Mangá</Badge>
                    <Badge variant="accent">Manhwa</Badge>
                    <Badge variant="neutral">Completo</Badge>
                    <Badge variant="neutral">Em andamento</Badge>
                    <Badge variant="danger">Hiato</Badge>
                </SubSection>
            </Section>

            {/* AVATAR */}
            <Section title="Avatar">
                <SubSection label="Com imagem">
                    <Avatar src="https://i.pravatar.cc/96?img=1" name="Ana Paula" size={24} />
                    <Avatar src="https://i.pravatar.cc/96?img=2" name="Carlos" size={32} />
                    <Avatar src="https://i.pravatar.cc/96?img=3" name="Beatriz" size={40} />
                    <Avatar src="https://i.pravatar.cc/96?img=4" name="Diego" size={48} />
                    <Avatar src="https://i.pravatar.cc/96?img=5" name="Elena" size={64} />
                    <Avatar src="https://i.pravatar.cc/96?img=6" name="Fernanda" size={96} />
                </SubSection>
                <SubSection label="Fallback (iniciais)">
                    <Avatar name="Ana Paula" size={40} />
                    <Avatar name="Carlos Silva" size={40} />
                    <Avatar name="Beatriz Rocha" size={40} />
                    <Avatar name="Diego Martins" size={40} />
                    <Avatar size={40} />
                </SubSection>
                <SubSection label="Formas">
                    <Avatar name="Normal" size={40} />
                </SubSection>
                <SubSection label="Interativo">
                    <Avatar name="Clicável" size={40} onClick={() => alert('clicou!')} />
                </SubSection>
            </Section>

            {/* STARS */}
            <Section title="Stars">
                <SubSection label="Display (read-only)">
                    <Stars value={0} />
                    <Stars value={1} />
                    <Stars value={2.4} />
                    <Stars value={3} />
                    <Stars value={4.6} />
                    <Stars value={5} />
                </SubSection>
                <SubSection label="Tamanhos">
                    <Stars value={4} size={12} />
                    <Stars value={4} size={14} />
                    <Stars value={4} size={18} />
                    <Stars value={4} size={20} />
                    <Stars value={4} size={24} />
                </SubSection>
                <SubSection label="Input interativo">
                    <div className="flex items-center gap-4">
                        <StarsInput value={rating} onChange={setRating} />
                        <span className="text-mr-fg-muted text-mr-small">{rating} / 5</span>
                        <button type="button" className="text-mr-tiny text-mr-fg-muted underline" onClick={() => setRating(0)}>
                            Limpar
                        </button>
                    </div>
                </SubSection>
            </Section>

            {/* LABEL */}
            <Section title="Label">
                <SubSection label="Básica">
                    <div className="flex flex-col gap-3 w-full">
                        <Label htmlFor="ex-email">Email</Label>
                        <Label htmlFor="ex-pass" required>
                            Senha
                        </Label>
                        <Label>Eyebrow sem campo</Label>
                    </div>
                </SubSection>
            </Section>

            {/* INPUT */}
            <Section title="Input">
                <SubSection label="Padrão">
                    <div className="flex flex-col gap-3 w-full max-w-sm">
                        <div>
                            <Label htmlFor="ex-email" className="mb-1 block">
                                Email
                            </Label>
                            <Input id="ex-email" placeholder="nome@exemplo.com" leadingIcon={Mail} />
                        </div>
                        <Input placeholder="Com ícone trailing" trailingIcon={Search} />
                        <Input placeholder="Sem ícone" />
                        <Input placeholder="Estado de erro" error="Email inválido" defaultValue="invalido@" />
                        <Input placeholder="Com hint" hint="Será enviado para confirmar sua conta" />
                        <Input placeholder="Desabilitado" disabled defaultValue="Não editável" />
                        <Input placeholder="ReadOnly" readOnly defaultValue="Somente leitura" />
                    </div>
                </SubSection>
            </Section>

            {/* TEXTAREA */}
            <Section title="Textarea">
                <SubSection label="Estados">
                    <div className="flex flex-col gap-3 w-full max-w-sm">
                        <Textarea placeholder="Escreva um comentário..." />
                        <Textarea placeholder="Com erro" error="Campo obrigatório" />
                        <Textarea placeholder="Com hint" hint="Máximo de 500 caracteres" />
                        <Textarea placeholder="Desabilitado" disabled />
                    </div>
                </SubSection>
            </Section>

            {/* SELECT */}
            <Section title="Select">
                <SubSection label="Estados">
                    <div className="flex flex-col gap-3 w-full max-w-sm">
                        <Select options={GENRE_OPTIONS} placeholder="Selecione um gênero" />
                        <Select options={GENRE_OPTIONS} defaultValue="action" />
                        <Select options={GENRE_OPTIONS} placeholder="Com erro" error="Selecione uma opção" />
                        <Select options={GENRE_OPTIONS} placeholder="Com hint" hint="Escolha o gênero principal" />
                        <Select options={GENRE_OPTIONS} placeholder="Desabilitado" disabled />
                    </div>
                </SubSection>
            </Section>

            {/* CHECKBOX */}
            <Section title="Checkbox">
                <SubSection label="Estados">
                    <div className="flex flex-col gap-2">
                        <Checkbox label="Aceito os termos de uso" />
                        <Checkbox label="Com hint" hint="Será usado apenas internamente" />
                        <Checkbox label="Com erro" error="Obrigatório para continuar" />
                        <Checkbox label="Checked" defaultChecked />
                        <Checkbox label="Desabilitado" disabled />
                        <Checkbox label="Desabilitado + checked" disabled defaultChecked />
                    </div>
                </SubSection>
            </Section>

            {/* RADIO */}
            <Section title="Radio">
                <SubSection label="Vertical (padrão)">
                    <RadioGroup name="reading-status" value={radioValue} onChange={setRadioValue} options={READING_OPTIONS} legend="Status de leitura" />
                </SubSection>
                <SubSection label="Horizontal">
                    <RadioGroup name="layout" value={radioValue} onChange={setRadioValue} options={READING_OPTIONS.slice(0, 3)} layout="horizontal" />
                </SubSection>
            </Section>

            {/* SWITCH */}
            <Section title="Switch">
                <SubSection label="Com label + descrição">
                    <div className="flex flex-col gap-2 w-full max-w-sm">
                        <Switch checked={notifications} onChange={setNotifications} label="Notificações" description="Receba alertas de novos capítulos" />
                        <Switch checked={darkMode} onChange={setDarkMode} label="Modo escuro" description="Tema escuro em toda a plataforma" />
                        <Switch checked={false} onChange={() => {}} label="Desabilitado" disabled />
                    </div>
                </SubSection>
                <SubSection label="Estado atual">
                    <span className="text-mr-small text-mr-fg-muted">
                        Notificações: {notifications ? 'ativo' : 'inativo'} · Modo escuro: {darkMode ? 'ativo' : 'inativo'}
                    </span>
                </SubSection>
            </Section>

            {/* KBD */}
            <Section title="Kbd">
                <SubSection label="Atalhos">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-mr-small">
                            Abrir busca: <Kbd>⌘</Kbd> <Kbd>K</Kbd>
                        </span>
                        <span className="text-mr-small">
                            Fechar: <Kbd>Esc</Kbd>
                        </span>
                        <span className="text-mr-small">
                            Próxima página: <Kbd>J</Kbd>
                        </span>
                        <span className="text-mr-small">
                            Salvar: <Kbd>S</Kbd>
                        </span>
                    </div>
                </SubSection>
                <SubSection label="Tamanhos">
                    <Kbd size="sm">⌘</Kbd>
                    <Kbd size="sm">K</Kbd>
                    <Kbd size="md">⌘</Kbd>
                    <Kbd size="md">Enter</Kbd>
                </SubSection>
            </Section>

            {/* FASE 2 — COMPOSIÇÕES */}
            <h1 className="mb-2 mt-12 text-mr-h1">Fase 2 — Composições</h1>
            <div className="mb-10 h-px bg-mr-border" />

            {/* CARD */}
            <Section title="Card">
                <SubSection label="Variantes">
                    <Card variant="default" className="w-40 text-center text-mr-small">
                        Default
                    </Card>
                    <Card variant="flat" className="w-40 text-center text-mr-small">
                        Flat
                    </Card>
                    <Card variant="elevated" className="w-40 text-center text-mr-small">
                        Elevated
                    </Card>
                </SubSection>
                <SubSection label="Padding">
                    <Card padding="none" className="border border-mr-border-subtle text-mr-tiny">
                        none
                    </Card>
                    <Card padding="sm" className="text-mr-tiny">
                        sm
                    </Card>
                    <Card padding="md" className="text-mr-tiny">
                        md (padrão)
                    </Card>
                    <Card padding="lg" className="text-mr-tiny">
                        lg
                    </Card>
                </SubSection>
                <SubSection label="Interativo (hover)">
                    <Card interactive className="w-40 text-center text-mr-small">
                        Passe o mouse
                    </Card>
                </SubSection>
            </Section>

            {/* TOOLTIP */}
            <Section title="Tooltip">
                <SubSection label="Lados">
                    <Tooltip content="Tooltip acima" side="top">
                        <Button variant="ghost" size="sm">
                            Top
                        </Button>
                    </Tooltip>
                    <Tooltip content="Tooltip abaixo" side="bottom">
                        <Button variant="ghost" size="sm">
                            Bottom
                        </Button>
                    </Tooltip>
                    <Tooltip content="Tooltip esquerda" side="left">
                        <Button variant="ghost" size="sm">
                            Left
                        </Button>
                    </Tooltip>
                    <Tooltip content="Tooltip direita" side="right">
                        <Button variant="ghost" size="sm">
                            Right
                        </Button>
                    </Tooltip>
                </SubSection>
            </Section>

            {/* PROGRESS BAR */}
            <Section title="ProgressBar">
                <SubSection label="Valores e espessuras">
                    <div className="flex w-full flex-col gap-4">
                        <div>
                            <p className="mb-1 text-mr-tiny text-mr-fg-muted">Thin 30%</p>
                            <ProgressBar value={30} label="30% concluído" />
                        </div>
                        <div>
                            <p className="mb-1 text-mr-tiny text-mr-fg-muted">Thin 75%</p>
                            <ProgressBar value={75} label="75% concluído" />
                        </div>
                        <div>
                            <p className="mb-1 text-mr-tiny text-mr-fg-muted">Thick 60%</p>
                            <ProgressBar value={60} thickness="thick" label="60% concluído" />
                        </div>
                        <div>
                            <p className="mb-1 text-mr-tiny text-mr-fg-muted">Danger 40%</p>
                            <ProgressBar value={40} tone="danger" label="40%" />
                        </div>
                        <div>
                            <p className="mb-1 text-mr-tiny text-mr-fg-muted">Indeterminado</p>
                            <ProgressBar value={0} indeterminate label="Carregando" />
                        </div>
                    </div>
                </SubSection>
            </Section>

            {/* STATUS DOT */}
            <Section title="StatusDot">
                <SubSection label="Estados">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2 text-mr-small">
                            <StatusDot status="operating" /> Operando
                        </span>
                        <span className="flex items-center gap-2 text-mr-small">
                            <StatusDot status="degraded" /> Degradado
                        </span>
                        <span className="flex items-center gap-2 text-mr-small">
                            <StatusDot status="down" /> Indisponível
                        </span>
                        <span className="flex items-center gap-2 text-mr-small">
                            <StatusDot status="idle" /> Em espera
                        </span>
                    </div>
                </SubSection>
                <SubSection label="Tamanhos">
                    <StatusDot status="operating" size={8} />
                    <StatusDot status="operating" size={10} />
                    <StatusDot status="operating" size={12} />
                </SubSection>
            </Section>

            {/* SKELETON */}
            <Section title="Skeleton">
                <SubSection label="Variantes">
                    <div className="flex w-full flex-col gap-3">
                        <Skeleton variant="rect" height={48} />
                        <div className="flex items-center gap-3">
                            <Skeleton variant="circle" width={40} height={40} />
                            <div className="flex-1">
                                <Skeleton variant="text" lines={3} />
                            </div>
                        </div>
                        <Skeleton variant="rect" width={200} height={16} />
                    </div>
                </SubSection>
            </Section>

            {/* SEGMENTED CONTROL */}
            <Section title="SegmentedControl">
                <SubSection label="Padrão">
                    <SegmentedControl
                        value={segment}
                        onChange={setSegment}
                        items={[
                            { value: 'all', label: 'Todos' },
                            { value: 'manga', label: 'Mangá', icon: BookOpen },
                            { value: 'news', label: 'Novidades' },
                        ]}
                    />
                </SubSection>
                <SubSection label="Small + Block">
                    <SegmentedControl
                        value={segment}
                        onChange={setSegment}
                        size="sm"
                        block
                        items={[
                            { value: 'all', label: 'Todos' },
                            { value: 'manga', label: 'Mangá' },
                            { value: 'news', label: 'Novidades' },
                        ]}
                    />
                </SubSection>
            </Section>

            {/* SEARCH FIELD */}
            <Section title="SearchField">
                <SubSection label="Com atalho / com clear">
                    <div className="flex w-full max-w-sm flex-col gap-3">
                        <SearchField value="" onChange={() => {}} shortcut="⌘K" />
                        <SearchField value={search} onChange={setSearch} placeholder="Buscar títulos..." />
                    </div>
                </SubSection>
                <SubSection label="Tamanhos">
                    <div className="flex w-full max-w-sm flex-col gap-3">
                        <SearchField value="" onChange={() => {}} size="sm" />
                        <SearchField value="" onChange={() => {}} size="md" />
                        <SearchField value="" onChange={() => {}} size="lg" />
                    </div>
                </SubSection>
            </Section>

            {/* EMPTY STATE */}
            <Section title="EmptyState">
                <SubSection label="Vertical">
                    <EmptyState
                        illustration="triste"
                        title="Nenhum resultado encontrado"
                        description="Tente outros termos de busca ou explore o catálogo completo."
                        action={
                            <Button variant="primary" size="sm">
                                Explorar catálogo
                            </Button>
                        }
                    />
                </SubSection>
                <SubSection label="Horizontal">
                    <EmptyState
                        illustration="pensando"
                        variant="horizontal"
                        size="sm"
                        title="Sua biblioteca está vazia"
                        description="Adicione títulos para acompanhar sua leitura."
                        action={
                            <Button variant="ghost" size="sm" icon={Plus}>
                                Adicionar título
                            </Button>
                        }
                    />
                </SubSection>
            </Section>

            {/* ACCORDION */}
            <Section title="Accordion">
                <SubSection label="Estados">
                    <div className="flex w-full flex-col gap-2">
                        <AccordionItem title="Como funciona o sistema de avaliação?" defaultOpen>
                            O sistema usa estrelas de 1 a 5. Você pode avaliar qualquer título que tenha pelo menos 1 capítulo lido. Sua avaliação pode ser
                            alterada a qualquer momento.
                        </AccordionItem>
                        <AccordionItem title="Posso cancelar minha assinatura?">
                            Sim. Você pode cancelar a qualquer momento na seção de configurações. O acesso continua até o fim do período pago.
                        </AccordionItem>
                        <AccordionItem title="Quais formatos são suportados?">
                            Suportamos CBZ, CBR, PDF e imagens em JPG/PNG/WebP. O leitor se adapta automaticamente ao formato.
                        </AccordionItem>
                    </div>
                </SubSection>
            </Section>

            {/* TABS */}
            <Section title="Tabs">
                <SubSection label="Underline (padrão)">
                    <div className="w-full">
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                            items={[
                                {
                                    value: 'overview',
                                    label: 'Visão geral',
                                    icon: Eye,
                                },
                                { value: 'chapters', label: 'Capítulos' },
                                {
                                    value: 'reviews',
                                    label: 'Avaliações',
                                    badge: <Badge variant="accent">12</Badge>,
                                },
                                { value: 'related', label: 'Relacionados' },
                                {
                                    value: 'disabled',
                                    label: 'Desabilitado',
                                    disabled: true,
                                },
                            ]}
                        />
                        <div className="mt-4 text-mr-small text-mr-fg-muted">
                            Aba ativa: <span className="text-mr-accent">{activeTab}</span>
                        </div>
                    </div>
                </SubSection>
                <SubSection label="Pills">
                    <Tabs
                        value={activeTab}
                        onChange={setActiveTab}
                        variant="pills"
                        items={[
                            { value: 'overview', label: 'Visão geral' },
                            { value: 'chapters', label: 'Capítulos' },
                            { value: 'reviews', label: 'Avaliações' },
                        ]}
                    />
                </SubSection>
            </Section>

            {/* PAGINATION */}
            <Section title="Pagination">
                <SubSection label="15 páginas, página atual: {page}">
                    <Pagination page={page} total={15} onChange={setPage} />
                </SubSection>
                <SubSection label="Início e fim">
                    <div className="flex flex-col gap-3 w-full">
                        <Pagination page={1} total={10} onChange={() => {}} />
                        <Pagination page={10} total={10} onChange={() => {}} />
                    </div>
                </SubSection>
            </Section>

            {/* MODAL */}
            <Section title="Modal">
                <SubSection label="Dialog nativo com foco trap">
                    <Button variant="primary" onClick={() => setModalOpen(true)}>
                        Abrir Modal
                    </Button>
                    <Modal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        title="Confirmar exclusão"
                        eyebrow="Ação irreversível"
                        description="Esta ação não pode ser desfeita."
                        footer={
                            <>
                                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button danger onClick={() => setModalOpen(false)}>
                                    Deletar
                                </Button>
                            </>
                        }
                    >
                        <p className="text-mr-body text-mr-fg-muted">
                            Tem certeza que deseja deletar este título? Todos os capítulos, avaliações e comentários serão removidos permanentemente.
                        </p>
                    </Modal>
                </SubSection>
            </Section>

            {/* DRAWER */}
            <Section title="Drawer">
                <SubSection label="Slide da direita">
                    <Button variant="ghost" icon={Settings} onClick={() => setDrawerOpen(true)}>
                        Abrir Drawer
                    </Button>
                    <Drawer
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        title="Configurações"
                        footer={
                            <Button variant="primary" block onClick={() => setDrawerOpen(false)}>
                                Salvar
                            </Button>
                        }
                    >
                        <div className="flex flex-col gap-4">
                            <p className="text-mr-small text-mr-fg-muted">Conteúdo do drawer. Feche com Esc ou clicando no overlay.</p>
                            <Switch checked={notifications} onChange={setNotifications} label="Notificações" description="Receba alertas de novos capítulos" />
                            <Switch checked={darkMode} onChange={setDarkMode} label="Modo escuro" />
                        </div>
                    </Drawer>
                </SubSection>
            </Section>

            {/* TOAST */}
            <Section title="Toast">
                <SubSection label="Tones">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            toast({
                                title: 'Salvo com sucesso',
                                tone: 'accent',
                                description: 'Seus dados foram atualizados.',
                            })
                        }
                    >
                        Accent
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            toast({
                                title: 'Erro ao salvar',
                                tone: 'danger',
                                description: 'Tente novamente em instantes.',
                            })
                        }
                    >
                        Danger
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Informação', tone: 'neutral' })}>
                        Neutral
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            toast({
                                title: 'Com ação',
                                tone: 'accent',
                                action: {
                                    label: 'Desfazer',
                                    onClick: () => {},
                                },
                            })
                        }
                    >
                        Com ação
                    </Button>
                </SubSection>
            </Section>

            {/* DROPDOWN MENU */}
            <Section title="DropdownMenu">
                <SubSection label="Trigger com ações">
                    <DropdownMenu
                        trigger={<IconButton icon={MoreVertical} aria-label="Mais opções" />}
                        items={[
                            { label: 'Editar', icon: Edit, onSelect: () => {} },
                            {
                                label: 'Compartilhar',
                                icon: Share,
                                shortcut: '⌘S',
                                onSelect: () => {},
                            },
                            {
                                label: 'Favoritar',
                                icon: Heart,
                                onSelect: () => {},
                            },
                            { type: 'separator' },
                            {
                                label: 'Deletar',
                                icon: Trash2,
                                destructive: true,
                                onSelect: () => {},
                            },
                        ]}
                    />
                    <DropdownMenu
                        trigger={
                            <Button variant="ghost" size="sm">
                                Opções
                            </Button>
                        }
                        items={[
                            { type: 'label', label: 'Ordenar por' },
                            { label: 'Nome', onSelect: () => {} },
                            { label: 'Data', onSelect: () => {} },
                            { label: 'Avaliação', onSelect: () => {} },
                            { type: 'separator' },
                            {
                                label: 'Desabilitado',
                                disabled: true,
                                onSelect: () => {},
                            },
                        ]}
                    />
                </SubSection>
            </Section>

            {/* FASE 3 — LAYOUTS */}
            <h1 className="mb-2 mt-12 text-mr-h1">Fase 3 — Layouts</h1>
            <div className="mb-10 h-px bg-mr-border" />

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

            {/* FASE 4 — CONTENT CARDS */}
            <h1 className="mb-2 mt-12 text-mr-h1">Fase 4 — Content Cards</h1>
            <div className="mb-10 h-px bg-mr-border" />

            {/* MANGA POSTER */}
            <Section title="MangaPoster">
                <SubSection label="Tamanhos e formas">
                    <MangaPoster size={80} alt="Berserk" />
                    <MangaPoster size={120} shape="rect" radius="sm" />
                    <MangaPoster size={120} shape="square" radius="sm" />
                    <MangaPoster size={120} elevated cover="https://picsum.photos/seed/manga1/120/180" alt="Manga com capa" />
                    <MangaPoster size={100} fallbackGradient="linear-gradient(135deg, #1a1a4e, #0d0d2b)" radius="lg" elevated onClick={() => {}} />
                </SubSection>
            </Section>

            {/* MANGA CARD */}
            <Section title="MangaCard">
                <SubSection label="Variantes">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 w-full">
                        <MangaCard
                            manga={{
                                id: '1',
                                title: 'Berserk',
                                author: 'Kentaro Miura',
                                rating: 4.9,
                                chapter: 363,
                            }}
                            size="md"
                            onClick={() => {}}
                        />
                        <MangaCard
                            manga={{
                                id: '2',
                                title: 'Solo Leveling',
                                author: 'Chugong',
                                cover: 'https://picsum.photos/seed/solo/200/300',
                                rating: 4.7,
                                chapter: 179,
                            }}
                            featured
                            tag={<Badge variant="accent">Top 1</Badge>}
                            size="md"
                            onToggleLibrary={() => {}}
                            inLibrary
                            onClick={() => {}}
                        />
                        <MangaCard
                            manga={{
                                id: '3',
                                title: 'One Piece',
                                author: 'Oda',
                                cover: 'https://picsum.photos/seed/op/200/300',
                                chapter: 1120,
                            }}
                            progress={65}
                            size="md"
                            onToggleLibrary={() => {}}
                            onClick={() => {}}
                        />
                        <MangaCard
                            manga={{
                                id: '4',
                                title: 'Vinland Saga',
                                fallbackGradient: 'linear-gradient(135deg, #1a3a2a, #0d1a10)',
                                rating: 4.8,
                            }}
                            size="sm"
                            onClick={() => {}}
                        />
                    </div>
                </SubSection>
            </Section>

            {/* CHAPTER LIST ITEM */}
            <Section title="ChapterListItem">
                <SubSection label="Estados: lido, atual, com group">
                    <div className="w-full rounded-mr-md border border-mr-border overflow-hidden">
                        <ChapterListItem
                            number={1120}
                            title="O amanhecer da nova era"
                            publishedAt="hoje"
                            group={{ name: 'Scan BR', avatar: undefined }}
                            downloaded
                            onMore={() => {}}
                            onClick={() => {}}
                        />
                        <ChapterListItem number={1119} publishedAt="há 3 dias" current group={{ name: 'Scan BR' }} onClick={() => {}} onMore={() => {}} />
                        <ChapterListItem
                            number={1118}
                            title="O encontro fatídico"
                            publishedAt="há 1 semana"
                            read
                            group={{ name: 'Scan BR' }}
                            onClick={() => {}}
                        />
                        <ChapterListItem number={1117} publishedAt="há 2 semanas" read onClick={() => {}} />
                    </div>
                </SubSection>
            </Section>

            {/* COMMENT BOX */}
            <Section title="CommentBox">
                <SubSection label="Comentários e estados">
                    <div className="flex w-full flex-col gap-3">
                        <CommentBox
                            author={{
                                name: 'Pedro Alves',
                                handle: 'pedroalves',
                                badge: 'mod',
                            }}
                            when="há 2 horas"
                            upvotes={42}
                            downvotes={3}
                            myVote="up"
                            onVote={() => {}}
                            rating={5}
                            highlighted
                            actions={
                                <>
                                    <button type="button" className="inline-flex items-center gap-1 text-mr-fg-muted hover:text-mr-accent text-mr-tiny">
                                        <Reply className="size-3.5" />
                                        Responder
                                    </button>
                                    <button type="button" className="inline-flex items-center gap-1 text-mr-fg-muted hover:text-mr-danger text-mr-tiny">
                                        <Flag className="size-3.5" />
                                        Denunciar
                                    </button>
                                </>
                            }
                        >
                            Simplesmente o melhor mangá de todos os tempos. A jornada de Guts é inesquecível.
                        </CommentBox>
                        <CommentBox
                            author={{ name: 'Mariana Costa' }}
                            when="há 5 horas"
                            upvotes={12}
                            replyTo={{
                                name: 'Pedro Alves',
                                preview: 'o melhor mangá de todos os tempos...',
                            }}
                            onVote={() => {}}
                        >
                            Concordo 100%! Mas acho que Vagabond chega perto.
                        </CommentBox>
                    </div>
                </SubSection>
            </Section>

            {/* REVIEW CARD */}
            <Section title="ReviewCard">
                <SubSection label="Com e sem poster">
                    <div className="flex w-full flex-col gap-3">
                        <ReviewCard
                            author={{
                                name: 'Carlos Lima',
                                avatar: 'https://i.pravatar.cc/48?img=5',
                            }}
                            when="há 3 dias"
                            rating={5}
                            title="Uma obra prima atemporal"
                            manga={{
                                id: '1',
                                title: 'Berserk',
                                gradient: 'linear-gradient(135deg, #2a1f0f, #161616)',
                            }}
                            upvotes={247}
                            myVote="up"
                            badge="top"
                            onVote={() => {}}
                            comments={18}
                        >
                            Berserk transcende o gênero shounen. A arte de Miura é inigualável, cada página uma obra de arte. A jornada de Guts é das mais
                            épicas já contadas.
                        </ReviewCard>
                        <ReviewCard author={{ name: 'Luiza Santos' }} when="há 1 semana" rating={4} upvotes={53} onVote={() => {}}>
                            Ótima obra, mas o ritmo no início é lento. Vale muito a pena persistir.
                        </ReviewCard>
                    </div>
                </SubSection>
            </Section>

            {/* GROUP CARD */}
            <Section title="GroupCard">
                <SubSection label="Status e follow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <GroupCard
                            group={{
                                id: '1',
                                name: 'Scan Brasil',
                                handle: 'scanbr',
                                status: 'active',
                                members: 12500,
                                projects: 48,
                                chaptersPublished: 3200,
                                verified: true,
                                tags: ['PT-BR', 'Shounen', 'Seinen'],
                            }}
                            following
                            onToggleFollow={() => {}}
                            onClick={() => {}}
                        />
                        <GroupCard
                            group={{
                                id: '2',
                                name: 'Fansub MangaPT',
                                handle: 'mangapt',
                                status: 'hiatus',
                                members: 890,
                                projects: 12,
                                chaptersPublished: 400,
                                tags: ['PT-PT'],
                            }}
                            onToggleFollow={() => {}}
                            onClick={() => {}}
                        />
                    </div>
                </SubSection>
            </Section>

            {/* EVENT CARD */}
            <Section title="EventCard">
                <SubSection label="Special e Normal">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <EventCard
                            event={{
                                id: '1',
                                title: 'Lançamento: Berserk Vol. 42',
                                type: 'launch',
                                when: '15 jun · 18h',
                                location: 'Online',
                                attendees: 1240,
                                special: true,
                                going: false,
                                coverGradient: 'linear-gradient(135deg, #2a1f0f, #161616)',
                            }}
                            onToggleGoing={() => {}}
                            onClick={() => {}}
                        />
                        <div className="flex flex-col gap-3">
                            <EventCard
                                event={{
                                    id: '2',
                                    title: 'Meetup Manga SP',
                                    type: 'meetup',
                                    when: '22 jun',
                                    location: 'São Paulo / SP',
                                    attendees: 87,
                                }}
                                onClick={() => {}}
                            />
                            <EventCard
                                event={{
                                    id: '3',
                                    title: 'Live: Top 10 Manhwas 2025',
                                    type: 'stream',
                                    when: 'Hoje · 20h',
                                    attendees: 312,
                                }}
                                onClick={() => {}}
                            />
                            <EventCard
                                event={{
                                    id: '4',
                                    title: 'Encerrado: AnimeExpo',
                                    type: 'announcement',
                                    when: '10 mai',
                                    past: true,
                                }}
                                onClick={() => {}}
                            />
                        </div>
                    </div>
                </SubSection>
            </Section>

            {/* FORUM TOPIC CARD */}
            <Section title="ForumTopicCard">
                <SubSection label="Estados">
                    <div className="flex w-full flex-col gap-3">
                        <ForumTopicCard
                            id="1"
                            title="[Spoiler] Berserk Capítulo 363 — Teorias sobre o destino de Guts"
                            category="Spoiler livre"
                            author={{
                                name: 'FãBerserk99',
                                avatar: 'https://i.pravatar.cc/48?img=12',
                            }}
                            postedAt="há 2 horas"
                            lastReplyAt="há 5 min"
                            replies={312}
                            views={4200}
                            spoiler
                            live={47}
                            onClick={() => {}}
                        />
                        <ForumTopicCard
                            id="2"
                            title="Regras e boas-vindas ao fórum de Berserk"
                            category="Discussão"
                            author={{ name: 'Moderador' }}
                            postedAt="há 2 anos"
                            replies={5}
                            views={18000}
                            pinned
                            onClick={() => {}}
                        />
                        <ForumTopicCard
                            id="3"
                            title="Qual é sua cena favorita de toda a série?"
                            category="Discussão"
                            author={{ name: 'MangaFan2024' }}
                            postedAt="há 3 dias"
                            lastReplyAt="há 1 hora"
                            replies={89}
                            views={1100}
                            onClick={() => {}}
                        />
                    </div>
                </SubSection>
            </Section>

            {/* NOTIFICATION ITEM */}
            <Section title="NotificationItem">
                <SubSection label="Tipos e estados">
                    <div className="w-full rounded-mr-md border border-mr-border overflow-hidden">
                        <NotificationItem
                            id="1"
                            kind="chapter"
                            actor={{
                                name: 'Scan Brasil',
                                avatar: 'https://i.pravatar.cc/48?img=8',
                            }}
                            text="Scan Brasil publicou o Capítulo 1120 de Berserk"
                            when="há 5 min"
                            unread
                            onDismiss={() => {}}
                            onClick={() => {}}
                        />
                        <NotificationItem
                            id="2"
                            kind="reply"
                            actor={{ name: 'Pedro Alves' }}
                            text="Pedro Alves respondeu seu comentário em Berserk"
                            preview="Concordo, a arte de Miura é inigualável..."
                            when="há 2 horas"
                            unread
                            onDismiss={() => {}}
                            onClick={() => {}}
                        />
                        <NotificationItem
                            id="3"
                            kind="mention"
                            actor={{
                                name: 'Mariana Costa',
                                avatar: 'https://i.pravatar.cc/48?img=9',
                            }}
                            text="Mariana Costa mencionou você em Fórum"
                            when="há 4 horas"
                            onDismiss={() => {}}
                            onClick={() => {}}
                        />
                        <NotificationItem
                            id="4"
                            kind="system"
                            text="Nova funcionalidade: Listas de leitura personalizadas"
                            when="há 1 dia"
                            onClick={() => {}}
                        />
                    </div>
                </SubSection>
            </Section>

            {/* TOKEN PALETTE */}
            <Section title="Paleta de tokens">
                <SubSection label="Cores">
                    {[
                        ['mr-primary', 'bg-mr-primary'],
                        ['mr-secondary', 'bg-mr-secondary'],
                        ['mr-tertiary', 'bg-mr-tertiary'],
                        ['mr-accent', 'bg-mr-accent'],
                        ['mr-danger', 'bg-mr-danger'],
                        ['mr-gray-900', 'bg-mr-gray-900'],
                        ['mr-gray-800', 'bg-mr-gray-800'],
                        ['mr-gray-700', 'bg-mr-gray-700'],
                        ['mr-gray-500', 'bg-mr-gray-500'],
                        ['mr-gray-300', 'bg-mr-gray-300'],
                    ].map(([label, cls]) => (
                        <div key={label} className="flex flex-col items-center gap-1">
                            <div className={`size-10 rounded-mr-xs border border-mr-gray-700 ${cls}`} />
                            <span className="text-[10px] text-mr-fg-muted">{label}</span>
                        </div>
                    ))}
                </SubSection>
                <SubSection label="Tipografia">
                    <div className="flex w-full flex-col gap-2">
                        <p className="text-mr-h1">H1 — Nunito Sans ExtraBold</p>
                        <p className="text-mr-h2">H2 — Nunito Sans ExtraBold</p>
                        <p className="text-mr-h3">H3 — Nunito Sans Bold</p>
                        <p className="text-mr-h4">H4 — Nunito Sans Bold</p>
                        <p className="text-mr-body">Body — Nunito Sans Regular (14px / 1.55)</p>
                        <p className="text-mr-small">Small — 12px / 1.4</p>
                        <p className="text-mr-tiny">Tiny — 11px / 1.3</p>
                    </div>
                </SubSection>
                <SubSection label="Sombras">
                    <div className="flex gap-6">
                        <div className="rounded-mr-sm bg-mr-secondary p-4 shadow-mr-default text-mr-small">shadow-mr-default</div>
                        <div className="rounded-mr-sm bg-mr-secondary p-4 shadow-mr-elevated text-mr-small">shadow-mr-elevated</div>
                        <div className="rounded-mr-sm bg-mr-secondary p-4 shadow-mr-overlay text-mr-small">shadow-mr-overlay</div>
                    </div>
                </SubSection>
            </Section>
        </div>
    );
}
