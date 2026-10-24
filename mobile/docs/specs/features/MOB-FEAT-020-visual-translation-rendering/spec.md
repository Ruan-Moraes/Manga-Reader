---
id: MOB-FEAT-020
type: feature
title: Renderização visual da tradução
status: in-progress
implementation_gate: open
blocked_by: [MOB-FEAT-019]
created: 2026-08-15
updated: 2026-10-05
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

- O renderer reabre a mídia remota privada validada, retida desde o upload com
  limite absoluto de uma hora, com decode limitado e rejeita dimensões ou
  consumo incompatíveis com capabilities. Não usa a cópia local do aparelho
  no worker. Depois do commit válido do render, remove o original remoto;
  falha/cancelamento também exigem cleanup, sem estender o prazo de uma hora.
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
- A aplicação não mantém cópias integrais redundantes do raster. Buffers internos
  do codec são permitidos com versão/política fixadas, desde que o consumo total
  seja limitado e medido no pipeline completo, incluindo JVM, memória nativa,
  fontes e arquivos temporários. Heap ou limite de cache não representa esse total.
- A capacidade de renderização deve ser adquirida antes do decode, com uma
  página pesada por instância e sem fila ilimitada. Buffers emprestados e
  capacidade permanecem sob posse até a execução nativa e sua limpeza terminarem.
- O orçamento operacional só será admitido após provas das imagens aceitas,
  timeout/cancelamento e falhas de memória/disco no ambiente de execução.
  Um teto experimental maior não muda a configuração cloud nem aprova operação.
  Permanecem dimensões/bytes/pixels defensivos e WebP lossless/exact; não reduzir
  qualidade, redimensionar ou truncar silenciosamente para atender ao orçamento.
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

Imagens nos limites defensivos são processadas sem cópias integrais redundantes
pela aplicação. Buffers internos do codec são contabilizados em um orçamento
total limitado e demonstrado pelo pipeline completo, com concorrência limitada
antes do decode e isolamento de timeout, cancelamento e falhas de memória/disco.
Falha não corrompe original nem outra página; não há perda silenciosa de qualidade.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------- |
| AC-001   | golden fixtures e diff fora dos polígonos                                                                |
| AC-002   | render dos sete scripts/destinos e revisão visual                                                        |
| AC-003   | fixture de overflow prova manifesto e ausência de truncamento                                            |
| AC-004   | fixture arte-only e comparação visual/hash compatível                                                    |
| AC-005   | integração URL/hash/ACK/TTL/cleanup                                                                      |
| AC-006   | profiling total gateway/Android, concorrência antes do decode e fault injection de memória/disco/timeout |

## Gate de implementação

- Estado: `open` em 2026-10-03, após a 019 atingir `verification-pending` e
  conforme autorização de Ruan para execução incremental autônoma até a renderização.
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

Aprovação registrada junto ao plano do vertical slice. O gate permaneceu
bloqueado até a execução e auditoria de `MOB-FEAT-019`. Em 2026-10-03, sua
transição verificada para `verification-pending` satisfez a dependência técnica;
a autorização de Ruan para avançar autonomamente até a 020 permite abrir o
gate e derivar tasks. Não autoriza custo de provider, deploy, alteração legal
ou habilitação de uploads. A 021 continua bloqueada.

## Decisão de manutenção — 2026-10-02

Ruan aprovou reter o original remoto até a renderização, sempre com failsafe
de uma hora. Esta revisão não abre o gate nem afirma implementação do renderer.

## Decisão de memória — 2026-10-05

Ruan escolheu explicitamente a opção «manter libwebp, com orçamento total
medido» após a pesquisa das alternativas. Isso substitui a proibição absoluta
de cópias internas do codec, não a proteção contra cópias redundantes da
aplicação. A revisão humana do requisito precede a nova prova técnica; não é
autoaprovação do renderer ou do consumo de memória.

O orçamento cloud atual de 1 GiB permanece inalterado e não foi admitido para
o máximo multicolor. Integração supervisionada, distribuição, perfil completo,
qualidade e operação continuam pendentes. 020 in-progress/open e 021 blocked.
Ver o [plano de memória](../../../../../api/apps/translation-gateway/docs/rendering-memory-policy.md).

Parcela posterior de 2026-10-05: [distribuição local fixada](evidence/rendering-native-distribution-2026-10-05.md)
e seleção explícita supervisionada foram codificadas e testadas no bean mínimo
Linux. Não habilita o modo, publica package, altera limites ou admite o worker
completo. Distribuição operacional, contenção e perfil total seguem pendentes.

Parcela posterior: [limites self-only da filha](evidence/rendering-native-limits-2026-10-05.md)
foram implementados no opt-in antes de fontes/decode, sem alteração de intenção
ou defaults. Provas locais não admitem RAM agregada, worker completo ou
contenção atômica; pico máximo ainda excede os 1 GiB cloud. Tasks/status/gates
permanecem conservadores, sem nova aprovação de qualidade.
