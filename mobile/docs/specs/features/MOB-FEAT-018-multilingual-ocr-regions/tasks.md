# Tasks — MOB-FEAT-018

- Spec: `spec.md`
- Status: `verification-pending`
- Gate: `open` (2026-09-24; `MOB-FEAT-017` em `verification-pending`)

## Rastreabilidade

| Critério | Tasks                        | Evidência esperada                                                 |
| -------- | ---------------------------- | ------------------------------------------------------------------ |
| AC-001   | TASK-001, TASK-004, TASK-006 | sete hints explícitos, recusa de código desconhecido               |
| AC-002   | TASK-002, TASK-004, TASK-006 | manifesto versionado, IDs, ordem, polígonos e hash                 |
| AC-003   | TASK-004, TASK-006, TASK-007 | fixtures horizontal/vertical e revisão humana; protocolo preparado |
| AC-004   | TASK-002, TASK-006           | manifesto vazio válido e transição atômica                         |
| AC-005   | TASK-002, TASK-004, TASK-006 | falhas sanitizadas, cancelamento e isolamento                      |
| AC-006   | TASK-002, TASK-003, TASK-006 | bucket privado, exclusão do original, cleanup e logs               |

## Checklist

- [x] TASK-001 — Criar contrato/validador de manifesto versionado e portas de OCR e storage; somente adapter falso nos testes, sem chamada real ao provider.
- [x] TASK-002 — Implementar revalidação da mídia, reserva única com lock, transições/cancelamento, Flyway V2, upload create-only, hash e cleanup de etapas abandonadas.
- [x] TASK-003 — Isolar perfil worker e rota interna; declarar Cloud Run privado e IAM mínimo, desabilitados por padrão, sem deploy.
- [ ] TASK-004 — Integração Vision regional, sete hints, mapper e piloto real entregues; concluir benchmark independente e referências/revisão competente, incluindo vertical e página sem texto real. Aprovação exploratória não substitui essa verificação.
- [ ] TASK-005 — Executar validação operacional completa com worker real, política/URLs aprovadas, logs e gates de produção antes de habilitar upload.
- [x] TASK-006 — Parcela offline de TASK-004: implementar client Vision v1 regional `us`, comando interno GCS, hints, mapeamento limitado de parágrafos, configuração fail-closed e gRPC falso; cobrir transações, concorrência, falhas e cancelamento sem chamada paga.
- [x] TASK-007 — Preparar protocolo de avaliação, catálogo de 18 posições e modelos privados de autorização, referência humana e relatório; sem obter imagens, executar OCR real ou afirmar qualidade.
- [x] TASK-008 — Parcela de TASK-004: preparar executor manual isolado, validar rodada simulada de imagem licenciada, guardar manifesto/relatório comparável e proteger opt-in real contra repetição automática. Não conclui benchmark nem validação operacional.

## Marco atual

O worker usa gRPC falso nos testes automatizados; execuções manuais anteriores
produziram capturas reais nos sete idiomas. A [consolidação auditada](evidence/ocr-consolidation.md)
separa 15 rodadas do catálogo, quatro controles tipográficos reais, simulações e
18 posições independentes ainda planejadas. A auditoria atual não usou credenciais
nem fez nova chamada. Runtime, worker cloud, gateway e layout continuam
desabilitados por padrão. TASK-004/005 abertas representam verificação externa,
não implementação omitida; a 018 não está concluída.

Na consolidação anterior, o gate candidato da 019 foi recusado pelo validador:
`approved` com gate aberto exige `tasks.md`, excluído daquele marco; foi aplicado
o fallback `in-progress`/`blocked`. Em 2026-09-27, Ruan aprovou a transição
documental com planejamento da 019. Após reconferir os hashes, a 018 passa a
`verification-pending` e a 019 a `approved/open`, com suas sete tasks abertas.
Nenhuma task técnica da 018 foi reaberta ou encerrada; TASK-004/005 continuam
pendentes. Nenhuma implementação de tradução ou chamada OCR decorre da transição.

A preparação de TASK-007 está no [protocolo OCR](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/protocol.md),
com [catálogo planejado](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/catalog.md)
e [modelos privados](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/templates.md).
As 18 posições do benchmark continuam sem referências independentes revisadas;
não são preenchidas automaticamente pelo piloto. Os relatos abaixo são históricos
dos respectivos marcos e não substituem o estado consolidado atual.

## Coleta e revisão — parcela de TASK-004, 2026-09-26

O [registro da coleta](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/collection-review.md)
documenta pesquisa pública inicial e protocolo 1.1: prioridade de quadrinhos,
alternativa de impressos ilustrados, categoria explícita, custódia local de até
30 dias e anotador/revisor distintos. Não reabre TASK-007 nem conclui TASK-004.

As 18 posições continuam planejadas: destino privado, acessos, equipe por idioma,
direitos por item e referências independentes ainda estão pendentes. Somente
18 amostras autorizadas e 18 referências revisadas vigentes fecham esta parcela;
resultados OCR e validação operacional permanecem fora da coleta.

## Executor manual — parcela de TASK-004, 2026-09-26

TASK-008 entrega o [executor e relatório local](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/manual-test.md).
Duas rodadas simuladas da página portuguesa 1 passaram pelo controller com filtros,
PostgreSQL 17 isolado e adapter Vision contra gRPC falso. Exportação exige estado
e hash confirmados; comparação não chama provider. O piloto licenciado de 12 JPEGs
continua distinto das 18 referências independentes, sem retificar conclusões históricas.
O caminho real tem opt-in por invocação e não foi executado. TASK-004/005 permanecem abertas.
