# Drawer

Painel lateral que entra da direita ou da esquerda. Usado em SideMenu (esquerda)
e em settings/configurações (direita).

## Props

```ts
import type { ReactNode } from 'react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Lado de entrada. Padrão: 'right' */
  side?: 'left' | 'right';
  /** Largura. Padrão: 380 */
  width?: number;
  /** Título do drawer (a11y + header visível) */
  title?: string;
  children: ReactNode;
  /** Ações no rodapé fixo */
  footer?: ReactNode;
}
```

## Anatomia

```
Overlay (rgba(0,0,0,.6) + blur 4px) — click pra fechar
└── Drawer (h: 100vh, max-w: 90vw, slide-in animation 250ms)
    ├── Header (sticky top, border-bottom)
    │   ├── Title
    │   └── IconButton close
    ├── Body (scroll-y, padding 16)
    └── Footer (sticky bottom, opcional)
```

## Comportamento

- Slide in: `transform: translateX(0)` (vinha de `100%` ou `-100%`)
- Esc → fecha
- Overlay click → fecha
- Focus trap obrigatório
- `aria-hidden` no resto da página? Não — `<dialog>` ou `inert` no body são alternativas; preferir `aria-modal="true"` no drawer + listener Esc

## Exemplo

```tsx
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import type { DrawerProps } from './Drawer.types';

export const Drawer = ({ open, onClose, side = 'right', width = 380, title, children, footer }: DrawerProps) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-mr-drawer bg-mr-primary-75 backdrop-blur-mr animate-mr-fade-in" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed top-0 z-mr-drawer h-screen overflow-hidden bg-mr-gray-900 ${side === 'right' ? 'right-0 border-l' : 'left-0 border-r'} border-mr-border flex flex-col animate-mr-drawer-in`}
        style={{ width: `min(${width}px, 90vw)` }}
      >
        {title && (
          <header className="flex shrink-0 items-center justify-between border-b border-mr-border-subtle p-mr-md">
            <h2 className="text-mr-h4 font-mr-extrabold">{title}</h2>
            <IconButton ref={closeBtnRef} icon={X} aria-label="Fechar" onClick={onClose} />
          </header>
        )}
        <div className="flex-1 overflow-y-auto p-mr-md">{children}</div>
        {footer && <footer className="shrink-0 border-t border-mr-border-subtle p-mr-md">{footer}</footer>}
      </aside>
    </>
  );
};
```

## Acessibilidade

- `role="dialog"` + `aria-modal="true"` + `aria-label` no painel
- Focus inicial no botão close
- Esc fecha
- Em mobile, drawer ocupa 90vw — não 100vw — pra usuário ver que tem app por trás

## Dependências

- `lucide-react` (X)
- `<IconButton>`
