---
id: MOB-FEAT-018
type: feature
title: OCR multilíngue e regiões de texto
status: approved
implementation_gate: blocked
blocked_by: [MOB-FEAT-017]
created: 2026-08-15
updated: 2026-08-15
supersedes: []
superseded_by: []
---

# MOB-FEAT-018 — OCR multilíngue e regiões de texto

## Objetivo

Transformar a primeira página aceita pelo gateway em regiões de texto
estruturadas, ordenadas e vinculadas à página, usando o idioma de origem
confirmado sem inventar detecção automática.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-017`, que define consentimento, sessão anônima,
  idempotência, upload, consulta e cancelamento.
- Atende RF-TRN-001..008 e controla RSK-001/002/024/033.
- Usa Cloud Vision `DOCUMENT_TEXT_DETECTION` pelo worker separado; o mobile não
  conhece credenciais, endpoint ou payload nativo do provider.
- Os idiomas de origem são `ja`, `en`, `es`, `ko`, `zh-Hans`, `zh-Hant` e
  `pt-BR`. A origem selecionada vira language hint; não há troca silenciosa.
- Esta spec produz regiões e estágio OCR; tradução pertence a `MOB-FEAT-019`.

## Requisitos e regras

- O worker revalida assinatura, MIME, bytes e dimensões antes de chamar OCR.
- A chamada é online e usa endpoint regional dos EUA, fato refletido no
  disclosure de `MOB-FEAT-017`.
- Resposta do provider é tratada como não confiável: limites de blocos, texto,
  vértices, coordenadas e payload total são aplicados antes do mapeamento.
- Cada região recebe ID opaco estável no job, ordem inteira única, texto fonte e
  polígono de quatro vértices normalizado ao espaço da imagem original.
- Blocos/parágrafos do provider são a unidade inicial. Nenhuma heurística afirma
  detectar balão, personagem ou onomatopeia.
- A ordem inicial preserva a sequência do provider; empates/ausências usam regra
  determinística por posição e direção de escrita, registrada no contrato.
- Texto horizontal e vertical são aceitos quando o provider os retornar. A
  qualidade de japonês vertical permanece `verification-pending` até benchmark.
- Região vazia, fora dos limites, duplicada ou com polígono degenerado é
  rejeitada individualmente; inconsistência que impeça associação segura falha
  a etapa inteira.
- Página sem texto é resultado válido com lista vazia e segue para tradução e
  renderização sem ser marcada `FAILED`.
- O manifesto efêmero contém somente regiões necessárias. PostgreSQL e logs não
  armazenam texto; o original remoto é apagado ao terminar ou falhar o OCR, com
  failsafe máximo de uma hora.
- O gateway publica estágio `OCR` somente enquanto essa etapa estiver ativa e
  avança para `TRANSLATING` apenas após manifesto íntegro persistido.

## Plano de persistência

No gateway, texto/regiões ficam em manifesto privado efêmero no bucket. A tabela
`processing_job_stages` guarda somente estado, timestamps e erro sanitizado.

No mobile, a persistência final é normalizada por `MOB-FEAT-019/021`:
`text_regions` possui PK própria e `UNIQUE(page_id, reading_order)`;
`text_region_vertices` usa PK `(region_id, vertex_index)` e FK cascade. Polígono
não usa JSON porque vértices têm ordem e integridade próprias.

## Casos de erro

- Language hint ausente/incompatível falha antes do provider.
- Timeout ou indisponibilidade produz erro `ocr-unavailable`, sem traduzir ou
  renderizar dados parciais.
- Resposta excedente, coordenada inválida ou texto sem região produz
  `ocr-invalid-response` e preserva original local.
- Cancelamento solicitado durante a chamada é observado assim que o provider
  retorna; nenhuma etapa seguinte começa.
- Cleanup remove original e manifesto parcial mesmo em crash/reentrega.

## Critérios de aceite

### AC-001 — OCR usa a origem confirmada

Cada um dos sete códigos é convertido explicitamente para o hint suportado, sem
auto-detecção ou fallback silencioso.

### AC-002 — Regiões estruturadas e estáveis

Texto, ID, ordem e quatro vértices válidos permanecem associados à mesma página
e sobrevivem ao envelope entre OCR e tradução.

### AC-003 — Escritas horizontal e vertical

Fixtures autorizadas provam mapeamento das duas orientações; qualidade real de
japonês vertical fica pendente até avaliação humana.

### AC-004 — Página sem texto é válida

Uma imagem decodificável sem regiões produz manifesto vazio e continua sem erro.

### AC-005 — Falha fechada e localizada

Timeout, payload hostil ou geometria inválida não produzem texto parcial nem
alteram páginas além da primeira.

### AC-006 — Conteúdo efêmero e observabilidade segura

Imagem/texto não entram no PostgreSQL ou logs; original é apagado após OCR e os
eventos contêm apenas etapa, duração em bucket e código sanitizado.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                              |
| -------- | --------------------------------------------------------------------- |
| AC-001   | unitário parametrizado dos sete hints e recusa de código desconhecido |
| AC-002   | contract test Vision→manifesto com IDs, ordem e polígonos             |
| AC-003   | fixtures horizontal/vertical + revisão humana Android                 |
| AC-004   | fixture arte-only produz zero regiões e sucesso                       |
| AC-005   | fault injection de timeout/payload/geometria e cancelamento           |
| AC-006   | integração de cleanup e inspeção de banco/logs                        |

## Gate de implementação

- Estado: `blocked`
- Dependência: `MOB-FEAT-017` implementada ou em verificação.
- A aprovação registra o contrato; não autoriza tasks enquanto o gateway ainda
  não fornecer sessão, upload idempotente e ambiente de teste.

## Fora de escopo

- Tradução, glossário, correção humana ou detecção automática de idioma.
- Detecção semântica de balões/personagens/onomatopeias.
- Renderização, reader, scheduler multi-page e retry cobrado.
- Metas numéricas de qualidade antes do benchmark.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-15

Aprovação registrada junto ao plano do vertical slice. O gate permanece
bloqueado pela execução de `MOB-FEAT-017`.
