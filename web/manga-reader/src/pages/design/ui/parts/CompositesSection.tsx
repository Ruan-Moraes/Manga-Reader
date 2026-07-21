import { useState } from 'react';
import { BookOpen, Edit, Eye, Heart, MoreVertical, Plus, Settings, Share, Trash2 } from 'lucide-react';

import { AccordionItem } from '@ui/Accordion';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';
import { Drawer } from '@ui/Drawer';
import { DropdownMenu } from '@ui/DropdownMenu';
import { EmptyState } from '@ui/EmptyState';
import { IconButton } from '@ui/IconButton';
import { Modal } from '@ui/Modal';
import { Pagination } from '@ui/Pagination';
import { ProgressBar } from '@ui/ProgressBar';
import { SearchField } from '@ui/SearchField';
import { SegmentedControl } from '@ui/SegmentedControl';
import { Skeleton } from '@ui/Skeleton';
import { StatusDot } from '@ui/StatusDot';
import { Switch } from '@ui/Switch';
import { Tabs } from '@ui/Tabs';
import { useToast } from '@ui/Toast';
import { Tooltip } from '@ui/Tooltip';

import { PhaseHeader, Section, SubSection } from './showcaseShared';

export default function CompositesSection() {
    const [segment, setSegment] = useState('all');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [page, setPage] = useState(3);
    const [modalOpen, setModalOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const { toast } = useToast();

    return (
        <>
            <PhaseHeader title="Fase 2 — Composições" />

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
                            Aba ativa: <span className="text-mr-accent-fg">{activeTab}</span>
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
        </>
    );
}
