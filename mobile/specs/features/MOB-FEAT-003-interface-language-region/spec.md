---
id: MOB-FEAT-003
type: feature
title: Idioma da interface e preferências regionais
status: draft
implementation_gate: blocked
blocked_by: [MOB-FEAT-001]
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-003 — Idioma da interface e preferências regionais

## Objetivo

Permitir que a pessoa use a interface mobile em um idioma suportado e controle a
apresentação regional de datas sem reiniciar o aplicativo, mantendo o locale da
interface separado das preferências de idioma do conteúdo.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-001` para modelo, hidratação, persistência local-first e
  sincronização das preferências de região.
- Evolui o comportamento observado em `MOB-BASE-003/OBS-001` a
  `MOB-BASE-003/OBS-005`; o baseline permanece válido até a implementação desta
  Target Spec.
- Preserva `pt-BR`, `en-US` e `es-ES` como idiomas suportados e `pt-BR` como
  fallback.
- A Core mantém o idioma da interface no cliente. `dateFormat` e `timezone`
  pertencem a `locale` em `GET/PATCH /users/me/settings`.
- `MOB-FEAT-004` define a cadeia de idiomas de conteúdo. Essa cadeia não altera
  o locale usado nos textos da interface nem o header `Accept-Language`.
- Textos e labels de domínio retornados por endpoints públicos são resolvidos
  pela Core conforme o locale do request; o Mobile não mantém traduções locais
  paralelas desses labels.

## Requisitos e regras

- O idioma da interface deve ser um dos valores `pt-BR`, `en-US` ou `es-ES`.
  Valor ausente, inválido ou não suportado deve ser normalizado para `pt-BR`.
- A alteração de idioma deve atualizar imediatamente toda interface já montada,
  sem reload, reinício ou bloqueio da navegação, e persistir a seleção localmente.
- Toda request iniciada depois da alteração deve enviar o idioma efetivo da
  interface em `Accept-Language`, inclusive requests de autenticação e refresh.
- A mudança de idioma deve invalidar ou atualizar somente caches cujas respostas
  tenham apresentação resolvida por `Accept-Language`. Estado independente de
  locale, dados de formulário e downloads em andamento devem ser preservados.
- Cada namespace mobile deve nascer com uma capacidade consumidora real. Todo
  namespace registrado deve existir nos três idiomas e possuir a mesma estrutura
  de chaves, com fallback final para `pt-BR`.
- Texto novo visível deve vir do i18n mobile. Labels de domínio traduzíveis
  fornecidos pela API devem ser apresentados como recebidos, sem dicionário local
  que duplique a fonte normativa da Core.
- `dateFormat` deve aceitar somente `D_MON`, `D_M` e `MON_D`; o default é
  `D_MON`. Os formatos representam, respectivamente, dia + mês abreviado, data
  numérica dia/mês e mês abreviado + dia, sempre incluindo o ano quando a
  superfície exibir uma data completa.
- `timezone` deve aceitar somente `America/Sao_Paulo`, `America/New_York`,
  `Europe/Lisbon`, `Asia/Tokyo` e `UTC`; o default é `America/Sao_Paulo`.
- Formatadores compartilhados de data, número e moeda devem consumir o idioma
  efetivo da interface. Formatadores de data devem também consumir `dateFormat` e
  `timezone`, salvo quando a própria superfície possuir formato temporal
  normativo mais específico.
- Preferências regionais devem usar o fluxo local-first de `MOB-FEAT-001`: o
  efeito visual local é imediato, enquanto a conta autenticada sincroniza o
  grupo `locale` com a Core.
- Na futura organização FSD, tipos e formatadores neutros pertencem a `shared`,
  o contrato de settings pertence a `entities`, a alteração/sincronização fica em
  `features` e providers de idioma ficam em `app`. Páginas e widgets apenas
  compõem esses contratos pelas APIs públicas dos slices.

## Casos de erro

- Falha de persistência local ou de sincronização regional deve preservar o
  valor efetivo em memória e expor o estado de retry definido em `MOB-FEAT-001`.
- Locale persistido ou retornado pela Core que não pertença aos valores aceitos
  deve cair no default correspondente e não pode impedir a inicialização.
- Data ausente ou inválida deve produzir o estado vazio definido pela superfície,
  sem lançar erro de renderização.
- Se a plataforma rejeitar um timezone inesperado apesar da validação, a data
  deve ser formatada no timezone seguro da plataforma e o aplicativo deve
  continuar utilizável.
- Falha ao recarregar uma resposta dependente de locale não deve reverter o
  idioma da interface; a superfície deve permitir retry preservando a seleção.

## Critérios de aceite

### AC-001 — Idiomas suportados e fallback

Dado um valor de idioma ausente, inválido ou não suportado, quando as
preferências forem hidratadas, então a interface usa `pt-BR`; valores válidos
preservam `pt-BR`, `en-US` ou `es-ES` sem conversão indevida.

### AC-002 — Troca imediata e persistida

Dada a interface já montada, quando a pessoa seleciona outro idioma suportado,
então os textos visíveis mudam sem reinício e a seleção continua ativa após uma
nova hidratação.

### AC-003 — Header representa a interface

Dado um idioma efetivo da interface, quando qualquer request ou refresh é
iniciado, então `Accept-Language` contém exatamente esse idioma, ainda que a
cadeia de conteúdo possua outra prioridade.

### AC-004 — Atualização seletiva de dados localizados

Dado cache com respostas dependentes e independentes de locale, quando o idioma
da interface muda, então somente as respostas cuja apresentação depende de
`Accept-Language` são invalidadas ou atualizadas, sem perder estado local não
relacionado.

### AC-005 — Paridade de namespaces

Dado qualquer namespace registrado no Mobile, quando o gate de specs e i18n é
executado, então o namespace possui a mesma estrutura de chaves em `pt-BR`,
`en-US` e `es-ES` e possui ao menos um consumidor da capacidade correspondente.

### AC-006 — Labels normativos permanecem na Core

Dada uma resposta pública com label de domínio já localizado, quando a
superfície o apresenta, então exibe o valor da API sem tentar traduzi-lo por um
dicionário mobile paralelo.

### AC-007 — Formatos de data

Dada a mesma data válida, quando cada preferência é selecionada, então `D_MON`
apresenta dia antes do mês abreviado, `D_M` apresenta dia e mês numericamente e
`MON_D` apresenta mês abreviado antes do dia, todos no idioma ativo e com ano em
datas completas.

### AC-008 — Timezones suportados

Dado um instante que muda de dia entre fusos, quando cada timezone suportado é
aplicado, então a data apresentada corresponde ao timezone selecionado; valor
inválido não derruba a superfície e usa fallback seguro.

### AC-009 — Sincronização regional autenticada

Dada uma sessão autenticada, quando `dateFormat` ou `timezone` muda, então o
efeito local é imediato e o grupo `locale` é sincronizado pelo contrato de
settings; falha mantém o valor pendente e oferece retry.

### AC-010 — Separação entre UI e conteúdo

Dadas preferências diferentes para interface e conteúdo, quando o app renderiza
seus próprios textos e busca conteúdo da Core, então a interface segue somente o
idioma da UI e a filtragem/fallback de conteúdo segue `MOB-FEAT-004`.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                 |
| -------- | ---------------------------------------------------------------------------------------- |
| AC-001   | Teste unitário de normalização e hidratação dos três locales e fallback                  |
| AC-002   | Teste de integração do provider/store comprovando troca sem remontagem e nova hidratação |
| AC-003   | Teste do cliente HTTP para requests comuns e refresh com cadeias de conteúdo distintas   |
| AC-004   | Teste de integração do cache por query keys dependentes e independentes de locale        |
| AC-005   | Gate automatizado de paridade de namespaces, chaves e consumidores                       |
| AC-006   | Teste de integração de uma superfície com label resolvido pela API                       |
| AC-007   | Testes unitários de formatação por locale e `dateFormat`                                 |
| AC-008   | Testes unitários de timezone, virada de dia e fallback inválido                          |
| AC-009   | Teste de integração com persistência local, contrato Core, erro e retry                  |
| AC-010   | Teste de integração combinando idioma de UI e cadeia de conteúdo diferentes              |

## Gate de implementação

- Estado: `blocked`
- Dependências: `MOB-FEAT-001`
- Motivo: idioma e região dependem do modelo, hidratação e sincronização local-first antes de expor controles.

O gate só pode ser aberto quando `MOB-FEAT-001` estiver `implemented`.

## Fora de escopo

- Adicionar um idioma além de `pt-BR`, `en-US` e `es-ES`.
- Traduzir conteúdo gerado por usuário ou manter traduções locais de labels de
  domínio resolvidos pela Core.
- Copiar para o Mobile todos os namespaces da Web antes de existirem capacidades
  consumidoras.
- Reproduzir a recarga completa exigida atualmente pela Web.
- Definir a navegação das telas de configurações, coberta por `MOB-FEAT-008`.

## Aprovação humana

- Aprovador: pendente
- Data: pendente

Não criar `tasks.md` antes de status `approved`, aprovação preenchida e
`implementation_gate: open`.
