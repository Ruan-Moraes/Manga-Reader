# ASSETS_INVENTORY — Manga Reader Design System

> Inventário completo de assets externos consumidos pelo design system.
> O projeto destino deve replicar esta estrutura em `public/` ou no asset
> pipeline equivalente (Vite `?url` imports são aceitáveis).

---

## 1. Fontes

| Família | Pesos | Variant | Origem | Hosting recomendado |
|---|---|---|---|---|
| **Nunito Sans** | 200–1000 (variable) | opsz 6–12, normal + italic | Google Fonts | self-hosted via `@fontsource-variable/nunito-sans` |
| **Fira Code** *(opcional)* | 400, 500, 700 | normal | Google Fonts / GitHub | self-hosted via `@fontsource/fira-code` |

**Instalação preferida:**
```bash
pnpm add @fontsource-variable/nunito-sans
# ou Fira Code para code/kbd
pnpm add @fontsource/fira-code
```

**Import no entrypoint:**
```ts
// main.tsx
import '@fontsource-variable/nunito-sans/wght.css';
import '@fontsource-variable/nunito-sans/wght-italic.css';
```

**Fallback CDN** (só em desenvolvimento):
```css
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap');
```

**Critério de aceite:** body renderiza com letter-spacing 0.0625rem, peso 400 visível com `font-weight: 400`, peso 800 visível com `font-weight: 800`.

---

## 2. Ícones

### Set canônico: **Lucide**

| Aspecto | Valor |
|---|---|
| Pacote | `lucide-react` |
| Estilo | outline 2px, 24×24 viewBox |
| Tamanhos | 12, 16, 20, 24, 28 |
| Cor | sempre `currentColor` |
| Cor default na UI | `var(--mr-fg)` |
| Cor em link/ativo | `var(--mr-accent)` |

```bash
pnpm add lucide-react
```

### Mapa de ícones usados no design system

Lista derivada do componente `<Icon>` recriado nos previews. Mapear 1:1 para nomes Lucide.

| Nome no design | Componente Lucide | Uso típico |
|---|---|---|
| `menu` | `Menu` | Hamburger do NavBar mobile |
| `search` | `Search` | Search field |
| `bookmark` | `Bookmark` | Salvar, library |
| `user` | `User` | Avatar fallback, perfil |
| `home` | `Home` | Nav, tab bar |
| `library` | `BookOpen` *(ou `Library`)* | Tab biblioteca |
| `star` | `Star` | Rating |
| `heart` | `Heart` | Favoritar |
| `comment` | `MessageSquare` | Comentários, fórum |
| `close` | `X` | Fechar modal/drawer |
| `chevronL` | `ChevronLeft` | Voltar, paginação |
| `chevronR` | `ChevronRight` | Avançar |
| `chevronD` | `ChevronDown` | Dropdown |
| `plus` | `Plus` | Adicionar |
| `check` | `Check` | Confirmação |
| `bell` | `Bell` | Notificações |
| `settings` | `Settings` | Configurações |
| `sparkle` | `Sparkles` | Recomendações, recursos |
| `trending` | `TrendingUp` | Em alta |
| `compass` | `Compass` | Descobrir |
| `news` | `Newspaper` | Novidades, blog |
| `groups` | `Users` | Grupos, comunidade |
| `forum` | `MessageCircle` | Fórum |
| `calendar` | `Calendar` | Eventos, datas |
| `logout` | `LogOut` | Sair |
| `eye` | `Eye` | Visualizações, privacidade |
| `clock` | `Clock` | Tempo, histórico |
| `refresh` | `RefreshCw` | Sincronizar, versão |
| `help` | `HelpCircle` | Ajuda |
| `download` | `Download` | Apps |
| `globe` | `Globe` | Idioma |
| `moon` | `Moon` | Tema |
| `mail` | `Mail` | Email, contato |
| `arrowR` | `ArrowRight` | CTA, próximo |
| `shuffle` | `Shuffle` | Randomizar |
| `filter` | `ListFilter` | Filtros |
| `az` | `ArrowDownAZ` | Sort A→Z |
| `za` | `ArrowDownZA` | Sort Z→A |

**Componente wrapper:** ver `components/Icon.md`. Re-exporta `lucide-react` com tamanhos canônicos e fallback acessível.

**Bundle size:** Lucide é tree-shakeable — só os ícones importados vão pro bundle. Não importar `lucide-react/dist/lucide-react.js` inteiro.

---

## 3. Ilustrações (chibi)

> **Sempre PNG**, nunca SVG. O estilo pintado à mão das chibis é parte da
> linguagem emocional do produto e não pode ser recriado em SVG genérico.
> **Não usar emoji** como substituto.

| Arquivo | Estado emocional | Uso típico |
|---|---|---|
| `feliz.png` | Alegria, conquista | Sucesso de envio, fim de capítulo, badge desbloqueado |
| `triste.png` | Tristeza, vazio | Estado de erro suave, lista vazia melancólica |
| `surpresa.png` | Surpresa | Onboarding, descoberta nova feature, easter egg |
| `zangada.png` | Frustração | Erro de validação repetida, ação destrutiva |
| `pensando.png` | Reflexão | CTA "Falar com o time", help center, dúvida |
| `duvida.png` | Confusão | Busca sem resultado, FAQ, "não encontramos" |
| `404.png` | Perdido, erro | Página NotFound, recurso removido |

### Localização

| Origem (DS) | Destino (projeto) |
|---|---|
| `assets/illustrations/feliz.png` | `public/illustrations/feliz.png` |
| `assets/illustrations/triste.png` | `public/illustrations/triste.png` |
| `assets/illustrations/surpresa.png` | `public/illustrations/surpresa.png` |
| `assets/illustrations/zangada.png` | `public/illustrations/zangada.png` |
| `assets/illustrations/pensando.png` | `public/illustrations/pensando.png` |
| `assets/illustrations/duvida.png` | `public/illustrations/duvida.png` |
| `assets/illustrations/404.png` | `public/illustrations/404.png` |

### Tamanhos canônicos

- **Inline em estado vazio:** 120×120
- **Modal de sucesso:** 96×96
- **Hero/banner:** 200×200 ou mais
- **Avatar surreal:** 64×64 (mantém estilo)

### Como usar

```tsx
import feliz from '@/assets/illustrations/feliz.png';

<img src={feliz} alt="" width={120} height={120} />
```

ou via path absoluto:

```tsx
<img src="/illustrations/feliz.png" alt="" width={120} height={120} />
```

Sempre `alt=""` quando a ilustração é decorativa (estado emocional) e o texto adjacente já comunica o estado. `alt="Personagem chibi pensativo"` apenas se for o único elemento.

---

## 4. Logo / Favicon

| Arquivo | Formato | Tamanho | Uso |
|---|---|---|---|
| `assets/favicon.svg` | SVG | viewBox 64×64 | Favicon principal (browser tab), favicon SVG no `<head>` |
| `assets/favicon.ico` | ICO | 16×16 + 32×32 | Fallback IE/legado |
| `assets/favicon-32x32.png` | PNG | 32×32 | `<link rel="icon" sizes="32x32">` |
| `assets/favicon-64x64.png` | PNG | 64×64 | Header navbar (preview cards) |
| `assets/favicon-192x192.png` | PNG | 192×192 | Android PWA |
| `assets/favicon-512x512.png` | PNG | 512×512 | Splash PWA / share preview |

### Markup recomendado

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
<link rel="apple-touch-icon" href="/favicon-192x192.png" />
<link rel="manifest" href="/site.webmanifest" />
```

### Wordmark

O wordmark "Manga Reader" não é um arquivo — é **markup**:

```tsx
<span className="font-mr-extrabold italic tracking-mr-logo text-mr-fg">
  Manga <span className="text-mr-accent">Reader</span>
</span>
```

- Italic + extrabold (800)
- `letter-spacing: 1.5px`
- "Reader" em accent

Não há versão imagem do logo completo no design system atual. Se necessário, gerar SVG a partir do markup.

---

## 5. Imagens de catálogo (capas de mangá)

| Item | Decisão |
|---|---|
| Capas | **Não são parte do design system** — vêm da API/CMS do projeto |
| Placeholder | Gradiente diagonal 135° entre duas variações do primary (`linear-gradient(135deg, #2a1f0f, #161616)`). Cada manga tem seu próprio par no banco fake (`data.js`) |
| Aspect ratio | `2 / 3` sempre |
| Border-radius | `var(--mr-radius-md)` (8px) |
| Loading | Skeleton com shimmer (ver `components/Skeleton.md`) |

**Importante:** capas reais NÃO devem receber filtro/grain/desaturação. O contraste com a UI neutra é intencional.

---

## 6. Ornamentos e padrões

| Item | Uso |
|---|---|
| **Pontuação `★ → ← ✓`** | Aceitos com parcimônia em textos. Nunca substituem ícones. |
| **`·` (middle dot U+00B7)** | Separador de metadados ("Autor · Status · Ano"). |
| **`—` (em dash U+2014)** | Pontuação literária; nunca usar `--` ASCII. |

---

## 7. Áudio / vídeo / animações pré-renderizadas

Nenhum. O design system não consome assets de áudio, vídeo ou Lottie. Toda animação é CSS/JS in-page.

---

## 8. Checklist de migração de assets

- [ ] Fontes (Nunito Sans variable) instaladas e renderizando com weight 400 e 800 corretos
- [ ] `lucide-react` adicionado às dependências
- [ ] 7 ilustrações chibi em `public/illustrations/` (preservando nomes)
- [ ] Favicon SVG + PNGs em `public/`
- [ ] `<link rel="icon">` configurado no `index.html` do Vite
- [ ] Wordmark renderizando como component, não como imagem
- [ ] Lint rule contra emoji ativa no ESLint
- [ ] Mapa de ícones antigo→Lucide aplicado em todo o codebase legado (auditoria via grep)

---

## 9. Pendências / discussões

1. **Tema claro:** não existe. Se for adicionar, recriar todas as ilustrações chibi em versão clara — o estilo pintado precisa do fundo claro pra funcionar visualmente.
2. **Logo completo:** se a marca crescer, considerar criar SVG wordmark exportável para share previews / OG images / favicon PWA.
3. **Lucide vs handmade:** o codebase atual do projeto fonte usa SVGs handmade. A substituição por Lucide é **decisão deste design system** — confirmar com stakeholders antes de remover SVGs originais permanentemente.
4. **PWA assets:** se virar PWA, falta gerar splash screens iOS e maskable icons (192/512 maskable).
