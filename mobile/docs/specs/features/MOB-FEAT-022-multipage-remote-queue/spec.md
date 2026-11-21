---
id: MOB-FEAT-022
type: feature
title: Fila de várias páginas por projeto
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-021]
created: 2026-11-18
updated: 2026-11-21
supersedes: []
superseded_by: []
---

# MOB-FEAT-022 — Fila de várias páginas por projeto

## Objetivo

Traduzir todas as páginas de um projeto local, e não só a primeira. As páginas vão em ordem de leitura e em
lotes pequenos, com no máximo dois jobs ativos por vez. Os nomes ficam iguais no capítulo inteiro (memória do
capítulo do gateway). As páginas prontas podem ser lidas enquanto as outras continuam.

## Contexto e contratos relacionados

- Depende da `MOB-FEAT-021`: acompanhamento, download, commit e ACK de uma página. A 022 repete esse ciclo
  por página.
- Substitui a regra "somente a primeira página" da `MOB-FEAT-017`: `validateProject`, `snapshot` e o reenvio de
  `reconcile` escolhem a página da tentativa, não `[0]`.
- Gateway:
    - `PageSubmission.contextRef` (UUID opcional), documentado em
      `api/apps/translation-gateway/docs/architecture/chapter-memory.md`;
    - o servidor não ordena páginas, então o cliente envia as de um capítulo uma depois da outra.
- Cota: 20 páginas por dia por instalação, respondida com `429 quota-exceeded`. Ver
  `api/apps/translation-gateway/docs/architecture/quotas-and-plans.md`. Cotas por plano estão fora deste escopo.
- Atende o marco M4, "Incremental Multi-page Reader", de `docs/plans/product-implementation.md`.

## Requisitos e regras

- **Referência do capítulo:** cada projeto guarda um `context_ref` (SQLite v11; a v10 é da 021).
    - É um UUID sorteado com `randomUuid()`, nunca derivado de id local.
    - Projetos anteriores recebem o UUID no primeiro envio.
    - Toda página do projeto é enviada com o mesmo valor.
- **Ordem e janela:**
    - As páginas `DRAFT` são enviadas em ordem de `position`.
    - A próxima só é enviada quando a anterior foi aceita e confirmou o estágio `RENDERING` ou um posterior, ou
      seja, a tradução dela terminou.
    - Há no máximo dois jobs ativos por projeto e um único projeto enviando por vez na instalação.
- **Lote:**
    - Um lote tem no máximo cinco páginas.
    - O próximo lote começa quando todas as páginas do anterior estão `READY` ou `FAILED` e o app está em foreground.
    - O polling consulta só os jobs ativos.
- **Idempotência:** cada página mantém a própria tentativa e a própria `Idempotency-Key`. A unicidade de tentativa
  ativa por página é preservada.
- **Projeto:** página 2 em diante não exige o projeto em `DRAFT`. `acceptAndQueue` aceita o projeto em `QUEUED` ou
  `PROCESSING`.
- **Cota:**
    - Um `429` com `code=quota-exceeded` pausa a fila e grava o estado, em vez de rejeitar a página.
    - A interface mostra quantas páginas foram enviadas e que a cota do dia acabou.
    - A fila retoma sozinha depois da meia-noite UTC.
    - O reenvio com a mesma chave continua permitido, porque não consome cota.
- **Cancelar:** cancela o projeto. As tentativas ativas são canceladas uma a uma, e as páginas não enviadas
  continuam `DRAFT`. `confirmCancelled` age por página.
- **Tentar de novo:** vale por página com falha, sem refazer as prontas.
- **Leitura parcial:** páginas `READY` já abrem no leitor enquanto as demais processam. O projeto só fica `READY`
  quando todas as páginas estão prontas.
- **Consentimento:** um consentimento cobre o projeto inteiro. Os textos deixam de falar em "primeira página" e
  mostram a contagem.

## Casos de erro

- **Falha numa página:** a fila não para. As seguintes continuam, e a página fica com retry individual.
- **Cota esgotada:** a fila pausa sem perder a ordem nem repetir páginas enviadas.
- **Restart, background ou perda de rede:** ao voltar, a fila reconcilia as tentativas antes de enviar outra
  página.
- **Projeto apagado ou cancelado durante a fila:** nenhuma página nova é enviada.

## Critérios de aceite

### AC-001 — Ordem e janela

Dado um projeto de N páginas, as submissões seguem `position` e nunca há mais de dois jobs ativos do projeto.

### AC-002 — Mesmo capítulo

Todas as submissões do projeto levam o mesmo `contextRef`, que é um UUID guardado localmente e não derivado do id.

### AC-003 — Lotes e polling limitados

Um lote tem no máximo cinco páginas, o próximo só começa quando o anterior termina e o polling consulta só os jobs
ativos.

### AC-004 — Cota pausa e retoma

`quota-exceeded` pausa a fila com estado persistido e mensagem localizada, e a fila retoma depois da virada UTC sem
duplicar páginas.

### AC-005 — Cancelar e repetir por página

Cancelar interrompe o projeto sem enviar mais páginas. "Tentar de novo" refaz só a página com falha.

### AC-006 — Leitura parcial

Páginas prontas abrem no leitor enquanto outras processam. O projeto vira `READY` só com todas prontas.

### AC-007 — UX trilíngue

O progresso agregado, os estados por página, a pausa por cota e os erros aparecem em pt-BR, en-US e es-ES, com
tokens e acessibilidade.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                 |
| -------- | -------------------------------------------------------- |
| AC-001   | Jest do controller da fila com transporte falso          |
| AC-002   | Jest de repositório v10 e das submissões                 |
| AC-003   | Jest com relógio falso contando chamadas                 |
| AC-004   | Jest com 429 `quota-exceeded`, restart e virada UTC      |
| AC-005   | Jest de cancelamento e retry por página                  |
| AC-006   | Jest de repositório e RNTL do leitor com projeto parcial |
| AC-007   | RNTL do painel nos três locales                          |

## Gate de implementação

- Estado: `open` em 2026-11-18, depois de a `MOB-FEAT-021` chegar a `verification-pending`.
- Dependência: `MOB-FEAT-021`, que precisa estar implementada ou em verificação.
- Motivo: a fila repete o ciclo de acompanhamento, download e ACK por página.

## Fora de escopo

- Cotas por plano, assinaturas e saldo nas capabilities.
- Prioridade pela posição do leitor; a ordem é a de leitura.
- Execução em background ilimitada e push notification.
- Vários projetos enviando ao mesmo tempo.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-18

Aprovada no chat ("Pode implementar"), depois de Ruan ler o resumo desta spec.

## Integração com a pipeline volátil — 2026-11-21

Ruan escolheu portar a pilha para a pipeline volátil ("adota o primeiro caminho"). No contrato v2 a página entra e
a traduzida sai na mesma resposta: não há jobs, polling, URL assinada nem ACK. Por isso a fila v1 desta spec
(`remoteQueue`, dois jobs ativos, lotes de cinco, pausa persistida) foi substituída pelo lote de capítulo da
`MOB-FEAT-055`/`066`/`067`, que já cumpria o mesmo objetivo sobre o v2. Os critérios ficam assim:

| Critério | No v2                                                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001   | O lote envia as páginas em ordem de leitura, uma de cada vez (menos que o limite de duas).                                                                            |
| AC-002   | Implementado aqui: `contextRef` guardado no projeto (SQLite v12) vai no cabeçalho `X-Context-Ref`.                                                                    |
| AC-003   | Sem polling: cada página recebe o resultado na própria resposta; a próxima só sai depois.                                                                             |
| AC-004   | `quota-exceeded` para o lote sem reenviar páginas, com mensagem localizada; a retomada é manual (a pausa persistida e a retomada automática da v1 não existem no v2). |
| AC-005   | Interromper e tentar de novo só a página com falha (`PageRetryIndicator`).                                                                                            |
| AC-006   | Implementado aqui: o leitor mostra o original da página sem resultado e atualiza a cada 4 s.                                                                          |
| AC-007   | Painel do lote nos três idiomas.                                                                                                                                      |

A implementação v1 continua no histórico do git (pilha `feat/glossary-names-and-reader-fade`).
