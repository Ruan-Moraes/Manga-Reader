---
id: MOB-FEAT-027
type: feature
title: Migração e recuperação dos dados locais
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-025, MOB-FEAT-026]
created: 2026-09-08
updated: 2026-09-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-027 — Migração e recuperação dos dados locais

## Objetivo

Evoluir SQLite v7 para v8 e recuperar escritas interrompidas entre banco e
filesystem sem perda silenciosa dos originais.

## Contexto e contratos relacionados

- Consolida o schema de resultados e progresso de `MOB-FEAT-025/026`.
- Reutiliza o banco e arquivos privados de `MOB-FEAT-012..017`.
- Controla RSK-008/028; backup cross-device permanece política futura.

## Requisitos e regras

- Migration v8 é forward-only, transacional e preserva integralmente v7.
- Staging é limpo no bootstrap; arquivos finais sem referência são órfãos
  removíveis; metadado sem arquivo íntegro é invalidado sem tocar no original.
- Escrita promove arquivo validado antes do commit SQLite; exclusão remove DB
  antes de arquivos para evitar referência válida apontando para dado apagado.
- Hash é verificado ao abrir, não por varredura recorrente no bootstrap.
- Backup automático Android é desabilitado para dados privados.

## Casos de erro

- Falha de migration executa rollback e mantém `user_version` anterior.
- Crash entre promoção e commit deixa somente arquivo órfão recuperável.
- Hash divergente remove resultado/regiões inválidos e permite regeneração demo.

## Critérios de aceite

### AC-001 — Upgrade preservador

Banco novo e upgrade v7→v8 produzem schema íntegro sem perder projetos.

### AC-002 — Recovery determinístico

Staging, órfãos, arquivos ausentes e hash inválido têm resolução reproduzível.

### AC-003 — Exclusão e privacidade

Cascade e limpeza não cruzam projetos e backup Android permanece desabilitado.

### AC-004 — Sem trabalho recorrente caro

Bootstrap não calcula hashes de toda a biblioteca e recovery termina.

## Estratégia de evidência

| Critério | Teste/evidência esperada                        |
| -------- | ----------------------------------------------- |
| AC-001   | fixtures fresh/v7, rollback e foreign_key_check |
| AC-002   | fault injection DB/files e restart              |
| AC-003   | cascade, isolamento e manifesto Expo            |
| AC-004   | spies de I/O/hash e timers abertos              |

## Gate de implementação

- Estado: `open`, implementação concluída e verificação física pendente
- Dependências: `MOB-FEAT-025`, `MOB-FEAT-026`
- Motivo: recovery cobre os dados introduzidos pelas duas features.

## Fora de escopo

- Backup/restauração entre aparelhos, iCloud, Google Drive ou sincronização.
- Migração da marca anterior e recuperação forense de mídia corrompida.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-09-08
