---
id: MOB-FEAT-053
type: feature
title: Light novel — conforto e personalização
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-051, MOB-FEAT-052]
created: 2026-09-09
updated: 2026-09-10
supersedes: []
superseded_by: []
---

# MOB-FEAT-053 — Light novel: conforto e personalização

## Objetivo

Melhorar leitura textual e personalização exclusivamente no mobile, preservando
rolagem contínua, virtualização e gestos. Preview permanece somente desenvolvimento.

## Contexto e contratos relacionados

Refina TEXT_FLOW de MOB-FEAT-051 e preferências locais de MOB-FEAT-052/009.
MOB-DEC-007 orienta evidência nativa; não altera API, imagens ou SQLite.

## Requisitos e regras

Pages compõem dados e preferências; feature própria oferece configurações; widget
renderiza texto. Preferências persistidas; posição de novels apenas na sessão.

## Critérios de aceite

### AC-001 — Tipografia e apresentação

Nunito Sans 18 sp, entrelinha 1,65, margens 20 dp, coluna central máxima 640 dp,
alinhamento à esquerda e escala de sistema preservada. Títulos, parágrafos,
diálogos e separadores têm hierarquia; menos espaços vazios superiores/inferiores.
Ilustrações preservam proporção. Barras sobrepostas não alteram geometria textual.

### AC-002 — Personalização acessível

Seção Texto e aparência no painel e configurações: fonte APP ou SERIF (Georgia iOS,
serif Android), tamanho 16..28 em passos 1, entrelinha 1,4/1,65/1,9, margens 12/20/28,
fundo APP/LIGHT/PAPER/DARK. Defaults APP/18/COMFORTABLE/MEDIUM/APP. Seleção explícita,
efeito imediato, reset somente texto, pt-BR/en-US/es-ES. Paleta afeta texto e barras
somente do leitor textual; respeita alto contraste, tokens e acessibilidade.

### AC-003 — Persistência local

TextReaderPreferences na entity de preferências. Envelope v4 migra versões anteriores
preservando settings, dirty paths e gestos; normaliza campos inválidos. Reutiliza fila
de persistência e erro/retry existentes; nunca inclui preferências textuais no PATCH.
Nenhuma retomada persistente de novels nesta feature.

### AC-004 — Posição e progresso

ReaderLocation aceita itemOffsetRatio opcional. Capturar bloco e posição relativa
antes de mudanças tipográficas/largura e restaurar após medição sem remontar lista.
Preserva parágrafo e fração, não a mesma linha após reflow. Cobrir bloco maior que
tela e localização fora da janela montada. Progresso por comprimento textual e
fração percorrida; percentagem em vez de Trecho X/Y, sem páginas fictícias. Todo
conteúdo visível e fim do capítulo indicam 100%. Alterar barras não restaura posição.

### AC-005 — Qualidade e evidência

Fixture longa dev com blocos variados e ilustração. Testes de normalização, migração,
restart, erro/retry, isolamento remoto, reflow, progresso e regressão de imagens.
Executar pnpm check, separar baseline. Inspecionar telas/temas/fontes/acessibilidade;
registrar medição nativa ausente como verification-pending, sem alegar performance.

## Casos de erro

Dados inválidos recebem defaults; gravação falha mantém escolha ativa e retry.
Medição incompleta restaura por aproximação e corrige quando alvo for medido, com
retry limitado e cancelável. IDs ausentes usam índice limitado; sem crash ou loop.

## Fora de escopo

Importação, catálogo, capítulos reais, sincronização remota textual, TTS, EPUB,
paginação textual, marcadores e mudança dos leitores de imagens.

## Estratégia de evidência

| Critério | Evidência                        |
| -------- | -------------------------------- |
| AC-001   | modelos e RNTL de texto/paleta   |
| AC-002   | controles e integração           |
| AC-003   | store com storage e API mocks    |
| AC-004   | geometria, reflow e progresso    |
| AC-005   | gates e inspeção nativa separada |

## Gate de implementação

Open. MOB-FEAT-051/052 executadas em verification-pending, dependência válida pelo AGENTS.

## Aprovação humana

Ruan, 2026-09-09, mensagem PLEASE IMPLEMENT THIS PLAN reproduzindo o plano de light novel.
