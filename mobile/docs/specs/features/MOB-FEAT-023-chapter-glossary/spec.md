---
id: MOB-FEAT-023
type: feature
title: Glossário do capítulo guardado no aparelho
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-022]
created: 2026-11-20
updated: 2026-11-20
supersedes: []
superseded_by: []
---

# MOB-FEAT-023 — Glossário do capítulo guardado no aparelho

## Objetivo

Manter os nomes de um capítulo iguais do começo ao fim, mesmo quando a fila pausa por mais tempo que a memória do
gateway (no máximo 1 hora, ou 1 dia renovando). O app guarda os nomes que o gateway decidiu para o projeto e os
reenvia com cada página.

## Contexto e contratos relacionados

- Depende da `MOB-FEAT-022`: fila, `contextRef` e retomada depois da cota.
- **Gateway** (ver `api/apps/translation-gateway/docs/architecture/chapter-memory.md`, "Glossário do cliente"):
    - o manifesto do resultado (render `1.2`) traz `terms`, os nomes que valeram para a página, no máximo 64;
    - `PageSubmission.glossary` (opcional, só com `contextRef`) recebe até 256 nomes em 32 KiB e recompõe a memória
      do capítulo onde ela expirou, sem sobrescrever um termo vivo.
- A memória do gateway continua sendo a ponte entre páginas seguidas. O glossário cobre pausas longas.

## Requisitos e regras

- **Tabela (SQLite v12):** `translation_project_terms`:
    - colunas `project_id` (FK com `ON DELETE CASCADE`), `source_term` e `target_term`, com `CHECK` de tamanho e
      linha única, e `created_at`;
    - chave primária (`project_id`, `source_term`).
- **Gravar:** os `terms` de um resultado `REMOTE` são gravados na mesma transação que deixa a página `READY`. Vale
  a primeira decisão: um termo que o projeto já tem não muda.
- **Ler o resultado:**
    - o parser do manifesto do resultado aceita `1.1` (sem termos) e `1.2` (com termos);
    - termos inválidos invalidam o resultado, como qualquer campo do manifesto.
- **Enviar:**
    - toda submissão com `contextRef`, inclusive o reenvio, leva `glossary` com os termos do projeto, em ordem de
      gravação, até 256;
    - sem termos, o campo não vai.
- **Apagar:** apagar o projeto ou limpar os dados locais apaga o glossário.
- **Consentimento:** a frase sobre os dados enviados passa a citar os nomes já traduzidos do projeto, nos 3
  idiomas. A versão do disclosure no gateway sobe junto, e o texto entra na revisão jurídica pendente antes de
  produção.

## Casos de erro

- **Glossário recusado (400):**
    - a página não é enviada sem ele de novo automaticamente;
    - a submissão é tratada como `gateway-rejected`, como qualquer 400, e o erro fica visível;
    - isso só aconteceria com dados locais corrompidos, porque o app valida os limites antes de enviar.
- **Termos inválidos no manifesto:** o resultado não é gravado e a página não vira `READY`, como na 021.

## Critérios de aceite

### AC-001 — Glossário gravado com o resultado

Os termos de um resultado `1.2` são gravados com ele numa transação, vale a primeira decisão, e um resultado `1.1`
grava sem termos.

### AC-002 — Glossário reenviado

Toda submissão de um projeto com termos leva `glossary` com esses termos, dentro dos limites do contrato.

### AC-003 — Ciclo de vida

Apagar o projeto ou os dados locais remove os termos. Uma migração de v11 para v12 preserva projetos, páginas e
resultados.

### AC-004 — Consentimento atualizado

O texto de dados enviados cita os nomes já traduzidos nos três idiomas.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                         |
| -------- | ---------------------------------------------------------------- |
| AC-001   | Jest com SQLite real (node:sqlite) do commit e do parser 1.1/1.2 |
| AC-002   | Jest do controller de start com transporte falso                 |
| AC-003   | Jest do repositório (cascade, clear, migração)                   |
| AC-004   | RNTL do diálogo de consentimento nos três locales                |

## Gate de implementação

- Estado: `open`, porque a `MOB-FEAT-022` está em `verification-pending`.
- Dependência: `MOB-FEAT-022`.

## Fora de escopo

- Editar ou ver o glossário na interface.
- Compartilhar o glossário entre projetos ou aparelhos.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-20

Aprovada no chat ("Approve the 023"), depois de Ruan ler o resumo desta spec e o resultado da validação real do
glossário no gateway.
