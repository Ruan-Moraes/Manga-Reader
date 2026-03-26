# Manga Reader — Visão Geral do Projeto

> Última atualização: 25 de março de 2026

---

## 1. Descrição do Projeto

O **Manga Reader** é uma plataforma web completa para leitura, catalogação e comunidade de mangás, manhwas e manhuas. O sistema oferece funcionalidades como:

- Catálogo de títulos com busca, filtros por gênero e ordenação
- Leitor de capítulos com navegação entre páginas
- Sistema de avaliações e reviews por usuários
- Fóruns de discussão com categorias e respostas
- Grupos de tradução com membros e obras
- Biblioteca pessoal com listas de leitura
- Perfil enriquecido com recomendações, histórico e configurações de privacidade
- Sistema de notícias e eventos da comunidade
- Lojas parceiras com links para compra
- Autenticação completa com JWT (login, cadastro, recuperação de senha)
- Painel administrativo para publicação de obras

---

## 2. Stack Tecnológica

### Frontend

| Tecnologia | Versão | Função |
|-----------|--------|--------|
| React | 19.1.0 | Biblioteca de UI |
| TypeScript | 5.8.3 | Tipagem estática |
| Vite | 6.2.6 | Build tool + dev server (SWC) |
| TailwindCSS | 4.1.3 | Framework CSS utilitário |
| React Router | 6.24.0 | Roteamento client-side |
| TanStack React Query | 5.73.3 | Gerenciamento de estado do servidor |
| Axios | 1.13.5 | Cliente HTTP com interceptores |
| React Toastify | 11.0.5 | Notificações toast |
| React Icons | 5.5.0 | Biblioteca de ícones |
| Splide | 4.1.4 | Componente de carrossel |
| React Select | 5.10.1 | Select avançado |
| React Modal | 3.16.3 | Modais |

### Backend

| Tecnologia | Versão | Função |
|-----------|--------|--------|
| Spring Boot | 3.4.3 | Framework principal |
| Java | 23 | Linguagem |
| PostgreSQL | 17 | Banco relacional (users, groups, events, forum, library, stores, tags) |
| MongoDB | 8.0 | Banco documental (titles, comments, ratings, news, view_history) |
| Redis | 7 | Cache (TTL 5 min) |
| RabbitMQ | 4 | Mensageria assíncrona |
| Flyway | — | Migrações PostgreSQL |
| Mongock | 5.5.0 | Migrações MongoDB |
| jjwt | 0.12.6 | Tokens JWT (HS256) |
| MapStruct | 1.6.3 | Mapeamento entity-DTO |
| Bucket4j | 8.10.1 | Rate limiting |
| Springdoc OpenAPI | 2.8.4 | Documentação Swagger |
| JaCoCo | 0.8.12 | Cobertura de código |
| TestContainers | 1.20.5 | Testes de integração MongoDB |
| BCrypt | — | Hash de senhas |

### Infraestrutura

| Ferramenta | Função |
|-----------|--------|
| Docker Compose | Orquestração de serviços (dev e prod) |
| Docker (multi-stage) | Build otimizado do backend |
| Spring Actuator | Health checks e métricas |
| ESLint + Prettier | Qualidade de código (frontend) |

---

## 3. Arquitetura

### Frontend — Arquitetura Modular por Feature

```
src/
├── app/              → Camada de aplicação (layouts, 29 páginas, router)
├── feature/          → 13 módulos de domínio auto-contidos
│   ├── auth/         → Autenticação e sessão
│   ├── manga/        → Títulos, cards, detalhes, busca
│   ├── chapter/      → Leitor de capítulos
│   ├── comment/      → Comentários hierárquicos + reações
│   ├── user/         → Perfis de usuário (enriquecido, recommendations, privacy)
│   ├── rating/       → Avaliações e reviews
│   ├── group/        → Grupos de tradução
│   ├── library/      → Biblioteca pessoal (tabs, contagens)
│   ├── category/     → Tags e filtros
│   ├── news/         → Notícias
│   ├── event/        → Eventos da comunidade
│   ├── forum/        → Fóruns de discussão
│   └── store/        → Lojas parceiras
├── shared/           → ~37 componentes, serviços e tipos reutilizáveis
├── mock/             → Dados mock (legacy — todas as features usam API real)
├── asset/            → Imagens e SVGs
└── style/            → CSS global (Tailwind + customizações)
```

Cada módulo de feature segue a estrutura: `component/`, `hook/`, `service/`, `type/`, `context/`, `constant/`, com barrel file (`index.ts`).

### Backend — Clean Architecture (4 camadas)

```
com.mangareader/
├── presentation/     → 13 REST Controllers (74 endpoints)
├── application/      → 70 Use Cases + Port interfaces
├── domain/           → 12 domínios de negócio (entidades, VOs, enums)
└── infrastructure/   → Persistência, segurança, email, mensageria
    ├── persistence/  → JPA (7 adapters PostgreSQL) + MongoDB (4 adapters)
    ├── security/     → JWT, BCrypt, CORS, rate limiting
    ├── email/        → SMTP, Console, Noop adapters
    ├── messaging/    → RabbitMQ publisher/consumer
    └── seed/         → Dados iniciais (DataSeeder, profile != prod)
```

Padrão de Use Cases com responsabilidade única e Input/Output baseados em records Java.

---

## 4. Situação Atual do Projeto

### Estado Geral: **Fase 9 — Qualidade e Polish**

O projeto está na fase de **qualidade e polish**. Todas as funcionalidades core estão implementadas, backend totalmente testado (727 testes), e todas as 13 features do frontend integradas com API real.

### O que já está funcional

| Área | Descrição |
|------|-----------|
| **Backend — API REST** | 74 endpoints implementados em 13 controllers, cobrindo todos os 12 domínios de negócio |
| **Backend — Schema de Banco** | 15 tabelas PostgreSQL + 6 coleções MongoDB com migrações Flyway (4) / Mongock (3) |
| **Backend — Segurança** | JWT completo (sign-in, sign-up, refresh, reset password), BCrypt, rate limiting |
| **Backend — Infraestrutura** | Docker Compose dev/prod, adaptadores de email, RabbitMQ configurado, Redis como cache |
| **Backend — Testes** | 727 testes passando (127 arquivos) — domain, application, presentation, infra JPA + MongoDB, Security E2E |
| **Backend — Documentação API** | Swagger/OpenAPI auto-gerado e acessível |
| **Frontend — UI** | 29 páginas implementadas com design responsivo (mobile-first) |
| **Frontend — Arquitetura** | 13 módulos de feature com separação clara de responsabilidades |
| **Frontend — HTTP Client** | Axios configurado com interceptores (token, error handling, 401 redirect) |
| **Frontend — Roteamento** | 23 rotas públicas + 4 protegidas com AuthGuard e RoleGuard |
| **Frontend — Integração** | 13/13 features conectadas à API real (mocks eliminados) |
| **Frontend — Perfil** | Perfil enriquecido com recomendações, histórico, privacidade, comentários |
| **Frontend — Biblioteca** | Tabs unificadas, contagens, paginação, updates otimistas |
| **Frontend — Testes de Hooks** | 4 arquivos, 35 testes (Vitest + RTL + MSW) — useSearchTitles, useAuth, useBookmark, useCommentCRUD |

### O que ainda não foi iniciado

| Área | Descrição |
|------|-----------|
| **Testes Frontend — Componentes/E2E** | Hooks testados (35 testes), faltam componentes e E2E |
| **CI/CD Pipeline** | Nenhum workflow de integração contínua ou deploy automatizado |
| **Deploy em Produção** | Nenhum ambiente de produção (Dockerfile e docker-compose.prod.yml existem) |
| **Code Splitting** | Sem lazy loading / React.lazy para rotas |
| **Error Boundaries** | Sem fallback para erros de componentes |
| **Upload de Arquivos** | Sem sistema para upload de capas, avatares ou páginas de capítulos |

---

## 5. Etapa Atual de Desenvolvimento

```
[✅] Setup inicial
    └─ Projeto criado, dependências configuradas, Docker Compose funcional

[✅] Arquitetura e estrutura
    └─ Clean Architecture (backend), Feature-based (frontend), banco de dados modelado

[✅] Implementação de funcionalidades — Backend
    └─ 70 use cases, 13 controllers, 74 endpoints, security, email, messaging

[✅] Implementação de funcionalidades — Frontend
    └─ 29 páginas com UI, 13 features, auth structure, guards

[✅] Testes do Backend (727 testes)
    └─ 127 arquivos — domain ✅, application ✅, presentation ✅, infra JPA ✅, MongoDB ✅, Security E2E ✅

[✅] Integração Frontend ↔ Backend (13/13 features)
    └─ auth, library, rating, comment, user, forum, group, news, event, store, manga, category, chapter

[🔄] Qualidade e Polish     ← FASE ATUAL
    ├─ ✅ 9a: Biblioteca unificada, MyReviews, Profile stats
    ├─ ✅ 9b: Perfil enriquecido (recommendations, view history, privacy)
    └─ 🔲 9c: Code splitting, Error Boundaries, @Transactional fixes, a11y, testes frontend

[🔲] Preparação para Produção
    └─ CI/CD, infraestrutura cloud, deploy, monitoramento
```

**Próximo passo imediato**: Fase 9c — code splitting com React.lazy, Error Boundaries, correção dos `@Transactional` faltantes nos use cases.

---

## 6. Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [frontend-analysis.md](frontend-analysis.md) | Análise técnica completa do frontend |
| [backend-analysis.md](backend-analysis.md) | Análise técnica completa do backend |
| [tech-debt.md](tech-debt.md) | Inventário de dívidas técnicas com impacto e prioridade |
| [pending-tasks.md](pending-tasks.md) | Tarefas pendentes organizadas por área |
| [deployment-plan.md](deployment-plan.md) | Plano completo de deploy em produção |
