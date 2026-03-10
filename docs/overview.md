# Manga Reader — Visão Geral do Projeto

> Última atualização: 9 de março de 2026

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
| Mongock | — | Migrações MongoDB |
| jjwt | 0.12.6 | Tokens JWT (HS256) |
| MapStruct | 1.6.3 | Mapeamento entity-DTO |
| Bucket4j | 8.10.1 | Rate limiting |
| Springdoc OpenAPI | 2.8.4 | Documentação Swagger |
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
├── application/      → 60+ Use Cases + Ports (interfaces)
├── domain/           → 11 domínios de negócio (entidades)
└── infrastructure/   → Persistência, segurança, email, mensageria
    ├── persistence/  → JPA (PostgreSQL) + MongoDB adapters
    ├── security/     → JWT, BCrypt, CORS, rate limiting
    ├── email/        → SMTP, Console, Noop adapters
    ├── messaging/    → RabbitMQ publisher/consumer
    └── seed/         → Dados iniciais
```

Padrão de Use Cases com responsabilidade única e Input/Output baseados em records Java.

---

## 4. Situação Atual do Projeto

### Estado Geral: **Desenvolvimento Ativo — Fase de Implementação de Funcionalidades**

O projeto encontra-se na transição entre a **implementação de funcionalidades** e a **fase de integração** entre frontend e backend.

### O que já está funcional

| Área | Descrição |
|------|-----------|
| **Backend — API REST** | ~80 endpoints implementados em 13 controllers, cobrindo todos os 11 domínios de negócio |
| **Backend — Schema de Banco** | 14 tabelas PostgreSQL + 4 coleções MongoDB com migrações Flyway/Mongock |
| **Backend — Segurança** | JWT completo (sign-in, sign-up, refresh, reset password), BCrypt, rate limiting |
| **Backend — Infraestrutura** | Docker Compose dev/prod, adaptadores de email, RabbitMQ configurado, Redis como cache |
| **Backend — Documentação API** | Swagger/OpenAPI auto-gerado e acessível |
| **Frontend — UI** | 22+ páginas implementadas com design responsivo (mobile-first) |
| **Frontend — Arquitetura** | 13 módulos de feature com separação clara de responsabilidades |
| **Frontend — HTTP Client** | Axios configurado com interceptores (token, error handling, 401 redirect) |
| **Frontend — Roteamento** | 20 rotas públicas + 2 protegidas com AuthGuard e RoleGuard |
| **Frontend — Layout** | Header, Footer, Main com navegação, busca e exibição de auth |

### O que está parcialmente implementado

| Área | Status | Observação |
|------|--------|------------|
| **Integração Frontend-Backend** | ~25% | Apenas títulos, tags e comentários buscam dados reais da API; 10 features restantes usam mock data |
| **Autenticação End-to-End** | ~60% | Serviço frontend definido com endpoints, guards implementados, mas fluxo completo não testado com backend |
| **Formulários** | ~40% | Estrutura pronta para Login, SignUp, ForgotPassword; falta validação e integração completa |
| **Operações CRUD** | ~30% | Endpoints backend existem; frontend tem apenas read (GET) implementado para maioria |
| **Comentários** | ~50% | Listagem funcional com API real; criação, edição, deleção não conectados |
| **Leitor de Capítulos** | ~70% | Navegação e UI completos; URLs de imagem ainda são stub/placeholder |

### O que ainda não foi iniciado

| Área | Descrição |
|------|-----------|
| **Testes Automatizados** | 1 único arquivo de teste no backend (UserTest, 4 testes de domínio); zero testes no frontend |
| **CI/CD Pipeline** | Nenhum workflow de integração contínua ou deploy automatizado |
| **Deploy em Produção** | Nenhum ambiente de produção configurado além do Dockerfile e docker-compose.prod.yml |
| **Upload de Arquivos** | Sem sistema para upload de capas, avatares ou páginas de capítulos |
| **Acessibilidade** | Sem ARIA labels, landmarks ou HTML semântico |
| **Internacionalização** | Strings de UI hardcoded em português; mensagens de erro em português |
| **Conteúdo Legal** | Páginas de Termos de Uso e DMCA contêm texto placeholder |
| **Monitoramento** | Actuator configurado, mas sem sistema de logging/alertas em produção |

---

## 5. Etapa Atual de Desenvolvimento

```
[✅] Setup inicial
    └─ Projeto criado, dependências configuradas, Docker Compose funcional

[✅] Arquitetura e estrutura
    └─ Clean Architecture (backend), Feature-based (frontend), banco de dados modelado

[✅] Implementação de funcionalidades — Backend
    └─ 60+ use cases, 13 controllers, ~80 endpoints, security, email, messaging

[🔄] Implementação de funcionalidades — Frontend     ← FASE ATUAL
    └─ 22+ páginas com UI, 13 features com mock data, auth structure

[🔲] Integração Frontend ↔ Backend
    └─ Apenas 3/13 features conectadas à API real

[🔲] Testes
    └─ Infraestrutura de testes pronta (JUnit, TestContainers) mas não utilizada

[🔲] Preparação para Deploy
    └─ Dockerfile e docker-compose.prod.yml existem, mas sem pipeline CI/CD

[🔲] Produção
    └─ Não iniciado
```

**Conclusão**: O projeto está na **segunda metade da fase de implementação**, com o backend substancialmente completo e o frontend com UI construída mas dependente de dados mock. A próxima etapa natural é a **integração real** entre frontend e backend, seguida de testes e preparação para produção.

---

## 6. Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [frontend-analysis.md](frontend-analysis.md) | Análise técnica completa do frontend |
| [backend-analysis.md](backend-analysis.md) | Análise técnica completa do backend |
| [tech-debt.md](tech-debt.md) | Inventário de dívidas técnicas com impacto e prioridade |
| [pending-tasks.md](pending-tasks.md) | Tarefas pendentes organizadas por área |
| [deployment-plan.md](deployment-plan.md) | Plano completo de deploy em produção |
