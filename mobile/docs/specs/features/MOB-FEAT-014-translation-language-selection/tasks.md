# Tasks — MOB-FEAT-014

- Spec: `spec.md`
- Status da spec: `implemented`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-013`

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                      |
| -------- | ------------------ | ------------------------------------------------------------------------ |
| AC-001   | TASK-001, TASK-013 | Unitário dos 42 pares e RNTL provando independência                      |
| AC-002   | TASK-002           | RNTL dos defaults, prioridade de PT-BR e copy honesta                    |
| AC-003   | TASK-003, TASK-014 | Repository e integração de alteração/reload com códigos canônicos        |
| AC-004   | TASK-004, TASK-013 | Modelo, repository e UI rejeitando par/código inválido sem mutação       |
| AC-005   | TASK-005           | Confirmação com pré-condições e ausência de processamento fictício       |
| AC-006   | TASK-006           | Repository/RNTL validando invalidações e preservação do par              |
| AC-007   | TASK-007           | Hook/controller com falha, retry, serialização e reload consistente      |
| AC-008   | TASK-008           | Integração isolando UI locale, content locales, `Accept-Language` e Core |
| AC-009   | TASK-009, TASK-015 | RNTL trilíngue, semântica, estados, tokens e layout compacto             |
| AC-010   | TASK-010, TASK-014 | SQLite legado→v6, revisão de `zh`, constraints e preservação sem perda   |

## Checklist

- [x] TASK-001 — Modelar os seis códigos canônicos e validar os 30 pares direcionais sem acoplar os campos.
- [x] TASK-002 — Exibir JA → PT-BR como sugestão editável e priorizar PT-BR no seletor de destino sem alegar detecção.
- [x] TASK-003 — Persistir origem/destino independentes no draft e restaurá-los após reload.
- [x] TASK-004 — Rejeitar mesmo idioma e códigos desconhecidos na UI, modelo, repository e constraints SQLite.
- [x] TASK-005 — Confirmar idiomas somente após revisão válida, sem iniciar ou simular processamento.
- [x] TASK-006 — Invalidar confirmação de idiomas ao mudar o par e ambas as confirmações ao editar páginas, preservando escolhas.
- [x] TASK-007 — Serializar mutações, restaurar estado persistido em erro e oferecer retry localizado.
- [x] TASK-008 — Provar isolamento de idioma da interface, cadeia de conteúdo, `Accept-Language`, conta e Core.
- [x] TASK-009 — Adicionar i18n pt-BR/en-US/es-ES, semântica acessível, tokens e layout compacto.
- [x] TASK-010 — Evoluir SQLite v2→v3 atomicamente e testar instalação limpa, upgrade, constraints, FKs e rollback.
- [x] TASK-011 — Atualizar coverage/README, executar gates e reconciliar os documentos informativos.
- [x] TASK-012 — Produzir review e drift audit com checksum reproduzível e status comprovado.
- [x] TASK-013 — Substituir `zh` por `zh-Hans`/`zh-Hant` no domínio, checks e teste parametrizado dos 42 pares.
- [x] TASK-014 — Integrar a migration SQLite v6, preservar dados e exigir revisão explícita de seleções/projetos `zh` legados.
- [x] TASK-015 — Atualizar labels, seletores e testes nos três locales para as duas variantes chinesas.
- [x] TASK-016 — Atualizar coverage, executar gates e produzir novo review/drift audit antes de restaurar `implemented`.

## Ordem de execução

1. Schema SQLite v3, modelo e testes em `entities/local-media-import`.
2. Controller/hook/UI em `features/select-translation-languages`.
3. Composição em `pages/offline-translation` e i18n nos três locales.
4. Coverage, gates, review e drift audit.

## Riscos e bloqueios

- O gate está aberto porque `MOB-FEAT-013` está `implemented`.
- A migração deve preservar itens, ordem, arquivos e `confirmed_at`; não pode
  resetar o banco nem deixar a FK dos itens apontando para tabela temporária.
- `zh` deixa de ser opção válida; migração não pode promovê-lo silenciosamente a
  escolha confirmada. Capabilities reais continuam autoridade sobre pares.
- OCR, Core, rede, provider, quota e tradução permanecem fora destas tasks.
