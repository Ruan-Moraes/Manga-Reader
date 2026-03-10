# Manga Reader — Tarefas Pendentes

> Última atualização: 10 de março de 2026

---

## 1. Frontend — Tarefas Pendentes

### 1.1. Integração com API Real (Prioridade Crítica)

Conectar as 10 features restantes à API do backend, substituindo dados mock por chamadas reais:

| # | Feature | Endpoints Backend | Operações Pendentes | Complexidade |
|---|---------|-------------------|---------------------|-------------|
| 1 | **auth** | `/api/auth/*` | sign-in, sign-up, refresh, me, forgot/reset password | Alta |
| 2 | **library** | `/api/library` | GET, POST, PATCH, DELETE | Média |
| 3 | **rating** | `/api/ratings/*` | GET por título, GET average, POST, PUT, DELETE, GET user | Média |
| 4 | **comment** (CRUD) | `/api/comments/*` | POST, PUT, DELETE, POST react | Média |
| 5 | **forum** | `/api/forum/*` | GET, POST topic, POST reply, PUT, DELETE | Alta |
| 6 | **group** | `/api/groups/*` | GET, POST, PUT, join, leave, add/remove work | Alta |
| 7 | **news** | `/api/news/*` | GET, GET por categoria, search | Baixa |
| 8 | **event** | `/api/events/*` | GET, GET por status | Baixa |
| 9 | **store** | `/api/stores/*` | GET, GET por título | Baixa |
| 10 | **user** | `/api/users/*` | GET por id, GET me, PATCH me | Média |

### 1.2. Validação de Formulários (Prioridade Alta)

| Formulário | O que falta |
|-----------|------------|
| Login | Validação de email e senha, feedback de erros |
| Sign Up | Validação de todos os campos, confirmação de senha, force de senha |
| Forgot Password | Validação de email, feedback de envio |
| Reset Password | Validação de token e nova senha |
| Profile Edit | Validação de bio (limite de caracteres), email |
| Publish Work | Validação completa de todos os campos do formulário |
| Create Event | Validação de datas, campos obrigatórios |
| Forum Topic | Validação de título e conteúdo |

### 1.3. Melhorias de Performance (Prioridade Média)

- [ ] Implementar `React.lazy()` + `Suspense` para code splitting em todas as rotas
- [ ] Adicionar loading skeleton para páginas que buscam dados
- [ ] Otimizar imagens (lazy loading de imagens, fallback para placeholder)
- [ ] Configurar prefetch para rotas frequentes

### 1.4. Refatoração de Componentes (Prioridade Média)

Dividir page components grandes em subcomponentes:

- [ ] Forum.tsx → ForumFilters, ForumTopicList, ForumSidebar
- [ ] Groups.tsx → GroupFilters, GroupList
- [ ] News.tsx → NewsFilters, NewsList, NewsHero
- [ ] Events.tsx → EventFilters, EventList
- [ ] Library.tsx → LibraryTabs, LibraryList
- [ ] GroupProfile.tsx → GroupHeader, GroupMembers, GroupWorks
- [ ] SavedMangas.tsx → SavedMangaFilters, SavedMangaList
- [ ] Chapter.tsx → ChapterViewer (subcomponentes já existem parcialmente)

### 1.5. Acessibilidade (Prioridade Média)

- [ ] Adicionar `aria-label` em todos os botões e inputs
- [ ] Usar landmarks HTML (`<nav>`, `<main>`, `<aside>`, `<section>`)
- [ ] Implementar navegação por teclado (focus management)
- [ ] Garantir contraste adequado (WCAG AA)
- [ ] Testar com screen reader

### 1.6. Conteúdo (Prioridade Média)

- [ ] Redigir Termos de Uso reais (substituir placeholder)
- [ ] Redigir DMCA real (substituir placeholder)
- [ ] Revisar texto do About Us
- [ ] Substituir URLs de imagem stub no ChapterPages.tsx por URLs reais

### 1.7. Configuração (Prioridade Baixa)

- [ ] Parametrizar basename via `VITE_BASE_URL` (remover hardcode `/Manga-Reader`)
- [ ] Descomentar React Query DevTools no main.tsx
- [ ] Configurar `VITE_API_BASE_URL` no `.env.example`
- [ ] Adicionar variáveis de ambiente de produção

---

## 2. Backend — Tarefas Pendentes

### 2.1. Testes (Prioridade Crítica)

| Categoria | Escopo | Status | Detalhes |
|-----------|--------|--------|----------|
| **Testes unitários — Domain entities** | 11 entidades | ✅ **Concluído** | 13 arquivos, ~107 testes (UserTest, TitleTest, CommentTest, GroupTest, ForumTopicTest, ForumReplyTest, SavedMangaTest, EventTest, NewsItemTest, TagTest, MangaRatingTest, StoreTest, ChapterTest) |
| **Testes unitários — Use Cases** | 60 use cases | 🟡 **95% Concluído** | 57/60 arquivos, ~206 testes. **Faltam 3**: GetStoresUseCaseTest, GetStoresByTitleIdUseCaseTest, GetStoreByIdUseCaseTest |
| **Testes unitários — Controllers** | 13 controllers | 🟡 **69% Concluído** | 9/13 arquivos, ~84 testes. **Faltam 4**: NewsControllerTest, RatingControllerTest, StoreControllerTest, UserControllerTest |
| **Testes de integração** | Repositories | 🔲 Não iniciado | Testar queries PostgreSQL (H2) e MongoDB (TestContainers) |
| **Testes de segurança** | Auth + Protected endpoints | 🔲 Não iniciado | Testar JWT flow, refresh, 401/403 responses, acesso com/sem token |
| **Testes frontend** | Componentes + hooks + E2E | 🔲 Não iniciado | React Testing Library, testes de hooks, Cypress/Playwright |

**Resumo de testes**: 79 arquivos, 397 testes unitários, 0 erros de compilação. Faltam **7 arquivos** para cobertura unitária completa do backend.

### 2.2. Documentação (Prioridade Alta)

- [ ] Criar `.env.example` com todas as variáveis de ambiente necessárias
- [ ] Documentar seed data (quais dados são criados, como configurar)
- [ ] Documentar referências cross-database (PostgreSQL ↔ MongoDB)
- [ ] Adicionar Javadoc nos controllers e use cases públicos
- [ ] Documentar configuration properties customizadas (`app.*`)

### 2.3. Funcionalidades Pendentes (Prioridade Média)

- [ ] Upload de arquivos (capas de mangá, avatares, páginas de capítulos)
- [ ] Endpoint admin para gerenciamento de conteúdo (CRUD de títulos, capítulos)
- [ ] Paginação em endpoints que ainda não suportam (verificar consistência)
- [ ] Filtros avançados em endpoints de listagem
- [ ] Endpoint de busca global (cross-domain)

### 2.4. Infraestrutura (Prioridade Média)

- [ ] Configurar logback para produção (rotação, JSON format, níveis por pacote)
- [ ] Documentar limites de rate limiting por endpoint
- [ ] Configurar métricas Actuator para observabilidade (Prometheus/Grafana)
- [ ] Implementar job de limpeza para referências cross-database órfãs
- [ ] Configurar backup automatizado de PostgreSQL e MongoDB

### 2.5. Segurança (Prioridade Média)

- [ ] Implementar rotação de JWT secret
- [ ] Adicionar auditoria de ações sensíveis (login, mudanças de role)
- [ ] Revisar validação de input em todos os DTOs
- [ ] Configurar HTTPS redirect
- [ ] Implementar blacklist de tokens revogados (logout)

---

## 3. Integração Frontend ↔ Backend

### 3.1. Fluxos Críticos para Testar (Prioridade Crítica)

| # | Fluxo | Frontend | Backend | Status |
|---|-------|---------|---------|--------|
| 1 | **Sign Up** | Form → authService.signUp() | POST /api/auth/sign-up → UserJpa | 🔲 Não testado |
| 2 | **Login** | Form → authService.signIn() → localStorage | POST /api/auth/sign-in → JWT | 🔲 Não testado |
| 3 | **Token Refresh** | Interceptor → authService.refreshToken() | POST /api/auth/refresh → new JWT | 🔲 Não testado |
| 4 | **Protected Route** | AuthGuard → getStoredSession() | JwtFilter → validate claims | 🔲 Não testado |
| 5 | **Logout (401)** | Interceptor → clear localStorage → redirect | 401 response → client handles | 🔲 Não testado |
| 6 | **Reset Password** | Form → email → token → new password | Email adapter → token → BCrypt | 🔲 Não testado |

### 3.2. Alinhamento de Tipos (Prioridade Alta)

Verificar compatibilidade entre os tipos TypeScript do frontend e os DTOs Java do backend:

- [ ] `User` (frontend) ↔ `UserResponse` (backend)
- [ ] `Title` (frontend) ↔ `TitleResponse` (backend)
- [ ] `CommentData` (frontend) ↔ `CommentResponse` (backend)
- [ ] `MangaRating` (frontend) ↔ `RatingResponse` (backend)
- [ ] `ForumTopic` (frontend) ↔ `ForumTopicResponse` (backend)
- [ ] `Group` (frontend) ↔ `GroupResponse` (backend)
- [ ] `NewsItem` (frontend) ↔ `NewsResponse` (backend)
- [ ] `EventData` (frontend) ↔ `EventResponse` (backend)
- [ ] `Store` (frontend) ↔ `StoreResponse` (backend)
- [ ] `SavedMangaItem` (frontend) ↔ `LibraryItemResponse` (backend)
- [ ] `ApiResponse<T>` (frontend) ↔ `ApiResponse<T>` (backend)
- [ ] `PageResponse<T>` (frontend) ↔ `PageResponse<T>` (backend)

### 3.3. Paginação Consistente (Prioridade Média)

- [ ] Verificar se todos os endpoints paginados usam o mesmo formato (`page`, `size`, `sort`, `direction`)
- [ ] Alinhar `PageResponse` do frontend com response do backend
- [ ] Implementar infinite scroll ou paginação com botões onde necessário

### 3.4. Error Handling Alinhado (Prioridade Média)

- [ ] Mapear todos os error codes do backend para mensagens no frontend
- [ ] Testar tratamento de `ApiErrorResponse` e `ValidationErrorResponse`
- [ ] Garantir que field-level errors aparecem nos formulários corretos
- [ ] Testar handling de timeout (30s configurado no Axios)

---

## 4. Preparação para Produção

### 4.1. Infraestrutura (Prioridade Alta)

- [ ] Provisionar PostgreSQL 17, MongoDB 8, Redis 7, RabbitMQ 4 em cloud (AWS/GCP/DigitalOcean)
- [ ] Configurar DNS e domínio
- [ ] Configurar SSL/TLS (HTTPS) — certificado Let's Encrypt ou cloud provider
- [ ] Configurar reverse proxy (Nginx) para frontend estático + backend API
- [ ] Definir estratégia de backup (PostgreSQL pg_dump + mongodump, periodicidade)

### 4.2. CI/CD Pipeline (Prioridade Alta)

- [ ] Configurar GitHub Actions (ou GitLab CI) com workflow:
  - **Stage 1**: Lint (ESLint + Prettier) + TypeScript check
  - **Stage 2**: Testes backend (Maven test) + Testes frontend
  - **Stage 3**: Build frontend (Vite) + Build backend (Maven + Docker)
  - **Stage 4**: Push Docker image para registry
  - **Stage 5**: Deploy para ambiente de staging/produção
- [ ] Configurar secrets no CI (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Implementar deploy com rollback automático

### 4.3. Monitoramento (Prioridade Média)

- [ ] Configurar health checks (backend: `/actuator/health`, frontend: Nginx health)
- [ ] Integrar métricas (Prometheus + Grafana ou equivalente cloud)
- [ ] Configurar alertas (email/Slack) para erros 5xx, latência alta, disco cheio
- [ ] Implementar logging centralizado (ELK, Grafana Loki ou equivalente)

### 4.4. Segurança de Produção (Prioridade Alta)

- [ ] Gerar JWT secret com mínimo 256 bits (rotação periódica)
- [ ] Restringir CORS_ALLOWED_ORIGINS ao domínio de produção
- [ ] Configurar rate limiting para endpoints públicos
- [ ] Desabilitar Swagger em produção ou proteger com autenticação
- [ ] Configurar headers de segurança (HSTS, X-Content-Type-Options, etc.)
- [ ] Revisar open-in-view: false (já configurado)

---

## 5. Roadmap Resumido

### Fase 1: Integração Core (Estimativa: Semanas 1-3)
1. Testar e validar fluxo de auth completo (E2E)
2. Conectar library, rating, comment CRUD à API
3. Conectar user profile à API
4. Implementar validação em forms de auth

### Fase 2: Integração Completa (Estimativa: Semanas 4-6)
5. Conectar forum, group à API
6. Conectar news, event, store à API
7. Alinhar tipos e paginação
8. Implementar validação nos formulários restantes

### Fase 3: Qualidade (Estimativa: Semanas 7-9)
9. Escrever testes unitários para use cases do backend
10. Escrever testes de integração para controllers
11. Escrever testes de componentes no frontend
12. Implementar lazy loading e code splitting

### Fase 4: Produção (Estimativa: Semanas 10-12)
13. Configurar CI/CD pipeline
14. Provisionar infraestrutura cloud
15. Deploy em staging + testes de carga
16. Conteúdo legal (Termos, DMCA)
17. Deploy em produção + monitoramento
