# HeroSection

Banner full-bleed do topo de páginas-chave (Home, TitleDetail, eventos especiais).
Stack vertical no mobile, side-by-side no desktop.

## Props

```ts
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface HeroSectionProps {
  /** Eyebrow uppercase acima do título */
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  /** Título grande */
  title: string;
  /** Sinopse / descrição */
  description?: string;
  /** Metadados em badges (status, ano, gênero) */
  meta?: ReactNode;
  /** CTAs */
  actions?: ReactNode;
  /** Imagem/poster à direita */
  visual?: ReactNode;
  /** Gradient ou cor de fundo. Default: diagonal sutil */
  background?: string;
}
```

## Layout

```
Mobile (<768)                            Desktop (≥768)
──────────────────                       ────────────────────────────────
[visual]                                 [copy]      |  [visual]
[eyebrow]                                eyebrow     |
[title big]                              title big   |
[description]                            description |
[meta badges]                            meta        |
[actions]                                actions     |
```

## Estilo

- Padding: `p-mr-lg` mobile, `p-mr-xl md:p-10` desktop
- Background: gradient diagonal 135° das duas variações do primary (`linear-gradient(135deg, #2a1f0f, #161616)`) — ou imagem com overlay
- Border-radius: `mr-radius-lg` (12px) **só quando não full-bleed**; sem radius quando ocupa a largura da viewport
- min-height desktop: ~320px

## Title

- `font-size: clamp(24px, 6vw, 36px)`
- `font-weight: 700`
- `letter-spacing: 0.0625rem`
- `line-height: 1.1`
- Text-shadow opcional (`mr-text-shadow-default`) quando sobre fundo fotográfico

## Exemplo

```tsx
import type { HeroSectionProps } from './HeroSection.types';
import { cn } from '@/lib/cn';

export const HeroSection = ({ eyebrow, eyebrowIcon: EyeIcon, title, description, meta, actions, visual, background }: HeroSectionProps) => (
  <section
    className="relative flex flex-col-reverse gap-mr-md overflow-hidden rounded-mr-lg p-mr-lg md:flex-row md:items-center md:gap-mr-xl md:p-10"
    style={{ background: background ?? 'linear-gradient(135deg, #2a1f0f, #161616)' }}
  >
    <div className="flex min-w-0 flex-1 flex-col">
      {eyebrow && (
        <div className="mr-label mb-2.5 inline-flex items-center gap-1.5 text-mr-accent">
          {EyeIcon && <EyeIcon className="size-3.5" />}
          {eyebrow}
        </div>
      )}
      <h1 className="mb-1 text-[clamp(24px,6vw,36px)] font-mr-bold leading-tight tracking-mr text-mr-fg">
        {title}
      </h1>
      {description && <p className="mb-mr-md max-w-prose text-mr-body text-mr-gray-200 leading-relaxed">{description}</p>}
      {meta && <div className="mb-mr-md flex flex-wrap items-center gap-2">{meta}</div>}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    {visual && <div className="flex shrink-0 justify-center md:w-auto">{visual}</div>}
  </section>
);
```

## Acessibilidade

- `<section>` semântico
- O título do hero é geralmente o `<h1>` da página — não duplicar com outro h1 acima
- Visual decorativo: `<img alt="">` ou wrapper sem role

## Dependências

- `lucide-react` (no consumer)
- `cn`
