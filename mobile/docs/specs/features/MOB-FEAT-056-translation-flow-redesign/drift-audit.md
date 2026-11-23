# Drift audit — MOB-FEAT-056

- Data: 2026-11-08
- Implementação auditada: working-tree sha256:37efb4eb23c7aa8fdccc27e34bac1ed26492edf1aeef50a1ad29e7067c19bcd7
- Status da feature: `verification-pending`

## Escopo auditado

- Spec (com a revisão D3), tasks, review, `pages/offline-translation` (fluxo, `SaveDestination`, modelo de etapas),
  painéis de `import-local-media`, `review-local-media-import`, `select-translation-languages`,
  `validate-local-media`, `create-translation-project`, `widgets/remote-processing` (lote e consentimento),
  `shared/ui` (`ActionSlot`, `StepBar`, `PageContainer`, `SelectField`), locales, `coverage.json` e registry.

## Divergências

| Severidade | Evidência | Classificação             | Ação    |
| ---------- | --------- | ------------------------- | ------- |
| —          | —         | sem divergência conhecida | nenhuma |

Verificações feitas:

- A divergência da AC-003 (validação depois da ordem × pré-requisito da 015) foi resolvida pela decisão D4: a spec
  passou a dizer que a validação roda logo depois dos idiomas.

- Nenhuma chamada remota antes do aceite na folha "Antes de enviar"; recusa não envia nada.
- Confirmações (`confirmedAt`, `languagesConfirmedAt`, validação) continuam gravadas só pela ação de cada etapa.
- Não portados do kit: resultados roteirizados, data fixa, destinos fixos e validação simulada.

## Contadores derivados

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate: 0

## Pendências de verificação

- TASK-012: escuro no iPhone 18 Pro feito em 2026-11-09 (etapa 3 e "Antes de enviar" em
  `docs/ui-captures/dark/design-kit-phase2-iphone18pro/`); faltam claro, fonte ampliada, 320 pt e Android físico.

## Revisão de 2026-11-11

AC-014 mapeado a tasks, review e evidências. Resumo, rodapé e destino da tradução revisado por inspeção e testes automatizados. A verificação física permanece aberta.

No emulador Android API 37, oito imagens sintéticas foram importadas e validadas. A rolagem horizontal mostrou a oitava miniatura. A busca vazia preservou Sem obra e a folha Antes de enviar permitiu recusar o envio.

## Revisão de 2026-11-11

As miniaturas continuam na FlatList horizontal. O teste verifica que o indicador foi ocultado e a coleção permanece completa.

Na API 37, o resumo rolou até a oitava miniatura sem indicador visível. Durante a primeira importação, o emulador registrou um timeout de foco. O rascunho permaneceu íntegro e o fluxo avançou após reabrir o app. A matriz física continua pendente.
