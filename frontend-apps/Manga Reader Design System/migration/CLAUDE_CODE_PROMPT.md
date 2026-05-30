# 🚀 Instruções para você, Claude Code

## Contexto

Você vai migrar o frontend existente deste projeto para o **Manga Reader Design System**, de forma **incremental e segura**. Você **não** vai reescrever o app — vai trocar partes da UI por componentes novos seguindo um plano pré-definido.

A fonte da verdade desta migração é a pasta `migration/`, que contém:

```
migration/
├── MIGRATION_MAP.md              ← LEIA PRIMEIRO. Plano em fases.
├── design-tokens.json            ← Tokens (cores, type, spacing, etc.)
├── tailwind.config.suggested.js  ← Merge no tailwind.config existente
├── globals.css.suggested         ← CSS vars + base styles
├── ASSETS_INVENTORY.md           ← Fontes, ícones, ilustrações
├── components/                   ← 45 specs `.md` — uma por componente
└── screens/                      ← 26 specs `.md` — uma por tela
```

Cada `.md` em `components/` e `screens/` é **autocontido**: props (TypeScript), estados, anatomia, acessibilidade, exemplo de código e dependências.

---

## Stack confirmada do projeto destino

- React + TypeScript estrito
- Vite
- Tailwind CSS
- TanStack Query (React Query)
- react-i18next (todo texto visível em pt-BR via i18n)
- Vitest + @testing-library/react + MSW v2

Se algo da stack não bater com o que você encontrar no projeto, **pare e me pergunte** antes de seguir.

---

## Princípios não-negociáveis

Estas regras valem em **todo** PR. Quebrar qualquer uma delas é regressão de design system.

1. **Tokens primeiro.** Nenhum componente usa hex/px hardcoded. Sempre via Tailwind (`bg-mr-accent`) ou CSS var (`var(--mr-accent)`).
2. **Mobile-first.** Toda spec descreve mobile primeiro. Tablet/desktop são `min-width` overrides.
3. **letter-spacing 0.0625rem global no `body`** é assinatura visual do produto. Não removê-lo. Pode parecer estranho no início — não é bug.
4. **Sombras offset accent, NÃO depth shadows.** Proibido `0 4px 12px rgba(0,0,0,.2)`. Use `var(--mr-shadow-elevated)`.
5. **Zero gradientes em UI** (botões, headers, backgrounds). Gradiente só em poster placeholder de mangá quando capa real ausente.
6. **Zero emoji.** A linguagem emocional vem das 7 ilustrações chibi PNG. Habilite a lint rule sugerida no `tailwind.config.suggested.js`.
7. **Radii angulares.** `2px` em botões/inputs/badges, `8px` em cards. `rounded-full` só em avatares circulares e pills.
8. **Transições 0.3s `ease`.** Sem spring, sem bounce.
9. **Sentence case em UI.** UPPERCASE só em labels técnicos / badges com `tracking-wide`.
10. **Componente compartilhado = uma implementação.** Antes de mergear, faça `grep` no codebase pelo nome do componente novo e confirme que TODAS as call-sites antigas migraram. Variações legítimas viram `variant`/`size`/`tone` no próprio componente — nunca markup customizado.
11. **TypeScript estrito.** Sem `any`. Sem `// @ts-ignore`. Sem casts desnecessários.
12. **Comentários e copy em pt-BR.** Variáveis e nomes técnicos podem ficar em inglês.

---

## Fases de execução

Siga **estritamente nesta ordem**. Não pule. Cada fase tem critério de saída claro. Quando concluir uma fase, **pare, faça um resumo do que mudou, e me espere confirmar antes de seguir para a próxima.**

### Fase 0 — Fundação (esforço S/M)

1. Leia `migration/MIGRATION_MAP.md` inteiro.
2. Leia `migration/ASSETS_INVENTORY.md`.
3. Audite o projeto destino com `ls`/`grep` e gere um relatório curto:
   - Onde fica `tailwind.config.*`
   - Onde fica o CSS global (e quais resets/normalizes já existem)
   - Lista de dependências em `package.json` relevantes pra UI (Radix? shadcn? MUI? lucide? font?)
   - Estrutura de pastas dos componentes atuais
4. **Pause e me apresente o relatório.** Aguarde meu OK antes de mudar arquivo nenhum.
5. Após meu OK:
   - Copie `migration/design-tokens.json` para `src/design-system/tokens/tokens.json`
   - **Mescle** (não substitua) `migration/tailwind.config.suggested.js` no `tailwind.config.ts` existente, dentro de `theme.extend`. Se conflito de nomes, mantenha o nosso prefixado com `mr-`.
   - Adicione `migration/globals.css.suggested` ao entrypoint global (importe em `main.tsx` ou inclua via index.css principal).
   - Instale fontes: `pnpm add @fontsource-variable/nunito-sans` + import em `main.tsx`.
   - Instale ícones: `pnpm add lucide-react`.
   - Copie as 7 ilustrações chibi para `public/illustrations/` (lista em `ASSETS_INVENTORY.md`).
   - Ative o plugin de text-shadow (snippet em `tailwind.config.suggested.js`).
   - Adicione a lint rule contra emoji (snippet em `tailwind.config.suggested.js`).
6. **Critério de saída:**
   - Uma página em branco renderiza com Nunito Sans
   - Tokens disponíveis via Tailwind (`bg-mr-primary`, `text-mr-fg`, `shadow-mr-elevated`)
   - Tokens disponíveis via CSS var (`var(--mr-accent)`)
   - `/illustrations/feliz.png` acessível
   - Build passa sem warnings

### Fase 1 — Primitivos (15 componentes)

Para cada componente listado em `migration/MIGRATION_MAP.md` na ordem dada (Button → IconButton → Icon → Badge → Avatar → Stars → Input → Textarea → Select → Checkbox → Radio → Switch → Label → Kbd):

1. Leia o `.md` correspondente em `migration/components/`.
2. Crie o arquivo seguindo a estrutura sugerida (recomendação: `src/components/ui/<Nome>.tsx` + `<Nome>.types.ts` se útil).
3. Implemente **exatamente** as props do spec. Não adicione props "que talvez sejam úteis" — adicione só se eu pedir.
4. Use o exemplo do `.md` como base, **adaptando** ao padrão do projeto (paths de import, `cn` helper, etc.).
5. Crie testes mínimos em Vitest + RTL conforme indicado no `.md`.
6. Crie um adapter de transição apenas onde o `.md` instruir (ex.: Button) — sempre com `console.warn` em dev pra migrar call-sites antigos.
7. Auditoria pós-implementação: `grep` por usos do componente equivalente antigo no codebase. Liste quem ainda usa o antigo (NÃO migre agora — só liste).

Após **todos os 15 primitivos**:

- Gere uma rota interna `/design/primitives` que renderize cada um em todos os estados visuais documentados (default, hover, focus, disabled, loading, error, etc.). Isso é seu "test bed" pra eu validar visualmente.
- **Critério de saída:** test bed renderiza tudo sem warnings de console; testes passam; lint passa.
- **Pause, me chame para QA visual**, aguarde OK.

### Fase 2 — Composições (15 componentes)

Mesmo procedimento da Fase 1, na ordem: Card → Modal → Drawer → Toast → Tabs → Pagination → Tooltip → DropdownMenu → Accordion → SegmentedControl → ProgressBar → StatusDot → SearchField → EmptyState → Skeleton.

Notas:

- **DropdownMenu** usa `@radix-ui/react-dropdown-menu`. Confirme com `package.json` antes de instalar.
- **Toast** precisa de Provider no root. Adicione `<ToastProvider>` no entrypoint da árvore React, idealmente acima do Router.
- **Modal** usa `<dialog>` nativo. Se você detectar suporte a Safari < 15.4 nos targets do projeto, peça aprovação antes de adicionar polyfill.
- **EmptyState** importa as ilustrações PNG. Verifique se Vite resolve `public/illustrations/*.png` corretamente.

Após todos: estender o test bed para `/design/compositions`.

### Fase 3 — Layouts (7 componentes)

Ordem: PageContainer → SectionHeader → HeroSection → Footer → SideMenu → MobileTabBar → NavBar.

NavBar e MobileTabBar são **substituições visíveis em todas as páginas**.

- Implemente as 7 num branch isolado
- Trocá-las no app principal só depois da Fase 4 começar (assim você confere visualmente em ao menos uma tela migrada)
- Mantenha NavBar antigo + novo coexistindo via feature flag (`?nav=v2` ou env var) durante 1 sprint

### Fase 4 — Telas (26 telas em 6 ondas)

Ordem **obrigatória**:

**Onda 1 (baixo risco):** Terms → Privacy → DMCA → Contact → HelpCenter
**Onda 2:** Login → Register → ForgotPassword → SystemSettings
**Onda 3:** News → Trending → NewReleases → Categories (depende de MangaCard)
**Onda 4:** Library → Profile → ProfileEdit (mais denso da app — vai devagar)
**Onda 5:** Groups → GroupDetail → Events → EventDetail → Forum → ForumTopic → ForumComposer
**Onda 6 (alto risco, por último):** Home → TitleDetail → **Reader**

Para cada tela:

1. Leia `migration/screens/<Tela>.md` inteiro
2. Mapeie o layout em árvore (do spec) para um componente React funcional usando os primitivos/composições/layouts já entregues
3. Implemente **mobile-first** — comece pelo layout `<md`, depois adicione `md:` e `lg:`
4. Cubra todos os estados listados no spec: loading (Skeleton), vazio (EmptyState), erro, sucesso
5. **Integre i18n via react-i18next.** Toda string visível na UI deve passar por `t('...')`. Crie/atualize `locales/pt-BR/<tela>.json` em paralelo. Não hardcode texto.
6. Conecte data via TanStack Query — siga padrão de queryKey existente no projeto, peça se incerto
7. Cubra com testes Vitest+RTL: renderização básica, estado vazio, estado de erro, interação principal (1-2 fluxos críticos)
8. **Pause** ao terminar cada onda e me chame para QA visual antes de seguir

**Reader (Onda 6) é especial:**

- Coloque atrás de feature flag (`?reader=v2` ou env)
- Mantenha o leitor antigo intacto por 2 sprints após merge
- QA específico em iOS Safari (auto-hide chrome), Android Chrome (overscroll), navegação por teclado completa, prefers-reduced-motion

---

## Como você deve trabalhar

### Antes de cada fase

- Releia a seção correspondente em `MIGRATION_MAP.md`
- Confirme dependências (componentes anteriores entregues e mergeados)
- Liste o que vai fazer em 3-5 bullets

### Durante a implementação

- Um componente por vez. Não pule.
- Commits pequenos e atômicos: 1 componente = 1 PR (ou commit isolado se trunk-based)
- Mensagem do commit: `feat(ds): Button` ou `feat(screen): Library`
- Sempre rode `pnpm typecheck`, `pnpm lint`, `pnpm test` **antes** de considerar a tarefa completa

### Quando ficar em dúvida

**Pare e pergunte.** Sempre prefira me consultar a inventar. Casos comuns que justificam pausar:

- Spec do `.md` parece ambígua ou contradiz o que está no codebase
- Componente equivalente antigo tem API muito diferente do novo — adapter não óbvio
- Dependência não esperada (Radix, biblioteca de form, etc.)
- Conflito de naming de token no Tailwind config
- Test bed não renderiza idêntico ao print do spec
- Spec menciona feature que ainda não existe no backend (ex.: SSO em Login)

### Quando NÃO perguntar

- Implementação trivial seguindo o `.md`
- Pequenos ajustes de path de import, ordem de imports, formatação
- Adicionar comentário em pt-BR pra clarificar
- Refatoração interna que não muda API pública do componente

---

## Anti-padrões que vão ser rejeitados em review

- Hex hardcoded em qualquer lugar (`#161616`, `#ddda2a`) — sempre via token
- Sombras genéricas (`shadow-md`, `shadow-lg` do Tailwind core) — usar `shadow-mr-elevated`/etc.
- `rounded-md`, `rounded-lg` do Tailwind core — usar `rounded-mr-md`, `rounded-mr-lg`
- `text-base`, `text-lg`, `text-xl` do Tailwind core — usar `text-mr-body`, `text-mr-h3`, etc.
- Emoji em qualquer arquivo do output
- Componente novo que duplica algo já no DS (ex.: criar `<TrendingMangaCard>` em vez de usar `<MangaCard tag={...} featured />`)
- Wrapper inútil sobre primitivo (`<MyButton>` que só faz `<Button>`) — usar `<Button>` direto
- Markup que ignora `letter-spacing` global — não desligar sem motivo
- Estados de loading/vazio/erro implementados como TODO ou texto solto — sempre usar `<Skeleton>` / `<EmptyState>` conforme spec
- `any` em TypeScript
- Texto hardcoded em vez de `t('chave')`
- Migração parcial: componente novo coexistindo com 10 call-sites do antigo sem motivo

---

## Resumo das ações esperadas no primeiro turno

Quando você receber este prompt:

1. Confirme que leu este documento e que entende o escopo
2. Liste os arquivos da pasta `migration/` que vai consultar
3. Faça o relatório de pré-Fase 0 do projeto (config, dependências, estrutura)
4. **Pare aqui** e me espere

Não comece a tocar em código antes da minha confirmação do relatório.

---

## Observação final

Este é um projeto de migração **gradual**. O app continua no ar durante todo o processo. Quebra de produção tem custo real — qualquer mudança que afete usuários (NavBar, Reader, Home) tem que passar por feature flag ou por QA visual meu antes do merge.

A velocidade aqui é menos importante que o cuidado. Se um componente leva 2 commits a mais pra ficar certo, prefira isso ao "rápido e quebrado".

Boa migração.
