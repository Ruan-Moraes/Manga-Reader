# Tradução de obras — mapa de progresso em 2026-10-17

## Organização do repositório — 2026-10-24

A implementação e o piloto cloud estão pausados por solicitação do proprietário.
Os commits de organização preservam o código existente; não concluem features
nem autorizam upload, chamadas pagas, provisionamento ou publicação. Os valores
e autorizações descritos nas fotografias abaixo não são autorização vigente
para uma nova rodada; consultar os registros privados preservados antes de retomar.

Materiais e ferramentas exclusivos de performance mobile foram movidos, com
verificação de hashes, para `perfomance_app/`, pasta irmã do monorepo. C06 foi
preservada por orientação explícita. As referências históricas indicam esse
arquivo externo; a decisão de performance saiu do registry ativo. Checksum
renovado identifica conteúdo, sem renovar aceite funcional/físico.

Verificação desta organização: Maven geral offline com Docker e a toolchain
Java 25 já existente passou (gateway: 1.297 testes, 104 skips explícitos); web
`tsc -b`, FSD com polling e 29 testes afetados passaram; landing `tsc -b` e
97 testes passaram; mobile `pnpm check` passou com 116 suítes/892 testes.
Os skips nativos/opt-in não são execução cloud. A licença upstream `COPYING`
preserva o hash fixado, incluindo a linha em branco final apontada por
`git diff --check`. Links relativos mobile passaram; links antigos de auditorias
ausentes no índice geral permanecem uma limitação preexistente.

Este marco depende dos diretórios privados ignorados em `.local/`: mídia,
distribuições nativas, recibos, journals e reservas não foram versionados nem
removidos. Preservar esses arquivos ao retomar o piloto; o commit não habilita
seus operadores. Os modos de produção continuam desabilitados por padrão.

## Fotografia histórica de 2026-10-17

Auditoria paralela, somente leitura, solicitada por Ruan. Fotografia datada da
implementação e das evidências; não é promoção de status nem validação nova de
runtime. Fontes de verdade continuam sendo
[registry](../mobile/docs/specs/registry.md), specs/tasks/reviews e evidências de
cada feature. A investigação principal de isolamento não foi interrompida.

## Código entregue e trabalho restante

| Etapa                      | Estado formal          | O que já existe                                                                                      | Principal pendência                                                             |
| -------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 012–016: preparação local  | `implemented`          | Importação, organização, idiomas, validação e projeto privado                                        | Não representam tradução remota pronta                                          |
| 017: gateway/consentimento | `verification-pending` | Identidade, sessões, quota, idempotência, consulta/cancelamento, outbox, SQL e fundação mobile       | Operação, release/acessibilidade e disclosure de produção                       |
| 018: OCR                   | `verification-pending` | Worker/Vision regional, manifesto, limites, cancelamento e integridade; piloto real nos sete idiomas | Revisão independente, página vazia real, qualidade vertical e operação completa |
| 019: tradução contextual   | `verification-pending` | Adapter Google, contexto, associação por ID, validação, worker, manifesto e metadados locais         | Primeira tradução real, qualidade do contexto e operação                        |
| 020: renderização          | `in-progress/open`     | Codec/fontes, composição, overflow, worker e cleanup testados localmente                             | Segurança/distribuição, isolamento/memória, operação cloud e revisão visual     |
| 021: resultado no leitor   | `approved/blocked`     | Spec e primitives locais parciais                                                                    | Aquisição/download/hash, commit, ACK, abertura única e teste offline real       |

O [controller do worker](../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/presentation/OcrTaskController.java)
já encadeia OCR → tradução → renderização. Não falta escrever todo o pipeline.
Falta comprovar a composição real no ambiente admitido e completar sua entrega
ao aplicativo. Os modos continuam desabilitados por padrão; simulador e leitor
local não substituem a aquisição remota da 021.

## Indicador de tarefas, não percentual do produto

Contagem dos checkboxes em 17/10, sem ponderar tamanho ou risco:

| Feature                                                                                         | Concluídos/total |
| ----------------------------------------------------------------------------------------------- | ---------------: |
| [017](../mobile/docs/specs/features/MOB-FEAT-017-remote-processing-consent-gateway/tasks.md)    |            12/17 |
| [018](../mobile/docs/specs/features/MOB-FEAT-018-multilingual-ocr-regions/tasks.md)             |              6/8 |
| [019](../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/tasks.md) |              6/7 |
| [020](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/tasks.md)         |              4/8 |
| Total 017–020                                                                                   |  **28/40 (70%)** |

Isso **não significa 70% de prontidão do produto**: as tarefas têm tamanhos
desiguais, algumas abertas já contêm parcelas técnicas entregues e a 021 ainda
não possui tasks derivadas. Processamento de todas as páginas, lotes/retry e
onomatopeias também não estão incluídos nesse denominador.

## O que as evidências realmente demonstram

- [OCR](../mobile/docs/specs/features/MOB-FEAT-018-multilingual-ocr-regions/evidence/ocr-consolidation.md):
  15 rodadas reais do catálogo nos sete idiomas e quatro controles tipográficos
  reais. Não equivalem a 18 referências independentes aprovadas; não há página
  vazia real confirmada naquela consolidação.
- [Tradução](../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-consolidation-2026-10-03.md):
  adapter/transporte exercitados offline, sem primeira tradução real validada.
  Resposta do fake não prova naturalidade ou fidelidade.
- [Renderer](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-consolidation-2026-10-12.md):
  composição real local com OCR/tradução sintéticos nos cenários integrais.
  O envelope Linux de 8 GiB não admite automaticamente um alvo cloud de 1 GiB.
- [Pré-flight cloud](../api/apps/translation-gateway/docs/worker-isolation-read-preflight-2026-10-17.md)
  e [reconciliação posterior](../api/apps/translation-gateway/docs/worker-isolation-schema-reconciliation-2026-10-17.md):
  consultas reais de preparação, sem prova de montagem/renderer. Os ensaios do
  lifecycle/serial continuam sintéticos. A configuração Cloud Run testada não
  foi admitida; isso não demonstra impossibilidade universal de Cloud Run.

## Caminho crítico e previsão

1. Resolver e aprovar ambiente, controles de segurança, permissões, orçamento e
   capacidade. A prova mínima COS é de montagem, não do worker completo.
2. Executar o worker completo no alvo aprovado e sua matriz operacional:
   reentrega, cancelamento, commit ambíguo, SQL/GCS/Tasks, retenção e logs.
3. Validar a primeira tradução real e o resultado visual em português; corrigir
   problemas revelados, sem presumir qualidade a partir dos mocks.
4. Abrir e implementar a 021; testar aquisição, recuperação, ACK e leitor no
   aparelho, incluindo modo offline e preservação do original.
5. Fechar os gates de produção separados: legal/disclosure, release,
   acessibilidade, revisão competente e operação continuada.

**Previsão de baixa confiança: múltiplos dias/semanas, não poucas horas.** Não
há base medida para uma data final ou estimativa estreita: o maior risco está
na admissão/execução do alvo, não na contagem dos componentes. Reestimar após a
primeira execução do worker completo no ambiente aprovado. Espera por revisão
humana/legal ou aprovação operacional não deve ser confundida com esforço de
codificação. O [roteiro operacional](../api/apps/translation-gateway/docs/rendering-cloud-validation.md)
exige mais que HTTP 204 ou um processo com exit 0.

## O que depende de Ruan

Agora: instalações realmente necessárias e ativação final, quando alvo, custo e
efeitos estiverem apresentados. O teto continua **US$ 5 total**, não renovado a
cada rodada; reserva não é gasto faturado nem hard cap do provider.

Quando houver resultado real, forneceremos um roteiro curto para avaliar:

- português compreensível, texto legível, encaixe e fallback de overflow;
- comparação com original e preservação da imagem original;
- abrir, navegar, fechar/reabrir e ler offline no telefone;
- mensagens de falha e cancelamento compreensíveis.

Hashes, SQL, cgroups, IAM, retry e isolamento são responsabilidade técnica, não
validação manual de Ruan. Sua aprovação exploratória não será apresentada como
revisão linguística independente. Fidelidade em idiomas que ele não domina
continua pendente de revisão competente; traduzir para português não a comprova.

A [review da 020](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/review.md)
permanece `changes-requested`. Nenhuma etapa foi concluída ou desbloqueada por
este mapa; não foram usados credenciais, cloud ou providers para produzi-lo.
