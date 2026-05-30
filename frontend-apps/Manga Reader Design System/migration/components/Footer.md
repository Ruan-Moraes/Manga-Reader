# Footer

Rodapé global expandido: 6 colunas no desktop, stack no mobile. Brand + newsletter + apps + colunas de links + status banner + bottom bar.

## Props

```ts
import type { ReactNode } from 'react';

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string; onClick?: () => void }>;
}

export interface FooterProps {
  columns: FooterColumn[];
  /** Componente do status do sistema (geralmente StatusDot + texto) */
  status?: ReactNode;
  /** Newsletter handler */
  onSubscribe?: (email: string) => void | Promise<void>;
  /** Preferências (idioma, tema, ajuda) — geralmente botões */
  preferences?: ReactNode;
  /** Copyright text */
  copyright?: string;
}
```

## Layout

| Breakpoint | Top-row colunas |
|---|---|
| <640 | 1 coluna (stack vertical) |
| 640–1023 | brand topo + 3 colunas embaixo |
| ≥1024 | brand (300px) + 6 colunas |

## Anatomia

```
Footer (bg #1a1a1a, border-top 2px tertiary)
├── Top row
│   ├── Brand block
│   │   ├── Logo + wordmark
│   │   ├── Tagline
│   │   ├── Newsletter (input + button accent)
│   │   └── App badges (iOS + Android)
│   └── Colunas (mapeadas de columns)
├── Status banner (Card flat, StatusDot + texto + link "ver status")
└── Bottom bar
    ├── Copyright (esquerda)
    └── Preferências (direita)
```

## Hover de link

```css
.footer-link {
  color: var(--mr-gray-200);
  transition: color .25s, padding-left .25s;
}
.footer-link:hover {
  color: var(--mr-accent);
  padding-left: 6px;
}
```

## Exemplo (estrutural)

```tsx
import { ArrowRight, Download } from 'lucide-react';
import { Card } from './Card';
import { StatusDot } from './StatusDot';
import { Input } from './Input';
import type { FooterProps } from './Footer.types';

export const Footer = ({ columns, status, onSubscribe, preferences, copyright }: FooterProps) => (
  <footer className="border-t-2 border-mr-tertiary bg-mr-gray-900 py-mr-xl px-mr-md tracking-mr">
    <div className="mx-auto max-w-mr-footer">
      {/* Top row */}
      <div className="grid gap-mr-xl lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
        {/* Brand */}
        <div className="min-w-0">
          <div className="font-mr-sans font-mr-extrabold italic tracking-mr-logo text-mr-fg">
            Manga <span className="text-mr-accent">Reader</span>
          </div>
          {/* tagline + newsletter + app badges */}
        </div>

        {/* Columns */}
        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-7 sm:grid-cols-3 lg:grid-cols-6">
          {columns.map(col => (
            <div key={col.title}>
              <div className="mr-label mb-3.5 border-b border-mr-gray-800 pb-2 text-mr-accent">{col.title}</div>
              <ul className="flex flex-col gap-0.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      onClick={l.onClick}
                      className="block py-1.5 text-mr-small text-mr-gray-200 transition-all duration-mr-default hover:pl-1.5 hover:text-mr-accent"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Status */}
      {status && <Card className="mt-7 flex flex-wrap items-center gap-3">{status}</Card>}

      {/* Bottom */}
      <div className="mt-mr-md flex flex-wrap items-center justify-between gap-3 border-t border-mr-border-subtle pt-mr-md">
        <div className="text-mr-tiny text-mr-fg-subtle">{copyright}</div>
        <div className="flex flex-wrap gap-2">{preferences}</div>
      </div>
    </div>
  </footer>
);
```

## Acessibilidade

- `<footer>` semântico
- `<nav aria-label="Rodapé">` para colunas
- Links: usar `<a href>` real, não `<button>`. Se for SPA, usar `<Link>` do router

## Dependências

- `<Card>`, `<Input>`, `<StatusDot>`, `<Button>`
- `lucide-react`

## Conteúdo fixo

Estes itens devem aparecer **sempre**, mesmo se `columns` estiver vazio:
- Logo + wordmark
- Copyright
- Status do sistema (mesmo que "operando normalmente")
- Link de Termos / Privacidade / DMCA / Contatos
