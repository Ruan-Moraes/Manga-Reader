# Documentation Policy

O que atualizar (README / CLAUDE / tech-debt / locales) por tipo de mudança.
Referenciado por `CLAUDE.md`.

| Tipo de Mudança | Documentação Exigida |
|-----------------|---------------------|
| Nova feature/endpoint | Atualizar `README.md` (tabela endpoints), `CLAUDE.md`/`docs/architecture.md` (patterns) |
| Novo use case/entity | Atualizar `README.md` (métricas), `docs/architecture.md` (domínios se aplicável) |
| Nova tela/página | Implementar i18n obrigatoriamente; documentar chaves em `locales/README.md` |
| Bug fix com lição aprendida | Atualizar `docs/testing.md` (Known Test Limitations) |
| Mudança de arquitetura | Atualizar `docs/architecture.md` (Architecture/patterns) e `README.md` (§2) |
| Novo tech debt identificado | Adicionar em `docs/tech-debt.md` com prioridade e impacto |
| Tech debt resolvido | Remover de `docs/tech-debt.md`, atualizar `README.md` |
| Nova tarefa/dívida ou backlog de produto | Adicionar em `docs/tech-debt.md` |
| Tarefa/dívida concluída | Marcar resolvida em `docs/tech-debt.md` |
| Mudança de versão de dependência | Atualizar `README.md` (Stack) |
| Mudança na contagem de testes | Atualizar `README.md` |
| Adição/modificação de strings i18n | Atualizar todos os idiomas suportados (pt, en, es) em `locales/` |
