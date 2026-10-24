---
id: MOB-FEAT-050
type: feature
title: Simulador local de tradução para desenvolvimento
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-016]
created: 2026-09-08
updated: 2026-09-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-050 — Simulador local de tradução para desenvolvimento

## Objetivo

Permitir validar leitor, biblioteca e continuidade local antes do gateway real,
gerando resultados explicitamente simulados a partir das páginas importadas.

## Contexto e contratos relacionados

- Depende do projeto privado de `MOB-FEAT-016`.
- Não implementa nem desbloqueia `MOB-FEAT-018..021`.
- Usa os mesmos contratos locais que poderão receber resultados remotos futuros.

## Requisitos e regras

- A ação existe somente com `__DEV__ === true` e o controller também recusa
  execução fora de desenvolvimento.
- Cada original é copiado para o namespace privado de resultados, validado e
  associado a texto/região determinísticos com `sourceKind: DEMO`.
- A interface identifica permanentemente a demonstração e nunca chama HTTP,
  capabilities, consentimento, sessão ou tentativa remota.
- Fila, OCR, tradução, renderização e salvamento podem ser apresentados como
  etapas simuladas, sem ETA, porcentagem ou trabalho recorrente após desmontar.
- Reexecução é idempotente e preserva o original.

## Casos de erro

- Projeto ausente, página inválida ou arquivo original indisponível não produz
  `READY` e retorna erro localizado.
- Falha de cópia ou persistência remove staging e mantém dados previamente
  íntegros.
- Build de produção não expõe ação nem aceita invocação programática.

## Critérios de aceite

### AC-001 — Isolamento de desenvolvimento

O simulador só pode ser acionado em desenvolvimento e efetua zero requests.

### AC-002 — Resultado demonstrativo honesto

Originais geram resultados/ regiões determinísticos identificados como demo.

### AC-003 — Persistência segura e idempotente

Arquivos são promovidos antes do commit e falhas não corrompem o projeto.

### AC-004 — UX trilíngue

Etapas, avisos, erros e ações possuem pt-BR, en-US e es-ES acessíveis.

## Estratégia de evidência

| Critério | Teste/evidência esperada                          |
| -------- | ------------------------------------------------- |
| AC-001   | controller prod/dev e spy de rede vazio           |
| AC-002   | integração multi-page com resultado/regiões       |
| AC-003   | idempotência e fault injection em arquivos/SQLite |
| AC-004   | RNTL e paridade dos três locales                  |

## Gate de implementação

- Estado: `open`, implementação concluída e verificação física pendente
- Dependência: `MOB-FEAT-016` implementada
- Motivo: o simulador consome somente projetos locais já persistidos.

## Fora de escopo

- OCR, tradução, renderização, upload, polling, ACK ou benchmark de qualidade.
- Disponibilização da demonstração em builds de produção.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-09-08
