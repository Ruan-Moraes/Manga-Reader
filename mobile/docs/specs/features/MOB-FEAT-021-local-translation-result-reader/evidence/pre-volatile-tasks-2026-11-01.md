# Histórico anterior à revisão volátil — MOB-FEAT-021 / tasks.md

> Fotografia preservada em 2026-11-01. Este registro descreve o desenho
> substituído, inclusive seus estados, conclusões e restrições da época. Não é
> contrato vigente nem evidência de implementação do processamento em memória.
> Contrato atual: [spec](../spec.md). Os materiais de prova citados são históricos.

# Tasks — MOB-FEAT-021

- Spec no planejamento: `approved`, gate `open`, revisão humana de 2026-10-25.
- Dependências executadas: 019/026/027/051 em `verification-pending`, permitidas
  pelo contrato corrente de AGENTS.md (prevalece sobre o texto antigo das skills).
- Aplicar SDD Task Planner/Executor, FSD e plano de dados abaixo; sem migration.

## Plano de persistência anterior ao código

Banco: SQLite v9 privado já existente. Sem Postgres/Mongo/Flyway novos.
`page_id → resultado` é PK; `attempt_id` e `rendered_filename` são UNIQUE.
`id → região` é PK e `(page_id, reading_order)` chave candidata; vértices usam
`(region_id, vertex_index)`. FKs CASCADE e checks existentes são preservados.
Idiomas e job vêm de JOINs com projeto/attempt, não são duplicados no resultado.
Não adicionar índices redundantes, contadores ou documentos JSON paralelos.

A escrita remota deve conferir o attempt/page/project/job/par sob transação
exclusiva, recusar CANCELLED/FAILED/DEMO/conflitos, inserir resultado, regiões e
vértices e só então promover página/project a READY. Arquivo verificado é movido
antes do commit para nome exclusivo; rollback remove somente arquivos da tentativa.
Manifesto é preservado no diretório privado junto ao WebP, sem URL assinada.
ACK é derivado do resultado REMOTE confirmado e attempt: pode ser repetido
idempotentemente no restart até expiração, sem inventar coluna/flag de ACK.
Auto-open usa compare-and-set de `auto_opened_at`, antes da navegação.

O manifesto final 1.0 contém textos/geometry/overflow e hashes de OCR/tradução,
mas não o nome do modelo. Não inventar metadados opcionais: conservar NULL no
trio de metadados quando o contrato final não os informa. Não reclassificar DEMO.

## Estrutura incremental

Shared: download limitado por bytes, sem redirect/autorização para URLs assinadas.
Entities: parser final estrito e persistência remota no schema existente.
Feature: consulta/aquisição/ACK e ciclo foreground limitado; widget compõe
progresso e navegação. Page existente usa reader unificado e fallback textual.

## Rastreabilidade

| Critério | Task     | Evidência planejada                                  |
| -------- | -------- | ---------------------------------------------------- |
| AC-001   | TASK-001 | polling foreground, backoff, monotonicidade/restart  |
| AC-002   | TASK-002 | parser/stream/hash/move/transação SQLite e rollback  |
| AC-003   | TASK-003 | CAS auto-open, restart/back/rerender, rota           |
| AC-004   | TASK-004 | reader unificado REMOTE, original e overflow         |
| AC-005   | TASK-005 | aquisição da página capturada real, leitura sem rede |
| AC-006   | TASK-006 | erros/expiração/cancelamento, ACK perdido e retomada |
| AC-007   | TASK-007 | manifesto arte-only e mensagem localizada            |
| AC-008   | TASK-008 | i18n/RNTL/gates e verificação de dispositivos        |

## Checklist

- [x] TASK-001 — Polling e cinco marcos confirmados, foreground/restart.
- [x] TASK-002 — Download e parser estritos, commit remoto atômico sem migration.
- [x] TASK-003 — Abertura única persistida antes da navegação.
- [x] TASK-004 — Resultado/original/fallback no leitor atual sem overlay DEMO.
- [x] TASK-005 — Validar leitura offline da página real adquirida.
- [x] TASK-006 — Cobrir falhas de integridade/storage/cancelamento/TTL/ACK.
- [x] TASK-007 — Cobrir página sem texto, sem região inventada.
- [x] TASK-008 — Trilíngue/RNTL, cobertura individual e gates automatizados; validação física separada na TASK-009.
- [x] TASK-009 — Review/drift e matriz física Android, com foco observado e fala/gestos/Ver original confirmados pelo usuário.

## Limites

020 continua em andamento; produção pública/providers desabilitados. Reusar
artefatos reais autorizados, sem chamadas pagas/VMs ou mudanças de API/schema.

## Evidência executada

Ver [recibo nativo sanitizado](native-acquisition-2026-10-25.md).
Matriz Android executada: [evidência física](android-physical-2026-10-26.md).
TASK-009 concluída com confirmação humana de 2026-10-26: nomes falados,
exploração solicitada e Ver original funcionam; TalkBack desativado. Eventos ADB
não substituem o relato humano nem comprovam retorno ao controle de origem.
