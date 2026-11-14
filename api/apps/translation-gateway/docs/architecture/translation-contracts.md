# Contratos internos de tradução — TASK-001 (fotografia)

Este documento registra o marco da TASK-001. A parcela posterior de adapter e
worker está descrita no [README do gateway](../README.md); as afirmações abaixo
sobre ausência de adapter referem-se apenas àquela fotografia histórica.

Fundação Java da MOB-FEAT-019, sem adapter ou ligação ao worker. Não executa
tradução e não altera `/v1`, task `{jobRef}`, manifesto OCR `1.0` ou estados.

## Tipos e responsabilidade

`SupportedLanguages.CODES` é a lista canônica ordenada dos sete códigos;
`GetCapabilitiesUseCase.LANGUAGES` permanece como alias compatível. `LanguagePair`
representa os 42 pares distintos, sem aliases. `TranslationRequest` contém job,
par e regiões `(id, readingOrder, sourceText)`; `TranslationResponse` contém
somente `(id, translatedText)`. Nenhuma geometria é transmitida por essa porta.

`TranslationValidator` recebe um snapshot explícito de pares habilitados. Não
consulta capabilities, relógio, banco ou configuração: o chamador futuro deve
fornecer a política vigente, inclusive após remoção de um par. Conjunto vazio
recusa todos os pares, mesmo com página vazia; não há habilitação por default.

O chamador valida a requisição antes de usar `TranslationPort`. Depois valida a
resposta contra a mesma requisição; o resultado só é produzido se a associação
estiver completa. Resposta reordenada é aceita por IDs e retorna na ordem
original. IDs ausentes/extras/duplicados e texto inválido falham integralmente.

`TranslationResult` só é criado pelo pacote de validação, preservando job/par,
IDs e ordem. Coleções são copiadas defensivamente. Texto, inclusive markup,
acentos combinados, espaços e quebras, é dado opaco: não se interpreta HTML,
normaliza, traduz, concatena ou trunca. Renderização segura pertence ao consumidor
futuro, não é demonstrada por estes contratos.

## Limites e falhas

| Medida           | Fonte   | Tradução                   |
| ---------------- | ------- | -------------------------- |
| Regiões          | 1.024   | exatamente os IDs da fonte |
| Texto por região | 4.096   | 8.192                      |
| Texto por página | 262.144 | 524.288                    |

Texto é medido por `String.length()` (UTF-16, emoji suplementar usa duas unidades).
Entrada reutiliza os limites OCR, saída tem margem de 2× aprovada por Ruan.
Não são quotas do provider, limites de bytes ou contrato de manifesto serializado.
Texto nulo/em branco é inválido; página vazia admite apenas resposta vazia.

Falhas internas são `INVALID_INPUT`, `UNSUPPORTED_PAIR` ou `INVALID_OUTPUT`,
sem HTTP mapping, causa do provider ou conteúdo sensível. `toString()` dos tipos
com texto/identificadores é redigido. Idiomas válidos são informação pública.
Nenhum código público de erro foi adicionado.

## Fora desta parcela

Não há bean/adapter de produção para `TranslationPort`, SDK de tradução,
serialização do manifesto, persistência, processamento pago ou lógica de retry.
Evitar cobrança em página vazia, cancelar e avançar para `RENDERING` são tarefas
de orquestração ainda abertas. Contexto linguístico e nomes próprios dependem
do adapter/provider e da avaliação real, não de um fake determinístico.

Testes: `TranslationValidatorTest` (domínio e fake exclusivo dos testes) e
`GetCapabilitiesUseCaseTest` (forma/ordem/ETag público congelados antes da alteração).
Gates e rastreabilidade ficam na
[review parcial](../../../../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/review.md).
