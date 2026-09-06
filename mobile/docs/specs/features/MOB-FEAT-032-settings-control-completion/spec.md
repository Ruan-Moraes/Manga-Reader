---
id: MOB-FEAT-032
type: feature
title: Conclusão dos controles e estados das configurações
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-031]
created: 2026-08-22
updated: 2026-09-03
supersedes: []
superseded_by: []
---

# MOB-FEAT-032 — Conclusão dos controles e estados das configurações

## Objetivo

Concluir a migração das configurações por meio de uma auditoria individual de
cada preferência real, corrigindo controles cuja apresentação ainda perde
clareza em telas estreitas, fonte ampliada ou foco, e provando que interação,
persistência, aplicação imediata e navegação continuam corretas.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-031` sem criar preferências ou capacidades novas.
- Mantém `UserSettings`, preferências de conta, idiomas priorizados, stores,
  requests, confirmações e políticas de sincronização como fontes de verdade.
- Agrupamento, hierarquia e personalidade visual seguem os contratos de
  `MOB-FEAT-028..031`, os tokens de tema e as primitivas compartilhadas;
  controles sem contrato real permanecem descartados.
- Primitivas agnósticas continuam em `shared/ui`; features escolhem a entrada
  adequada e pages apenas compõem navegação e estados de acesso.

## Requisitos e regras

### Inventário normativo

| Configuração                                  | Componente               | Justificativa                                           |
| --------------------------------------------- | ------------------------ | ------------------------------------------------------- |
| tema                                          | cards de escolha         | decisão visual com preview, ícone e descrição           |
| tamanho de texto e densidade                  | segmentado adaptativo    | conjuntos exclusivos, curtos e frequentes               |
| animações, reduzir movimento e alto contraste | switch em linha          | estados booleanos independentes                         |
| idioma da interface                           | cards empilhados         | rótulos localizados e mudança global relevante          |
| formato de data                               | segmentado adaptativo    | três exemplos curtos e mutuamente exclusivos            |
| fuso horário                                  | select em sheet          | lista maior, rótulos extensos e baixa frequência        |
| modo e direção de leitura                     | cards                    | decisões espaciais que se beneficiam de ícone/descrição |
| ajuste da página                              | segmentado adaptativo    | três valores curtos e exclusivos                        |
| qualidade de imagem                           | select em sheet          | conjunto dependente das capacidades do capítulo         |
| fundo do leitor                               | cards com amostra        | decisão visual que não pode depender apenas da cor      |
| saturação                                     | slider ajustável         | intervalo contínuo limitado, com valor textual          |
| espaçamento e pré-carregamento                | slider ajustável         | intervalos inteiros equivalentes aos controles web      |
| marcar como lido e analytics                  | switch em linha          | booleanos independentes com dependências explícitas     |
| visibilidades sociais                         | segmentado adaptativo    | conjuntos pequenos; reflow deve evitar opções mescladas |
| histórico e conteúdo adulto                   | cards empilhados         | consequências que exigem descrição por alternativa      |
| idiomas de conteúdo                           | lista ordenada com ações | prioridade, fallback e reordenação não são radios       |
| limpeza, exportação e histórico               | botões de ação           | comandos com loading, autenticação e confirmação        |

### Estados e responsividade

- Segmentos nunca quebram como opções ambíguas dentro de uma mesma linha: em
  largura compacta ou fonte ampliada passam a uma coluna, preservando a
  identidade de seletor exclusivo.
- Seleção combina superfície, borda espessa e `accessibilityState.selected`;
  cards e segmentos empilhados também usam ícone quando há espaço seguro.
- Cards, segmentos, selects e switches apresentam foco visível; pressionado e
  desabilitado permanecem distintos por mais de uma pista visual.
- Sliders e steppers anunciam valor e limites; seus incrementos respeitam step,
  mínimo e máximo tanto por toque quanto por ação assistiva.
- Sheets possuem título, fechamento, radios, valor selecionado e retorno seguro.
- Seções mantêm alinhamento, ritmo editorial e leitura sem sobreposição em
  320×568, 390×844, 600×960, 840×600 e font scale de 200%.
- Toda subtela mantém retorno reutilizável no topo esquerdo; back visual, gesto e
  back do sistema convergem para o índice de configurações.

### Persistência e aplicação

- Aparência, acessibilidade, idioma, região e leitor continuam atualizando o
  único settings store, persistindo localmente e sincronizando o grupo correto.
- Tema, contraste, movimento, escala e densidade têm preview imediato.
- Privacidade e idiomas de conteúdo preservam rollback, retry, estados
  confirmados e alinhamento por `identityEpoch`.
- Valores reabertos, remountados ou restaurados do storage refletem a última
  verdade persistida, sem estado paralelo dentro dos controles.

## Casos de erro

- Falha local ou remota mantém mensagem persistente e ação de retry aplicável.
- Opção desabilitada permanece legível, anunciada e não aceita interação.
- `DO_NOT_TRACK` continua exigindo confirmação e desabilita analytics com causa.
- Qualidade indisponível é normalizada para opção válida sem expor capacidade
  fictícia.
- Ações destrutivas mantêm confirmação, estado ocupado e escopo informado.
- Texto longo ou ampliado não mescla alternativas, oculta valor nem remove ação.

## Critérios de aceite

### AC-001 — Mapeamento completo

Todas as configurações reais estão registradas no inventário e usam o controle
correspondente, sem checkbox genérico ou preferência fictícia.

### AC-002 — Estados completos

Primitivas apresentam normal, pressionado, foco, selecionado e desabilitado;
loading e erro são cobertos no nível adequado da operação.

### AC-003 — Reflow legível

Segmentos e cards preservam separação, labels e seleção nas dimensões e escalas
definidas, sem opções visualmente concatenadas.

### AC-004 — Interação e limites

Cada controle altera apenas o valor esperado; slider, stepper, switches, sheets,
reordenação e confirmações respeitam limites e pré-condições.

### AC-005 — Persistência e aplicação

Mudanças locais, remount, storage, sync, rollback e preview imediato continuam
equivalentes aos contratos existentes.

### AC-006 — Navegação e acesso

Índice e subtelas mantêm back acessível, safe area, login quando necessário e
nenhum destino futuro ou inacessível é simulado.

### AC-007 — Matriz visual e assistiva

Tema claro/escuro, alto contraste, densidades, orientações, quatro larguras e
font scale de 200% passam pela auditoria documentada.

### AC-008 — Qualidade e arquitetura

i18n possui paridade, boundaries FSD permanecem válidas e `pnpm check` passa
integralmente sem regressão de contratos.

## Estratégia de evidência

| Critério | Evidência esperada                                          |
| -------- | ----------------------------------------------------------- |
| AC-001   | inventário desta spec e inspeção das features               |
| AC-002   | testes dirigidos de foco, seleção, disabled, loading e erro |
| AC-003   | testes de layout adaptativo e auditoria nativa              |
| AC-004   | testes unitários e de integração por configuração           |
| AC-005   | testes dos stores, persistência, remount e rollback         |
| AC-006   | integração das rotas e auditoria do back                    |
| AC-007   | matriz nativa registrada em `evidence/native-audit.md`      |
| AC-008   | gates, review e drift audit finais                          |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-031` implementada.
- Escopo autorizado: correções de controles, estados visuais, responsividade,
  acessibilidade, testes e documentação das configurações existentes.

## Fora de escopo

- Criar botão de reset ou qualquer preferência sem contrato funcional aprovado.
- Adicionar controles sem contrato funcional aprovado.
- Alterar API, payload, banco, autenticação ou política de privacidade.
- Redesenhar superfícies que não pertencem à jornada de configurações.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-22
- Decisão: nova revisão completa e implementação explicitamente solicitadas.
