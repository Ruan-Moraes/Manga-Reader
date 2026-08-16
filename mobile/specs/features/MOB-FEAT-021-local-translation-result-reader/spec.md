---
id: MOB-FEAT-021
type: feature
title: Leitor local do resultado traduzido
status: approved
implementation_gate: blocked
blocked_by: [MOB-FEAT-020]
created: 2026-08-15
updated: 2026-08-15
supersedes: []
superseded_by: []
---

# MOB-FEAT-021 — Leitor local do resultado traduzido

## Objetivo

Baixar, verificar, persistir e abrir automaticamente a primeira página traduzida
em um leitor próprio de projetos locais, preservando acesso ao original e aos
fallbacks textuais sem depender de login ou rede após o download.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-020` e atende RF-RDR-001/002/009 e UX-RDR-001..006.
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
- O leitor mostra resultado por padrão, oferece ação simples **Ver original** e
  exibe painel textual para regiões marcadas com overflow. Comparação avançada e
  edição pertencem a M6.
- Página sem texto abre normalmente e comunica que nenhum texto foi identificado.
- Depois da persistência, leitura, original e fallback funcionam offline e sem
  sessão de conta/gateway.
- Cancelled/failed/expired nunca navegam. Resultado expirado antes do download
  informa necessidade de novo processamento futuro, sem retry automático.

## Plano de persistência local

SQLite v6 adiciona:

- `translation_page_results(page_id PK/FK, attempt_id UNIQUE, rendered_filename
UNIQUE, mime_type, byte_size, width_px, height_px, sha256, ready_at,
auto_opened_at)`;
- `text_regions(id PK, page_id FK, reading_order, source_text,
translated_text, overflow, created_at)` com `UNIQUE(page_id, reading_order)`;
- `text_region_vertices(region_id FK, vertex_index, x, y)` com PK composta.

FKs usam `ON DELETE CASCADE`; checks validam MIME, hashes, dimensões, índices de
vértice, coordenadas e timestamps. Projeto/idiomas não são duplicados. O registry
de storage mede e limpa metadados/arquivos coordenadamente.

## Arquitetura FSD planejada

```text
entities/translation-page + entities/text-region
  → features/open-local-translation-result
    → pages/local-translation-reader
      → app/translation-reader/[projectId].tsx
```

A page de progresso compõe start/cancel sem import horizontal. O leitor consome
entities e shared UI por barrels públicos e não importa o leitor publicado.

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

Resultado, original e fallback são exibidos sem Chapter, publicação, Core ou
login obrigatório.

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

- Estado: `blocked`
- Dependência: `MOB-FEAT-020` implementada ou em verificação.
- Abertura exige contrato terminal com hash/manifesto e renderer real no
  ambiente de teste.

## Fora de escopo

- Scheduler/lote, retry, biblioteca, progresso de leitura e recuperação ampla.
- Comparação lado a lado, edição, feedback, export ou compartilhamento.
- Push notification e execução ilimitada em background.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-15

Aprovação registrada junto ao plano do vertical slice. O gate permanece
bloqueado pela execução de `MOB-FEAT-020`.
