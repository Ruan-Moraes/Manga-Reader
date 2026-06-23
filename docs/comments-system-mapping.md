# Mapeamento do Sistema de Comentários — Frontend

> Gerado em: 2026-06-20  
> Escopo: `web/manga-reader/src`

---

## 1. Visão Geral: Existem 4 Implementações Paralelas

O projeto possui **4 sistemas de comentários distintos e desconectados** entre si:

| # | Nome | Localização | Status |
|---|------|------------|--------|
| A | **Sistema Padrão** (título) | `entities/comment` + `features/comment` | ✅ Produção — React Query, CRUD completo, árvore recursiva |
| B | **Leitor de Capítulo** | `pages/chapter/ui/parts/ReaderCommentsPanel` | ❌ Mock local — sem API, sem React Query, tipo próprio |
| C | **Notícias** | `pages/news/ui/parts/NewsCommentsSection` | ⚠️ Dados mock — UI inline própria, sem CRUD |
| D | **Fórum** | `pages/forum/ui/parts/ForumComment` | ⚠️ Dados mock — UI própria com CSS de fórum |

O **Sistema A** é a implementação madura que deve ser o padrão. Os sistemas B, C e D são implementações independentes que variam de protótipos a UIs em produção com dados mockados.

---

## 2. Mapa Completo de Arquivos

### 2.1 Sistema A — Padrão (entities/comment + features/comment)

#### Entity Layer — modelo, tipos e API
```
entities/comment/
├── index.ts                              — barrel público da entity
├── api/
│   └── commentService.ts                 — chamadas HTTP (get/create/update/delete/vote/reactions)
│   └── __tests__/commentService.test.ts
├── model/
│   ├── comment.types.ts                  — CommentData, CommentWithChildren, CommentCallbacks, CommentProps, CommentReactions
│   ├── useComments.tsx                   — hook público (wraps useCommentsFetch)
│   ├── useCommentPagination.tsx          — paginação client-side por "load more"
│   ├── CommentSortContext.tsx            — React Context p/ tipo de ordenação (likes/dislikes/newest/oldest)
│   ├── data/
│   │   └── useCommentsFetch.tsx          — React Query fetch por titleId + page + crossLanguage
│   │   └── __tests__/useCommentsFetch.test.tsx
│   └── internal/
│       └── useCommentTree.tsx            — monta árvore de CommentWithChildren + ordena recursivamente
│       └── __tests__/useComments.test.tsx
└── ui/
    ├── body/CommentContent.tsx           — exibe textContent (Markdown) + imageContent
    └── footer/CommentActions.tsx         — botões like/dislike/reply/edit/delete (DUMB, sem estado)
```

#### Feature Layer — interações e composição
```
features/comment/
├── index.ts                              — barrel público da feature
├── model/internal/
│   ├── useCommentCRUD.tsx                — useMutation p/ delete/edit/reply (invalida QUERY_KEYS.COMMENTS)
│   ├── useCommentReactions.tsx           — like/dislike com atualização otimista
│   ├── useCommentModals.tsx              — estado dos modais de delete/edit
│   ├── useCommentScrollToParent.ts       — scroll + ring animado ao clicar em "respondendo a"
│   ├── useCommentImageUpload.tsx         — file picker → base64, limite 3 imagens / 2MB cada
│   ├── useCommentRichEditor.tsx          — integração com editor Markdown
│   ├── useCommentEditorImages.tsx        — gerenciamento de imagens no editor
│   ├── useEasyMDE.tsx                    — wrapper do EasyMDE
│   ├── useEditorPlaceholder.tsx
│   └── __tests__/useCommentCRUD.test.tsx
└── ui/
    ├── CommentsSection.tsx               — ENTRY POINT: header + CommentInput + SortComments + CommentsList
    ├── CommentsList.tsx                  — monta árvore + paginação + passa callbacks para Comment
    ├── Comment.tsx                       — card recursivo (ThreadPost + CommentContent + CommentReplies + modais)
    ├── CommentInput.tsx                  — Composer para novo comentário (nível raiz)
    ├── SortComments.tsx                  — toolbar de ordenação (lê CommentSortContext)
    ├── InlineReplyInput.tsx              — Composer inline de resposta (desktop)
    ├── parts/
    │   ├── CommentReplies.tsx            — collapse/expand + "continuar conversa" no limite de profundidade
    │   └── CommentBadges.tsx             — chips membro/moderador
    ├── modal/
    │   ├── delete-comment/DeleteModal.tsx
    │   ├── delete-comment/header/DeleteModalHeader.tsx
    │   ├── delete-comment/body/DeleteModalBody.tsx
    │   ├── delete-comment/footer/DeleteModalFooter.tsx
    │   ├── edit-comment/EditModal.tsx
    │   ├── edit-comment/header/EditModalHeader.tsx
    │   ├── edit-comment/body/EditModalBody.tsx
    │   └── reply-comment/ReplyModal.tsx  — Composer em Modal (mobile)
    └── __tests__/SortComments.test.tsx
```

#### Shared UI usada pelo Sistema A
```
shared/ui/
└── ThreadPost.tsx                        — layout canônico: PostShell + PostHeader + ActionBar + slots
```

#### Páginas que usam o Sistema A
```
pages/title/ui/parts/CommentsTab.tsx      — useComments(titleId) → CommentsSection (integração COMPLETA)
```

#### Entidade de usuário (cross-import)
```
entities/user/@x/comment.ts              — re-exporta entities/user para uso pelo comment entity (FSD @x)
```

---

### 2.2 Sistema B — Leitor de Capítulo (MOCK)

```
pages/chapter/
├── model/
│   ├── readerData.ts                     — ChapterComment[], InlineMarker[] — DADOS HARDCODED
│   └── useChapterReader.ts               — estado do reader: commentsOpen, comment, posted (tudo local)
└── ui/parts/
    ├── ReaderCommentsPanel.tsx            — aside CSS custom, lista ChapterComment, textarea, botão publish
    └── InlineCommentMarker.tsx            — marcador por página no modo vertical, abre mini-thread
```

**Tipo próprio** (`readerData.ts`):
```typescript
interface ChapterComment {
  id: string; user: string; initials: string; color: string;
  when: string; text: string; up: number; op?: boolean;
}
interface InlineMarker { count: number; top: InlineMarkerComment; }
```

---

### 2.3 Sistema C — Notícias

```
pages/news/ui/parts/NewsCommentsSection.tsx  — seção completa inline (sort + spoiler + lista)
entities/news/model/news.types.ts            — NewsComment type
entities/news/model/useNewsDetails.tsx       — sort client-side, dados vindos do newsService
```

**Tipo próprio** (`news.types.ts`):
```typescript
type NewsComment = {
  id: string; user: string; avatar: string; content: string;
  createdAt: string; likes: number; spoiler?: boolean;
  replies?: Array<{ id: string; user: string; content: string; createdAt: string; }>;
};
```

---

### 2.4 Sistema D — Fórum

```
pages/forum/ui/parts/ForumComment.tsx       — componente recursivo, usa CSS de fórum
pages/forum/ui/forumData.ts                 — ForumCommentData[], FORUM_COMMENTS — DADOS HARDCODED
pages/forum/ui/ForumTopic.tsx               — monta lista de ForumComment + sort nativo <select>
```

---

### 2.5 Itens Auxiliares

```
entities/user/ui/profile/ProfileCommentsSection.tsx  — lista resumida de comentários do usuário no perfil
                                                       (CommentSummary — não usa CommentsSection, OK)
pages/review/ui/MyReviews.tsx                        — ReviewCard LOCAL inline (duplicata simplificada)
entities/review/ui/ReviewCard.tsx                    — ReviewCard REAL (PostShell + VotePill + breakdown)
```

---

## 3. Diagrama Textual de Dependências

```
pages/title/ui/parts/CommentsTab.tsx
  └── @entities/comment :: useComments          (fetch React Query)
  └── @features/comment :: CommentsSection
        ├── CommentInput
        │     └── @entities/comment :: createComment
        │     └── internal/useCommentImageUpload
        ├── SortComments
        │     └── @entities/comment :: CommentSortContext
        └── CommentsList
              ├── @entities/comment :: useCommentTree (monta árvore + ordena)
              ├── @entities/comment :: useCommentPagination (load-more client-side)
              ├── internal/useCommentCRUD (delete/edit/reply — React Query mutations)
              ├── internal/useCommentReactions (like/dislike otimista)
              └── Comment (recursivo)
                    ├── shared/ui/ThreadPost (PostShell + PostHeader + ActionBar)
                    ├── @entities/comment :: CommentContent (Markdown + imagem)
                    ├── parts/CommentBadges
                    ├── parts/CommentReplies
                    │     └── Comment (recursivo — renderReply/renderLeaf callbacks)
                    ├── InlineReplyInput (desktop)  → Composer
                    ├── modal/ReplyModal (mobile)   → Composer
                    ├── modal/DeleteModal
                    └── modal/EditModal

pages/chapter/ui/Chapter.tsx
  └── useChapterReader (estado local puro)
  └── ReaderCommentsPanel (ISOLADO — dados MOCK de readerData.ts, sem @entities/comment)
  └── InlineCommentMarker (ISOLADO — dados MOCK de readerData.ts)

pages/news/ui/NewsDetails.tsx
  └── @entities/news :: useNewsDetails (sort + dados de newsService)
  └── NewsCommentsSection (ISOLADO — tipo NewsComment, sem @entities/comment)

pages/forum/ui/ForumTopic.tsx
  └── forumData.ts (MOCK)
  └── ForumComment (ISOLADO — tipo ForumCommentData, sem @entities/comment)

entities/user/ui/profile/ProfileCommentsSection.tsx
  └── userService :: getUserComments (API própria)
  (exibe CommentSummary — não usa CommentsSection, OK para contexto de perfil)
```

---

## 4. Análise das Diferenças: Sistema A vs Sistema B (capítulo)

| Aspecto | Sistema A (padrão) | Sistema B (capítulo) |
|---------|-------------------|---------------------|
| **Dados** | API backend via React Query | Array hardcoded em `readerData.ts` |
| **Tipo** | `CommentData` (unificado) | `ChapterComment` (local, campos: initials, color) |
| **Create** | `createComment()` → POST `/api/comments` | `setPosted(true)` — apenas muda estado local |
| **Edit/Delete** | `useMutation` + invalida cache | Não implementado |
| **Votos** | `VotePill` + `likeComment`/`dislikeComment` | `<Heart size={13}> {c.up}` estático |
| **Replies** | Árvore recursiva com `CommentReplies` | Plano, sem suporte a replies |
| **Sort** | `CommentSortContext` (likes/dislikes/newest/oldest) | Não existe |
| **Moderação** | `isHighlighted`, badges membro/mod | `op` boolean simples |
| **Layout UI** | `ThreadPost` → `PostShell` → `PostHeader` + `ActionBar` | aside customizado com classes `reader-comments` |
| **CSS** | Tailwind + tokens `mr-*` | `reader.css` classes customizadas |
| **i18n** | namespace `comment` | namespace `manga` |
| **Auth guard** | `requireAuth()` | Não verificado |
| **Inline markers** | Não implementado (existe no sistema B como mock) | `InlineCommentMarker` com dados MOCK |

---

## 5. Análise das Diferenças: Sistema A vs Sistema C (notícias)

| Aspecto | Sistema A | Sistema C (notícias) |
|---------|-----------|---------------------|
| **Tipo** | `CommentData` com `User` object | `NewsComment` com `user: string` (só nome) |
| **Fetch** | React Query com `useCommentsFetch` | `useEffect + useState` em `useNewsDetails` |
| **Sort** | Context global + `useCommentTree` | `.sort()` inline em `useMemo` |
| **CRUD** | CRUD completo | Apenas exibição (sem create/edit/delete) |
| **Replies** | `CommentReplies` com colapso/profundidade | `comment.replies?.map()` inline sem componente |
| **Spoilers** | Não implementado | `blur-sm select-none` no conteúdo |
| **Input** | `Composer` com Markdown e imagens | Não existe |
| **Paginação** | Load-more via `useCommentPagination` | Sem paginação |
| **Layout** | `ThreadPost`/`PostShell` | `div.p-3 rounded-lg bg-primary` inline |

---

## 6. Análise das Diferenças: Sistema A vs Sistema D (fórum)

| Aspecto | Sistema A | Sistema D (fórum) |
|---------|-----------|------------------|
| **Dados** | API real | `FORUM_COMMENTS[]` hardcoded |
| **Votos** | `VotePill` (up/down unificado) | `<ChevronUp>/<ChevronDown>` separados |
| **Ações** | reply, like, dislike, edit, delete | reply, like, quote, report |
| **Sort** | `CommentSortContext` | `<select>` nativo |
| **Layout** | `ThreadPost`/`PostShell` | `article.forum-comment` + `forum.css` |
| **Roles** | chips membro/mod via `CommentBadges` | badges admin/mod inline na UI |

---

## 7. Candidatos ao Componente Padrão

### Deve ser o padrão: `features/comment/ui/CommentsSection`

```typescript
<CommentsSection
  titleId={titleId}
  comments={comments}       // CommentData[]
  isLoading={isLoading}
  isError={isError}
  error={error}
  onCommentCreated={refetch}
  crossLanguage={crossLanguage}           // opcional (admin)
  onToggleCrossLanguage={toggle}          // opcional (admin)
/>
```

**Por quê**: Já integra tudo — input, sort, lista, árvore, modais, reações, CRUD. É o único sistema com cobertura de testes e integração real com backend.

### Deve ser o padrão para layout visual: `shared/ui/ThreadPost`

Já é o primitivo correto: abstrai `PostShell + PostHeader + ActionBar` com slots. `ReviewCard` até usa `PostShell`/`PostHeader` diretamente — poderia migrar para `ThreadPost` sem perda.

---

## 8. Problemas de Duplicação de Lógica

### P1. Quatro tipos para "comentário" (CRÍTICO)
- `CommentData` — padrão
- `ChapterComment` — capítulo (mock)
- `NewsComment` — notícias
- `ForumCommentData` — fórum

**Impacto**: impossibilita reutilização de componentes entre contextos. Cada tipo tem campos nomeados diferente para a mesma informação (`textContent` vs `content`, `user: User` vs `user: string`, `up` vs `likeCount`).

### P2. Sort implementado três vezes
- `useCommentTree.tsx` + `CommentSortContext` — padrão
- `useNewsDetails.tsx` (`.sort()` inline em `useMemo`) — notícias
- `<select>` nativo em `ForumTopic` — fórum

### P3. Render de replies duplicado
- `CommentReplies.tsx` — collapse, "continuar conversa", profundidade máxima, flatten
- `NewsCommentsSection.tsx` — `{comment.replies?.map(reply => <div...>)}` inline sem estado/collapse

### P4. Sistema de votos em três formatos
- `VotePill` + `likeComment()`/`dislikeComment()` — padrão
- `<Heart size={13}> {c.up}` estático — capítulo
- `<ChevronUp>/<ChevronDown>` com `.reactions.up/.down` — fórum

### P5. ReviewCard duplicado
- `entities/review/ui/ReviewCard.tsx` — componente canônico, rico (rating, breakdown, spoiler veil, VotePill, badges)
- `pages/review/ui/MyReviews.tsx` — `ReviewCard` LOCAL redefinido inline na página, com UI completamente diferente (Card + Textarea + Stars), sem VotePill, sem breakdown

### P6. Fetch de comentários em dois padrões
- `useCommentsFetch` (React Query, cache, staleTime) — padrão
- `useEffect + useState + try/catch` — news e profile comments

### P7. Messages de toast hardcoded em PT-BR
Em `useCommentCRUD.tsx`:
```typescript
showSuccessToast(`Comentário deletado com sucesso.`, ...)
showErrorToast('Erro ao deletar comentário.', ...)
```
Não usa `i18n.t()` — violação da política de i18n do projeto.

### P8. Página de capítulo sem integração com API (CRÍTICO)
O comentário do leitor (`ReaderCommentsPanel`) é completamente desconectado do backend. O `readerData.ts` documenta isso explicitamente ("espelham o protótipo"), mas não existe nenhuma migração planejada para a API real.

---

## 9. Proposta de Padronização

### Fase 1 — Migrar NewsCommentsSection → CommentsSection

**O que fazer**:
1. Adicionar `targetType: 'NEWS'` no backend e no `createComment` (ou criar endpoint separado)
2. Substituir `NewsComment[]` por `CommentData[]` — adaptar o `newsService` para retornar o formato padrão
3. Remover `NewsCommentsSection.tsx` inteiramente
4. Em `NewsDetails.tsx`: chamar `useComments(newsId)` e renderizar `<CommentsSection titleId={newsId} .../>`

**Funcionalidade spoiler**: extrair como prop ou slot em `CommentsSection` se necessário.

### Fase 2 — Integrar capítulo com a API

**O que fazer**:
1. Adicionar `targetType: 'CHAPTER'` no backend
2. Criar `useChapterComments(chapterId)` baseado em `useCommentsFetch`
3. Refatorar `ReaderCommentsPanel` para usar `CommentsSection` ou criar variante `ChapterCommentsPanel` que aceite a mesma `CommentsSection` mas num `aside` com CSS do reader
4. Remover `ChapterComment` e `CHAPTER_COMMENTS` de `readerData.ts`
5. Decidir sobre inline markers: se mantidos, criar fetch de highlights por página

### Fase 3 — Corrigir duplicações menores

1. **ReviewCard**: apagar o componente local de `MyReviews.tsx` e importar `ReviewCard` de `entities/review`
2. **Toasts de CRUD**: substituir strings literais por `t('comment:toast.deleted')` etc.
3. **ForumComment**: quando o fórum integrar com backend, avaliar se `ThreadPost` pode ser base

### O que NÃO unificar

- `ProfileCommentsSection` — é uma lista de resumo (link → título + texto truncado), não uma seção interativa. Faz sentido ser separada.
- `ReviewCard` — resenhas têm layout próprio (rating central, breakdown por critério, spoiler veil) que não encaixa em `ThreadPost`. Usar `PostShell`/`PostHeader` diretamente é correto.
- `ForumComment` — o fórum tem contexto próprio (quote, report, roles) e enquanto for protótipo/mock, a prioridade é baixa.

---

## 10. Resumo Executivo

| Situação | Detalhe |
|----------|---------|
| **Sistema maduro** | `entities/comment` + `features/comment` — use como base para tudo |
| **Entry point** | `CommentsSection` (título) — já funciona, já tem testes |
| **Maior dívida técnica** | `ReaderCommentsPanel` — UI sem API real, tipo desconectado |
| **Segunda dívida** | `NewsCommentsSection` — UI paralela sem CRUD |
| **Duplicata crítica** | `ReviewCard` redefinido localmente em `MyReviews.tsx` |
| **Violação de i18n** | Toasts em português hardcoded em `useCommentCRUD.tsx` |
| **Primitivo correto** | `ThreadPost` = layout canônico de post (comment + forum topic) |
