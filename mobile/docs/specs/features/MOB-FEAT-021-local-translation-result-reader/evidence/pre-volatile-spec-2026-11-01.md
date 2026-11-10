# Histórico anterior à revisão volátil — MOB-FEAT-021 / spec.md

> Fotografia preservada em 2026-11-01. Este registro descreve o desenho
> substituído, inclusive seus estados, conclusões e restrições da época. Não é
> contrato vigente nem evidência de implementação do processamento em memória.
> Contrato atual: [spec](../spec.md). Os materiais de prova citados são históricos.

---

id: MOB-FEAT-021
type: feature
title: Leitor local do resultado traduzido
status: in-progress
implementation_gate: open
blocked_by: [MOB-FEAT-019, MOB-FEAT-026, MOB-FEAT-027, MOB-FEAT-051]
created: 2026-08-15
updated: 2026-11-01
supersedes: []
superseded_by: []

---

# MOB-FEAT-021 — Leitor local do resultado traduzido

## Objetivo

Baixar, verificar, persistir e abrir automaticamente a primeira página traduzida
no leitor unificado, com domínio de projetos locais, preservando acesso ao original e aos
fallbacks textuais sem depender de login ou rede após o download.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-019/026/027/051`, em verificação, e atende RF-RDR-001/002/009 e UX-RDR-001..006.
- Integra o contrato terminal da 020 já executado, sem promover sua admissão operacional.
  Revisão aprovada: [decisão delimitada](../../../../../../docs/translation-reader-revision-2026-10-24.md).
- `MOB-FEAT-005` continua leitor de capítulos publicados. Reuso limita-se a
  primitives `shared`; Chapter, publicação e Core não são estendidos.
- Controla RSK-005/021/026/027. Biblioteca e progresso entre páginas pertencem a
  M5.
- A barra por etapas aparece no fluxo atual e a navegação automática ocorre
  somente após verdade local verificável.

## Requisitos e regras

- Polling consulta o mesmo job apenas em foreground, usa backoff limitado e
  reconcilia imediatamente ao voltar do background/restart.
- A barra tem cinco segmentos: fila, OCR, tradução, renderização e download.
  Segmento avança somente com estágio confirmado; não representa tempo, não
  regressa e não exibe ETA.
- Ao receber `READY`, o app baixa resultado por URL assinada curta, valida host,
  HTTPS, bytes, MIME, dimensões e SHA-256, grava em arquivo temporário e move
  atomicamente para o diretório privado.
- Manifesto é validado como resposta não confiável e persistido em transação com
  resultado/regiões. Só então página vira `READY` e o app envia ACK.
- Falha depois do download mas antes do commit não envia ACK; retomada usa o
  mesmo job enquanto o TTL permitir.
- A navegação automática acontece uma vez por resultado. `auto_opened_at` é
  persistido antes da navegação para que voltar, rerender ou restart não forme
  loop.
- Se o usuário saiu da tela, a retomada do fluxo abre o leitor uma vez quando o
  resultado íntegro for encontrado. Não há push notification nesta spec.
- O leitor unificado adapta o domínio local, sem overlay demonstrativo para REMOTE; mostra resultado por padrão, oferece ação simples **Ver original** e
  exibe painel textual para regiões marcadas com overflow. Comparação avançada e
  edição pertencem a M6.
- Página sem texto abre normalmente e comunica que nenhum texto foi identificado.
- Depois da persistência, leitura, original e fallback funcionam offline e sem
  sessão de conta/gateway.
- Cancelled/failed/expired nunca navegam. Resultado expirado antes do download
  informa necessidade de novo processamento futuro, sem retry automático.

## Plano de persistência local

SQLite v9 já contém `translation_page_results`, `text_regions`,
`text_region_vertices` e metadados de tradução. Reusar essas tabelas e suas FKs,
checks e índices, sem migration. Resultado `REMOTE` exige attempt válido e não
pode sobrescrever/converter `DEMO`; preservar originais, drafts e resultados
anteriores. Arquivo privado verificado e regiões são publicados em uma transação
exclusiva, junto com READY local. ACK posterior pode ser repetido idempotentemente
após restart enquanto houver retenção; falha do ACK não desfaz resultado local.

## Arquitetura FSD planejada

```text
shared/files + shared/remote-gateway
  → entities/local-translation-result + entities/remote-processing-attempt
    → features/acquire-remote-translation-result
      → widgets/remote-processing
        → pages/offline-translation (leitor unificado)
```

As entities relacionadas usam referências `@x`, com APIs públicas; features
não importam features horizontalmente. A viewport é compartilhada com a 051,
mas domínio, persistência e adaptadores locais continuam separados de Chapter,
publicação, Core e login.

## Casos de erro

- URL expirada/host inesperado, hash, MIME ou manifesto inválido impedem `READY`.
- Disco insuficiente preserva original e attempt recuperável; arquivo temporário
  é removido.
- ACK falho não desfaz resultado local; é retomado separadamente até expirar.
- Rerender/back/restart não repetem auto-open depois de `auto_opened_at`.
- Sem rede após persistência não afeta leitura nem alternância para original.

## Critérios de aceite

### AC-001 — Progresso por etapas verdadeiro

A barra reflete somente os cinco marcos confirmados, sem ETA ou percentual de
tempo fictício, e restaura o mesmo estágio após restart.

### AC-002 — READY depende da persistência local

Página só fica `READY` após download, validações, move atômico e commit de
resultado/regiões.

### AC-003 — Navegação automática exatamente uma vez

Resultado íntegro abre o leitor automaticamente e persiste consumo antes de
navegar; back, rerender e restart não reabrem em loop.

### AC-004 — Leitor local separado

Resultado, original e fallback usam o leitor unificado, com domínio local separado
de Chapter/publicação/Core e sem login obrigatório.

### AC-005 — Leitura offline

Após ACK/expiração remota, resultado e original continuam acessíveis sem rede.

### AC-006 — Falhas e expiração honestas

Download/manifests inválidos, falta de espaço, cancelamento e TTL não produzem
reader ou sucesso falso e preservam dados locais seguros.

### AC-007 — Página sem texto

Resultado equivalente ao original abre normalmente com mensagem localizada e
sem fallback vazio.

### AC-008 — UX acessível e trilíngue

Progresso, estados, reader, original, overflow e erros possuem pt-BR/en-US/es-ES,
tokens, foco, labels e touch targets adequados.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                            |
| -------- | ------------------------------------------------------------------- |
| AC-001   | RNTL/persistência dos cinco estágios e restart                      |
| AC-002   | fault injection em download/hash/move/commit/ACK                    |
| AC-003   | integração com contagem de navegação em ready/back/rerender/restart |
| AC-004   | teste arquitetural e reader com resultado/original/fallback         |
| AC-005   | teste offline após remoção remota                                   |
| AC-006   | URL/manifest hostis, disco cheio, cancel/expired                    |
| AC-007   | fixture arte-only no reader                                         |
| AC-008   | RNTL nos três locales + matriz física Android                       |

## Gate de implementação

- Estado: `open`, por aprovação humana de 2026-10-25.
- Dependências executadas em verificação: `MOB-FEAT-019/026/027/051`.
- Contrato terminal com hash/manifesto e renderer real executado na página
  sintética autorizada, com respostas reais capturadas e replay sem rede.
- A 020 permanece `in-progress`, com segurança/distribuição, orçamento,
  matriz operacional e qualidade pendentes. Nenhuma publicação é autorizada.

## Fora de escopo

- Scheduler/lote, retry, biblioteca, progresso de leitura e recuperação ampla.
- Comparação lado a lado, edição, feedback, export ou compartilhamento.
- Push notification e execução ilimitada em background.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-15

Aprovação inicial registrada junto ao plano do vertical slice. Revisão de
2026-10-25 aprovada explicitamente por Ruan (“Aprovar revisão e implementar”),
incluindo dependências, SQLite v9, leitor unificado e abertura delimitada do gate.
Gateway público e providers permanecem desabilitados; sem nova chamada paga,
VM, API pública, schema ou migration.
