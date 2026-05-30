# EventCard

Cartão de evento (lançamento, encontro, transmissão). Duas variantes: `special` (hero,
destaque) e `normal` (linha).

## Props

```ts
export interface EventCardProps {
  event: {
    id: string;
    title: string;
    type: 'launch' | 'meetup' | 'stream' | 'announcement';
    /** Data ISO ou string já formatada (ex.: "12 mai · 19h") */
    when: string;
    location?: string;          // texto livre: "Online", "São Paulo / SP"
    coverImage?: string;
    coverGradient?: string;
    /** Quem organiza */
    organizer?: { name: string; avatar?: string };
    /** Confirmados / interessados */
    attendees?: number;
    /** Já estou indo */
    going?: boolean;
    /** Em destaque (especial) */
    special?: boolean;
    /** Já passou */
    past?: boolean;
  };
  onClick?: () => void;
  onToggleGoing?: () => void;
}
```

## Variantes

### `special` (default quando `event.special = true`)

```
┌──────────────────────────────────────┐
│         [cover banner h=180]          │
│         type badge                    │
├──────────────────────────────────────┤
│ TITLE                                 │
│ when · location                       │
│ organizer · X confirmados             │
│ [CTA "Tenho interesse"]               │
└──────────────────────────────────────┘
```

### `normal`

```
┌──────────────────────────────────────┐
│ [cover 80×80] │ type badge            │
│              │ Title                  │
│              │ when · location        │
│              │ N indo                 │
└──────────────────────────────────────┘
```

## Type mapping

| type | Cor accent | Label PT |
|---|---|---|
| launch | accent | Lançamento |
| meetup | neutral | Encontro |
| stream | danger | Ao vivo |
| announcement | neutral | Anúncio |

## Estados

- `past`: opacity 0.55, "Encerrado" em vez do CTA
- `going`: botão variant `ghost` com texto "Vou comparecer ✓"
- hover: translateY -2 + border accent-50

## Exemplo (special)

```tsx
import { Button } from './Button';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { cn } from '@/lib/cn';
import type { EventCardProps } from './EventCard.types';

const typeBadge = {
  launch: { variant: 'accent' as const, label: 'Lançamento' },
  meetup: { variant: 'neutral' as const, label: 'Encontro' },
  stream: { variant: 'danger' as const, label: 'Ao vivo' },
  announcement: { variant: 'neutral' as const, label: 'Anúncio' },
};

export const EventCard = ({ event, onClick, onToggleGoing }: EventCardProps) => {
  const t = typeBadge[event.type];
  if (event.special) {
    return (
      <article onClick={onClick} className={cn('group flex cursor-pointer flex-col overflow-hidden rounded-mr-md border border-mr-border bg-mr-surface transition-all duration-mr-default hover:-translate-y-0.5 hover:border-mr-accent-50', event.past && 'opacity-55')}>
        <div className="relative h-44" style={{ background: event.coverGradient ?? 'linear-gradient(135deg, #2a1f3a, #161616)' }}>
          {event.coverImage && <img src={event.coverImage} alt="" className="size-full object-cover" />}
          <div className="absolute left-3 top-3"><Badge variant={t.variant}>{t.label}</Badge></div>
        </div>
        <div className="flex flex-col gap-mr-sm p-mr-md">
          <h3 className="text-mr-h3 font-mr-extrabold leading-tight tracking-mr text-mr-fg">{event.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-mr-tiny text-mr-fg-subtle">
            <span className="font-mr-bold uppercase tracking-[0.08em] text-mr-fg">{event.when}</span>
            {event.location && <><span>·</span><span>{event.location}</span></>}
          </div>
          {event.organizer && (
            <div className="flex items-center gap-2 text-mr-tiny text-mr-fg-muted">
              <Avatar src={event.organizer.avatar} name={event.organizer.name} size={24} />
              <span>{event.organizer.name}</span>
              {event.attendees != null && <span>· {event.attendees} confirmados</span>}
            </div>
          )}
          {!event.past && onToggleGoing && (
            <Button variant={event.going ? 'ghost' : 'primary'} onClick={(e) => { e.stopPropagation(); onToggleGoing(); }} aria-pressed={event.going}>
              {event.going ? 'Vou comparecer' : 'Tenho interesse'}
            </Button>
          )}
          {event.past && <div className="mr-label text-mr-fg-subtle">Encerrado</div>}
        </div>
      </article>
    );
  }
  // Variante normal — versão horizontal compacta
  return (
    <article onClick={onClick} className="group flex cursor-pointer gap-3 rounded-mr-md border border-mr-border bg-mr-surface p-mr-md transition-all hover:-translate-y-0.5 hover:border-mr-accent-50">
      <div className="size-20 shrink-0 rounded-mr-sm" style={{ background: event.coverGradient ?? 'linear-gradient(135deg, #2a1f3a, #161616)' }}>
        {event.coverImage && <img src={event.coverImage} alt="" className="size-full rounded-mr-sm object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Badge variant={t.variant}>{t.label}</Badge>
        <h3 className="truncate text-mr-h4 font-mr-extrabold tracking-mr text-mr-fg">{event.title}</h3>
        <div className="flex flex-wrap gap-2 text-mr-tiny text-mr-fg-subtle">
          <span className="font-mr-bold text-mr-fg">{event.when}</span>
          {event.location && <span>· {event.location}</span>}
          {event.attendees != null && <span>· {event.attendees} indo</span>}
        </div>
      </div>
    </article>
  );
};
```

## Acessibilidade

- `<article>` por card
- Botão "going" com `aria-pressed`
- Imagem decorativa (`alt=""`) — título adjacente comunica

## Dependências

- `<Button>`, `<Badge>`, `<Avatar>`
- `cn`
