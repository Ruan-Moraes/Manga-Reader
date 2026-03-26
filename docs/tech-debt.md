# Manga Reader — Dívidas Técnicas

> Última atualização: 25 de março de 2026

---

## Resumo

Este documento lista as dívidas técnicas identificadas no projeto, organizadas por **prioridade** (Crítica, Alta, Média, Baixa). Cada item inclui descrição, impacto e recomendação.

---

## Prioridade Crítica

### DT-01: Use cases data-modifying sem `@Transactional`

**Descrição**: ~23 use cases que modificam dados no banco não possuem `@Transactional`. Isso inclui CreateComment, DeleteComment, UpdateComment, JoinGroup, SaveToLibrary, SubmitRating, AddRecommendation, RecordViewHistory, entre outros.

**Impacto**:
- Risco de `LazyInitializationException` quando lazy collections são acessadas fora da transação
- Inconsistência de dados em operações multi-repository (ex: salvar em dois bancos sem atomicidade)
- Race conditions em operações concorrentes

**Recomendação**:
1. Adicionar `@Transactional` a todos os use cases que fazem write (POST/PUT/DELETE)
2. Adicionar `@Transactional(readOnly = true)` a use cases de leitura que acessam lazy collections
3. Documentar a regra no CLAUDE.md (já feito)

---

### DT-02: Zero testes no frontend

**Descrição**: O frontend não possui nenhum teste — nem unitário, nem de componente, nem E2E. Não há library de teste no `package.json` (jest/vitest, testing-library, etc.).

**Impacto**:
- Sem garantia de qualidade no frontend
- Regressões não detectadas
- Refatorações arriscadas

**Recomendação**:
1. Adicionar Vitest + React Testing Library ao projeto
2. Priorizar testes de hooks customizados (useAuth, useBookmark, useCommentCRUD)
3. Testes de componentes críticos (CommentsSection, Library, UserProfile)
4. Considerar Playwright para testes E2E dos fluxos de auth

---

## Prioridade Alta

### DT-03: Sem pipeline CI/CD

**Descrição**: Nenhum workflow de integração contínua ou deploy automatizado. Não há verificação automática de lint, build, testes ou deploy.

**Impacto**:
- Erros de build passam despercebidos
- Deploys manuais são propensos a falhas
- Sem garantia de qualidade antes do merge
- Processo de deploy não reproduzível

**Recomendação**: Configurar GitHub Actions com stages: lint → test → build → deploy (ver `deployment-plan.md`).

---

### DT-04: UserController injeta repository ports diretamente

**Descrição**: O `UserController` injeta `ViewHistoryRepositoryPort` e `UserRepositoryPort` diretamente (linhas 69-70), em vez de usar use cases. Isso viola o princípio da Clean Architecture onde controllers devem depender apenas de use cases.

**Impacto**:
- Violação arquitetural (controller acessa infraestrutura diretamente)
- Lógica de negócio espalhada na camada de apresentação
- Dificulta testes unitários do controller

**Recomendação**:
1. Criar use cases dedicados para as operações que usam esses ports no controller
2. Remover injeção de repository ports do controller
3. Controller deve depender apenas de use case ports

---

### DT-05: Sem Error Boundaries no frontend

**Descrição**: O frontend não possui nenhum `ErrorBoundary`. Um erro em qualquer componente causa crash da aplicação inteira.

**Impacto**:
- UX degradada — tela branca em caso de erro em qualquer componente
- Sem fallback visual para erros
- Difícil diagnosticar problemas em produção

**Recomendação**:
1. Criar `ErrorBoundary` genérico com fallback UI
2. Envolver rotas principais com ErrorBoundary
3. Considerar integração com Sentry para error tracking

---

### DT-06: Validação insuficiente em formulários do frontend

**Descrição**: Formulários de SignUp, PublishWork e outros forms de criação/edição não possuem validação client-side completa. Faltam validação de formato de email, força de senha, campos obrigatórios com feedback visual, e sanitização de inputs.

**Impacto**:
- UX degradada (sem feedback de erros inline)
- Dados inválidos podem ser enviados ao backend
- Vulnerabilidade a XSS se inputs não são sanitizados

**Recomendação**: Implementar validação com React Hook Form + Zod. Priorizar forms de auth (login, signup, reset password).

---

## Prioridade Média

### DT-07: Sem lazy loading / code splitting para rotas

**Descrição**: Todas as 27 rotas são importadas estaticamente. Não há uso de `React.lazy()` ou dynamic imports para code splitting. Os 272 arquivos TypeScript do frontend carregam no bundle inicial.

**Impacto**:
- Bundle inicial contém todo o código de todas as páginas
- Tempo de carregamento inicial elevado
- Usuários baixam código de páginas que podem nunca visitar

**Recomendação**: Implementar `React.lazy()` + `Suspense` para todas as rotas. Vite faz code splitting automático com dynamic imports.

---

### DT-08: Ausência de acessibilidade completa (a11y)

**Descrição**: Acessibilidade parcial — alguns `aria-label`, `role="search"` e HTML semântico presentes, mas vários botões icon-only sem labels, falta de landmarks consistentes, sem testes de acessibilidade.

**Impacto**:
- Usuários com deficiência visual ou motora não conseguem usar partes da aplicação
- Potenciais problemas legais em algumas jurisdições

**Recomendação**: Adicionar aria-labels em todos os botões icon-only, garantir landmarks (`<nav>`, `<main>`, `<aside>`), implementar navegação por teclado completa.

---

### DT-09: Conteúdo placeholder em páginas legais

**Descrição**: Termos de Uso e DMCA possuem texto placeholder com "XX" para datas e Lorem Ipsum para conteúdo. About Us também usa conteúdo genérico.

**Impacto**:
- Requisito legal não atendido
- Não pode ir para produção sem conteúdo real

**Recomendação**: Redigir conteúdo legal real ou consultar um advogado. Bloquear deploy até que esteja pronto.

---

### DT-10: Referências cross-database sem integridade referencial documentada

**Descrição**: Tabelas PostgreSQL referenciam ObjectIds do MongoDB (`user_libraries.title_id`, `group_works.title_id`, `store_titles.title_id`). Sem FK entre bancos — integridade por aplicação.

**Impacto**:
- IDs órfãos se um título for deletado do MongoDB
- Sem cascading delete automático

**Recomendação**:
1. Documentar quais tabelas fazem cross-ref
2. Implementar validação na aplicação antes de salvar referências
3. Criar job de limpeza para referências órfãs

---

### DT-11: Logging sem estratégia para produção

**Descrição**: Logback configurado mas sem rotação de logs, níveis por pacote, ou integração com ferramentas de observabilidade.

**Impacto**:
- Logs podem crescer sem limite em produção
- Difícil debugar problemas em produção

**Recomendação**: Configurar logback com rotação, JSON format para produção, e considerar ELK/Grafana Loki.

---

### DT-12: `localhost:5000` hardcoded em useCategoryFilters

**Descrição**: O hook `useCategoryFilters.tsx` (linha 34) possui `http://localhost:5000/search_title_by?` hardcoded, referenciando uma API diferente da principal (porta 5000 vs 8080).

**Impacto**:
- Filtros de categoria apontam para endpoint errado/inexistente
- Funcionalidade de busca por categoria quebrada

**Recomendação**: Migrar para o endpoint correto da API principal (`/api/titles/filter`) ou remover se não for utilizado.

---

## Prioridade Baixa

### DT-13: Basename hardcoded para GitHub Pages

**Descrição**: `ROUTES.WEB_URL = '/Manga-Reader'` e `base` no Vite config estão hardcoded para deploy no GitHub Pages. Em produção real, o basename seria `/` ou outro valor.

**Impacto**: Precisa ser alterado manualmente para deploy em outro ambiente.

**Recomendação**: Parametrizar via variável de ambiente (`VITE_BASE_URL`).

---

### DT-14: Sem internacionalização (i18n)

**Descrição**: Todas as strings de UI, mensagens de erro e labels estão hardcoded em português. Não há framework de i18n configurado.

**Impacto**: Impossível atingir mercado internacional sem reescrita significativa.

**Recomendação**: Para o momento, não é bloqueante. Se internacionalização for desejada futuramente, integrar `react-i18next`.

---

### DT-15: React Query DevTools comentado

**Descrição**: O import do `ReactQueryDevtools` está comentado em `main.tsx`.

**Impacto**: Mínimo. Ferramenta de desenvolvimento útil que não está acessível.

**Recomendação**: Descomentar para ambiente de desenvolvimento.

---

## Resumo por Prioridade

| Prioridade | Quantidade | IDs |
|-----------|-----------|-----|
| **Crítica** | 2 | DT-01, DT-02 |
| **Alta** | 4 | DT-03, DT-04, DT-05, DT-06 |
| **Média** | 6 | DT-07, DT-08, DT-09, DT-10, DT-11, DT-12 |
| **Baixa** | 3 | DT-13, DT-14, DT-15 |
| **Total** | **15** | |

### Itens Resolvidos (removidos nesta atualização)

| ID Antigo | Dívida | Data de Resolução |
|-----------|--------|-------------------|
| DT-01 (old) | Cobertura de testes backend incompleta | 2026-03-14 (727 testes, 126 arquivos) |
| DT-02 (old) | Features frontend com dados mock | 2026-03-14 (13/13 integradas com API real) |
| DT-04 (old) | Fluxo de autenticação não testado E2E | 2026-03-14 (16 testes SecurityIntegrationTest) |
