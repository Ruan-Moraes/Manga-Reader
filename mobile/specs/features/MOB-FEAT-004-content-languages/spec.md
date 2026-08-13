---
id: MOB-FEAT-004
type: feature
title: Cadeia de idiomas de conteúdo
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-001, MOB-FEAT-003]
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-004 — Cadeia de idiomas de conteúdo

## Objetivo

Definir uma cadeia explícita e previsível de idiomas para catálogo e conteúdo
gerado por usuário, preservando a ordem de preferência de contas autenticadas e
oferecendo a convidados um comportamento real sem controles locais ineficazes.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-001` para transições guest/conta, hidratação autenticada,
  isolamento entre contas e estados de sincronização.
- Depende de `MOB-FEAT-003` para o idioma efetivo da interface e seu header
  `Accept-Language`.
- A Core expõe `GET /users/me/content-locales` e
  `PATCH /users/me/content-locales` com `{ contentLocales: string[] }` para
  pessoas autenticadas. A lista é ordenada e a Core rejeita somente lista vazia,
  entradas em branco ou tags BCP 47 inválidas; unicidade, conjunto mobile e
  presença de `pt-BR` são garantias desta Target Spec no cliente.
- Na resolução da Core, contas autenticadas priorizam `contentLocales`, depois o
  locale do request e finalmente `pt-BR`; convidados usam o locale do request e
  `pt-BR`.
- Conteúdo localizado de catálogo usa fallback por locale. UGC não é traduzido:
  comentários, tópicos e respostas são particionados por idioma.

## Requisitos e regras

- A cadeia editável de uma conta deve conter somente `pt-BR`, `en-US` e `es-ES`,
  sem duplicatas e na ordem escolhida pela pessoa.
- `pt-BR` é o fallback obrigatório: deve estar presente uma única vez e não pode
  ser removido. Ele pode ser reposicionado, pois a ordem inteira representa a
  prioridade de conteúdo.
- Adicionar, remover ou reordenar deve produzir a cadeia normalizada completa e
  sincronizá-la por `PATCH /users/me/content-locales`. O sucesso deve substituir
  o estado local pela resposta normalizada e invalidar dados de catálogo e UGC
  cuja seleção ou resolução dependa da cadeia.
- Ao autenticar ou trocar de conta, o Mobile deve buscar a cadeia por
  `GET /users/me/content-locales`; o valor da conta prevalece sobre qualquer
  estado privado da conta anterior.
- Uma resposta da Core deve ser normalizada para o conjunto mobile: preservar a
  primeira ocorrência de cada idioma suportado na ordem recebida, descartar
  valores não suportados e acrescentar `pt-BR` se ausente. Essa correção local
  não dispara `PATCH` automaticamente; a cadeia completa será enviada na próxima
  alteração explícita da pessoa.
- Enquanto a pessoa estiver como guest, a cadeia efetiva deve ser derivada do
  idioma da interface: `[idiomaDaInterface, pt-BR]`, removendo duplicata. Não deve
  haver editor de cadeia nem request aos endpoints autenticados.
- No logout, expiração ou troca de conta, dados privados da cadeia anterior e
  caches autenticados dependentes dela devem ser removidos antes de retornar à
  política guest.
- `Accept-Language` deve continuar contendo apenas o idioma da interface. A
  cadeia de conteúdo autenticada é resolvida pela Core a partir da conta e não
  deve ser serializada nesse header.
- A interface deve explicar que a ordem define prioridade e identificar
  `pt-BR` como fallback obrigatório. Ações de mover e remover devem possuir
  nomes acessíveis, estados desabilitados coerentes e alvos de toque adequados.
- Na futura organização FSD, o tipo e a normalização da cadeia pertencem à
  entidade de preferências de conteúdo; leitura, edição e sincronização formam
  uma feature; superfícies de catálogo/UGC apenas consomem a cadeia efetiva por
  APIs públicas. O cliente HTTP e utilitários BCP 47 permanecem em `shared`.

## Casos de erro

- Falha no `GET` autenticado não pode reutilizar a cadeia de outra conta. O app
  deve usar temporariamente `[idiomaDaInterface, pt-BR]`, indicar indisponibilidade
  da preferência remota e permitir retry.
- Falha no `PATCH` deve manter a edição pendente visível, preservar a última
  cadeia confirmada separadamente e oferecer retry sem reordenar silenciosamente
  a escolha.
- Lista vazia, apenas com valores não suportados ou sem `pt-BR` deve ser
  normalizada para uma cadeia válida que termine contendo `pt-BR`.
- Uma resposta obsoleta não pode sobrescrever uma edição mais recente nem dados
  pertencentes a outra conta.
- Falha ao atualizar dados dependentes da cadeia não deve reverter uma
  preferência já confirmada; cada superfície afetada deve permitir retry.

## Critérios de aceite

### AC-001 — Cadeia autenticada normalizada

Dada uma conta com valores suportados repetidos, não suportados ou sem fallback,
quando a resposta da Core é hidratada, então o Mobile preserva a primeira
ocorrência de cada idioma suportado, descarta os demais e garante exatamente uma
ocorrência de `pt-BR`.

### AC-002 — Ordem representa prioridade

Dada uma cadeia autenticada com três idiomas, quando a pessoa move um idioma,
então a ordem exibida, enviada e confirmada permanece idêntica à prioridade
escolhida.

### AC-003 — Fallback obrigatório

Dada qualquer cadeia editável, quando a pessoa tenta remover `pt-BR`, então a
ação permanece indisponível e nenhuma cadeia sem `pt-BR` é persistida ou enviada.

### AC-004 — Contrato autenticado de leitura e escrita

Dada uma sessão autenticada, quando a preferência é hidratada ou alterada,
então o Mobile usa respectivamente `GET` e `PATCH /users/me/content-locales` com
o envelope `{ contentLocales: string[] }`, sem chamar esses endpoints como guest.

### AC-005 — Atualização dos consumidores

Dado conteúdo em cache cuja seleção ou apresentação depende da cadeia, quando um
`PATCH` é confirmado, então catálogo e UGC afetados são invalidados ou atualizados
sem apagar estado independente de idioma.

### AC-006 — Política guest efetiva

Dado um guest com idioma de interface `en-US`, quando o conteúdo é solicitado,
então a cadeia efetiva é `['en-US', 'pt-BR']`; com interface `pt-BR`, ela é
`['pt-BR']`, sem editor de cadeia e sem persistência remota fictícia.

### AC-007 — Isolamento de conta e logout

Dada uma cadeia autenticada, quando ocorre logout, expiração ou troca de conta,
então a cadeia e os caches privados anteriores deixam de ser observáveis antes
da aplicação da política guest ou da hidratação da nova conta.

### AC-008 — Independência de `Accept-Language`

Dada uma interface `es-ES` e uma cadeia autenticada `['en-US', 'pt-BR']`, quando
uma request é enviada, então `Accept-Language` continua `es-ES` e a cadeia não é
concatenada nem serializada no header.

### AC-009 — Falha e retry de leitura

Dada falha no `GET` da conta, quando a tela de preferência é aberta, então não
exibe dados de outra conta, usa a política guest como fallback temporário e
oferece retry identificável.

### AC-010 — Falha, concorrência e retry de escrita

Dadas alterações consecutivas ou falha no `PATCH`, quando respostas chegam fora
de ordem ou a pessoa aciona retry, então apenas a versão mais recente pode ser
confirmada e a ordem pendente não é perdida nem substituída por resposta obsoleta.

### AC-011 — Acessibilidade do editor

Dada a tela autenticada de idiomas de conteúdo, quando ela é operada por toque
ou tecnologia assistiva, então cada posição, idioma, ação de mover e ação de
remover possui nome e estado perceptíveis, e `pt-BR` é anunciado como fallback.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                        |
| -------- | ------------------------------------------------------------------------------- |
| AC-001   | Teste unitário da normalização com duplicatas, tags externas e fallback ausente |
| AC-002   | Teste de estado do editor e payload mantendo a ordem escolhida                  |
| AC-003   | Teste de interação impedindo remoção e envio sem `pt-BR`                        |
| AC-004   | Teste de contrato HTTP autenticado e prova de ausência de chamadas como guest   |
| AC-005   | Teste de integração da mutação com invalidação seletiva de cache                |
| AC-006   | Teste parametrizado da derivação guest para os três idiomas da interface        |
| AC-007   | Teste de integração de logout, expiração e troca entre duas contas              |
| AC-008   | Teste do interceptor com UI e cadeia autenticada divergentes                    |
| AC-009   | Teste de erro de hidratação, isolamento e retry                                 |
| AC-010   | Teste com respostas fora de ordem, erro e retry da versão mais recente          |
| AC-011   | Teste de acessibilidade e interação do editor nativo                            |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-001`, `MOB-FEAT-003`
- Motivo: a cadeia de conteúdo depende do isolamento local-first e de um idioma de interface efetivo.

O gate foi aberto após as duas dependências alcançarem `implemented`.

## Fora de escopo

- Tradução automática de catálogo ou conteúdo gerado por usuário.
- Idiomas além de `pt-BR`, `en-US` e `es-ES` nesta versão do contrato mobile.
- Persistir uma cadeia customizável para guests ou promovê-la automaticamente
  para uma conta recém-autenticada.
- Alterar a semântica da Core ou enviar a cadeia inteira em `Accept-Language`.
- Definir filtros específicos de catálogo, comentários ou fórum além da
  invalidação necessária quando a cadeia muda.
- Definir a navegação das configurações, coberta por `MOB-FEAT-008`.

## Aprovação humana

- Aprovador: usuário responsável pelo produto
- Data: 2026-08-08

O usuário aprovou explicitamente a continuação da implementação das Target Specs; o planejamento pode ser criado com o gate aberto.
