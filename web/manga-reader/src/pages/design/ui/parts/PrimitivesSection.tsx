import { useState } from 'react';
import { Bell, Bookmark, Eye, Heart, Mail, Plus, Search, Settings, Star, Trash2, X } from 'lucide-react';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { Checkbox } from '@ui/Checkbox';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Input } from '@ui/Input';
import { Kbd } from '@ui/Kbd';
import { Label } from '@ui/Label';
import { RadioGroup } from '@ui/Radio';
import { Select } from '@ui/Select';
import { Stars, StarsInput } from '@ui/Stars';
import { Switch } from '@ui/Switch';
import { Textarea } from '@ui/Textarea';

import { GENRE_OPTIONS, READING_OPTIONS, Section, SubSection } from './showcaseShared';

export default function PrimitivesSection() {
    const [rating, setRating] = useState(3);
    const [radioValue, setRadioValue] = useState('reading');
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    return (
        <>
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
                    <Icon icon={Heart} size={24} className="text-mr-accent-fg" />
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
        </>
    );
}
