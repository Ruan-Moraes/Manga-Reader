# EmptyState

Estado vazio / erro suave / pós-ação. Sempre com ilustração chibi — **nunca emoji**.

## Props

```ts
import type { ReactNode } from 'react';

export type ChibiKind = 'feliz' | 'triste' | 'surpresa' | 'zangada' | 'pensando' | 'duvida' | '404';

export interface EmptyStateProps {
  /** Qual ilustração usar */
  illustration: ChibiKind;
  /** Tamanho da ilustração. Padrão: 'md' */
  size?: 'sm' | 'md' | 'lg';
  title: string;
  description?: string;
  /** CTA principal */
  action?: ReactNode;
  /** Variante visual. Padrão: 'default' (centralizado em coluna) */
  variant?: 'default' | 'horizontal';
}
```

## Sizes da ilustração

| size | px |
|---|---|
| sm | 80 |
| md | 120 (default) |
| lg | 200 |

## Mapeamento semântico

| Estado | Ilustração |
|---|---|
| Lista vazia (esperançoso) | `pensando` |
| Lista vazia (melancólico) | `triste` |
| Busca sem resultado | `duvida` |
| Erro de validação repetido | `zangada` |
| Sucesso pós-ação | `feliz` |
| Onboarding / descoberta | `surpresa` |
| Página 404 / removida | `404` |

## Anatomia

```
Default (vertical centralizado)              Horizontal (lado a lado, desktop)
─────────────────────────                    ─────────────────────────────────
       [chibi]                               [chibi] | Eyebrow
       Title                                          | Title
       Description                                    | Description
       [Action]                                       | [Action]
```

## Exemplo

```tsx
import type { EmptyStateProps } from './EmptyState.types';

const sizeMap = { sm: 80, md: 120, lg: 200 };

export const EmptyState = ({ illustration, size = 'md', title, description, action, variant = 'default' }: EmptyStateProps) => {
  const px = sizeMap[size];
  return (
    <div className={variant === 'horizontal'
      ? 'flex flex-col gap-mr-md items-center text-center md:flex-row md:items-center md:text-left md:gap-mr-xl'
      : 'flex flex-col items-center gap-mr-md text-center'
    }>
      <img
        src={`/illustrations/${illustration}.png`}
        alt=""
        width={px}
        height={px}
        className="shrink-0"
      />
      <div className="flex flex-col items-center gap-2 md:items-start">
        <h3 className="text-mr-h3 font-mr-extrabold text-mr-fg">{title}</h3>
        {description && <p className="max-w-md text-mr-body text-mr-fg-muted">{description}</p>}
        {action && <div className="mt-mr-sm">{action}</div>}
      </div>
    </div>
  );
};
```

## Acessibilidade

- Imagem decorativa → `alt=""`
- Title como `<h3>` (semântica de seção) — ajustar nível conforme contexto da página
- Action button com label clara (ex.: "Começar a ler", não "OK")

## Dependências

- Ilustrações em `/public/illustrations/` (ver `ASSETS_INVENTORY.md`)

## Regra

**NUNCA** usar emoji como substituto da chibi. Se a chibi certa não existir pro estado, abrir issue pra criar — não improvisar com 🙂.
