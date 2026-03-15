# Manga Reader — Visão Geral do Projeto

> Última atualização: 13 de março de 2026

---

## 1. Descrição do Projeto

O **Manga Reader** é uma plataforma web completa para leitura, catalogação e comunidade de mangás, manhwas e manhuas. O sistema oferece funcionalidades como:

- Catálogo de títulos com busca, filtros por gênero e ordenação
- Leitor de capítulos com navegação entre páginas
- Sistema de avaliações e reviews por usuários
- Fóruns de discussão com categorias e respostas
- Grupos de tradução com membros e obras
- Biblioteca pessoal com listas de leitura
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
| MongoDB | 8.0 | Banco documental (titles, comments, ratings, news) |
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
├── app/              → Camada de aplicação (layouts, rotas, router)
├── feature/          → 13 módulos de domínio auto-contidos
│   ├── auth/         → Autenticação e sessão
│   ├── manga/        → Títulos, cards, detalhes
│   ├── chapter/      → Leitor de capítulos
│   ├── comment/      → Comentários hierárquicos + emojis
│   ├── user/         → Perfis de usuário
│   ├── rating/       → Avaliações e reviews
│   ├── group/        → Grupos de tradução
│   ├── library/      → Biblioteca pessoal
│   ├── category/     → Tags e filtros
│   ├── news/         → Notícias
│   ├── event/        → Eventos da comunidade
│   ├── forum/        → Fóruns de discussão
│   └── store/        → Lojas parceiras
├── shared/           → Componentes, serviços e tipos reutilizáveis
├── mock/             → Dados mock para desenvolvimento
├── asset/            → Imagens e SVGs
└── style/            → CSS global (Tailwind + customizações)
```

Cada módulo de feature segue a estrutura: `component/`, `hook/`, `service/`, `type/`, `context/`, `constant/`, com barrel file (`index.ts`).

### Backend — Clean Architecture (4 camadas)

```
com.mangareader/
├── presentation/     → 13 REST Controllers (~80 endpoints)
├── application/      → 65 Use Cases + 14 Ports (interfaces)
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

### Estado Geral: **Fase 7 — Testes do Backend**

O projeto está na fase de **testes e estabilização do backend**. Todas as funcionalidades core estão implementadas. O foco atual é completar a cobertura de testes antes de iniciar a integração frontend ↔ backend.

### O que já está funcional

| Área | Descrição |
|------|-----------|
| **Backend — API REST** | ~80 endpoints implementados em 13 controllers, cobrindo todos os 12 domínios de negócio |
| **Backend — Schema de Banco** | 14 tabelas PostgreSQL + 4 coleções MongoDB com migrações Flyway/Mongock |
| **Backend — Segurança** | JWT completo (sign-in, sign-up, refresh, reset password), BCrypt, rate limiting |
| **Backend — Infraestrutura** | Docker Compose dev/prod, adaptadores de email, RabbitMQ configurado, Redis como cache |
| **Backend — Testes** | 582 testes passando (98 arquivos) — domain, application, presentation, infra JPA e MongoDB completos |
| **Backend — Documentação API** | Swagger/OpenAPI auto-gerado e acessível |
| **Frontend — UI** | 22+ páginas implementadas com design responsivo (mobile-first) |
| **Frontend — Arquitetura** | 13 módulos de feature com separação clara de responsabilidades |
| **Frontend — HTTP Client** | Axios configurado com interceptores (token, error handling, 401 redirect) |
| **Frontend — Roteamento** | 24 rotas públicas + 2 protegidas com AuthGuard e RoleGuard |

### O que está parcialmente implementado

| Área | Status | Observação |
|------|--------|------------|
| **Testes Backend** | ~95% | 582 testes passando. Falta: Security integrado (Auth E2E) |
| **Integração Frontend-Backend** | ~25% | Apenas títulos, tags e comentários (GET) buscam dados reais da API |
| **Autenticação End-to-End** | ~60% | Serviço frontend definido, guards implementados, mas fluxo completo não testado |
| **Formulários** | ~40% | Estrutura pronta; falta validação e integração completa |
| **Operações CRUD** | ~30% | Endpoints backend existem; frontend tem apenas read (GET) para maioria |

### O que ainda não foi iniciado

| Área | Descrição |
|------|-----------|
| **Testes Frontend** | Zero testes (React Testing Library, E2E) |
| **CI/CD Pipeline** | Nenhum workflow de integração contínua ou deploy automatizado |
| **Deploy em Produção** | Nenhum ambiente de produção (Dockerfile e docker-compose.prod.yml existem) |
| **Upload de Arquivos** | Sem sistema para upload de capas, avatares ou páginas de capítulos |
| **Acessibilidade** | Sem ARIA labels, landmarks ou HTML semântico |
| **Internacionalização** | Strings de UI hardcoded em português |

---

## 5. Etapa Atual de Desenvolvimento

```
[✅] Setup inicial
    └─ Projeto criado, dependências configuradas, Docker Compose funcional

[✅] Arquitetura e estrutura
    └─ Clean Architecture (backend), Feature-based (frontend), banco de dados modelado

[✅] Implementação de funcionalidades — Backend
    └─ 65 use cases, 13 controllers, ~80 endpoints, security, email, messaging

[✅] Implementação de funcionalidades — Frontend
    └─ 22+ páginas com UI, 13 features, auth structure, guards

[🔄] Testes do Backend     ← FASE ATUAL
    └─ 98 arquivos, 582 testes (domain ✅, application ✅, presentation ✅, infra JPA ✅, infra MongoDB ✅)
    └─ Pendente: Security integrado (Auth E2E)

[🔲] Integração Frontend ↔ Backend
    └─ 3/13 features conectadas à API real

[🔲] Qualidade e Polish
    └─ Testes frontend, validação de formulários, lazy loading, acessibilidade

[🔲] Preparação para Produção
    └─ CI/CD, infraestrutura cloud, deploy, monitoramento
```

**Próximo passo imediato**: Testes de segurança integrados (fluxo Auth E2E com `@SpringBootTest` + TestContainers), seguido pela integração frontend ↔ backend.

---

## 6. Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [frontend-analysis.md](frontend-analysis.md) | Análise técnica completa do frontend |
| [backend-analysis.md](backend-analysis.md) | Análise técnica completa do backend |
| [tech-debt.md](tech-debt.md) | Inventário de dívidas técnicas com impacto e prioridade |
| [pending-tasks.md](pending-tasks.md) | Tarefas pendentes organizadas por área |
| [deployment-plan.md](deployment-plan.md) | Plano completo de deploy em produção |
