---
id: MOB-FEAT-062
type: feature
title: Configurações no padrão do kit mobile
status: draft
implementation_gate: open
blocked_by: [MOB-FEAT-057]
created: 2026-11-08
updated: 2026-11-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-062 — Configurações no padrão do kit mobile

## Objetivo

Levar o índice e as sete seções de Configurações ao padrão do kit mobile do Toonlira Design System: páginas mais
curtas, escolhas de baixa frequência em folhas, linhas de lista padronizadas e confirmações descritivas, preservando
todas as opções, regras de acesso e sincronização atuais.

## Contexto e contratos relacionados

- Mantém MOB-FEAT-008: as sete seções, rotas, deep links, separação visitante/conta, estados de sincronização e "Sobre"
  (AC-001 a AC-009). Não junta seções como o DESIGN-BRIEF propunha.
- Mantém 030/AC-001 e AC-003 a AC-006, 033 e 034–042 (exceto o que a 057 já substituiu).
- **Altera MOB-FEAT-032/AC-001** (inventário de controles) e **MOB-FEAT-031/AC-003 e AC-004** nas linhas abaixo;
  as demais linhas do inventário continuam:

    | Configuração                    | Antes (032)                | Passa a ser                                                         |
    | ------------------------------- | -------------------------- | ------------------------------------------------------------------- |
    | tema                            | cards empilhados           | três tiles lado a lado com prévia e descrição da opção ativa abaixo |
    | idioma da interface             | cards empilhados           | linha de escolha que abre folha com rádios                          |
    | formato de data                 | segmentado                 | linha de escolha que abre folha com rádios e exemplo                |
    | fuso horário                    | select em folha            | linha de escolha que abre folha com rádios (mesmo comportamento)    |
    | preferências do leitor (página) | controles inline na página | cinco linhas que abrem folhas (ver abaixo)                          |

- **Altera a forma de confirmar de MOB-FEAT-031/AC-006, MOB-FEAT-006 e MOB-FEAT-007:** as confirmações de Privacidade e de Dados passam de
  `Alert` nativo para `ConfirmSheet`, com o mesmo texto, as mesmas condições e o mesmo efeito.
- Não altera o painel de ajustes dentro do leitor (054); só a página Configurações > Leitor.
- Usa primitivas da MOB-FEAT-057.
- Referência visual: `SettingsScreen.jsx` e `SettingsGroup`/`SettingsRow`/`KitField`/`KitSegmented`/`KitSlider`/
  `KitSwatches`/`KitChoices` de `kit-parts.jsx` (kit, versão 42).

## Requisitos e regras

### Índice

- Introdução editorial e quatro grupos (Aplicativo, Leitura, Dispositivo, Conta) como hoje.
- Cabeçalho de grupo com barra de acento de 4 × 16, título em eyebrow e descrição `caption`.
- Cada seção é uma linha de lista com tile de ícone de 40 (ícone de 20), título, descrição, status com ponto e
  chevron, com altura mínima de 64.
- Seções privadas sem login continuam mostrando "Login necessário" e levando ao login com retorno.

### Padrão das subpáginas

- Cabeçalho de página (eyebrow, título `display`, texto de apoio) como hoje.
- Cada grupo tem barra de acento, título `section` e descrição fora da superfície, e um cartão com blocos de padding
  `md` separados por divisória.
- **Linha de escolha:** rótulo, valor atual em tom muted e indicador de abertura; abre uma `BottomSheet` com título,
  descrição e opções em rádio (com descrição quando houver). Escolher aplica e fecha; fechar sem escolher não muda
  nada.
- O status de sincronização e o erro com "tentar novamente" de cada seção continuam como hoje.

### Aparência e acessibilidade

- Tema: três tiles lado a lado (Sistema, Claro, Escuro), cada um com prévia e rótulo; a descrição da opção ativa
  aparece abaixo dos tiles. Em tela estreita ou fonte ampliada, os tiles empilham.
- Tamanho do texto e densidade: segmentado da 057. Animações, reduzir movimento e alto contraste: switches, como hoje.

### Idioma e região

- Idioma da interface, formato de data (com exemplo em cada opção) e fuso horário: linhas de escolha com folha.

### Idiomas do conteúdo (requer login)

- Lista ordenada com número em círculo de 24, nome, subir, descer e remover (pt-BR é o fallback e não pode ser
  removido), como hoje.
- "Adicionar idioma": linhas com o nome e a ação "+ Adicionar" em vez de botões de largura total; sem idiomas
  restantes, uma linha informativa.

### Leitor

A página passa a ter cinco linhas, cada uma abrindo uma folha com os controles atuais daquele grupo, sem perder
nenhuma opção:

1. **Navegação** (valor: modo atual): modo e direção como escolhas empilhadas com descrição; ajuste como segmentado
   com Largura, Altura e Original (005).
2. **Imagem** (valor: qualidade atual): qualidade em linha de escolha com as mesmas opções e a mesma regra de
   disponibilidade de hoje (005/AC-004); fundo em amostras; saturação em controle deslizante.
3. **Comportamento**: espaçamento, pré-carregamento e "Marcar automaticamente como lido".
4. **Gestos** (preferências do aparelho): exibir controles como escolhas com descrição; "Áreas laterais de toque" com
   a mesma regra de desabilitar no modo vertical ou na direção Webtoon.
5. **Texto e aparência** (valor: tamanho atual): fonte, tamanho, entrelinha, margens, fundo do leitor de texto e
   "Restaurar ajustes do texto" no rodapé da folha.

Limites, passos, commit dos sliders e persistência continuam os mesmos.

### Privacidade (requer login)

- Mesmos controles e regras. Confirmação de "Não rastrear" e de desligar analytics em `ConfirmSheet`, com o texto
  atual e o mesmo efeito ao confirmar; cancelar não muda nada.

### Dados e armazenamento

- Grupos "Neste dispositivo", "Dados offline" e "Dados da conta" com linhas de tile.
- "Uso de armazenamento" continua visível; "Limpar cache" mostra o tamanho atual como valor.
- Limpar cache, limpar dados offline e limpar histórico confirmam em `ConfirmSheet` com o que será removido e o que é
  preservado; exportar dados mantém o comportamento atual (login quando necessário). Carregamento e erro continuam
  na própria linha.

### Sobre

- Versão e build como hoje; links oficiais como linhas de tile; falha ao abrir link continua com o erro e "tentar
  novamente".

### i18n, tema e acessibilidade

- Textos novos (títulos e descrições das folhas, valores resumidos, itens do que será removido) em
  `settingsNavigation` ou nos namespaces atuais dos controles, nos três idiomas.
- Nenhuma cor ou tamanho solto. Folhas fecham por botão, scrim e voltar.

## Casos de erro

- Falha ao salvar uma preferência: o erro e "tentar novamente" atuais aparecem na seção; a folha não afirma sucesso.
- Sessão expirada numa seção privada: o bloqueio de login aparece, como hoje (008/AC-004).
- Ação destrutiva falhou: erro perto da linha, sem marcar como concluída.

## Critérios de aceite

### AC-001 — Índice padronizado

Dado o índice, quando renderizado, então mostra os quatro grupos com barra de acento e as sete seções como linhas de
64 com tile, descrição, status e chevron, com o bloqueio de login das seções privadas preservado.

### AC-002 — Linha de escolha com folha

Dada uma linha de escolha, quando o usuário a tocar, então a folha abre com as opções e a atual marcada; escolher
aplica e fecha, e fechar por botão, scrim ou voltar não muda o valor.

### AC-003 — Aparência

Dada a seção, quando renderizada, então o tema aparece em três tiles com prévia e descrição da opção ativa
(empilhando em tela estreita ou fonte ampliada), e os demais controles mantêm valores e efeitos.

### AC-004 — Idioma e região

Dada a seção, quando o usuário mudar idioma, formato de data ou fuso pelas folhas, então o valor é aplicado e
persistido como hoje.

### AC-005 — Idiomas do conteúdo

Dada a seção com login, quando o usuário ordenar, remover ou adicionar idiomas, então as regras atuais valem, incluindo
o fallback obrigatório, e adicionar usa linhas com "+ Adicionar".

### AC-006 — Leitor em cinco folhas

Dada a página do leitor, quando o usuário abrir cada uma das cinco linhas, então encontra todos os controles atuais
daquele grupo, incluindo o ajuste Original e a qualidade com a disponibilidade atual, com os mesmos limites e a mesma
persistência; o painel dentro do leitor não muda.

### AC-007 — Privacidade

Dada a seção com login, quando o usuário escolher "Não rastrear" ou desligar analytics, então a confirmação aparece em
folha com o texto atual, confirmar tem o mesmo efeito de hoje e cancelar não muda nada.

### AC-008 — Dados e armazenamento

Dada a seção, quando o usuário limpar cache, dados offline ou histórico, então a confirmação em folha descreve o que
será removido e preservado, o uso de armazenamento continua visível, e carregamento, autenticação e erros se mantêm.

### AC-009 — Contratos preservados

Dados os AC da 008, da 031 e da 032 não alterados por esta spec, quando os testes rodarem, então continuam verdes;
nenhuma opção, rota, request ou regra de persistência é removida ou criada.

### AC-010 — Idiomas, tema e acessibilidade

Dados os três idiomas, claro, escuro, alto contraste, fonte a 200%, 320 × 568 e paisagem, quando índice, subpáginas e
folhas renderizarem, então não há texto fixo, cor solta, corte ou ação inalcançável, e a ordem assistiva segue a
visual.

### AC-011 — Qualidade

Dadas as telas e features alteradas, quando os gates rodarem, então os testes de páginas, features, widget, i18n e FSD
passam e os arquivos estão mapeados no `coverage.json`.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                       |
| -------- | ---------------------------------------------------------------------------------------------- |
| AC-001   | RNTL do `SettingsIndex` e da página do índice                                                  |
| AC-002   | RNTL da linha de escolha (abrir, escolher, cancelar por cada meio)                             |
| AC-003   | RNTL dos controles de aparência (tiles, empilhamento)                                          |
| AC-004   | RNTL dos controles de idioma e região com persistência                                         |
| AC-005   | Testes existentes do editor de idiomas e RNTL da adição                                        |
| AC-006   | RNTL da página do leitor, folha por folha; testes do `ReaderSettingsControls` no painel verdes |
| AC-007   | RNTL das confirmações de privacidade                                                           |
| AC-008   | RNTL das confirmações e estados de dados                                                       |
| AC-009   | Testes das specs 008, 031 e 032 verdes                                                         |
| AC-010   | Teste de chaves nos três locales; RNTL com `fontScale` 2; capturas no iOS Simulator            |
| AC-011   | `pnpm lint:fsd`, `pnpm typecheck`, testes e `coverage.json`                                    |

## Gate de implementação

- Estado: `open`
- Dependências: MOB-FEAT-057 (`verification-pending`, primitivas executadas).

## Fora de escopo

- Juntar seções, mover "Sobre" para o rodapé ou criar a seção Conta.
- Painel de ajustes dentro do leitor e botão "Ajustes do leitor" (ficam com a 063).
- Novas preferências ou preferências sem efeito real.

## Pontos em aberto para a aprovação

- Nenhum além dos herdados da 057. Observação: o kit mostra a qualidade com as cinco opções sempre; esta spec mantém a
  regra atual de disponibilidade (005/AC-004).

## Aprovação humana

- Aprovador: pendente
- Data: pendente

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
