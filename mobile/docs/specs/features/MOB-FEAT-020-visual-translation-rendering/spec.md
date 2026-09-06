---
id: MOB-FEAT-020
type: feature
title: Renderização visual da tradução
status: approved
implementation_gate: blocked
blocked_by: [MOB-FEAT-019]
created: 2026-08-15
updated: 2026-08-15
supersedes: []
superseded_by: []
---

# MOB-FEAT-020 — Renderização visual da tradução

## Objetivo

Gerar uma imagem traduzida legível da primeira página, alterando somente regiões
textuais reconhecidas, preservando o original local e oferecendo fallback para
traduções que não caibam com segurança.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-019` e atende RF-TRN-021..026.
- Controla RSK-004/010/024. O renderer executa no worker, não na UI thread.
- A estratégia aprovada é caixa limpa determinística; inpainting generativo não
  pertence ao primeiro slice.
- O resultado será WebP privado com hash e manifesto; original nunca é
  sobrescrito.

## Requisitos e regras

- O renderer reabre a mídia validada com decode limitado e rejeita dimensões ou
  consumo incompatíveis com capabilities.
- Cada polígono é recortado/clampado aos limites; sobreposição é resolvida por
  ordem estável sem pintar fora da união textual necessária.
- A região é neutralizada com cor estimada do entorno. Não há reconstrução de
  arte nem alegação de remoção perfeita do texto fonte.
- Noto Sans/Noto Sans CJK são fontes empacotadas e licenciadas. Fonte, quebra de
  linha, alinhamento e contraste seguem o idioma destino.
- O tamanho da fonte é reduzido até um mínimo legível definido por política
  versionada. Se ainda não couber, a região recebe representação segura e a
  tradução completa fica marcada como fallback textual no manifesto.
- Texto é tratado como conteúdo, sem HTML/markup executável.
- Página sem regiões produz resultado visual equivalente ao original e estado
  válido, sem caixa artificial.
- Saída WebP usa política de qualidade/tamanho versionada; hash, bytes, MIME e
  dimensões são calculados sobre o arquivo final.
- Resultado e manifesto ficam privados, disponíveis por URL assinada curta e
  expiram após ACK ou uma hora. URL nunca entra em analytics/log.
- `READY` remoto significa render concluído; `READY` local só ocorre após
  download, hash e persistência definidos em `MOB-FEAT-021`.

## Plano de persistência

O gateway guarda objetos efêmeros e metadados técnicos do job, sem conteúdo no
PostgreSQL. O mobile criará `translation_page_results` com PK/FK `page_id`,
`attempt_id UNIQUE`, filename privado, MIME, bytes, dimensões, SHA-256,
`ready_at` e `auto_opened_at`. A FK usa cascade; resultado não existe sem página.

Dependências funcionais: `page_id → resultado` e `attempt_id → resultado`; ambas
são chaves candidatas. Arquivo é fonte visual durável; cache não o substitui.

## Casos de erro

- Decode/encode, fonte ausente, memória ou disco insuficiente falham em
  `rendering`, preservando original e manifesto anterior íntegro.
- Polígono inválido que escapou do OCR bloqueia somente o job atual.
- Overflow produz fallback textual, não truncamento silencioso.
- Cancelamento antes do commit elimina saída parcial; depois de `READY`, ACK ou
  TTL ainda controla exclusão.
- Hash/tamanho divergente no download impede promoção local para `READY`.

## Critérios de aceite

### AC-001 — Alteração limitada e original preservado

O renderer modifica apenas regiões válidas e nunca escreve sobre o original
privado do aparelho.

### AC-002 — Texto legível nos sete destinos

Fontes, wrapping, direção, contraste e caracteres suportam os sete códigos sem
glyph ausente conhecido nas fixtures.

### AC-003 — Overflow possui fallback completo

Texto que não couber não é truncado; manifesto sinaliza e conserva a tradução
completa para o leitor.

### AC-004 — Página sem texto permanece visualmente válida

Zero regiões não cria caixas e entrega resultado equivalente ao original.

### AC-005 — Resultado verificável e efêmero

SHA-256/MIME/dimensões acompanham o arquivo; ACK ou TTL de uma hora remove saída
e manifesto remotos.

### AC-006 — Memória e falha isoladas

Imagens nos limites defensivos não são mantidas em múltiplas cópias simultâneas;
falha não corrompe original nem outra página.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                      |
| -------- | ------------------------------------------------------------- |
| AC-001   | golden fixtures e diff fora dos polígonos                     |
| AC-002   | render dos sete scripts/destinos e revisão visual             |
| AC-003   | fixture de overflow prova manifesto e ausência de truncamento |
| AC-004   | fixture arte-only e comparação visual/hash compatível         |
| AC-005   | integração URL/hash/ACK/TTL/cleanup                           |
| AC-006   | profiling Android/gateway e fault injection de memória/disco  |

## Gate de implementação

- Estado: `blocked`
- Dependência: `MOB-FEAT-019` implementada ou em verificação.
- Política de fonte/codec e fixtures precisam ser licenciadas e versionadas na
  execução.

## Fora de escopo

- Inpainting generativo, redesenho de arte, onomatopeia avançada ou edição.
- Comparação lado a lado, export/share e múltiplas páginas.
- Metas quantitativas de legibilidade antes da baseline.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-15

Aprovação registrada junto ao plano do vertical slice. O gate permanece
bloqueado pela execução de `MOB-FEAT-019`.
