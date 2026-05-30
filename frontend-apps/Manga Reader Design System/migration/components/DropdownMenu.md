# DropdownMenu

Menu de ações que aparece abaixo de um trigger. **Componente onde Radix faz sentido** —
gerenciar posicionamento + focus trap + click-outside corretamente é trabalhoso.

## Recomendação

Usar `@radix-ui/react-dropdown-menu` como base, com estilização nossa. Headless UI é
alternativa aceitável. Não implementar do zero.

```bash
pnpm add @radix-ui/react-dropdown-menu
```

## API exposta (nossa)

```ts
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DropdownMenuItem {
  type?: 'item' | 'separator' | 'label';
  label?: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  destructive?: boolean;
  shortcut?: string;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  /** Trigger (botão ou wrapper) */
  trigger: ReactNode;
  items: DropdownMenuItem[];
  /** Lado de abertura. Padrão: 'bottom' */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Alinhamento. Padrão: 'start' */
  align?: 'start' | 'center' | 'end';
}
```

## Estilização (referencia Card + lista)

```
Content (Radix Portal)
└── div bg-mr-gray-900 border-mr-border rounded-mr-sm shadow-mr-default p-1 min-w-[180px]
    ├── Item (h-9 px-3 hover:bg-mr-accent-25)
    │   ├── Icon (size-4 text-mr-fg-muted)
    │   ├── Label (text-mr-body)
    │   └── Shortcut (kbd à direita)
    ├── Separator (h-px bg-mr-border-subtle my-1)
    └── DestructiveItem (text-mr-danger hover:bg-[rgba(255,120,79,.1)])
```

## Exemplo

```tsx
import * as RD from '@radix-ui/react-dropdown-menu';
import { Kbd } from './Kbd';
import type { DropdownMenuProps } from './DropdownMenu.types';

export const DropdownMenu = ({ trigger, items, side = 'bottom', align = 'start' }: DropdownMenuProps) => (
  <RD.Root>
    <RD.Trigger asChild>{trigger}</RD.Trigger>
    <RD.Portal>
      <RD.Content
        side={side}
        align={align}
        sideOffset={6}
        className="z-mr-dropdown min-w-[180px] rounded-mr-sm border border-mr-border bg-mr-gray-900 p-1 shadow-mr-default"
      >
        {items.map((it, i) => {
          if (it.type === 'separator') return <RD.Separator key={i} className="my-1 h-px bg-mr-border-subtle" />;
          if (it.type === 'label') return <RD.Label key={i} className="mr-label px-3 py-1 text-mr-fg-subtle">{it.label}</RD.Label>;
          const Icon = it.icon;
          return (
            <RD.Item
              key={i}
              disabled={it.disabled}
              onSelect={it.onSelect}
              className={`flex h-9 cursor-pointer items-center gap-2 rounded-mr-xs px-3 text-mr-body outline-none data-[highlighted]:bg-mr-accent-25 data-[disabled]:opacity-mr-disabled ${it.destructive ? 'text-mr-danger data-[highlighted]:bg-[rgba(255,120,79,0.1)]' : 'text-mr-fg'}`}
            >
              {Icon && <Icon className="size-4" />}
              <span className="flex-1">{it.label}</span>
              {it.shortcut && <Kbd size="sm">{it.shortcut}</Kbd>}
            </RD.Item>
          );
        })}
      </RD.Content>
    </RD.Portal>
  </RD.Root>
);
```

## Acessibilidade

- Radix oferece: ARIA roles, navegação por setas, Esc para fechar, focus trap, retorno de foco
- Não adicionar nada — só estilo

## Dependências

- `@radix-ui/react-dropdown-menu`
- `<Kbd>`
- `lucide-react` (no consumer)
