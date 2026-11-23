---
id: MOB-FEAT-025
type: feature
title: Biblioteca local de traduções
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-016, MOB-FEAT-050]
created: 2026-09-08
updated: 2026-09-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-025 — Biblioteca local de traduções

## Objetivo

Listar, abrir e remover projetos privados locais sem login ou dependência da
plataforma autenticada.

## Contexto e contratos relacionados

- Consome projetos de `MOB-FEAT-016` e resultados demo de `MOB-FEAT-050`.
- Resolve `CON-007` com rota própria; não altera o placeholder da plataforma.
- Controla RSK-008/027 e prepara integração futura com `MOB-FEAT-021`.

## Requisitos e regras

- A lista deriva de projetos, páginas, resultados e progresso existentes, sem
  tabela ou snapshot duplicado de biblioteca.
- Ordenação é por atualização mais recente, com capa da primeira página,
  idiomas, quantidade, estado e posição local.
- Abertura usa a última página válida; sem progresso usa a primeira.
- Exclusão exige confirmação e remove metadados por cascade antes da limpeza
  idempotente dos arquivos.
- Biblioteca permanece pública, guest-first e totalmente local.

## Casos de erro

- Biblioteca vazia oferece ação para iniciar nova tradução.
- Resultado ausente/corrompido apresenta reparo, sem sucesso silencioso.
- Falha ao limpar arquivo não restaura metadados apagados e é reconciliada na
  próxima inicialização.

## Critérios de aceite

### AC-001 — Listagem local verdadeira

Projetos persistidos aparecem ordenados com dados derivados consistentes.

### AC-002 — Abertura e estado vazio

Projeto abre localmente na posição válida e vazio direciona à importação.

### AC-003 — Exclusão coordenada

Confirmação remove projeto, filhos e arquivos sem afetar outros projetos.

### AC-004 — Independência e acessibilidade

Login, Core e rede não bloqueiam biblioteca trilíngue e acessível.

## Estratégia de evidência

| Critério | Teste/evidência esperada                   |
| -------- | ------------------------------------------ |
| AC-001   | repository/projeção e RNTL de ordenação    |
| AC-002   | integração de rotas, retomada e vazio      |
| AC-003   | cascade, confirmação e falha de filesystem |
| AC-004   | zero HTTP, guest/logout e três locales     |

## Gate de implementação

- Estado: `open`, implementação concluída e verificação física pendente
- Dependências: `MOB-FEAT-016`, `MOB-FEAT-050`
- Motivo: os dados locais necessários possuem produtor verificável.

## Fora de escopo

- Catálogo, biblioteca de conta, sincronização cloud e compartilhamento.
- Renomear projetos, busca, filtros ou paginação remota.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-09-08
