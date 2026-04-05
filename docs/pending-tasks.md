# Manga Reader — Tarefas Pendentes

> Última atualização: 26 de março de 2026

---

## 1. Frontend — Tarefas Pendentes

### 1.1. Code Splitting e Performance (Prioridade Alta)

- [ ] Implementar `React.lazy()` + `Suspense` para code splitting em todas as rotas
- [ ] Adicionar `ErrorBoundary` genérico com fallback UI nas rotas principais
- [ ] Adicionar `loading="lazy"` em tags `<img>` para lazy loading de imagens
- [ ] Otimizar `useBookmark` — evitar carregar biblioteca inteira (`getUserLibrary(0, 1000)`) no mount
- [ ] Adicionar `useMemo`/`React.memo` em componentes com re-renders frequentes
- [ ] Configurar prefetch para rotas frequentes

### 1.2. Validação de Formulários (Prioridade Alta)

| Formulário | O que falta |
|-----------|------------|
| Login | Validação de email e senha, feedback de erros |
| Sign Up | Validação de todos os campos, confirmação de senha, força de senha |
| Forgot Password | Validação de email, feedback de envio |
| Reset Password | Validação de token e nova senha |
| Profile Edit | Validação de bio (limite de caracteres), email |
| Publish Work | Validação completa de todos os campos do formulário |
| Create Event | Validação de datas, campos obrigatórios |
| Forum Topic | Validação de título e conteúdo |

### 1.3. Correções Pendentes (Prioridade Média)

- [ ] Corrigir `localhost:5000` hardcoded em `useCategoryFilters.tsx` (linha 34) — migrar para API principal
- [ ] Completar QUERY_KEYS com chaves faltantes (USER_ENRICHED_PROFILE, RECOMMENDATIONS, etc.)
- [ ] Adicionar `aria-label` em todos os botões icon-only
- [ ] Implementar scroll position restoration entre navegações

### 1.4. Refatoração de Componentes (Prioridade Média)

Dividir page components grandes em subcomponentes:

- [ ] Forum.tsx → ForumFilters, ForumTopicList, ForumSidebar
- [ ] Groups.tsx → GroupFilters, GroupList
- [ ] News.tsx → NewsFilters, NewsList, NewsHero
- [ ] Events.tsx → EventFilters, EventList
- [ ] GroupProfile.tsx → GroupHeader, GroupMembers, GroupWorks
- [ ] Chapter.tsx → ChapterViewer (subcomponentes já existem parcialmente)

> **Nota**: Library.tsx e Profile.tsx já foram refatorados na Fase 9a/9b.

### 1.5. Acessibilidade (Prioridade Média)

- [ ] Adicionar `aria-label` em todos os botões e inputs icon-only
- [ ] Usar landmarks HTML (`<nav>`, `<main>`, `<aside>`, `<section>`) de forma consistente
- [ ] Implementar navegação por teclado (focus management)
- [ ] Garantir contraste adequado (WCAG AA)
- [ ] Testar com screen reader

### 1.6. Conteúdo (Prioridade Média)

- [ ] Redigir Termos de Uso reais (substituir placeholder "XX de XXXXXXXX de XXXX")
- [ ] Redigir DMCA real (substituir placeholder)
- [ ] Revisar texto do About Us
- [ ] Substituir URLs de imagem stub no ChapterPages.tsx por URLs reais

### 1.7. Testes Frontend (Prioridade Alta)

- [x] Configurar Vitest + React Testing Library + MSW no projeto
- [x] Testes de hooks customizados (17 arquivos, ~83 testes — auth, category, chapter, comment, library, manga, rating)
- [x] Testes de services (13 arquivos, ~191 testes — todos os 13 domínios)
- [x] Testes de utilities (6 arquivos, ~60 testes — apiErrorMessages, checkValidId, formatDate, formatRelativeDate, validateId, validateResponse)
- [ ] Corrigir 1 teste falhando (session guard em useBookmark)
- [ ] Testes de componentes (CommentsSection, Library, UserProfile, SearchResults)
- [ ] Considerar Playwright para testes E2E (fluxo auth, navegação)

**Estado atual**: 37 arquivos, 317 testes (316 passando, 1 falhando)

### 1.8. Configuração (Prioridade Baixa)

- [ ] Parametrizar basename via `VITE_BASE_URL` (remover hardcode `/Manga-Reader`)
- [ ] Descomentar React Query DevTools no main.tsx
- [ ] Configurar `VITE_API_BASE_URL` no `.env.example`
- [ ] Adicionar variáveis de ambiente de produção

---

## 2. Backend — Tarefas Pendentes

### 2.1. Correções Críticas (Prioridade Crítica)

- [ ] Adicionar `@Transactional` a ~23 use cases data-modifying (ver DT-01 em tech-debt.md)
- [ ] Remover injeção de repository ports do UserController — criar use cases dedicados (ver DT-04 em tech-debt.md)

### 2.2. Testes (Status Atual)

| Categoria | Escopo | Status | Detalhes |
|-----------|--------|--------|----------|
| **Domain** | 31 entidades/VOs/enums | ✅ **Concluído** | 31 arquivos, 197 testes |
| **Application** | 72 use cases | ✅ **Concluído** | 72 arquivos, 277 testes |
| **Presentation** | 13 controllers | ✅ **Concluído** | 13 arquivos, 155 testes |
| **Infrastructure JPA** | 7 adapters PostgreSQL | ✅ **Concluído** | 7 arquivos, 72 testes (H2 in-memory) |
| **Infrastructure MongoDB** | 4 adapters MongoDB | ✅ **Concluído** | 4 arquivos, 51 testes (TestContainers mongo:8.0) |
| **Infrastructure Security** | JwtTokenProvider | ✅ **Concluído** | 1 arquivo, 17 testes (unitário) |
| **Security E2E** | Auth flow completo | ✅ **Concluído** | 1 arquivo, 16 testes (@SpringBootTest) |
| **Root** | Smoke test | ✅ **Concluído** | 1 arquivo, 1 teste (context loads) |
| **Testes frontend — Services** | 13 domínios | ✅ **Concluído** | 13 arquivos, ~191 testes (Vitest + MSW) |
| **Testes frontend — Hooks** | 7 domínios | ✅ **Concluído** | 17 arquivos, ~83 testes (RTL + MSW) |
| **Testes frontend — Utils** | 6 utilities | ✅ **Concluído** | 6 arquivos, ~60 testes (Vitest puro) |
| **Testes frontend — Smoke** | Setup verification | ✅ **Concluído** | 1 arquivo, 3 testes |
| **Testes frontend — Fixes** | 1 teste falhando | 🔲 Não iniciado | session guard em useBookmark |
| **Testes frontend — Componentes** | Componentes + E2E | 🔲 Não iniciado | Vitest + React Testing Library |

**Total backend**: 129 arquivos, **817 testes passando**, 2 failures (AuthSecurityIntegrationTest), 0 errors.
**Total frontend**: 37 arquivos, **317 testes** (316 passando, 1 falhando).

### 2.3. Documentação (Prioridade Alta)

- [ ] Criar `.env.example` com todas as variáveis de ambiente necessárias
- [ ] Documentar seed data (quais dados são criados, como configurar)
- [ ] Documentar referências cross-database (PostgreSQL ↔ MongoDB)
- [ ] Documentar configuration properties customizadas (`app.*`)

### 2.4. Funcionalidades Pendentes (Prioridade Média)

- [ ] Upload de arquivos (capas de mangá, avatares, páginas de capítulos)
- [ ] Endpoint admin para gerenciamento de conteúdo (CRUD de títulos, capítulos)
- [ ] Endpoints faltantes: news/event `/related`, group `/members/{id}`
- [ ] Filtros avançados em endpoints de listagem
- [ ] Endpoint de busca global (cross-domain)

### 2.5. Infraestrutura (Prioridade Média)

- [ ] Configurar logback para produção (rotação, JSON format, níveis por pacote)
- [ ] Documentar limites de rate limiting por endpoint
- [ ] Configurar métricas Actuator para observabilidade (Prometheus/Grafana)
- [ ] Implementar job de limpeza para referências cross-database órfãs
- [ ] Configurar backup automatizado de PostgreSQL e MongoDB

### 2.6. Segurança (Prioridade Média)

- [ ] Implementar rotação de JWT secret
- [ ] Adicionar auditoria de ações sensíveis (login, mudanças de role)
- [ ] Revisar validação de input em todos os DTOs
- [ ] Configurar HTTPS redirect
- [ ] Implementar blacklist de tokens revogados (logout)

---

## 3. Integração Frontend ↔ Backend

### 3.1. Fluxos Auth (✅ Testados via Security E2E)

| # | Fluxo | Status |
|---|-------|--------|
| 1 | **Sign Up** → persistência → sign-in | ✅ Testado |
| 2 | **Login** → JWT access + refresh tokens | ✅ Testado |
| 3 | **Token Refresh** → novo access token | ✅ Testado |
| 4 | **Protected Route** → JWT validation | ✅ Testado |
| 5 | **Erro auth** → email duplicado (409), senha errada (401) | ✅ Testado |
| 6 | **Endpoints** → público (200) vs protegido (401) | ✅ Testado |

### 3.2. Lacunas Remanescentes

| Feature | Lacuna | Impacto |
|---------|--------|---------|
| **news** | Endpoint `/related` não implementado | Seção "notícias relacionadas" sem dados |
| **event** | Endpoint `/related` não implementado | Seção "eventos relacionados" sem dados |
| **group** | Endpoint `/members/{id}` não implementado | Detalhe de membro indisponível |
| **category** | `useCategoryFilters` com `localhost:5000` hardcoded | Filtro de categorias quebrado |

---

## 4. Preparação para Produção

### 4.1. Infraestrutura (Prioridade Alta)

- [ ] Provisionar PostgreSQL 17, MongoDB 8, Redis 7, RabbitMQ 4 em cloud
- [ ] Configurar DNS e domínio
- [ ] Configurar SSL/TLS (HTTPS) — certificado Let's Encrypt
- [ ] Configurar reverse proxy (Nginx)
- [ ] Definir estratégia de backup

### 4.2. CI/CD Pipeline (Prioridade Alta)

- [ ] Configurar GitHub Actions com workflow (ver template em `deployment-plan.md`):
  - **Stage 1**: Lint (ESLint + Prettier) + TypeScript check
  - **Stage 2**: Testes backend (Maven test) + Testes frontend
  - **Stage 3**: Build frontend (Vite) + Build backend (Maven + Docker)
  - **Stage 4**: Push Docker image para registry
  - **Stage 5**: Deploy para ambiente de staging/produção
- [ ] Configurar secrets no CI
- [ ] Implementar deploy com rollback automático

### 4.3. Monitoramento (Prioridade Média)

- [ ] Configurar health checks
- [ ] Integrar métricas (Prometheus + Grafana)
- [ ] Configurar alertas (email/Slack)
- [ ] Implementar logging centralizado

### 4.4. Segurança de Produção (Prioridade Alta)

- [ ] Gerar JWT secret com mínimo 256 bits (rotação periódica)
- [ ] Restringir CORS_ALLOWED_ORIGINS ao domínio de produção
- [ ] Configurar rate limiting para endpoints públicos
- [ ] Desabilitar Swagger em produção ou proteger com autenticação
- [ ] Configurar headers de segurança (HSTS, X-Content-Type-Options, etc.)
