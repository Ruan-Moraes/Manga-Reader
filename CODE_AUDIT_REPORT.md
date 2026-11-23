# Auditoria técnica das alterações correntes

Data: 1 de agosto de 2026  
Escopo: índice e working tree comparados com `HEAD`  
Natureza: auditoria seguida de remediação dos achados

## Estado das correções — 1 de agosto de 2026

Os 23 achados descritos abaixo foram tratados. Os textos das seções individuais foram
preservados como registro do estado encontrado durante a auditoria; esta seção representa
o estado atual após as correções.

| Achados | Estado após remediação |
| --- | --- |
| `AUD-001` a `AUD-017` | Corrigidos, com testes direcionados nos fluxos alterados |
| `AUD-018` | Reclassificado: o gateway de produção já usava HTTP; comentários e documentação obsoletos foram corrigidos |
| `AUD-019` a `AUD-023` | Corrigidos, incluindo cobertura de regressão e ajuste das evidências JPEG |

Verificações executadas após a remediação:

- Frontend: TypeScript (`npx tsc -b`) sem erros.
- Frontend: Vitest completo com 186 arquivos e 1.205 testes aprovados.
- Fronteiras FSD: `pnpm lint:fsd` sem problemas.
- Backend: suíte Maven completa com 1.434 testes aprovados, sem falhas ou erros.

## 1. Resumo executivo

| Item | Resultado |
| --- | --- |
| Branch analisada | `feat/auth-refresh-rotation` |
| Base da auditoria | `HEAD`/`origin/feat/auth-refresh-rotation` em `63246fbe1c4cac821959c3b73aeb3e2576fd91d9` |
| Contexto da branch | merge-base com `main`: `8a1eef2cc4734cb9417bdd0a7a2c7bdaa585d17d` |
| Arquivos alterados | 306 |
| Adicionados / modificados / removidos / renomeados | 133 / 170 / 3 / 0 |
| Linhas adicionadas / removidas | 10.055 / 1.206 |
| Arquivos efetivamente analisados | 298 arquivos textuais |
| Ignorados justificadamente | 8 imagens de evidência; metadados inspecionados, conteúdo binário fora da revisão estática |
| Problemas encontrados | 23 |
| Severidade | 0 críticos, 5 altos, 15 médios, 3 baixos |
| Categoria | Lógica 8; Integração 3; Desempenho 3; Segurança 2; Banco de dados 2; Testes 2; Manutenibilidade 3 |

Os módulos de maior risco são: persistência JPA de autores/editoras; busca global cross-DB; feed de lançamentos e seu cache otimista; contratos administrativos de autores, editoras, títulos e capítulos; e a cobertura de segurança dos endpoints novos. Há falhas confirmadas capazes de gerar HTTP 500, paginação em memória, resultados truncados ou incorretos, bloqueio de exclusão e cache divergente do servidor.

A base adequada é `HEAD`, não `main`: os 306 arquivos são exatamente as alterações preparadas e não preparadas atuais, enquanto `git diff main` inclui 1.300 arquivos já comprometidos ao longo da branch. Não havia arquivos untracked no levantamento inicial. A revisão incluiu os dois estados por meio de `git diff HEAD`.

Limitações: não houve teste visual em navegador, medição com `EXPLAIN`, carga volumétrica nem inspeção pixel a pixel das evidências. A primeira suíte Maven foi inviabilizada pelo sandbox; a repetição autorizada com Docker revelou uma falha real de teste. CSS foi revisado estaticamente. O relatório documenta possíveis riscos como tais quando dependem de volume, configuração do navegador ou plano de execução do banco.

## 2. Inventário das alterações

Os globs abaixo são mutuamente exclusivos e cobrem os 306 caminhos retornados por `git diff --name-status HEAD`. A classificação de risco considera o conteúdo, não apenas a extensão.

| Arquivo ou módulo | Tipo de alteração | Categoria / tecnologia | Risco | Status da análise |
| --- | --- | --- | --- | --- |
| `api/core/src/main/java/.../application/**` (33) | 16 A, 17 M | aplicação / Java / Spring | Alto | Analisado com problemas |
| `api/core/src/main/java/.../domain/**` (19) | 12 A, 7 M | domínio / Java | Médio | Analisado com problemas |
| `api/core/src/main/java/.../infrastructure/**` (21) | 9 A, 12 M | JPA, MongoDB, segurança | Alto | Analisado com problemas |
| `api/core/src/main/java/.../presentation/**` (43) | 17 A, 26 M | REST, DTO, mapper | Alto | Analisado com problemas |
| `api/core/src/main/java/.../shared/**` (1) | 1 A | domínio compartilhado | Baixo | Analisado |
| `api/core/src/main/resources/db/migration/**` (5) | 5 A | Flyway / PostgreSQL | Alto | Analisado com problemas |
| `api/core/src/main/resources/messages*` (3) | 3 M | i18n backend | Baixo | Analisado |
| `api/core/src/test/**` (19) | 10 A, 9 M | JUnit, Mockito, Testcontainers | Alto | Analisado com problemas |
| `web/.../src/app/**` (1) | 1 M | React / roteamento FSD | Médio | Analisado |
| `web/.../src/entities/**` (39) | 22 A, 17 M | React Query / FSD entities | Alto | Analisado com problemas |
| `web/.../src/features/**` (30) | 19 A, 11 M | React / FSD features | Alto | Analisado com problemas |
| `web/.../src/pages/**` (42) | 10 A, 31 M, 1 D | páginas React | Alto | Analisado com problemas |
| `web/.../src/widgets/**` (8) | 6 M, 2 D | widgets React | Médio | Analisado |
| `web/.../src/shared/**` (12) | 12 M | UI e constantes compartilhadas | Médio | Analisado |
| `web/.../src/i18n/**` (15) | 15 M | JSON / i18next | Baixo | Analisado |
| `web/.../src/styles/**` (1) | 1 M | CSS / Tailwind | Baixo | Parcialmente analisado |
| `web/.../src/test/**` (1) | 1 M | MSW | Médio | Analisado |
| `docs/architecture.md` (1) | 1 M | documentação normativa | Médio | Analisado com problemas |
| `ADMIN_AUDIT_REPORT.md` e `.audit-admin/*.md` (4) | 4 A | relatórios funcionais | Baixo | Analisado com problemas |
| `.audit-admin/evidence/root/*.jpg` (8) | 8 A | evidência binária | Baixo | Metadados validados como JPEG |

Não há dependências vendorizadas, bundles, diretórios de build ou arquivos gerados entre os 306 itens. Os oito binários são evidências funcionais, não implementação. Os 43 testes com padrão `*Test.java`/`*.test.*` e o handler MSW foram tratados como testes; as cinco migrations e os 18 bundles de mensagens/locales foram separados da implementação funcional.

## 3. Matriz de cobertura

| Módulo | Arquivos alterados | Arquivos analisados | Problemas encontrados | Risco geral |
| --- | ---: | ---: | ---: | --- |
| Backend — application/domain | 52 | 52 | 6 | Alto |
| Backend — infrastructure/persistência/segurança | 21 | 21 | 6 | Alto |
| Backend — presentation/shared | 44 | 44 | 4 | Alto |
| Backend — migrations/i18n | 8 | 8 | 2 | Alto |
| Backend — testes | 19 | 19 | 3 | Alto |
| Frontend — app/entities/features | 70 | 70 | 7 | Alto |
| Frontend — pages/widgets | 50 | 50 | 7 | Alto |
| Frontend — shared/styles/test | 14 | 14 | 1 | Médio |
| Frontend — locales | 15 | 15 | 0 | Baixo |
| Documentação e relatórios | 5 | 5 | 1 | Baixo |
| Evidências binárias | 8 | 0 | 1 | Baixo |

Os totais de problemas por módulo não são somáveis: achados de contrato e testes aparecem nos dois módulos envolvidos, mas existem uma única vez na seção seguinte.

## 4. Problemas encontrados

### AUD-001 — Busca filtrada de autores e editoras serializa coleções lazy fora da transação

**Severidade:** Alta  
**Categoria:** Banco de dados  
**Arquivo:** `AuthorJpaRepository.java`, `PublisherJpaRepository.java`, respectivos mappers/controllers  
**Linhas:** repositories 27; `AuthorMapper.java` 31; `PublisherMapper.java` 26; controllers 52–53 e 47–48  
**Módulo:** API — autores/editoras  
**Status:** Confirmado

#### Descrição

`findByNameContainingIgnoreCase` não hidrata `aliases`, mas os novos mappers percorrem essa coleção depois que o use case encerrou sua transação. O projeto desativa Open Session in View.

#### Evidência

Os métodos filtrados não possuem `EntityGraph` nem segunda consulta; `application.yml:22` mantém `open-in-view=false`. As listagens sem filtro receberam tratamento diferente, confirmando a lacuna.

#### Cenário de falha

`GET /api/authors?name=miura` ou `GET /api/publishers?name=kodansha` retorna uma página não vazia e o mapper acessa `aliases` já desconectado.

#### Impacto

`LazyInitializationException` e resposta HTTP 500 em buscas administrativas/públicas.

#### Recomendação

Hidratar aliases em lote dentro da transação pelo padrão de duas queries sobre os IDs paginados e cobrir ambos os endpoints com integração real.

#### Arquivos relacionados

`ListAuthorsUseCase.java:21-26`, `ListPublishersUseCase.java:21-26`, `Author.java:52-54`, `Publisher.java:55-57`.

### AUD-002 — `EntityGraph` de coleção transforma paginação de autores/editoras em paginação na memória

**Severidade:** Alta  
**Categoria:** Desempenho  
**Arquivo:** `AuthorJpaRepository.java`, `PublisherJpaRepository.java`  
**Linhas:** 29–31 em ambos; coleções em `Author.java:52-54` e `Publisher.java:55-57`  
**Módulo:** API — persistência JPA  
**Status:** Confirmado

#### Descrição

`findAll(Pageable)` faz fetch de `aliases`, uma coleção `@OneToMany`. Hibernate não pagina com segurança um fetch de coleção e aplica o recorte após carregar os resultados pais/filhos.

#### Evidência

As assinaturas combinam `Pageable` com `@EntityGraph(attributePaths="aliases")`, antipadrão explicitamente proibido por `docs/orm-persistence.md`.

#### Cenário de falha

Listagens de autores/editoras em uma base crescente carregam muito mais registros que o tamanho solicitado.

#### Impacto

Latência e memória crescem com a tabela inteira, podendo degradar ou indisponibilizar o endpoint.

#### Recomendação

Paginar pais/IDs primeiro e hidratar aliases em uma segunda query `IN`, preservando a ordem.

#### Arquivos relacionados

`AuthorController.java`, `PublisherController.java`, respectivos use cases e mappers.

### AUD-003 — IDs numéricos do backend são tratados como strings no modal de exclusão

**Severidade:** Alta  
**Categoria:** Integração  
**Arquivo:** `features/admin/model/types/author.types.ts`, `ConfirmDeleteWithIdModal.tsx`  
**Linhas:** tipos 1–8; modal 8–13 e 26; `DashboardAuthors.tsx:84-91`  
**Módulo:** Web/API — autores e editoras  
**Status:** Confirmado

#### Descrição

`AuthorResponse.id` e `PublisherResponse.id` são `Long`, enquanto os tipos admin declaram `string`. O modal compara estritamente o texto digitado com o ID recebido em runtime.

#### Evidência

Para o autor 13, a entrada produz `'13' !== 13`. O cliente Axios genérico mascara a divergência e o type-check não a detecta. O comportamento já foi observado como ADM-007 no relatório funcional.

#### Cenário de falha

Um administrador digita corretamente o ID mostrado para confirmar a exclusão.

#### Impacto

O botão permanece bloqueado; autores e possivelmente editoras não podem ser excluídos pela UI.

#### Recomendação

Alinhar o contrato de tipos ou canonicalizar o ID na fronteira, com teste de UI usando JSON real da API.

#### Arquivos relacionados

`AuthorResponse.java`, `PublisherResponse.java`, `DashboardPublishers.tsx`, `ADMIN_AUDIT_REPORT.md:354-395`.

### AUD-004 — Rollback concorrente pode sobrescrever marcações de lançamentos já confirmadas

**Severidade:** Alta  
**Categoria:** Lógica  
**Arquivo:** `useMarkReleaseSeen.ts`  
**Linhas:** 24–67  
**Módulo:** Web — feed de lançamentos  
**Status:** Confirmado

#### Descrição

As mutações por capítulo e por dia capturam/restauram snapshots de todas as queries de releases. Elas podem executar simultaneamente e não invalidam/reconciliam o cache em sucesso ou `settled`.

#### Evidência

Cada botão usa seu próprio `isPending` em `NewReleases.tsx:176-193`; uma mutação não bloqueia a outra. Um rollback restaura um snapshot global, não somente os itens alterados pela operação que falhou.

#### Cenário de falha

A marcação A começa; a marcação diária B conclui; A falha e restaura o snapshot anterior a B.

#### Impacto

A interface volta a exibir itens como não vistos apesar de o servidor ter confirmado B, sem refetch corretivo.

#### Recomendação

Aplicar patches e rollbacks por item, serializar operações conflitantes ou invalidar as queries no `onSettled`; testar interleaving.

#### Arquivos relacionados

`useMarkReleaseSeen.test.tsx:34-59`, `NewReleases.tsx`.

### AUD-005 — Testes do feed não exercitam a fronteira real de autenticação

**Severidade:** Alta  
**Categoria:** Segurança  
**Arquivo:** `ReleaseControllerTest.java`  
**Linhas:** 35–38, 71–77 e 96–110  
**Módulo:** API — segurança/releases  
**Status:** Possível risco

#### Descrição

O teste desliga todos os filtros. O caso anônimo de `libraryOnly` fabrica 401 no mock do use case; não verifica os matchers que tornam GET público e deixam PUT autenticado.

#### Evidência

`SecurityConfig.java:48-50,100` define a fronteira, mas nenhum teste com filtros ativos cobre `PUT /{chapterId}/seen` nem `PUT /days/{date}/seen` anônimos.

#### Cenário de falha

Uma futura mudança de ordem/matcher publica PUTs ou torna GETs privados e a suíte continua verde.

#### Impacto

Risco de alteração de dados sem autenticação ou regressão de acesso público não detectados.

#### Recomendação

Adicionar teste de segurança com filtros ativos para GET/PUT anônimo e autenticado, principal inválido e `libraryOnly`.

#### Arquivos relacionados

`ReleaseController.java:38-78`, `SecurityConfig.java`, `MarkReleaseSeenUseCase.java`.

### AUD-006 — Busca relacional trunca silenciosamente candidatos em 2.000 obras

**Severidade:** Média  
**Categoria:** Lógica  
**Arquivo:** `TitleAuthorJpaRepository.java`, `TitlePublisherJpaRepository.java`, `GroupJpaRepository.java`  
**Linhas:** 35–43, 33–46 e 52–61, respectivamente  
**Módulo:** API — busca cross-DB  
**Status:** Confirmado

#### Descrição

As consultas impõem `LIMIT 2000`, sem `ORDER BY`, e o Mongo calcula a paginação apenas sobre o subconjunto recebido.

#### Evidência

`SearchTitlesUseCase.java:50-64` coleta os IDs uma única vez; não há continuação nem indicação do corte no contrato.

#### Cenário de falha

Um termo corresponde a uma pessoa, editora ou grupo com mais de 2.000 relações.

#### Impacto

Resultados desaparecem, totais/páginas ficam incorretos e o subconjunto pode variar entre execuções.

#### Recomendação

Projetar candidatos paginados e determinísticos ou tornar um limite de produto explícito no contrato.

#### Arquivos relacionados

`SearchTitlesUseCase.java`, `TitleRepositoryAdapter.java`.

### AUD-007 — Busca de grupo indexa também as chaves do JSON de idiomas

**Severidade:** Média  
**Categoria:** Lógica  
**Arquivo:** `GroupJpaRepository.java`  
**Linhas:** 52–60, sobretudo 57  
**Módulo:** API — busca global  
**Status:** Confirmado

#### Descrição

`mr_normalize_search(g.name::text)` normaliza a representação JSON inteira, incluindo `pt-BR`, `en-US` e `es-ES`, não apenas os valores traduzidos.

#### Evidência

A busca categorial em `GroupJpaRepository.java:63-94` já usa os valores e demonstra a expressão correta; o índice de `V44:23-24` segue a expressão defeituosa.

#### Cenário de falha

Termos como `pt`, `en` ou `br` casam grupos cujo nome não contém o texto.

#### Impacto

Obras de grupos irrelevantes entram na busca e alteram total/paginação.

#### Recomendação

Indexar e consultar a concatenação normalizada de `jsonb_each_text(...).value`.

#### Arquivos relacionados

`V44__global_title_search_indexes.sql`, `GlobalSearchUseCase.java`.

### AUD-008 — Busca de obras ignora aliases de pessoas e o papel `LETTERER`

**Severidade:** Média  
**Categoria:** Lógica  
**Arquivo:** `TitleAuthorJpaRepository.java`  
**Linhas:** 35–43  
**Módulo:** API — busca global  
**Status:** Confirmado

#### Descrição

A categoria de pessoas pesquisa `author_aliases`, mas a resolução de obras compara apenas `Author.name`; o papel `LETTERER`, tratado como artista em outros fluxos, também ficou fora.

#### Evidência

`AuthorJpaRepository.java:33-138` conhece aliases e `GetAuthorWorksUseCase.java:62-65` contém a classificação mais ampla, divergente da query de referências.

#### Cenário de falha

Pesquisar pelo pseudônimo de um autor ou por um profissional creditado apenas como letterer.

#### Impacto

A pessoa aparece na seção de pessoas, mas suas obras não aparecem na seção de títulos.

#### Recomendação

Centralizar a definição de papéis e incluir aliases no predicado/texto de match.

#### Arquivos relacionados

`AuthorAlias.java`, `GlobalSearchUseCase.java`, `GetAuthorWorksUseCase.java`.

### AUD-009 — PATCH de título ignora constraints aninhadas de alias

**Severidade:** Média  
**Categoria:** Integração  
**Arquivo:** `AdminTitleController.java`  
**Linhas:** 118–128, sobretudo 121  
**Módulo:** API — admin de títulos  
**Status:** Confirmado

#### Descrição

O `UpdateTitleRequest` não recebe `@Valid`. A validação manual não replica os limites de `TitleAliasRequest` para nome e locale.

#### Evidência

`TitleAliasRequest.java:9-12` declara limites; `CreateTitleUseCase.java:113-124` valida presença/tipo/unicidade, mas não os comprimentos.

#### Cenário de falha

PATCH envia alias ou locale com milhares de caracteres.

#### Impacto

O Mongo persiste documento fora do contrato e create/update passam a aceitar conjuntos diferentes.

#### Recomendação

Ativar validação aninhada no controller e manter os invariantes essenciais no domínio/use case.

#### Arquivos relacionados

`UpdateTitleRequest.java:25`, `TitleAliasRequest.java`, `CreateTitleRequest.java`.

### AUD-010 — Atualização de capítulo não consegue remover o grupo de scan

**Severidade:** Média  
**Categoria:** Lógica  
**Arquivo:** `AdminChapterUseCase.java`  
**Linhas:** 94–95  
**Módulo:** API — admin de capítulos  
**Status:** Confirmado

#### Descrição

`applyScanGroup(null)` sabe limpar o snapshot, porém `update()` só o chama quando `scanGroupId != null`.

#### Evidência

O DTO aceita nulo em `AdminChapterRequest.java:18-19`, mas nulo também é usado como “não executar”, tornando remoção e ausência indistinguíveis.

#### Cenário de falha

Administrador altera um capítulo atribuído para “sem grupo”.

#### Impacto

ID, nome e logo antigos permanecem persistidos e exibidos.

#### Recomendação

Representar presença do campo separadamente do valor, ou fornecer operação explícita de remoção; testar atribuir, trocar e limpar.

#### Arquivos relacionados

`AdminChapterController.java:79-84`, `AdminChapterMapper.java`.

### AUD-011 — `$lookup` do feed transforma `_id` e pode impedir uso do índice

**Severidade:** Média  
**Categoria:** Desempenho  
**Arquivo:** `ReleaseFeedQueryAdapter.java`  
**Linhas:** 88–95  
**Módulo:** API — MongoDB/releases  
**Status:** Possível risco

#### Descrição

O lookup compara `{$toString: "$_id"}` ao `titleId`. Transformar o campo indexado dentro de `$expr` tende a impedir a busca direta pelo índice `_id`.

#### Evidência

Os índices da V027 cobrem o match de capítulos, não essa junção, que é repetida para conteúdo, contagem e idiomas.

#### Cenário de falha

Feed semanal/mensal com muitos capítulos e catálogo grande.

#### Impacto

Reavaliações/scans da coleção de títulos e latência crescente.

#### Recomendação

Converter o ID local com fallback seguro e usar igualdade indexável por `_id`; confirmar a decisão com `explain("executionStats")`.

#### Arquivos relacionados

`V027CreateReleaseFeed.java`, `Chapter.java`, `Title.java`.

### AUD-012 — Backfill V028 não constrói índice a partir dos aliases existentes

**Severidade:** Média  
**Categoria:** Banco de dados  
**Arquivo:** `V028CreateTitleSearchIndex.java`  
**Linhas:** 35–40 e 65–69  
**Módulo:** API — Mongock/busca  
**Status:** Confirmado

#### Descrição

A documentação afirma que `Title.searchIndex` deriva de nome e aliases, mas a migration projeta somente `_id,name` e chama o overload sem aliases. O callback de novas gravações inclui ambos.

#### Evidência

`docs/architecture.md:150-153` e `TitleSearchIndexCallback.java` divergem da V028. `V028CreateTitleSearchIndexTest.java:33-54` cobre apenas traduções do nome.

#### Cenário de falha

Título existente antes da migration só é buscado por um alias e nunca é regravado.

#### Impacto

Aliases legados ficam invisíveis na busca até uma atualização incidental do título.

#### Recomendação

Projetar/decodificar aliases no backfill e testar `normalizedAliases`, grams e consulta por alias.

#### Arquivos relacionados

`TitleSearchIndex.java`, `TitleSearchIndexCallback.java`, `docs/architecture.md`.

### AUD-013 — Deep link `libraryOnly=true` quebra para visitante

**Severidade:** Média  
**Categoria:** Lógica  
**Arquivo:** `useReleasesPage.ts`  
**Linhas:** 22–43  
**Módulo:** Web — releases  
**Status:** Confirmado

#### Descrição

O hook aceita `libraryOnly` da query string e consulta a API mesmo com `isLoggedIn=false`. O guard existe apenas ao clicar no switch.

#### Evidência

`NewReleases.tsx:124-143` protege a interação, mas não a hidratação da URL; o backend retorna 401 para `libraryOnly` sem usuário.

#### Cenário de falha

Visitante abre `/releases?libraryOnly=true`, usa histórico ou perde a sessão mantendo a URL.

#### Impacto

A página pública entra em erro genérico, sem normalizar o filtro nem abrir login.

#### Recomendação

Normalizar a URL antes da query ou acionar explicitamente o fluxo de login; adicionar teste de deep link anônimo.

#### Arquivos relacionados

`GetReleaseFeedUseCase.java`, `NewReleases.test.tsx`.

### AUD-014 — Página de editora conserva paginação ao trocar o slug

**Severidade:** Média  
**Categoria:** Lógica  
**Arquivo:** `PublisherProfile.tsx`  
**Linhas:** 19–25  
**Módulo:** Web — editoras  
**Status:** Confirmado

#### Descrição

O estado `page` não é reiniciado quando o router reutiliza o componente para outro `slug`.

#### Evidência

`AuthorProfile.tsx:29` já faz o reset equivalente, demonstrando a divergência.

#### Cenário de falha

Usuário navega da página N da editora A diretamente para a editora B.

#### Impacto

B pode aparecer sem obras embora sua primeira página tenha resultados.

#### Recomendação

Resetar a página por slug ou persistir a paginação na URL e testar rerender A→B.

#### Arquivos relacionados

`usePublisher.ts`, `publisherService.ts`, `PublicRoutes.tsx`.

### AUD-015 — Busca completa dispara requisição a cada tecla

**Severidade:** Média  
**Categoria:** Desempenho  
**Arquivo:** `SearchResults.tsx`  
**Linhas:** 40–47, 58–60 e 87  
**Módulo:** Web/API — busca global  
**Status:** Confirmado

#### Descrição

Cada tecla é escrita na URL e alimenta imediatamente sugestões e catálogo. O debounce de 350 ms existe apenas no header.

#### Evidência

`useGlobalSearch.ts:19,36-42` contém o debounce do combobox; a página não utiliza estado intermediário. `AbortSignal` não desfaz trabalho já iniciado no servidor.

#### Cenário de falha

Digitação normal de um termo longo após o segundo caractere.

#### Impacto

Rajadas de histórico, HTTP e consultas PostgreSQL/MongoDB.

#### Recomendação

Debounce antes de atualizar parâmetros/queries, preservando submit por Enter; testar contagem de requests.

#### Arquivos relacionados

`useCatalogSearch.ts`, `globalSearchService.ts`, `GlobalSearchUseCase.java`.

### AUD-016 — Modal de capítulo torna inacessíveis grupos além da primeira centena

**Severidade:** Média  
**Categoria:** Lógica  
**Arquivo:** `ChapterFormModal.tsx`  
**Linhas:** 34–40 e 146–155  
**Módulo:** Web — admin de capítulos  
**Status:** Confirmado

#### Descrição

O modal carrega `getGroups(0,100)` uma vez e converte apenas essa página em select estático.

#### Evidência

Não há paginação, busca remota nem carregamento posterior; também são buscados objetos `Group` completos.

#### Cenário de falha

Há mais de cem grupos e o desejado não pertence à primeira página.

#### Impacto

O relacionamento não pode ser criado pela UI e cada cache cold transfere dados excessivos.

#### Recomendação

Usar autocomplete paginado/endpoint resumo e cobrir grupo fora da página inicial.

#### Arquivos relacionados

`groupService.ts`, `AdminChapterRequest.java`, `EntitySearchSelect.tsx`.

### AUD-017 — Website de editora não restringe esquemas seguros

**Severidade:** Média  
**Categoria:** Segurança  
**Arquivo:** `PublisherProfile.tsx`  
**Linhas:** 85–89  
**Módulo:** Web/API — editoras  
**Status:** Possível risco

#### Descrição

`publisher.website` é aplicado diretamente em `href`. O formulário usa `type=url`, mas o backend limita apenas o comprimento; não existe allowlist `http/https` na fronteira confiável.

#### Evidência

`PublisherFormModal.tsx:115-117` valida apenas no browser; os requests Java de criação/edição aceitam qualquer string de até 512 caracteres. `rel=noreferrer` não valida destino/esquema.

#### Cenário de falha

Conta administrativa comprometida, importação ou cliente direto persiste URL com esquema não confiável/enganoso.

#### Impacto

Usuário público pode receber link malicioso rotulado como site oficial. A gravidade depende de como a versão do React/navegador trata o esquema.

#### Recomendação

Canonicalizar e aceitar somente HTTP(S) no backend; aplicar defesa adicional no render e testar esquemas inválidos.

#### Arquivos relacionados

`CreatePublisherRequest.java`, `UpdatePublisherRequest.java`, `Publisher.java`.

### AUD-018 — Painel de capítulos ainda valida um gateway local, não a API nova

**Severidade:** Média  
**Categoria:** Integração  
**Arquivo:** `localStorageChapterAdminGateway.ts`  
**Linhas:** 14 em diante  
**Módulo:** Web/API — capítulos admin  
**Status:** Confirmado

#### Descrição

Backend/DTOs agora suportam capítulos e novos campos, mas o painel continua usando armazenamento local e pipeline simulado. Não existe integração ponta a ponta dos contratos alterados.

#### Evidência

`API_URLS.ADMIN_CHAPTERS` permanece marcado como futuro adapter Axios; `legacyChapterMigration.ts` migra somente o estado local.

#### Cenário de falha

Administrador edita idioma/grupo/status no painel acreditando usar o backend real.

#### Impacto

Dados aparentam funcionar no navegador sem persistir na API; testes do fake podem divergir de autorização, versão e formato reais.

#### Recomendação

Não declarar integração concluída; implementar o adapter real com testes contratuais ou marcar explicitamente a UI como experimental.

#### Arquivos relacionados

`chapterGateways.ts`, `AdminChapterController.java`, `ChapterFormModal.tsx`, `docs/architecture.md`.

### AUD-019 — Fluxos novos não possuem a cobertura exigida por camada

**Severidade:** Média  
**Categoria:** Testes  
**Arquivo:** conjunto de testes backend e frontend  
**Linhas:** não aplicável  
**Módulo:** Sistêmico  
**Status:** Confirmado

#### Descrição

Não existem testes dedicados para `GlobalSearchUseCase`/controller, repositories JPA de aliases, três use cases de obras relacionadas, adapter de release views, clear de scan group, aliases nos CRUDs nem hooks/páginas novas de autores/editoras/grupos.

#### Evidência

A busca em `api/core/src/test` e `web/.../__tests__` encontrou cobertura Mongo e UI parcial, mas não as unidades acima. MSW replica contratos e não detecta divergências reais.

#### Cenário de falha

As falhas AUD-001, AUD-003, AUD-006–AUD-010 e AUD-014 atravessam os gates atuais.

#### Impacto

Regressões em paginação, validação, autorização e contrato chegam ao runtime apesar de suites extensas.

#### Recomendação

Adicionar testes de domínio/aplicação/controller/persistência conforme `docs/testing.md`, priorizando os achados altos e os fluxos cross-DB.

#### Arquivos relacionados

`GlobalSearchUseCase.java`, `GlobalSearchController.java`, `GetAuthorWorksUseCase.java`, `GetPublisherWorksUseCase.java`, `GetGroupWorksUseCase.java`, `useAuthor.ts`, `usePublisher.ts`, `usePagedGroupWorks.ts`.

### AUD-020 — Novo teste de saturação falha durante configuração do mock

**Severidade:** Média  
**Categoria:** Testes  
**Arquivo:** `UserControllerTest.java`  
**Linhas:** 465–493, sobretudo 468 e 477  
**Módulo:** API — settings  
**Status:** Confirmado

#### Descrição

Três stubs sucessivos usam `argThat(settings -> settings.reader()...)` sem aceitar nulo. Ao registrar o segundo stub, Mockito confronta a chamada de configuração com o matcher anterior e a lambda dereferencia `settings == null`.

#### Evidência

A suíte fora do sandbox compilou e executou 1.425 testes; o único erro foi `NullPointerException` nesse método, reportado na linha 477 com origem no matcher da linha 468.

#### Cenário de falha

Executar `./mvnw test` em ambiente com Docker e attach de JVM disponíveis.

#### Impacto

Gate backend vermelho e ausência de confirmação automatizada da compatibilidade de saturação.

#### Recomendação

Capturar argumentos/verificar chamadas ou tornar o matcher null-safe, mantendo cada cenário independente.

#### Arquivos relacionados

`UserSettingsMapper.java`, `UpdateUserSettingsRequest.java`, `UserSettings.java`.

### AUD-021 — Chave de cache promete oito títulos, mas consulta seis

**Severidade:** Baixa  
**Categoria:** Manutenibilidade  
**Arquivo:** `useReleasesPage.ts`  
**Linhas:** 45–48  
**Módulo:** Web — releases  
**Status:** Confirmado

#### Descrição

Query key `[RECENT_TITLES, 8]` executa `getRecentTitles(6)`, violando a identidade do cache.

#### Evidência

O hook canônico `useRecentTitles.ts:7-11` alinha parâmetro e chave.

#### Cenário de falha

Outro consumidor pede oito itens e reutiliza a entrada criada pela página.

#### Impacto

Recebe seis resultados por até dez minutos, dependendo da política de stale/cache.

#### Recomendação

Usar o hook canônico com 6 ou alinhar chave e chamada.

#### Arquivos relacionados

`QUERY_KEYS.ts`, `titleService.ts`.

### AUD-022 — Evidências com extensão PNG contêm bytes JPEG

**Severidade:** Baixa  
**Categoria:** Manutenibilidade  
**Arquivo:** `.audit-admin/evidence/root/*.jpg` (antes da correção, `.png`)  
**Linhas:** não aplicável  
**Módulo:** Artefatos de auditoria  
**Status:** Confirmado

#### Descrição

Os oito arquivos tinham cabeçalho JFIF/JPEG apesar da extensão `.png`; foram renomeados para `.jpg` e as referências foram atualizadas.

#### Evidência

O comando `file` identificou todos como `JPEG image data`, 1280×720.

#### Cenário de falha

Servidor ou pipeline define `Content-Type: image/png` pela extensão e um consumidor exige correspondência MIME.

#### Impacto

Falha de render/ingest em ferramentas estritas e ruído no commit funcional.

#### Recomendação

Corrigir extensão/formato e manter evidências/relatórios em commit ou armazenamento separado da implementação.

#### Arquivos relacionados

`ADMIN_AUDIT_REPORT.md`, `.audit-admin/agent-*.md`.

### AUD-023 — Comentário de configuração Mongo contém nome incorreto

**Severidade:** Baixa  
**Categoria:** Manutenibilidade  
**Arquivo:** `CommentVote.java`  
**Linhas:** 25  
**Módulo:** API — comentários  
**Status:** Confirmado

#### Descrição

O comentário escreve `auto-indyex-creation=false`.

#### Evidência

É um typo em uma orientação operacional; o código não depende do texto.

#### Cenário de falha

Pessoa usa o comentário para procurar/configurar a propriedade.

#### Impacto

Apenas confusão documental localizada.

#### Recomendação

Restaurar `auto-index-creation=false` na etapa de correções.

#### Arquivos relacionados

Configuração Spring Data MongoDB e migrations Mongock.

## 5. Problemas sistêmicos

### Cobertura concentra-se em implementações parciais, não em fronteiras

AUD-005, AUD-019 e AUD-020 revelam um padrão: há muitos testes, mas fronteiras entre SecurityConfig/controller, JPA/mapper, API/MSW e Postgres/Mongo permanecem sem prova. Isso explica por que falhas determinísticas de lazy loading, tipo numérico, validação e limpeza de relacionamento atravessaram as suites locais.

### Busca global possui múltiplas definições de equivalência

AUD-006, AUD-007, AUD-008 e AUD-012 mostram regras diferentes para nome, alias, papel profissional, locale e limite de candidatos. Essas regras tendem a evoluir juntas, mas estão distribuídas entre repositories PostgreSQL, migration, callback e adapter Mongo. O risco concreto é a mesma consulta produzir seções incompatíveis e totais falsos.

### Paginação é quebrada em mais de uma fronteira

AUD-002 pagina no lugar errado (memória), AUD-006 corta candidatos antes da paginação Mongo, AUD-014 conserva uma página entre entidades e AUD-016 usa a primeira página como catálogo completo. O padrão sistêmico é tratar uma página como conjunto total ou manter estado sem a identidade completa da consulta.

### Estado provisório e cache não têm reconciliação explícita

AUD-004 e AUD-018 mostram duas formas do mesmo risco: estado local/otimista é apresentado como resultado final sem uma reconciliação confiável com a fonte canônica.

### Contratos duplicados não são validados ponta a ponta

AUD-003, AUD-009, AUD-010 e AUD-017 dependem de tipos/constraints repetidos em Java, TypeScript e formulário. O type-check verde prova apenas coerência interna do frontend, não que o JSON real cumpra os tipos declarados.

## 6. Arquivos críticos sem problemas aparentes

- `V45__multicategory_catalog_search.sql`: tabelas filhas em BCNF, FKs `ON DELETE CASCADE`, CHECKs e unicidade normalizada coerentes; índices de FK não redundantes.
- `V46__expand_reader_background_options.sql`, `V47__default_reader_gap_to_zero.sql`, `V48__add_reader_saturation.sql`: constraints/defaults alinhados a `UserSystemSettings`/`UserSettings`.
- `V027CreateReleaseFeed.java`: chave natural, índice de limpeza e índices de janela coerentes.
- `ReleaseFeedViewRepositoryAdapter.java`: upsert individual preserva o primeiro `seenAt`; bulk é idempotente.
- `GetReleaseFeedUseCase.java` e `MarkReleaseSeenUseCase.java`: janela civil/timezone, política adulta, publicação e biblioteca coerentes.
- `TitleRepositoryAdapter.java`: ranking, deduplicação, política adulta e facet coerentes para o conjunto de candidatos recebido.
- `SecurityConfig.java`: na implementação atual, GET de busca/release é público e PUT de seen cai em `authenticated()`; o problema é a ausência de teste da fronteira.
- `GlobalSearchController.java` e `ReleaseController.java`: envelopes, `PageParams` e `CurrentUserId` seguem o padrão do projeto.
- Bundles `messages*.properties` e locales `pt-BR/en-US/es-ES`: novas chaves aparecem simetricamente nos idiomas alterados.
- Frontend: contratos nominais de `globalSearchService.ts`, `release.api.ts`, `release.types.ts` e DTOs correspondentes alinham forma e nomes.
- FSD: barrels/cross-references novos e dependências entre camadas passaram no Steiger; não foi confirmada nova violação arquitetural.
- Reader e acessibilidade: `useChapterReader.ts`, `ReadingArea.tsx`, `ReaderDrawer.tsx`, `ReaderRails.tsx`, `ReaderTab.tsx` e merge de defaults não apresentaram regressão estática adicional.

## 7. Validações executadas

| Comando | Resultado |
| --- | --- |
| `git status --short`, `git status --porcelain=v2 --branch` | branch e estados staged/unstaged levantados; 0 untracked inicialmente |
| `git diff --name-status HEAD`, `git diff --shortstat HEAD` | 306 arquivos; 10.055 adições; 1.206 remoções |
| `git merge-base HEAD main` | `8a1eef2c...`; confirmou que `main` não é a base adequada para as mudanças correntes |
| `git diff --check HEAD` | encontrou somente whitespace em relatórios Markdown preexistentes no diff; nenhum código funcional afetado |
| varredura de TODO/logs/credenciais adicionados | 1 TODO de apresentação; nenhum segredo real ou log temporário confirmado |
| `cd web/toonlira && npx tsc -b` | passou com 0 erros |
| `cd web/toonlira && npx vitest run --pool=forks` | passou: 185 arquivos, 1.202 testes |
| `pnpm lint:fsd` dentro do sandbox | bloqueado por `EMFILE: too many open files, watch`, inclusive após elevar `ulimit` |
| `pnpm lint:fsd` fora do sandbox | passou: `No problems found!` |
| `cd api/core && ./mvnw test` dentro do sandbox | compilou, mas Docker socket e attach Byte Buddy foram bloqueados; 1.090 erros ambientais |
| `cd api/core && ./mvnw test` fora do sandbox | 1.425 testes, 0 failures, 1 error real em `UserControllerTest` (AUD-020); build failure |

Não foi executado `npm run lint`, pois é vermelho no baseline e proibido pelas instruções do repositório. A cadeia Flyway foi exercitada indiretamente pelos testes com Testcontainers na suíte Maven, mas a auditoria não executou um `psql` manual de V1..V48 nem `EXPLAIN ANALYZE`/`executionStats`; portanto AUD-011 permanece possível risco.

## 8. Ordem sugerida de correção

1. **AUD-001** — remover os HTTP 500 das buscas filtradas sem introduzir fetch join paginado.
2. **AUD-003** — alinhar IDs de autores/editoras e restaurar exclusão administrativa.
3. **AUD-004** — tornar as mutações de seen concorrentes seguras e reconciliáveis.
4. **AUD-005** — fechar a cobertura real da fronteira pública/autenticada antes de evoluir SecurityConfig.
5. **AUD-002** — substituir paginação em memória antes do crescimento das tabelas.
6. **AUD-020** — restaurar o gate Maven verde para que as correções seguintes tenham sinal confiável.
7. **AUD-009** e **AUD-010** — corrigir integridade de payload e remoção de relacionamento no admin.
8. **AUD-012** — corrigir/backfillar aliases antes de depender da busca em produção.
9. **AUD-006**, **AUD-007** e **AUD-008** — unificar semântica e paginação da busca cross-DB.
10. **AUD-011** e **AUD-015** — medir/limitar custo das consultas do feed e da busca.
11. **AUD-013**, **AUD-014** e **AUD-016** — corrigir estados de URL/paginação e seleção incompleta.
12. **AUD-017** e **AUD-018** — endurecer URLs e esclarecer/integrar o gateway de capítulos.
13. **AUD-019** — completar a matriz de testes junto de cada correção, sem criar uma fase tardia isolada.
14. **AUD-021**, **AUD-022** e **AUD-023** — limpar inconsistências localizadas e separar evidências do commit funcional.

Lista priorizada final: `AUD-001`, `AUD-003`, `AUD-004`, `AUD-005`, `AUD-002`, `AUD-020`, `AUD-009`, `AUD-010`, `AUD-012`, `AUD-006`, `AUD-007`, `AUD-008`, `AUD-011`, `AUD-015`, `AUD-013`, `AUD-014`, `AUD-016`, `AUD-017`, `AUD-018`, `AUD-019`, `AUD-021`, `AUD-022`, `AUD-023`.
