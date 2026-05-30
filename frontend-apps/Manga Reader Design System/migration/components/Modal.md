# Modal (Dialog)

Modal centralizado com overlay blur. Preferir `<dialog>` nativo via `useRef` —
acessibilidade ganha de graça.

## Props

```ts
import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Título acessível e visível */
  title: string;
  /** Sub do header (opcional) */
  description?: string;
  /** Eyebrow uppercase acima do título */
  eyebrow?: string;
  /** Tamanho. Padrão: 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Esconde botão close — útil pra forçar decisão. Padrão: false */
  hideClose?: boolean;
  children: ReactNode;
  /** Rodapé com ações */
  footer?: ReactNode;
}
```

## Sizes

| size | max-width |
|---|---|
| sm | 400px |
| md | 560px (default) |
| lg | 720px |

## Anatomia

```
Overlay (rgba(0,0,0,.6) + backdrop-blur 4px)
└── Dialog (mr-surface, border, radius 8px, shadow black, drawer-in animation)
    ├── Header
    │   ├── Eyebrow (opcional)
    │   ├── Title
    │   ├── Description (opcional)
    │   └── IconButton close (direita)
    ├── Body (scroll-y se conteúdo > 60vh)
    └── Footer (opcional, com botões alinhados à direita)
```

## Estados

- `open=false` → não renderiza
- focus inicial: no primeiro tabbable do body (ou no botão close se body vazio)
- Esc → fecha (pode desabilitar via `hideClose`)
- Click fora → fecha (pode desabilitar via prop futura `dismissOnOutsideClick`)
- Focus trap obrigatório

## Exemplo

```tsx
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import type { ModalProps } from './Modal.types';

const sizeMap = { sm: 'max-w-[400px]', md: 'max-w-[560px]', lg: 'max-w-[720px]' } as const;

export const Modal = ({ open, onClose, title, description, eyebrow, size = 'md', hideClose, children, footer }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      className={`p-0 ${sizeMap[size]} w-[90vw] rounded-mr-md border border-mr-border bg-mr-surface text-mr-fg shadow-mr-black backdrop:bg-mr-primary-75 backdrop:backdrop-blur-mr animate-mr-fade-in`}
      aria-labelledby="modal-title"
    >
      <header className="flex items-start justify-between gap-4 border-b border-mr-border-subtle p-mr-md">
        <div className="min-w-0 flex-1">
          {eyebrow && <div className="mr-label text-mr-accent mb-1">{eyebrow}</div>}
          <h2 id="modal-title" className="text-mr-h3 font-mr-extrabold text-mr-fg">{title}</h2>
          {description && <p className="mt-1 text-mr-small text-mr-fg-subtle">{description}</p>}
        </div>
        {!hideClose && <IconButton icon={X} aria-label="Fechar" onClick={onClose} />}
      </header>

      <div className="max-h-[60vh] overflow-y-auto p-mr-md">{children}</div>

      {footer && <footer className="flex items-center justify-end gap-2 border-t border-mr-border-subtle p-mr-md">{footer}</footer>}
    </dialog>
  );
};
```

## Acessibilidade

- `<dialog>` nativo já oferece focus trap, Esc, modal blocking, role="dialog"
- `aria-labelledby` aponta pro `<h2>` do título
- Focus return: ao fechar, foco volta pro trigger automaticamente

## Dependências

- `lucide-react` (X)
- `<IconButton>`

## Notas

- Em iOS Safari < 15.4 o `<dialog>` não é suportado — adicionar polyfill `dialog-polyfill` se for um requisito real
- `Modal` é usado em ProfileEdit, ForumComposer, confirmações de delete
