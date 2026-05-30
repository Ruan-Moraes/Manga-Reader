# Toast

Notificação efêmera no canto da tela. Auto-dismiss + ações opcionais.

## Provider + hook

```ts
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ToastTone = 'accent' | 'success' | 'danger' | 'neutral';

export interface ToastConfig {
  id?: string;
  tone?: ToastTone;
  title: string;
  description?: string;
  /** Duração ms. Padrão: 4000. Passar 0 = manual close */
  duration?: number;
  /** Ação opcional (botão à direita) */
  action?: { label: string; onClick: () => void };
  icon?: LucideIcon;
}

export interface ToastApi {
  toast: (cfg: ToastConfig) => string;
  dismiss: (id: string) => void;
}
```

## Comportamento

- Posição: **top-right** desktop, **top-center** mobile
- Stack vertical, gap 8px, máx **3 visíveis** (mais antigas são empilhadas e dispensadas)
- Auto-dismiss: 4s default (pode ser custom)
- Pause on hover/focus dentro do toast
- Action button: 1 só, à direita; clicar dispensa
- Animação: slide-down + fade

## Estados visuais por tone

| tone | Border-left | Icon color | Uso |
|---|---|---|---|
| accent | `mr-accent` | `mr-accent` | sucesso de envio, save |
| success | `mr-accent` | `mr-accent` | igual accent (sem verde no sistema) |
| danger | `mr-danger` | `mr-danger` | erro, falha |
| neutral | `mr-tertiary` | `mr-fg-muted` | info |

## Exemplo de uso (consumidor)

```tsx
import { useToast } from '@/components/ui/Toast';
import { Check } from 'lucide-react';

function SaveButton() {
  const { toast } = useToast();
  return (
    <Button onClick={async () => {
      await save();
      toast({ tone: 'accent', icon: Check, title: 'Salvo', description: 'Seus dados foram atualizados.' });
    }}>Salvar</Button>
  );
}
```

## Estrutura do toast item

```
<Card> (border-left 3px accent, padding 12 16)
  ├── Icon (opcional)
  ├── Body: title (bold) + description (small muted)
  └── ActionButton (opcional)
  └── IconButton close (sempre)
```

## Acessibilidade

- Container do provider: `role="region"` + `aria-label="Notificações"`
- Cada toast: `role="status"` (não-crítico) ou `role="alert"` (crítico/danger)
- `aria-live="polite"` no provider — não interrompe screen reader
- Em danger, considerar `aria-live="assertive"`

## Dependências

- `lucide-react`
- `<Card>`, `<IconButton>`

## Provider sugerido

Implementar via Context + reducer; expor `<ToastProvider>` no root e `useToast()` para qualquer componente. Não usar biblioteca externa nesta fase — toast simples é fácil.
