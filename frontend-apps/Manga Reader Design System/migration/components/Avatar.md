# Avatar

Avatar quadrado com cantos angulares (radius 2px) ou circular (radius full). Iniciais
ou imagem. **Compartilhado por:** comentários, fórum, perfil, navbar, side menu, review cards.

## Props

```ts
export type AvatarSize = 24 | 32 | 40 | 48 | 64 | 96;
export type AvatarShape = 'square' | 'circle';

export interface AvatarProps {
  /** URL de imagem; se ausente, mostra iniciais */
  src?: string;
  /** Iniciais (2 chars). Calcula automático a partir de name se omitido */
  initials?: string;
  /** Nome completo — usado pra alt e para gerar iniciais */
  name?: string;
  /** Cor de fundo da fallback. Default: accent */
  color?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Click handler — torna interativo */
  onClick?: () => void;
}
```

## Defaults

- `size`: 40
- `shape`: `square` (padrão do produto, é angular)
- `color`: `var(--mr-accent)` → texto `var(--mr-primary)` automático

## Anatomia

- Box `size × size`, `border-radius: 2px` (square) ou `9999px` (circle)
- Iniciais centralizadas, weight 800, fontsize escala com box
- Imagem `object-fit: cover` no full bleed
- Em interativo: `cursor: pointer` + `hover: opacity 0.85`

## Tamanho de fonte por size

| size | fontSize |
|---|---|
| 24 | 10 |
| 32 | 12 |
| 40 | 14 |
| 48 | 14 |
| 64 | 18 |
| 96 | 32 |

## Exemplo

```tsx
const getInitials = (name?: string) =>
  (name ?? '?? ')
    .split(' ')
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase();

const fontByBox: Record<AvatarSize, string> = {
  24: 'text-[10px]', 32: 'text-mr-small', 40: 'text-mr-body',
  48: 'text-mr-body', 64: 'text-mr-h4', 96: 'text-mr-h1',
};

export const Avatar = ({ src, initials, name, color, size = 40, shape = 'square', onClick }: AvatarProps) => {
  const inits = initials ?? getInitials(name);
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? name ?? 'Abrir perfil' : undefined}
      className={`inline-flex shrink-0 items-center justify-center font-mr-extrabold ${shape === 'circle' ? 'rounded-mr-full' : 'rounded-mr-xs'} ${fontByBox[size]} ${onClick ? 'cursor-pointer hover:opacity-mr-hover' : ''}`}
      style={{ width: size, height: size, background: src ? undefined : (color ?? 'var(--mr-accent)'), color: 'var(--mr-primary)' }}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className={`size-full object-cover ${shape === 'circle' ? 'rounded-mr-full' : 'rounded-mr-xs'}`} />
      ) : inits}
    </div>
  );
};
```

## Acessibilidade

- Imagem: `alt` = nome quando disponível, `""` se decorativo
- Quando clicável: `role="button"` + `tabIndex={0}` + `Enter`/`Space` ativam
- Iniciais: nunca traduzidas — são extraídas do nome real

## Cores de fundo determinísticas

Para nomes sem cor explícita, gerar HSL a partir do hash:

```ts
const hashToHue = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
};
const colorFromName = (name: string) => `hsl(${hashToHue(name)}, 60%, 60%)`;
```

## Dependências

Nenhuma.
