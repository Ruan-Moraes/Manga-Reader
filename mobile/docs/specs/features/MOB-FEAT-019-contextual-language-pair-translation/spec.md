---
id: MOB-FEAT-019
type: feature
title: Tradução contextual por par de idiomas
status: approved
implementation_gate: blocked
blocked_by: [MOB-FEAT-018]
created: 2026-08-15
updated: 2026-08-15
supersedes: []
superseded_by: []
---

# MOB-FEAT-019 — Tradução contextual por par de idiomas

## Objetivo

Traduzir conjuntamente as regiões OCR da primeira página entre qualquer par
direcional confirmado dos sete idiomas, preservando IDs, ordem e contexto de
página para que o resultado possa ser renderizado com segurança.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-018` e atende RF-TRN-009..015/019 e RF-LNG-003..006.
- Usa Cloud Translation Advanced `general/translation-llm` por adapter do
  gateway; provider/modelo não aparecem como opção na UI.
- Controla RSK-003/011/013/022/033. Naturalidade e nomes próprios continuam
  sujeitos a benchmark, sem SLO inventado.
- O conjunto é `ja`, `en`, `es`, `ko`, `zh-Hans`, `zh-Hant`, `pt-BR`; origem e
  destino diferentes geram 42 pares.

## Requisitos e regras

- Capabilities publica somente pares realmente habilitados. Par ausente é
  bloqueado antes do consentimento/upload.
- A tradução recebe todas as regiões ordenadas da página em uma mesma operação
  contextual, com marcadores opacos que preservam associação região→resultado.
- A resposta deve conter exatamente os IDs esperados uma vez cada; ID ausente,
  extra, duplicado ou reordenado sem associação válida falha a etapa inteira.
- Texto fonte e tradução são limitados por região e por página. HTML/markup do
  provider é tratado como dado, nunca renderizado ou executado pelo mobile.
- `zh-Hans` mapeia para chinês simplificado e `zh-Hant` para tradicional; não há
  conversão implícita entre variantes.
- Nomes próprios são preservados quando não houver evidência suficiente para
  tradução. Glossário e edição pertencem a M6.
- Lista vazia de regiões não chama provider e produz resultado vazio válido.
- O gateway avança de `TRANSLATING` para `RENDERING` somente após validar e
  persistir o manifesto traduzido efêmero.
- Não há retry automático de chamada cobrada. Falha fica vinculada à etapa e ao
  mesmo job; retry de página pertence a `MOB-FEAT-024`.
- Imagem e textos não entram em logs, analytics ou PostgreSQL. O manifesto é
  removido após ACK do mobile ou em uma hora.

## Plano de persistência

O gateway conserva o manifesto traduzido apenas no bucket efêmero. No SQLite
final, `text_regions` usa `region_id` como PK/FK cascade e guarda texto fonte,
texto traduzido, versão do contrato/modelo e timestamp. Como existe exatamente
um destino por projeto, `target_language` deriva do projeto e não é duplicado
por região.

Dependências funcionais: `region_id → tradução/metadados`; a determinante é chave
candidata. O conteúdo local é necessário para leitura/fallback offline.

## Casos de erro

- Par removido entre capabilities e execução falha sem substituir idiomas.
- Resposta parcial/incompatível não segue para renderer.
- Timeout após provider permanece falha da etapa sem nova cobrança automática.
- Tradução vazia para região não vazia é inválida, salvo código explícito de
  conteúdo intraduzível aceito pelo contrato.
- Cancelamento impede início da tradução ou interrompe o pipeline na primeira
  fronteira segura posterior à chamada em andamento.

## Critérios de aceite

### AC-001 — Matriz direcional explícita

Os 42 pares podem ser representados, mas somente capabilities habilitadas são
processadas e origem/destino nunca são trocados silenciosamente.

### AC-002 — Contexto de página

Todas as regiões ordenadas são enviadas juntas e retornam associadas aos mesmos
IDs, permitindo coerência além de uma frase isolada.

### AC-003 — Variantes chinesas preservadas

Simplificado e tradicional têm códigos e targets distintos em request,
resultado, fixtures e UI.

### AC-004 — Validação integral do resultado

ID ausente/extra/duplicado, texto excedente ou payload inválido falha fechado e
não inicia renderização.

### AC-005 — Sem texto e cancelamento honestos

Manifesto vazio evita cobrança; cancelamento e indisponibilidade mantêm estado e
erro verdadeiros sem tradução fictícia.

### AC-006 — Conteúdo efêmero e custo controlado

Não há texto remoto em banco/log, retry cobrado automático ou processamento além
da primeira página.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                     |
| -------- | ------------------------------------------------------------ |
| AC-001   | parametrizado dos 42 pares e capabilities parciais           |
| AC-002   | contract test de associação/contexto com múltiplas regiões   |
| AC-003   | fixtures `zh-Hans`/`zh-Hant` em ambas as direções relevantes |
| AC-004   | payloads ausente/extra/duplicado/excedente                   |
| AC-005   | lista vazia, timeout e cancelamento entre etapas             |
| AC-006   | inspeção de calls, storage, banco e logs                     |

## Gate de implementação

- Estado: `blocked`
- Dependência: `MOB-FEAT-018` implementada ou em verificação.
- Conta Google Cloud, API habilitada e fixture sem cobrança surpresa são
  evidências de execução, não autorização para pular a dependência normativa.

## Fora de escopo

- Glossário, edição, feedback, transliteração e detecção automática.
- Tradução de lote, retry de página, cobrança/monetização e modelos premium.
- Renderização visual ou reader.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-15

Aprovação registrada junto ao plano do vertical slice. O gate permanece
bloqueado pela execução de `MOB-FEAT-018`.
