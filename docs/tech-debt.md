# Manga Reader — Dívidas Técnicas

> Última atualização: 9 de março de 2026

---

## Resumo

Este documento lista as dívidas técnicas identificadas no projeto, organizadas por **prioridade** (Crítica, Alta, Média, Baixa). Cada item inclui descrição, impacto e recomendação.

---

## Prioridade Crítica

### DT-01: Ausência quase total de testes automatizados

**Descrição**: O backend possui 1 único arquivo de teste (`UserTest` com 4 testes unitários de domínio). O frontend possui zero testes. A infraestrutura de testes do backend está pronta (JUnit 5, H2, TestContainers, MockMVC, Spring Security Test) mas não está sendo utilizada.

**Impacto**: Bloqueante para produção. Impossível garantir que:
- Regras de negócio estão corretas
- Endpoints retornam os dados esperados
- Segurança (JWT, guards) funciona corretamente
- Refatorações não quebram funcionalidades existentes
- Regressões são detectadas automaticamente

**Recomendação**:
1. Backend: Testes unitários para todos os use cases, testes de integração para controllers e repositórios, testes de segurança para endpoints protegidos
2. Frontend: Testes de componentes com React Testing Library, testes de hooks customizados, testes de integração para fluxos críticos (auth, navegação)
3. Meta mínima para deploy: Cobertura de ~80% nos use cases do backend e testes E2E para fluxos críticos

---

### DT-02: Maioria das features do frontend usa dados mock

**Descrição**: Apenas 3 de 13 features do frontend estão conectadas à API real do backend (titles, tags, comments parcial). As 10 features restantes (rating, group, library, news, event, forum, store, user, auth parcial, chapter parcial) utilizam dados mock hardcoded em `src/mock/`.

**Impacto**:
- A aplicação não é funcional em cenário real
- Possíveis divergências entre a estrutura dos dados mock e o schema real do backend
- CRUD (create, update, delete) não está conectado em nenhuma feature
- Impossível testar fluxos reais de usuário

**Recomendação**:
1. Priorizar integração das features que têm endpoints prontos no backend
2. Seguir a ordem: auth → library → rating → comment (CRUD) → forum → group → news → event → store → user
3. Remover dados mock conforme a integração avança
4. Validar compatibilidade de tipos entre frontend e backend

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

### DT-04: Fluxo de autenticação não testado end-to-end

**Descrição**: O backend tem endpoints de auth implementados (sign-in, sign-up, refresh, forgot/reset password). O frontend tem o `authService` com todos os métodos e guards (AuthGuard, RoleGuard). Porém, o fluxo completo frontend→backend nunca foi testado em conjunto.

**Impacto**:
- Não é possível garantir que login, cadastro e refresh token funcionam
- Guards de rota podem não funcionar corretamente com tokens reais
- Interceptor de 401 (logout automático) não foi validado
- Fluxo de reset de senha depende de email funcional

**Recomendação**:
1. Testar manualmente o fluxo completo: sign-up → sign-in → me → refresh → protected route
2. Verificar interceptores HTTP (token injection, 401 handling)
3. Testar forgot/reset password com console email adapter (dev)
4. Escrever testes E2E para o fluxo de auth

---

### DT-05: Validação insuficiente em formulários do frontend

**Descrição**: Formulários de SignUp, PublishWork e outros forms de criação/edição não possuem validação client-side completa. Faltam:
- Validação de formato de email
- Validação de força de senha
- Validação de campos obrigatórios com feedback visual
- Confirmação de senha
- Sanitização de inputs

**Impacto**:
- UX degradada (sem feedback de erros)
- Dados inválidos podem ser enviados ao backend
- Vulnerabilidade a XSS se inputs não são sanitizados

**Recomendação**: Implementar validação com React Hook Form + Zod ou Yup. Priorizar forms de auth (login, signup, reset password).

---

## Prioridade Média

### DT-06: Componentes de página excessivamente longos

**Descrição**: Diversos page components têm mais de 100 linhas e concentram múltiplas responsabilidades. Páginas identificadas: Forum, Groups, News, Events, Library, Profile, Chapter, GroupProfile, SavedMangas.

**Impacto**:
- Dificulta manutenção e compreensão
- Dificulta reutilização de seções
- Aumenta risco de bugs em refatorações

**Recomendação**: Extrair subcomponentes para seções lógicas (filtros, listagem, detalhes, sidebar). Manter page components como composições de subcomponentes.

---

### DT-07: Sem lazy loading / code splitting para rotas

**Descrição**: Todas as 22+ rotas são importadas estaticamente. Não há uso de `React.lazy()` ou dynamic imports para code splitting.

**Impacto**:
- Bundle inicial contém todo o código de todas as páginas
- Tempo de carregamento inicial elevado
- Usuários baixam código de páginas que podem nunca visitar

**Recomendação**: Implementar `React.lazy()` + `Suspense` para todas as rotas. Vite faz code splitting automático com dynamic imports.

---

### DT-08: Ausência de acessibilidade (a11y)

**Descrição**: Sem ARIA labels, roles, landmarks ou HTML semântico consistente. Sem testes de acessibilidade.

**Impacto**:
- Usuários com deficiência visual ou motora não conseguem usar a aplicação
- Potenciais problemas legais em algumas jurisdições
- Perda de SEO (bots usam semântica HTML)

**Recomendação**: Adicionar aria-labels em inputs e botões, usar landmarks (`<nav>`, `<main>`, `<aside>`), implementar navegação por teclado.

---

### DT-09: Conteúdo placeholder em páginas legais

**Descrição**: Termos de Uso e DMCA possuem texto placeholder com "XX" para datas e Lorem Ipsum para conteúdo. About Us também usa conteúdo genérico.

**Impacto**:
- Requisito legal não atendido
- Não pode ir para produção sem conteúdo real

**Recomendação**: Redigir conteúdo legal real ou consultar um advogado. Bloquear deploy até que esteja pronto.

---

### DT-10: Referências cross-database sem integridade referencial documentada

**Descrição**: Três tabelas PostgreSQL referenciam ObjectIds do MongoDB:
- `user_libraries.title_id` → `titles._id` (MongoDB)
- `group_works.title_id` → `titles._id` (MongoDB)
- `store_titles.title_id` → `titles._id` (MongoDB)

Não há foreign key entre bancos de dados distintos — a integridade é garantida apenas pela aplicação.

**Impacto**:
- IDs órfãos podem existir se um título for deletado do MongoDB
- Sem cascading delete automático
- Consultas que fazem join lógico entre bancos são complexas

**Recomendação**:
1. Documentar claramente quais tabelas fazem cross-ref
2. Implementar validação na aplicação antes de salvar referências
3. Criar job de limpeza para detectar referências órfãs
4. Considerar soft delete para títulos

---

### DT-11: Logging sem estratégia para produção

**Descrição**: Logback está configurado (`logback-spring.xml`) mas sem rotação de logs, níveis por pacote, ou integração com ferramentas de observabilidade.

**Impacto**:
- Logs podem crescer sem limite em produção
- Difícil debugar problemas em produção
- Sem alertas para erros críticos

**Recomendação**: Configurar logback com rotação, JSON format para produção, e considerar ELK/Grafana Loki.

---

## Prioridade Baixa

### DT-12: Sem documentação inline (JSDoc/Javadoc)

**Descrição**: Código do frontend sem JSDoc. Backend com Javadoc mínimo. A arquitetura é auto-explicativa pelo padrão de nomes, mas métodos públicos de serviço e use cases se beneficiariam de documentação.

**Impacto**: Curva de aprendizado mais lenta para novos desenvolvedores.

**Recomendação**: Adicionar JSDoc/Javadoc nos pontos de entrada de cada módulo (barrel files, use cases, controllers).

---

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
| **Alta** | 3 | DT-03, DT-04, DT-05 |
| **Média** | 6 | DT-06, DT-07, DT-08, DT-09, DT-10, DT-11 |
| **Baixa** | 4 | DT-12, DT-13, DT-14, DT-15 |
| **Total** | **15** | |
