# SideMenu

Drawer da esquerda com navegação completa + perfil + atalhos. Mesma drawer em mobile e desktop (abre por click no hamburger do NavBar).

## Props

```ts
import type { LucideIcon } from 'lucide-react';

export interface SideMenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: string | number;
  onClick?: () => void;
}

export interface SideMenuSection {
  title?: string;
  items: SideMenuItem[];
}

export interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  /** Seções de navegação */
  sections: SideMenuSection[];
  user?: { name: string; handle?: string; avatar?: string } | null;
  /** Rota ativa atual */
  activeKey?: string;
  /** Ações de rodapé (login/logout) */
  footer?: React.ReactNode;
}
```

## Largura

- Mobile: `min(320px, 85vw)`
- Desktop: 320px fixo

## Anatomia

```
Drawer (esquerda, 320px)
├── Header (border-bottom)
│   ├── Wordmark
│   └── IconButton close (mobile)
├── User block (se logado)
│   ├── Avatar 48
│   └── Name + handle
├── Section 1 (com title opcional)
│   └── Items (icon + label + badge opcional)
├── Section 2
│   └── ...
└── Footer (sticky bottom)
    └── Botão Entrar / Logout
```

## Estado de item ativo

- `bg: mr-accent-25`
- `color: mr-accent`
- `border-left: 3px solid mr-accent`

## Exemplo (estrutura simplificada)

```tsx
import { X } from 'lucide-react';
import { Drawer } from './Drawer';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { cn } from '@/lib/cn';
import type { SideMenuProps } from './SideMenu.types';

export const SideMenu = ({ open, onClose, sections, user, activeKey, footer }: SideMenuProps) => (
  <Drawer open={open} onClose={onClose} side="left" width={320}>
    <div className="flex h-full flex-col">
      {user && (
        <div className="flex items-center gap-3 border-b border-mr-border-subtle pb-mr-md mb-mr-md">
          <Avatar src={user.avatar} name={user.name} size={48} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-mr-body font-mr-extrabold text-mr-fg">{user.name}</div>
            {user.handle && <div className="truncate text-mr-tiny text-mr-fg-subtle">@{user.handle}</div>}
          </div>
        </div>
      )}

      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-mr-md overflow-y-auto">
        {sections.map((s, si) => (
          <div key={si} className="flex flex-col gap-1">
            {s.title && <div className="mr-label px-3 text-mr-fg-subtle">{s.title}</div>}
            {s.items.map(it => {
              const Icon = it.icon;
              const active = activeKey === it.key;
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => { it.onClick?.(); onClose(); }}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-mr-xs px-3 text-mr-body transition-colors duration-mr-default',
                    active
                      ? 'border-l-[3px] border-mr-accent bg-mr-accent-25 text-mr-accent font-mr-extrabold'
                      : 'text-mr-fg-muted hover:bg-mr-accent-25 hover:text-mr-fg',
                  )}
                >
                  <Icon className="size-5" />
                  <span className="flex-1 text-left">{it.label}</span>
                  {it.badge != null && <Badge variant="neutral">{it.badge}</Badge>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {footer && <div className="border-t border-mr-border-subtle pt-mr-md mt-mr-md">{footer}</div>}
    </div>
  </Drawer>
);
```

## Acessibilidade

- Internamente é um `<Drawer>` (já cobre dialog/aria-modal/esc/focus trap)
- `<nav aria-label="Navegação principal">`
- Itens são `<button>` (programáticos) ou `<a>` (rotas reais — preferir)

## Dependências

- `<Drawer>`, `<Avatar>`, `<Badge>`
- `lucide-react`, `cn`

## Conteúdo típico das seções

1. **Descobrir:** Home, Em alta, Lançamentos, Categorias
2. **Comunidade:** Grupos, Fórum, Eventos
3. **Minha conta:** Biblioteca, Perfil, Notificações
4. **Outros:** Configurações, Ajuda, Sair
