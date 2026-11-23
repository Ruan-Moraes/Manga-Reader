---
id: MOB-FEAT-019
type: feature
title: Tradução contextual por par de idiomas
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-018]
created: 2026-08-15
updated: 2026-11-02
supersedes: []
superseded_by: []
---

# MOB-FEAT-019 — Tradução contextual por par de idiomas

## Decisão vigente e aprovação da revisão

Esta versão substitui integralmente as regras anteriores deste arquivo sobre
conteúdo remoto. A direção foi aprovada explicitamente por Ruan em
2026-11-01: processamento volátil em memória, entrega ao cliente e manutenção
de logs operacionais sanitizados. A solicitação inclui substituir o conteúdo
anterior das especificações. Não se trata de aprovação da implementação.

Referências normativas: [MOB-DEC-008](../../../decisions/MOB-DEC-008-volatile-processing.md)
e [arquitetura do gateway](../../../../../docs/volatile-processing-architecture.md).
A [versão anterior](evidence/pre-volatile-spec-2026-11-01.md) e as provas
anteriores permanecem históricas, sem herdar seus aceites para este transporte.

## Objetivo

Traduzir conjuntamente as regiões OCR da primeira página na mesma sessão
volátil, preservando IDs, ordem e contexto para renderização segura, sem
persistir texto ou manifesto no servidor.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-018`; atende RF-TRN-009..015/019 e RF-LNG-003..006.
- Usa Cloud Translation Advanced `general/translation-llm` por adapter no
  gateway, endpoint global `translate.googleapis.com`, parent/modelo em
  `locations/global` e seleção explícita de modelo. Sem fallback NMT.
- Tradução global não oferece residência geográfica fixa; OCR permanece `us`.
- Os sete códigos são `ja`, `en`, `es`, `ko`, `zh-Hans`, `zh-Hant`, `pt-BR`,
  formando 42 pares direcionais diferentes. Capabilities limita o conjunto ativo.
- Naturalidade e nomes próprios dependem de benchmark, sem SLO inventado.

## Requisitos e regras

- Publicar e processar apenas pares realmente habilitados; origem e destino
  são confirmados e nunca trocados para contornar indisponibilidade.
- Receber todas as regiões ordenadas da página em uma operação contextual
  síncrona, com marcadores opacos que preservam associação por ID.
- Antes da chamada cobrada, medir a requisição completa, incluindo marcadores e
  instruções, e recusar mais de 30.000 pontos de código Unicode. Não dividir,
  truncar ou mudar modelo/endpoint silenciosamente para caber.
- Resposta deve conter exatamente os IDs esperados uma vez cada. Ausência,
  duplicação, item extra ou associação inválida impede render da página inteira.
- Limitar texto por região/página; tratar HTML/markup como dado, nunca código.
- Preservar distinção `zh-Hans`/`zh-Hant` em request, resultado, fixtures e UI.
  Nomes próprios são preservados quando não houver evidência para tradução.
- Lista vazia não chama provider e produz tradução vazia válida.
- Validar integralmente a tradução em memória antes de iniciar o renderer.
  Texto fonte, tradução e manifesto só existem na sessão; não criar arquivo,
  registro de conteúdo, objeto remoto, fila, glossário persistente ou cache.
- Não repetir chamada cobrada automaticamente após timeout/replay/restart.
  Nova execução exige ação explícita e nova tentativa conforme a 017.
- Logs e recibos contêm somente metadados permitidos; não manter mensagens
  brutas do provider, prompts, texto ou manifesto para auditoria.

## Dados e persistência local

O gateway persiste somente recibos operacionais sanitizados. A passagem OCR →
tradução → render mantém a mesma posse limitada de memória e vínculo de operação,
sem recuperação de conteúdo após encerramento.

O aplicativo preserva texto fonte/traduzido, ordem, geometria e metadados
opcionais de versão/modelo em tabelas normalizadas existentes, somente no commit
do resultado final definido na 021. O destino deriva do projeto; região é chave
candidata dos dados locais da tradução, sem documentos paralelos de conteúdo.
Alterar schema exige plano e migration próprios; não presumir mudança necessária.

## Casos de erro

- Par removido entre capabilities e execução falha sem trocar idiomas.
- Resposta parcial/incompatível nunca segue ao renderer.
- Timeout depois do provider registra erro sanitizado e não repete cobrança.
- Payload acima do limite é recusado antes da chamada e não produz tradução parcial.
- Tradução vazia para região não vazia falha, salvo código explícito de conteúdo
  intraduzível previsto no contrato validado.
- Interrupção observada impede o próximo estágio; não promete cancelamento de
  chamada externa já em andamento ou recuperação após restart.

## Critérios de aceite

### AC-001 — Matriz direcional explícita

Os 42 pares podem ser representados, mas só pares habilitados são processados;
origem, destino e modelo não são substituídos silenciosamente.

### AC-002 — Contexto de página

Todas as regiões ordenadas são enviadas juntas e retornam associadas aos
mesmos IDs na mesma sessão, permitindo coerência além de uma frase isolada.

### AC-003 — Variantes chinesas preservadas

Simplificado e tradicional têm códigos e targets distintos em request,
resultado, fixtures e UI.

### AC-004 — Validação integral do resultado

ID ausente/extra/duplicado, texto excedente ou payload inválido falha fechado,
sem iniciar renderização ou entregar manifesto parcial.

### AC-005 — Sem texto e interrupção honestos

Lista vazia evita cobrança; cancelamento observado e indisponibilidade impedem
avanço falso e nunca inventam tradução ou cancelamento remoto confirmado.

### AC-006 — Conteúdo volátil e custo controlado

Texto e manifesto não são persistidos no servidor ou logs; replay/restart não
repete chamada cobrada. Requisição excedente é recusada antes do provider, e
somente a primeira página é processada.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                              |
| -------- | --------------------------------------------------------------------- |
| AC-001   | matriz direcional, capabilities e recusa de modelo/par não habilitado |
| AC-002   | página contextual e IDs/ordem em memória                              |
| AC-003   | fixtures separadas Hans/Hant e paridade dos códigos                   |
| AC-004   | payloads/IDs/textos hostis e zero início de render inválido           |
| AC-005   | lista vazia, indisponibilidade e retorno tardio/interrupção           |
| AC-006   | limite do modelo, replay/restart e inspeção de I/O/logs               |

Provas do fluxo anterior são referências históricas e exigem revalidação quando
a interface, o ciclo de vida ou a posse dos buffers mudar. Aprovação visual ou
linguística anterior pode orientar fixtures, sem comprovar privacidade, entrega
ou recuperação da sessão atual.

## Gate de implementação

- Estado: `open` em 2026-11-02; dependência `MOB-FEAT-018` em `verification-pending`.
- A revisão independente confirmou a integração inline técnica, com benchmark
  humano e admissão/políticas explicitamente abertos. O gate documental foi
  validado antes desta abertura sequencial, autorizada por Ruan/DEC-008.
- A aprovação do requisito não comprova qualidade real ou operação pública.
  O plano corrente deriva os seis ACs e não herda aceites do transporte antigo.
- A autorização de continuidade de Ruan permite abrir o gate e planejar a
  execução quando todas as dependências atingirem `implemented` ou
  `verification-pending`, com evidência da revisão vigente. Não declarar
  código ausente como verificação pendente para abrir a cadeia.

## Fora de escopo

- Glossário persistente, edição, lote, retry automático pago, mudança silenciosa de modelo.
- Renderer/reader dentro desta feature ou provider direto no cliente.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-01

Ruan aprovou explicitamente implementar processamento estritamente volátil,
retorno ao cliente e logs operacionais padrão sanitizados; depois pediu substituir
as especificações antigas por esse requisito. Aprovação inicial do slice em
2026-08-15 permanece no histórico. Esta revisão não autoriza deploy, chamadas
pagas, nova infraestrutura ou publicação de textos legais sem o fluxo pertinente.
