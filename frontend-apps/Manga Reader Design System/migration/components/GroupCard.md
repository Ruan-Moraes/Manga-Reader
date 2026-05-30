# GroupCard

Cartão de um grupo de scan/tradução. Aparece em GroupsPage (listagem) e em recomendados.

## Props

```ts
export interface GroupCardProps {
  group: {
    id: string;
    name: string;
    handle?: string;          // @grupo
    avatar?: string;
    banner?: string;          // URL ou gradient
    /** Status atividade */
    status: 'active' | 'hiatus' | 'inactive';
    members: number;
    projects: number;         // obras em catálogo
    chaptersPublished: number;
    /** Tags (idiomas/gêneros) */
    tags?: string[];
    verified?: boolean;
  };
  onClick?: () => void;
  /** Você segue o grupo */
  following?: boolean;
  onToggleFollow?: () => void;
}
```

## Anatomia

```
<article>
├── Banner (h=72, gradient ou imagem)
├── Avatar (sobreposto, -24 top, 64×64, square radius 2)
└── Body
    ├── Name + verified
    ├── @handle
    ├── Status dot + label
    ├── Stats row: members · projects · chapters
    ├── Tags pills
    └── Follow button
```

## Status mapping

| status | StatusDot | Label |
|---|---|---|
| active | operating | Ativo |
| hiatus | degraded (pulse) | Em hiato |
| inactive | idle | Inativo |

## Exemplo (estrutural)

```tsx
import { BadgeCheck } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { StatusDot } from './StatusDot';
import type { GroupCardProps } from './GroupCard.types';

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const statusLabel = { active: 'Ativo', hiatus: 'Em hiato', inactive: 'Inativo' };
const statusKind = { active: 'operating', hiatus: 'degraded', inactive: 'idle' } as const;

export const GroupCard = ({ group, onClick, following, onToggleFollow }: GroupCardProps) => (
  <article
    onClick={onClick}
    className="group flex cursor-pointer flex-col overflow-hidden rounded-mr-md border border-mr-border bg-mr-surface transition-all duration-mr-default hover:-translate-y-0.5 hover:border-mr-accent-50"
  >
    <div
      className="h-18 w-full"
      style={{ background: group.banner ?? 'linear-gradient(135deg, #2a1f3a, #161616)' }}
    />
    <div className="-mt-6 flex flex-col gap-mr-sm p-mr-md">
      <Avatar src={group.avatar} name={group.name} size={64} />
      <div>
        <h3 className="inline-flex items-center gap-1.5 text-mr-h4 font-mr-extrabold tracking-mr text-mr-fg">
          {group.name}
          {group.verified && <BadgeCheck className="size-4 text-mr-accent" />}
        </h3>
        {group.handle && <div className="text-mr-tiny text-mr-fg-subtle">@{group.handle}</div>}
      </div>

      <div className="flex items-center gap-2 text-mr-tiny">
        <StatusDot status={statusKind[group.status]} />
        <span className="font-mr-bold uppercase tracking-[0.08em] text-mr-fg-muted">
          {statusLabel[group.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-mr-md text-mr-tiny text-mr-fg-muted">
        <span><strong className="text-mr-fg font-mr-extrabold">{fmt(group.members)}</strong> seguidores</span>
        <span><strong className="text-mr-fg font-mr-extrabold">{group.projects}</strong> obras</span>
        <span><strong className="text-mr-fg font-mr-extrabold">{fmt(group.chaptersPublished)}</strong> capítulos</span>
      </div>

      {group.tags && group.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {group.tags.map(t => <Badge key={t} variant="neutral">{t}</Badge>)}
        </div>
      )}

      {onToggleFollow && (
        <Button
          variant={following ? 'ghost' : 'primary'}
          block
          onClick={(e) => { e.stopPropagation(); onToggleFollow(); }}
        >
          {following ? 'Seguindo' : 'Seguir grupo'}
        </Button>
      )}
    </div>
  </article>
);
```

## Acessibilidade

- `<article>` por card
- Verified mark: tooltip "Grupo verificado" + ícone com `aria-label`
- Botão de follow tem `aria-pressed` quando `following`

## Dependências

- `<Avatar>`, `<Badge>`, `<Button>`, `<StatusDot>`
- `lucide-react`
