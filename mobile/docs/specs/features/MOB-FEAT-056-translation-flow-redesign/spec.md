---
id: MOB-FEAT-056
type: feature
title: Redesenho do fluxo de tradução de capítulo
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-055]
created: 2026-11-08
updated: 2026-11-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-056 — Redesenho do fluxo de tradução de capítulo

## Objetivo

Tornar o caminho "importar páginas → traduzir capítulo" mais curto, claro e
consistente, reduzindo etapas e toques sem remover nenhuma funcionalidade nem
relaxar as garantias de validação, consentimento e persistência.

## Contexto e contratos relacionados

- Refina a interface de MOB-FEAT-012/013 (importação e ordem), 014 (idiomas),
  015 (validação), 016 (projeto preparado), 043/044/045 (organização, campos de
  idioma, galeria de validação) e 055 (lote, voltar/Home).
- Parte do [DESIGN-BRIEF](../../../ui-captures/DESIGN-BRIEF.md) (seções 2.1, 4.2,
  4.3, 5 e 6), limitado ao fluxo de tradução. Biblioteca/Obra, Configurações,
  Conta e remoção de rotas **não** fazem parte desta spec.
- Não altera SQLite, gateway, consentimento, envio volátil nem regras de retry.

## Diagnóstico do fluxo atual

1. Cinco etapas lineares (Importar, Organizar, Idiomas, Validar, Revisar) mais
   uma sexta tela (projeto preparado + lote). A ação principal só aparece depois
   de seis telas.
2. Cada etapa repete eyebrow + título display + descrição + conteúdo, empurrando
   a pergunta "o que faço agora?" para baixo.
3. Na etapa Importar, o bloco do projeto anterior, o painel de lote e (em dev) a
   demonstração aparecem acima da seleção, sugerindo que o trabalho já terminou.
4. Idiomas ocupam uma etapa inteira para dois campos; Validar é uma etapa que o
   usuário só atravessa, sem decisão (exceto quando há página inválida).
5. Revisar apenas repete o que o usuário acabou de ver; "Preparar" e "Traduzir"
   são duas ações em duas telas.
6. No projeto preparado empilham-se resumo, demonstração (dev), aviso de vínculo
   sem ação e lote; o botão de traduzir fica no fim da rolagem.
7. O botão primário muda de posição por etapa e não é fixo.

## Requisitos e regras

### Estrutura (5 → 3 etapas)

- O fluxo passa a ter três etapas visíveis: **Páginas** (importar + organizar,
  na mesma tela), **Idiomas** (linha única origem → destino, com validação
  automática e resumo) e **Traduzir** (projeto preparado + lote).
- Validação deixa de ser etapa: executa automaticamente na etapa Idiomas,
  logo depois de os idiomas serem confirmados (pré-requisito da MOB-FEAT-015),
  mostra estado por miniatura (chip) e só bloqueia o avanço se houver página
  inválida, com correção localizada e retry seletivo como hoje (decisão D4).
- "Revisar" é absorvida em "Idiomas": um resumo curto (páginas, idiomas,
  validação) acima do botão primário. "Preparar" e "Traduzir" passam a ser a
  mesma ação na etapa final; o consentimento continua explícito antes de
  qualquer envio.
- Confirmações persistidas (`confirmedAt`, `languagesConfirmedAt`, validação
  pronta pela política vigente) continuam sendo gravadas; o botão "Continuar"
  as registra. Nenhuma passa a ser inferida sem ação do usuário.

### Interface

- Cabeçalho único: voltar (esquerda), título curto, Home (direita). Sem eyebrow
  nem título display por etapa; uma linha de apoio opcional.
- Indicador de progresso compacto de 3 passos, com o passo atual rotulado.
- Botão primário **fixo no rodapé** em todas as etapas, único por tela, com o
  rótulo da ação (Continuar, Preparar e traduzir, Traduzir N páginas). Nenhuma
  etapa exige rolagem para alcançá-lo.
- Projeto anterior, lote antigo e demonstração (somente `__DEV__`) saem da
  etapa Páginas; o projeto anterior fica acessível por link discreto
  "Retomar último capítulo" quando existir.
- Estados (carregando, validando, enviando, sucesso, erro) usam um componente
  de status único (ícone + rótulo + cor semântica), perto da causa e com ação.
- Aviso de vínculo falho vira item com ação "Tentar vincular de novo".
- Lote: "Selecionar todas / nenhuma", contador e progresso agregado no topo;
  estados aguardando, processando, salva, falhou e incerta como chips.
- Cores, espaçamentos e raios apenas por tokens; textos por i18n; componentes
  reutilizáveis em `shared/ui`; layout responsivo a fonte grande e telas
  pequenas, sem corte nem rolagem horizontal.

### Navegação e progresso

- Voltar retorna à etapa anterior preservando draft, ordem, idiomas e
  validação; Home e saída durante processamento mantêm o aviso atual, sem perda
  silenciosa nem reenvio automático.
- Rascunho ativo é restaurado na etapa correta ao reabrir o app.

## Casos de erro

- Página inválida: etapa Idiomas permanece com chip de erro, ação de
  substituir/remover e retry; o botão primário leva à correção, sem avançar.
- Falha de gravação ou validação: mensagem recuperável, sem perder draft.
- Recusa de consentimento: nada é enviado; o usuário permanece na etapa final.

## Critérios de aceite

### AC-001 — Três etapas
Importar, organizar, escolher idiomas, validar e preparar são concluídos em três
etapas visíveis, sem remover nenhuma capacidade existente.

### AC-002 — Confirmações preservadas
Ordem, idiomas e validação continuam registrados e exigidos antes de preparar;
nenhum passo é pulado sem ação explícita do usuário.

### AC-003 — Validação automática
Validação roda sozinha logo depois de confirmar os idiomas, na etapa Idiomas,
exibe estado por página e só bloqueia quando há página inválida, com correção e
retry localizados.

### AC-004 — Ação principal sempre alcançável
Cada etapa tem um único botão primário fixo no rodapé, visível sem rolagem em
telas pequenas e com fonte ampliada.

### AC-005 — Navegação sem perda
Voltar e avançar preservam draft, ordem, idiomas e validação; Home e saída
durante processamento preservam o comportamento seguro atual.

### AC-006 — Consentimento e envio inalterados
Nenhuma chamada remota ocorre antes do aceite; consentimento, chave por
tentativa, recibos e retry seguem MOB-FEAT-017/055.

### AC-007 — Lote e feedback de estado
Seleção em lote, progresso agregado e chips de estado distinguem aguardando,
processando, salva, falhou e incerta; erros mostram ação.

### AC-008 — Consistência visual e i18n
Tokens de tema, componentes de `shared/ui`, claro/escuro e textos completos em
`pt-BR`, `en-US` e `es-ES`, sem texto ou cor fixos.

### AC-009 — Itens de desenvolvimento
Demonstração e atalhos de desenvolvimento não aparecem em build de usuário.

### AC-010 — Qualidade e regressão
Testes de página, painéis, modelo de etapas, i18n e FSD passam; `pnpm check`
verde; cobertura e registry atualizados.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                         |
| -------- | ---------------------------------------------------------------- |
| AC-001   | teste de página e `translationFlow` com 3 etapas                 |
| AC-002   | testes de persistência das confirmações e gating                 |
| AC-003   | teste de validação automática, inválida e retry                  |
| AC-004   | teste de layout com rodapé fixo e fonte ampliada; captura        |
| AC-005   | testes de voltar/avançar, Home e saída em processamento          |
| AC-006   | testes de consentimento e ausência de chamada antes do aceite    |
| AC-007   | testes do painel de lote e do componente de status               |
| AC-008   | testes de i18n por chave e capturas claro/escuro                 |
| AC-009   | teste com `__DEV__` falso                                        |
| AC-010   | `pnpm check` e revisão                                           |

## Gate de implementação

- Estado: `open` (2026-11-08). MOB-FEAT-055 chegou a `verification-pending`.
- Abertura: Ruan Moraes, mensagem “Vamos fazer tudo, depois eu verifico se esta oK”.
- Esta spec exige aprovação humana antes de tasks ou código (registrada abaixo).

## Fora de escopo

Biblioteca/Obra, Configurações, Conta, remoção de rotas da plataforma, mudanças
de gateway, de contratos de dados ou de política de consentimento (a revisão D3
muda só a apresentação do consentimento, não a política).

## Revisão 2026-11-08 — adendo do kit mobile (decisão D3)

O kit mobile do Toonlira Design System (`ui_kits/mobile/TranslateScreen.jsx`) diverge desta spec em quatro pontos.
Mudar a intenção de uma spec aprovada é revisão: a spec volta a `draft` até nova aprovação humana, e o gate continua
`blocked` pela MOB-FEAT-055. Na aprovação da revisão, a opção **A (seguir o kit)** foi escolhida nas quatro linhas;
as regras e AC abaixo valem e prevalecem sobre o texto original dos AC citados.

| #    | Item                | 056 hoje                       | A — kit                                                                                               | AC afetados (com A)           | Escolha      |
| ---- | ------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------- | ------------ |
| D3.1 | Idiomas             | linha única "origem → destino" | seletores "De" e "Para" em folha, botão de trocar; o idioma escolhido no outro lado fica desabilitado | AC-001 (texto), AC-013 novo   | A            |
| D3.2 | Consentimento       | fora do escopo desta spec      | folha "Antes de enviar" com 3 itens e "Ver detalhes" com o texto completo                             | AC-006 (reforço), AC-011 novo | A            |
| D3.3 | Destino do capítulo | não previsto                   | cartão "Salvar em: <obra> / Sem obra" com folha de escolha, antes de traduzir                         | AC-012 novo                   | A            |
| D3.4 | Progresso           | 3 passos com o atual rotulado  | barra de 3 segmentos e "Etapa N de 3: <nome>"                                                         | AC-004 (texto do indicador)   | A            |

### Regras adicionais

- **Idiomas (D3.1):** na etapa Idiomas, "De" e "Para" abrem folhas de escolha (`ChoiceRow`) com os idiomas
  suportados pela 014/044; o idioma escolhido no outro seletor aparece desabilitado com motivo acessível; o botão
  "Trocar origem e destino" inverte os dois e só fica disponível quando a troca é válida. A confirmação continua
  gravando `languagesConfirmedAt` só no "Continuar".
- **Consentimento em camadas (D3.2):** antes do primeiro envio de cada tentativa, abre a folha "Antes de enviar" com
  três itens curtos, fiéis à MOB-FEAT-017 e à MOB-DEC-008: o que sai do aparelho, por quanto tempo é retido e que
  respostas incertas não são reenviadas automaticamente. "Ver detalhes" abre o texto completo real do consentimento
  da 017 (não um aviso temporário). Nenhuma chamada remota antes do aceite; recusar ou fechar a folha não envia nada e
  mantém a pessoa na etapa Traduzir; chave por tentativa e recibos inalterados. Isto ajusta só a apresentação: a
  política de consentimento continua fora de escopo.
- **Salvar em (D3.3):** na etapa Traduzir, um cartão mostra "Salvar em: <obra> · <origem> → <destino>"; tocar abre
  folha com as obras da 055 e "Sem obra". O padrão é a obra de origem do fluxo, quando houver, senão "Sem obra". A
  escolha usa o vínculo de capítulo da 055 e fica bloqueada durante o processamento. Falha de vínculo segue a regra
  já prevista: item com "Tentar vincular de novo", sem perder o resultado.
- **Progresso (D3.4):** o indicador compacto passa a ser barra de 3 segmentos com o rótulo "Etapa N de 3: <nome>",
  exposta como `progressbar` acessível (valor, mínimo, máximo e nome do passo).

### Critérios de aceite adicionados ou alterados

- **AC-001 (texto alterado):** a etapa Idiomas usa os seletores "De" e "Para" da D3.1 em vez da linha única.
- **AC-004 (texto alterado):** o indicador de progresso é a barra de 3 segmentos com "Etapa N de 3: <nome>".
- **AC-006 (reforço):** o aceite acontece na folha "Antes de enviar" da D3.2.

### AC-011 — Consentimento em camadas

Dado um envio a fazer, quando a pessoa tocar na ação principal da etapa Traduzir, então a folha "Antes de enviar"
mostra os três itens e "Ver detalhes" com o texto completo da 017; nenhuma chamada remota ocorre antes do aceite, e
recusar ou fechar não envia nada nem sai da etapa.

### AC-012 — Destino do capítulo

Dada a etapa Traduzir, quando a pessoa escolher a obra em "Salvar em" (ou "Sem obra"), então o capítulo é vinculado
pela operação da 055 ao concluir; durante o processamento a escolha fica bloqueada; falha de vínculo mostra "Tentar
vincular de novo" sem perder o resultado.

### AC-013 — Seletores de idioma

Dada a etapa Idiomas, quando a pessoa abrir "De" ou "Para", então o idioma usado no outro lado aparece desabilitado
com motivo, "Trocar" inverte os dois quando válido e a confirmação só é gravada em "Continuar".

### Evidência adicional

| Critério | Teste/evidência esperada                                                      |
| -------- | ----------------------------------------------------------------------------- |
| AC-011   | teste da folha, "Ver detalhes", recusa e ausência de chamada antes do aceite  |
| AC-012   | teste do cartão, folha de obras, bloqueio em processamento e falha de vínculo |
| AC-013   | teste dos seletores, idioma desabilitado, troca e persistência da confirmação |

### Não portar do kit

Resultados roteirizados (4ª página falha, 6ª incerta), data fixa "08/11/2026", destinos fixos de "Abrir no leitor" e
"Retomar último capítulo", validação simulada a cada 420 ms e avisos temporários de protótipo ("Nada foi enviado",
"Abre o texto completo do consentimento").

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-08
- Evidência: resposta “Aprovo as duas” à apresentação da revisão D3 (com MOB-FEAT-063), escolhendo a opção A nas
  quatro linhas. O gate de implementação segue `blocked`.
- **D4 — momento da validação (2026-11-09, durante a execução):** a AC-003 pedia validação depois da ordem, mas a
  MOB-FEAT-015 só valida com idiomas confirmados. Ruan Moraes escolheu ajustar a spec (resposta “Ajustar a spec”): a
  validação roda na etapa Idiomas, logo depois da confirmação dos idiomas; a 015 não muda.

### Histórico de aprovação

- Versão original: aprovada por Ruan Moraes em 2026-11-08 (resposta “Aprovo a spec”), com gate `blocked`. Esta
  aprovação não cobre a revisão D3 acima.
