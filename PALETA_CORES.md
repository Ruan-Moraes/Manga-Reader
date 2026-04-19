# 🎨 Paleta de Cores — Manga Reader

Documento completo com todas as cores utilizadas no projeto Manga Reader.

---

## 📋 Resumo Executivo

| Categoria | Cor | Hex | RGB | Uso |
|-----------|-----|-----|-----|-----|
| **Primary** | Preto profundo | `#161616` | `22, 22, 22` | Fundo principal |
| **Secondary** | Cinza escuro | `#252526` | `37, 37, 38` | Backgrounds secundários |
| **Tertiary** | Cinza médio | `#727273` | `114, 114, 115` | Ícones, disabled |
| **Accent Primary** | Amarelo-lime | `#ddda2a` | `221, 218, 42` | Highlights, borders, botões |
| **Accent Secondary** | Coral | `#FF784F` | `255, 120, 79` | Deletes, warnings |

---

## 🎯 Paleta Principal (Tailwind Config)

### Primary — Preto Profundo
**Uso:** Fundo da página, texto principal, elementos dark mode

| Variante | Valor | Hex |
|----------|-------|-----|
| `primary-default` | Preto | `#161616` |
| `primary-opacity-80` | Com 80% opacidade | `#161616cc` |
| `primary-opacity-75` | Com 75% opacidade | `#161616bf` |

```css
/* Aplicação */
background-color: #161616;           /* Fundo de página */
color: #161616;                      /* Texto em contraste */
box-shadow: ... 0.25rem #161616bf;   /* Sombras */
```

### Secondary — Cinza Escuro
**Uso:** Backgrounds secundários, cards, containers

| Valor | Hex |
|-------|-----|
| `secondary` | `#252526` |

```css
/* Aplicação */
background-color: #252526;  /* Cards, modais */
border-color: #252526;      /* Bordas sutis */
```

### Tertiary — Cinza Médio
**Uso:** Ícones, placeholders, textos desabilitados

| Valor | Hex |
|-------|-----|
| `tertiary` | `#727273` |

```css
/* Aplicação */
color: #727273;             /* Ícones SVG */
color: #727273;             /* Placeholders */
fill: #727273;              /* Ícones Splide carousel */
```

### Accent Primary — Amarelo-Lime
**Uso:** Destaques, bordas, accents principais, hover states

| Variante | Valor | Hex |
|----------|-------|-----|
| `accent-primary-default` | Amarelo-lime | `#ddda2a` |
| `accent-primary-opacity-25` | 25% opacity | `#ddda2a40` |
| `accent-primary-opacity-50` | 50% opacity | `#ddda2a80` |
| `accent-primary-opacity-75` | 75% opacity | `#ddda2abf` |

```css
/* Aplicações */
color: #ddda2a;              /* Textos destacados */
border-color: #ddda2a;       /* Bordas accent */
background-color: #ddda2a;   /* Botões primários */
box-shadow: ... #ddda2a40;   /* Sombras accent */
```

### Accent Secondary — Coral
**Uso:** Ações destrutivas, avisos, alerts

| Valor | Hex |
|-------|-----|
| `accent-secondary-default` | Coral | `#FF784F` |

```css
/* Aplicações */
color: #FF784F;              /* Botões delete/remover */
border-color: #FF784F;       /* Bordas destrutivas */
```

---

## 🎨 Cores de Suporte (CSS Global)

### White (Branco)
**Uso:** Texto padrão, elementos em contraste

| Valor | Hex | Uso |
|-------|-----|-----|
| Branco | `#ffffff` | Texto padrão, borders |

```css
color: #ffffff;              /* Texto principal */
border-left-color: #ffffff;  /* Borders */
```

### Cinzas de Suporte
**Uso:** Backgrounds, borders, UI elements

| Descrição | Hex | RGB | Uso |
|-----------|-----|-----|-----|
| Cinza bem escuro | `#1a1a1a` | `26, 26, 26` | Editor EasyMDE fundo |
| Cinza escuro | `#2d2d2d` | `45, 45, 45` | Scrollbar track, editor toolbar |
| Cinza médio | `#444444` | `68, 68, 68` | Scrollbar thumb, borders |
| Cinza mais claro | `#555555` | `85, 85, 85` | Separadores, borders hover |
| Cinza claro | `#777777` | `119, 119, 119` | Scrollbar thumb hover, placeholders |
| Cinza bem claro | `#999999` | `153, 153, 153` | Scrollbar thumb active, links inativos |
| Cinza muito claro | `#cccccc` | `204, 204, 204` | Blockquote, textos secundários |

```css
/* Scrollbar */
background-color: #2d2d2d;   /* Track */
background-color: #444;      /* Thumb |
background-color: #777;      /* Thumb hover */
background-color: #999;      /* Thumb active */

/* Editor */
background-color: #1a1a1a;   /* Fundo */
background-color: #2d2d2d;   /* Toolbar, code blocks */
color: #ccc;                 /* Blockquote */
color: #777;                 /* Placeholder |
```

---

## 🎭 Box Shadows (com cores)

### Shadow: Black
```css
box-shadow: 0 0 2rem 0.25rem #161616bf !important;
```
Sombra profunda com cor do primary.

### Shadow: Default
```css
box-shadow: 0.25rem 0.25rem 0 0 #ddda2a40 !important;
```
Sombra offset com accent primary (25% opacity).

### Shadow: Inside
```css
box-shadow: 0 0 0.075rem 0.25rem #ddda2a40 !important;
```
Sombra interna com accent primary.

### Shadow: Elevated
```css
box-shadow: -0.25rem 0.25rem 0 0 #ddda2a40 !important;
```
Sombra elevada com accent primary.

---

## 🔤 Text Shadows

### Default
```css
text-shadow: 0.125rem 0.0625rem 0 #161616bf !important;
```

### Highlight
```css
text-shadow: 0.125rem 0.0625rem 0 #ddda2a40 !important;
```

---

## 🎬 Loader Animation

```css
border-top: 0.25rem solid #ffffff;         /* Branco */
border-left: 0.25rem solid #ddda2a;        /* Amarelo-lime */
```

Spinner com branco (outer) + amarelo-lime (inner).

---

## 📝 EasyMDE Editor (Markdown)

### Editor Background & Text
- **Editor background**: `#1a1a1a`
- **Texto padrão**: `#ffffff`
- **Border**: `1px solid #444`
- **Cursor**: `#ffffff`
- **Seleção**: `#444` background

### Toolbar
- **Background**: `#2d2d2d`
- **Border**: `#444`
- **Botões**: `#ffffff` text
- **Hover**: `#444` background
- **Separadores**: `#555`

### Preview
- **Background**: `#1a1a1a`
- **Code blocks**: `#2d2d2d` background
- **Links**: `#ddda2a` (amarelo-lime)
- **Blockquotes**: `border-left 3px solid #444`, `color: #ccc`
- **Placeholder**: `#777`

---

## 🎨 Markdown Comments (Styling)

Quando comentários são renderizados com markdown, seguem estas cores:

### Textos
- **Padrão**: `#ffffff`
- **Links**: `#ddda2a` (amarelo-lime)
- **Blockquotes**: `#ccc` com `border-left #444`
- **Code inline**: `#2d2d2d` background

### Headers
- H1, H2, H3, H4: `#ffffff` com pesos variados

### Code Blocks
```css
background-color: #2d2d2d;
color: #ffffff;
padding: 0.5rem;
```

---

## 🎨 Mapa Visual

```
┌─────────────────────────────────────────────────────────┐
│                    #161616 (Primary)                     │  ← Fundo principal
│ ┌────────────────────────────────────────────────────┐  │
│ │  #252526 (Secondary)                               │  │  ← Cards/containers
│ │ ┌──────────────────────────────────────────────┐  │  │
│ │ │  Conteúdo com #ffffff (Text)                 │  │  │
│ │ │                                              │  │  │
│ │ │  ▼ Accent Primary: #ddda2a ▼                │  │  │  ← Amarelo-lime
│ │ │  ▼ Accent Secondary: #FF784F ▼              │  │  │  ← Coral
│ │ │                                              │  │  │
│ │ │  Ícones: #727273 (Tertiary)                  │  │  │  ← Cinza médio
│ │ └──────────────────────────────────────────────┘  │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Variações & Estados

### Hover States
- Botões com accent-primary → opacity 80%
- Links com accent-primary → color: #ddda2a com hover opacity 0.8

### Disabled States
- Texto com tertiary `#727273`
- Borders com tertiary `#727273`

### Active/Focus States
- Border/outline com accent-primary `#ddda2a`
- Shadow com accent-primary `#ddda2a40`

---

## 💡 Recomendações de Uso

### Para Novos Componentes
1. **Fundo**: `#161616` (primary)
2. **Cards**: `#252526` (secondary)
3. **Textos**: `#ffffff` (white)
4. **Accents**: `#ddda2a` (quaternary) — PRIMARY
5. **Warns/Deletes**: `#FF784F` (quinary)
6. **Placeholders**: `#727273` (tertiary)

### Contrast Ratios
- Branco `#ffffff` sobre Preto `#161616`: ✅ 21:1 (AAA)
- Amarelo `#ddda2a` sobre Preto `#161616`: ✅ 15:1 (AA)
- Cinza `#727273` sobre Preto `#161616`: ⚠️ 3.8:1 (AA, cuidado em textos pequenos)

### Mobile First
- Respeitar breakpoints: `mobile-sm` (320px), `mobile-md` (375px), `mobile-lg` (425px)
- Cores funcionam bem em qualquer resolução
- Suficiente contraste para leitura em telas pequenas

---

## 📊 Tabela Consolidada

| Nome | Hex | RGB | Tipo | Uso Principal |
|------|-----|-----|------|---------------|
| Primary Default | `#161616` | 22, 22, 22 | Dark | Fundo |
| Primary Opacity 80% | `#161616cc` | 22, 22, 22, 0.8 | Dark | Sombras |
| Primary Opacity 75% | `#161616bf` | 22, 22, 22, 0.75 | Dark | Sombras |
| Secondary | `#252526` | 37, 37, 38 | Dark | Cards |
| Tertiary | `#727273` | 114, 114, 115 | Gray | Ícones |
| Accent Primary Default | `#ddda2a` | 221, 218, 42 | Accent | Highlights |
| Accent Primary Opacity 25% | `#ddda2a40` | 221, 218, 42, 0.25 | Accent | Sombras |
| Accent Primary Opacity 50% | `#ddda2a80` | 221, 218, 42, 0.50 | Accent | Hover |
| Accent Primary Opacity 75% | `#ddda2abf` | 221, 218, 42, 0.75 | Accent | Borders |
| Accent Secondary Default | `#FF784F` | 255, 120, 79 | Accent | Deletes |
| Text Default | `#ffffff` | 255, 255, 255 | Light | Texto |
| Gray L1 | `#1a1a1a` | 26, 26, 26 | Dark | Editors |
| Gray L2 | `#2d2d2d` | 45, 45, 45 | Dark | Backgrounds |
| Gray L3 | `#444444` | 68, 68, 68 | Dark | Borders |
| Gray L4 | `#555555` | 85, 85, 85 | Dark | Separators |
| Gray L5 | `#777777` | 119, 119, 119 | Gray | Disabled |
| Gray L6 | `#999999` | 153, 153, 153 | Gray | Inactive |
| Gray L7 | `#cccccc` | 204, 204, 204 | Light | Subtle |

---

## 🎛️ Como Usar em Código

### Tailwind Classes
```tsx
// Com as cores definidas
<div className="bg-primary-default text-white">
  <h1 className="text-quaternary-default">Título</h1>
  <button className="border-quaternary-default">Clique</button>
  <span className="text-tertiary">Placeholder</span>
</div>

// Com opacity
<div className="bg-primary-opacity-80">
  Content
</div>
```

### CSS Direto
```css
.my-element {
  background-color: #161616;
  color: #ffffff;
  border: 2px solid #ddda2a;
  box-shadow: 0.25rem 0.25rem 0 0 #ddda2a40;
}

.my-hover:hover {
  background-color: #252526;
}
```

### Design System Token (Figma/Sketch)
```json
{
  "colors": {
    "primary": "#161616",
    "secondary": "#252526",
    "tertiary": "#727273",
    "accent-primary": "#ddda2a",
    "accent-primary-opacity-25": "#ddda2a40",
    "accent-primary-opacity-50": "#ddda2a80",
    "accent-primary-opacity-75": "#ddda2abf",
    "accent-secondary": "#FF784F",
    "text-default": "#ffffff",
    "gray": {
      "900": "#1a1a1a",
      "800": "#2d2d2d",
      "700": "#444444",
      "600": "#555555",
      "500": "#727273",
      "400": "#777777",
      "300": "#999999",
      "200": "#cccccc"
    }
  }
}
```

---

**Última atualização:** 19/04/2026 — Ruan
