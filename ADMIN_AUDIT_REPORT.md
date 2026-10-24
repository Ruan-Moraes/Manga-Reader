# Auditoria funcional da área administrativa

## Resumo executivo

| Item | Resultado |
| --- | --- |
| Data da auditoria | 01/08/2026 |
| Ambiente | Frontend local `http://localhost:5173`; API local `http://localhost:8080`; dados seed de desenvolvimento |
| Perfil utilizado | Administrador — Ana Beatriz |
| Módulos mapeados/analisados | 13 de 13 |
| Verificações funcionais executadas | 68 |
| Módulos com teste profundo de CRUD e reload | Títulos, Capítulos e Tags |
| Total de problemas encontrados | 11 |
| Críticos | 0 |
| Altos | 5 |
| Médios | 5 |
| Baixos | 1 |
| Módulos inteiramente não testados | Nenhum |
| Módulos parcialmente testados | Editoras, Lojas, Notícias, Eventos, Usuários, Grupos, Financeiro e Assinaturas |

A área administrativa foi mapeada integralmente pelo menu e pelas rotas disponíveis. Os fluxos de Títulos, Capítulos e Tags foram exercitados com criação identificada, validação da listagem, reload, pesquisa, edição e exclusão. Nos módulos que só possuíam dados reais, ações destrutivas foram evitadas; foram testados listagem, pesquisa, detalhes, formulários sem submissão e cancelamento, conforme aplicável.

Três agentes foram distribuídos por módulos, mas o navegador integrado ficou disponível apenas para a sessão principal. As sessões paralelas seguiram o diagnóstico obrigatório da skill e receberam lista vazia de navegadores. A sessão principal assumiu os testes dirigidos desses módulos; a limitação reduziu a profundidade, mas não deixou nenhum módulo sem ao menos uma verificação funcional.

O worktree já continha muitas alterações funcionais não relacionadas antes da auditoria. Nenhum arquivo funcional foi modificado por esta etapa. Foram criados somente este relatório e evidências em `.audit-admin/`.

## Matriz de cobertura

| Módulo | Página ou rota | Listagem | Cadastro | Edição | Exclusão | Filtros | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Visão Geral | `/dashboard` | Sim | N/A | N/A | N/A | N/A | Testado com problemas |
| Títulos | `/dashboard/titles` | Sim | Sim | Sim | Sim | Busca | Testado com problemas |
| Capítulos | `/dashboard/chapters`, `/dashboard/chapters/analytics` | Sim | Sim | Sim | Sim | Busca, status, datas e paginação | Testado com problemas |
| Tags | `/dashboard/tags` | Sim | Sim | Sim | Sim | Busca e paginação | Testado com problemas |
| Autores | `/dashboard/authors` | Sim | Sim | Sim | Bloqueada por defeito | Busca | Testado com problemas |
| Editoras | `/dashboard/publishers` | Sim | Não submetido | Não submetida | Não executada | Busca | Parcialmente testado |
| Lojas | `/dashboard/stores` | Sim | Formulário e cancelamento | Não submetida | Não executada | Busca | Parcialmente testado |
| Notícias | `/dashboard/news` | Sim | Formulário e cancelamento | Não submetida | Não executada | Busca e controles de filtro | Parcialmente testado |
| Eventos | `/dashboard/events` | Sim | Formulário e cancelamento | Não submetida | Não executada | Busca | Parcialmente testado |
| Usuários | `/dashboard/users` | Sim | N/A | Detalhes sem alteração | Não executada em dados reais | Busca | Parcialmente testado |
| Grupos | `/dashboard/groups` | Sim | Sem ação de cadastro | Detalhes sem alteração | Não executada em dados reais | Busca | Parcialmente testado |
| Financeiro | `/dashboard/financial` | Sim | N/A | Não executada em dados reais | N/A | Controle de status inspecionado | Parcialmente testado |
| Assinaturas | `/dashboard/subscriptions` | Sim | Formulários sem submissão | Modal inspecionado, sem alteração | Não executada em dados reais | Status e abas | Parcialmente testado |

## Funcionalidades verificadas e funcionando

- Autenticação com o perfil administrador seed e retorno à rota originalmente solicitada após a sessão expirar.
- Navegação do card “Obras” da Visão Geral para `/dashboard/titles`.
- Títulos: criação, aparição imediata, persistência após reload, pesquisa, edição, confirmação de exclusão por ID, cancelamento e exclusão persistente.
- Capítulos: paginação de 20 registros sem repetição entre as páginas 1 e 2, busca por título do capítulo, criação para uma obra disponível, persistência, edição, acesso ao analytics e exclusão lógica persistente.
- Tags: criação e exclusão persistente; o nome, porém, falha após reload conforme ADM-004.
- Lojas: listagem, pesquisa por “Amazon”, abertura e cancelamento do formulário.
- Notícias: listagem, pesquisa por “Solo Leveling”, controles de status/categoria visíveis, abertura e cancelamento do formulário completo.
- Usuários: listagem, pesquisa por email, detalhes do administrador e bloqueio da ação “Banir” para a própria conta.
- Grupos: listagem, pesquisa por “Aurora”, detalhes, membros e fechamento do modal.
- Assinaturas: navegação entre Assinaturas, Planos e Logs; abertura/cancelamento do formulário de plano e do modal de atualização.
- Ausência de erros no console nas operações CRUD bem-sucedidas de Títulos, Capítulos e Tags.

## Problemas encontrados

### ADM-001 — Distribuição de obras por status contradiz o total de obras

**Severidade:** Média  
**Módulo:** Visão Geral / Títulos  
**Página ou rota:** `/dashboard`, `/dashboard/titles`  
**Funcionalidade:** Métricas de conteúdo  
**Ambiente:** Local, perfil administrador  
**Pré-condições:** Dados seed carregados

#### Descrição

A Visão Geral informa 10 obras no card principal, mas a seção “Obras por Status” informa somente 1 obra no total. A listagem de Títulos também contém 10 registros.

#### Passos para reproduzir

1. Acessar `/dashboard` como administrador.
2. Comparar o card “10 Obras” com a seção “Obras por Status”.
3. Abrir `/dashboard/titles`.
4. Confirmar que a listagem contém 10 obras.

#### Dados utilizados

Dados seed existentes; nenhuma alteração necessária.

#### Resultado esperado

O total da distribuição por status deve corresponder ao total de obras apresentado no dashboard e na listagem.

#### Resultado obtido

Card e listagem: 10 obras. Distribuição por status: 1 obra, 100% “Em andamento”.

#### Evidências

- [Visão Geral](.audit-admin/evidence/root/overview-dashboard.jpg)
- [Listagem de Títulos](.audit-admin/evidence/root/titles-status-inconsistent.jpg)

#### Frequência

Sempre, inclusive após reload.

#### Impacto

O administrador recebe uma visão incorreta da composição do catálogo e não consegue confiar nos indicadores do dashboard.

#### Observações técnicas

Há indício de que a agregação de status considera apenas um subconjunto das obras que a listagem administrativa combina. Nenhuma correção foi implementada.

### ADM-002 — Títulos existentes aparecem com status e autores ausentes ou não localizados

**Severidade:** Média  
**Módulo:** Títulos  
**Página ou rota:** `/dashboard/titles`  
**Funcionalidade:** Listagem e relacionamentos  
**Ambiente:** Local, perfil administrador  
**Pré-condições:** Dados seed carregados

#### Descrição

Vários títulos mostram status vazio ou “—”; outros exibem códigos crus como `ongoing` e `hiatus`. A coluna Autor fica “—” inclusive para obras cujo autor aparece na interface pública, como “Reino de Aço”.

#### Passos para reproduzir

1. Acessar `/dashboard/titles`.
2. Observar as colunas Status e Autor.
3. Comparar “Reino de Aço”, “Noites Vermelhas” e “Espelho do Vazio”.

#### Dados utilizados

Registros seed existentes.

#### Resultado esperado

Todos os títulos devem exibir status localizado e relacionamentos de autoria correspondentes aos dados públicos/API.

#### Resultado obtido

Status ausentes ou crus e autores vazios para os registros seed.

#### Evidências

- [Status e autores inconsistentes](.audit-admin/evidence/root/titles-status-inconsistent.jpg)

#### Frequência

Sempre, após múltiplos reloads.

#### Impacto

O administrador não consegue auditar corretamente o estado editorial nem os créditos das obras.

#### Observações técnicas

Os registros parecem vir de fontes/contratos diferentes e não recebem a mesma normalização de labels e relacionamentos.

### ADM-003 — Obra persistida não aparece no seletor de criação de capítulo

**Severidade:** Alta  
**Módulo:** Capítulos / Títulos  
**Página ou rota:** `/dashboard/chapters`  
**Funcionalidade:** Seleção de relacionamento Obra  
**Ambiente:** Local, perfil administrador  
**Pré-condições:** A obra “Teste” existe em `/dashboard/titles` e possui capítulos listados

#### Descrição

O formulário de Novo capítulo não encontra a obra “Teste”, embora ela exista na listagem administrativa e seus capítulos apareçam no próprio módulo de Capítulos. Obras seed como “Reino de Aço” aparecem normalmente.

#### Passos para reproduzir

1. Confirmar “Teste” em `/dashboard/titles`.
2. Acessar `/dashboard/chapters`.
3. Clicar em “Novo capítulo”.
4. Digitar `Teste` no campo Obra.
5. Aguardar o carregamento das opções.

#### Dados utilizados

Busca: `Teste`.

#### Resultado esperado

A obra existente deve ser oferecida para seleção.

#### Resultado obtido

O seletor exibe “Nenhuma obra encontrada”. A busca por `Reino` retorna “Reino de Aço”.

#### Evidências

- [Obra ausente no seletor](.audit-admin/evidence/root/chapter-title-relationship-missing.jpg)

#### Frequência

Sempre nas tentativas realizadas.

#### Impacto

Impede cadastrar capítulos para obras válidas que pertençam ao conjunto não carregado pelo seletor.

#### Observações técnicas

O seletor e a listagem de títulos aparentam consultar conjuntos/contratos diferentes.

### ADM-004 — Tag é criada com sucesso, mas perde o nome após reload

**Severidade:** Alta  
**Módulo:** Tags  
**Página ou rota:** `/dashboard/tags`  
**Funcionalidade:** Cadastro, edição e persistência  
**Ambiente:** Local, perfil administrador  
**Pré-condições:** Nenhuma

#### Descrição

A tag aparece com o nome correto imediatamente após a mensagem de sucesso. Após recarregar, o registro continua existindo e pode ser encontrado pela pesquisa, mas a célula Nome e o formulário de edição ficam vazios. Editar e salvar um novo nome também mantém a célula vazia.

#### Passos para reproduzir

1. Criar uma tag com nome em pt-BR.
2. Confirmar que ela aparece na tabela.
3. Recarregar a página.
4. Pesquisar pelo nome criado.
5. Abrir a edição.

#### Dados utilizados

`AUDITORIA_ADMIN_TAGS_20260801_1`, depois `AUDITORIA_ADMIN_TAGS_20260801_1_EDITADO`.

#### Resultado esperado

O nome deve permanecer visível e preenchido após reload e edição.

#### Resultado obtido

O registro ID 25 permanece pesquisável, mas o nome fica vazio. A aplicação havia exibido “Tag criada com sucesso.”

#### Evidências

- [Tag sem nome após reload](.audit-admin/evidence/root/tag-name-blank-after-reload.jpg)

#### Frequência

Sempre no registro de auditoria.

#### Impacto

O cadastro/edição aparenta sucesso, mas produz registro administrativamente inutilizável e sem identificação visual.

#### Observações técnicas

Há indício de divergência entre o payload localizado enviado, o valor indexado para pesquisa e o campo localizado retornado pela API.

### ADM-005 — Pesquisas em Autores, Editoras e Eventos retornam erro interno

**Severidade:** Média  
**Módulo:** Autores, Editoras e Eventos  
**Página ou rota:** `/dashboard/authors`, `/dashboard/publishers`, `/dashboard/events`  
**Funcionalidade:** Pesquisa  
**Ambiente:** Local, perfil administrador  
**Pré-condições:** Listagens carregadas normalmente

#### Descrição

Pesquisar registros que aparecem na listagem substitui os dados por skeletons vazios e apresenta “Erro interno do servidor. Tente novamente mais tarde.”

#### Passos para reproduzir

1. Acessar uma das rotas afetadas.
2. Pesquisar por um registro visível.
3. Clicar em “Buscar”.

#### Dados utilizados

- Autores: `Chen`.
- Editoras: `JBC`.
- Eventos: `AnimeCon`.

#### Resultado esperado

A tabela deve apresentar somente os registros correspondentes.

#### Resultado obtido

A tabela fica em estado de carregamento vazio e surge uma mensagem de erro interno.

#### Evidências

- [Erro na pesquisa de Autores](.audit-admin/evidence/root/search-500-authors.jpg)
- Mensagem exibida: `Erro interno do servidor. Tente novamente mais tarde.`
- Status HTTP e corpo da resposta não puderam ser capturados pela superfície disponível do navegador.

#### Frequência

Sempre, em todas as três rotas e em tentativas repetidas.

#### Impacto

Obriga o administrador a localizar registros manualmente e inviabiliza a pesquisa quando o volume crescer.

#### Observações técnicas

O comportamento idêntico sugere uma falha comum na paginação/parâmetro de pesquisa desses endpoints.

### ADM-006 — Cadastro de autor aceita nacionalidade fora do contrato informado

**Severidade:** Média  
**Módulo:** Autores  
**Página ou rota:** `/dashboard/authors`  
**Funcionalidade:** Validação de formulário  
**Ambiente:** Local, perfil administrador  
**Pré-condições:** Formulário “Novo autor” aberto

#### Descrição

O campo informa que a nacionalidade deve ser um código ISO de 2 letras, mas aceita e persiste `BRA` com mensagem de sucesso.

#### Passos para reproduzir

1. Abrir “Novo autor”.
2. Preencher um nome válido.
3. Preencher Nacionalidade com `BRA`.
4. Clicar em “Criar”.
5. Recarregar a listagem.

#### Dados utilizados

Nome `AUDITORIA_ADMIN_AUTORES_20260801_1`; nacionalidade `BRA`.

#### Resultado esperado

O formulário deve impedir o envio e explicar que o valor precisa ter duas letras.

#### Resultado obtido

O botão permaneceu habilitado, o registro foi criado e a tabela exibiu `BRA`. A nacionalidade foi posteriormente alterada para `BR` para não deixar dado inválido.

#### Evidências

- Mensagem exibida: `Autor criado com sucesso.`
- Persistência observada na tabela após reload.

#### Frequência

Sempre no cenário executado.

#### Impacto

Permite dados fora do contrato informado, prejudicando filtros, integrações e consistência do catálogo.

#### Observações técnicas

Não há evidência de constraint ou validação de tamanho no cliente/API para esse campo.

### ADM-007 — Exclusão de autor não habilita após confirmação correta

**Severidade:** Alta  
**Módulo:** Autores  
**Página ou rota:** `/dashboard/authors`  
**Funcionalidade:** Exclusão  
**Ambiente:** Local, perfil administrador  
**Pré-condições:** Registro de autor criado pela auditoria

#### Descrição

O modal solicita o ID numérico do autor, mas o botão “Excluir” permanece desabilitado mesmo quando o valor exato é digitado.

#### Passos para reproduzir

1. Localizar `AUDITORIA_ADMIN_AUTORES_20260801_1`.
2. Clicar em “Excluir autor”.
3. Digitar o ID mostrado no modal (`13`).
4. Verificar o botão “Excluir”.

#### Dados utilizados

ID `13` do registro de auditoria.

#### Resultado esperado

O botão deve habilitar e permitir a remoção do registro criado para o teste.

#### Resultado obtido

O campo contém exatamente `13`, mas “Excluir” continua desabilitado.

#### Evidências

- [Exclusão de autor bloqueada](.audit-admin/evidence/root/author-delete-disabled.jpg)

#### Frequência

Sempre, em tentativas repetidas.

#### Impacto

Impede uma operação administrativa essencial. O registro de auditoria permanece no ambiente, identificado pelo prefixo, com nacionalidade válida `BR`.

#### Observações técnicas

O mesmo componente de confirmação funcionou para IDs de Título, Capítulo e Tag, sugerindo uma divergência específica de tipo/comparação para o ID numérico de Autor.

### ADM-008 — Receita anual exibe valor 100 vezes menor que a receita confirmada

**Severidade:** Alta  
**Módulo:** Financeiro  
**Página ou rota:** `/dashboard/financial`  
**Funcionalidade:** Resumo de receita  
**Ambiente:** Local, perfil administrador  
**Pré-condições:** Dados seed de pagamentos carregados

#### Descrição

Os cinco pagamentos concluídos totalizam R$ 10.263,89 e todos estão datados em 2026, mas o card “Receita Anual” mostra R$ 102,64.

#### Passos para reproduzir

1. Acessar `/dashboard/financial`.
2. Comparar “Receita confirmada” e a linha “Concluído” da distribuição.
3. Comparar com “Receita Anual”.
4. Confirmar as datas de 2026 na tabela de pagamentos.

#### Dados utilizados

Dados seed existentes.

#### Resultado esperado

A receita anual deve refletir a soma anual dos pagamentos concluídos, R$ 10.263,89 no conjunto exibido.

#### Resultado obtido

Receita confirmada: R$ 10.263,89. Receita anual: R$ 102,64.

#### Evidências

- [Resumo financeiro inconsistente](.audit-admin/evidence/root/financial-summary-inconsistent.jpg)

#### Frequência

Sempre, inclusive após reload e nova autenticação.

#### Impacto

Expõe um indicador financeiro materialmente incorreto, com risco de decisões administrativas erradas.

#### Observações técnicas

O fator próximo de 100 sugere dupla conversão de centavos/unidades em uma das métricas. Nenhuma correção foi feita.

### ADM-009 — Assinaturas encerradas em julho continuam marcadas como ativas em agosto

**Severidade:** Alta  
**Módulo:** Assinaturas  
**Página ou rota:** `/dashboard/subscriptions`  
**Funcionalidade:** Status, datas e resumo  
**Ambiente:** Local em 01/08/2026, perfil administrador  
**Pré-condições:** Dados seed carregados

#### Descrição

Duas assinaturas com data final anterior à data da auditoria aparecem como Ativas e entram no resumo de cinco assinaturas ativas.

#### Passos para reproduzir

1. Acessar `/dashboard/subscriptions` em 01/08/2026.
2. Localizar os IDs abreviados `7ea27139` e `2f5b2962`.
3. Comparar Status e Fim.

#### Dados utilizados

- `7ea27139`: Ativa, fim 10/07/2026.
- `2f5b2962`: Ativa, fim 24/07/2026.

#### Resultado esperado

Assinaturas com fim no passado devem estar expiradas, ou a interface deve explicar um período de tolerância válido.

#### Resultado obtido

Ambas aparecem como Ativas em 01/08/2026; nenhuma justificativa é exibida.

#### Evidências

- [Status e datas de assinaturas](.audit-admin/evidence/root/subscriptions-status-dates.jpg)

#### Frequência

Sempre, inclusive após reload e nova autenticação.

#### Impacto

Pode indicar concessão indevida de acesso e torna incorreto o resumo administrativo de assinaturas ativas.

#### Observações técnicas

O status parece ser lido como valor estático, sem reconciliação com `endDate`.

### ADM-010 — Aba Logs exige UUID que não é disponibilizado pela interface

**Severidade:** Média  
**Módulo:** Assinaturas  
**Página ou rota:** `/dashboard/subscriptions`  
**Funcionalidade:** Auditoria de logs  
**Ambiente:** Local, perfil administrador  
**Pré-condições:** Existirem assinaturas na listagem

#### Descrição

A aba Logs pede que o administrador cole o UUID completo da assinatura. A listagem e o modal de edição mostram somente os primeiros oito caracteres, sem ação de copiar ou navegar diretamente aos logs.

#### Passos para reproduzir

1. Abrir a aba Assinaturas.
2. Observar o ID abreviado de qualquer registro.
3. Abrir “Editar assinatura” e verificar que o modal também exibe apenas o prefixo.
4. Abrir a aba Logs.

#### Dados utilizados

Assinatura exibida como `94a07dce`.

#### Resultado esperado

A interface deve permitir abrir os logs a partir da linha selecionada ou fornecer/copiar o UUID completo.

#### Resultado obtido

O único campo da aba Logs solicita “Cole o UUID da assinatura”, mas esse valor não está disponível em nenhuma interface percorrida.

#### Evidências

- Listagem: IDs de oito caracteres.
- Modal: `Assinatura: 94a07dce`.
- Aba Logs: `Cole o UUID da assinatura`.

#### Frequência

Sempre para todas as assinaturas listadas.

#### Impacto

Torna a função de logs inutilizável sem consultar banco/API ou outra fonte externa.

#### Observações técnicas

Trata-se de um fluxo incompleto entre a listagem e a consulta de auditoria.

### ADM-011 — Categorias e tipos administrativos aparecem como códigos internos

**Severidade:** Baixa  
**Módulo:** Notícias e Eventos  
**Página ou rota:** `/dashboard/news`, `/dashboard/events`  
**Funcionalidade:** Apresentação/i18n da listagem  
**Ambiente:** Local, idioma pt-BR  
**Pré-condições:** Dados seed carregados

#### Descrição

As categorias de Notícias e tipos de Eventos aparecem como códigos crus (`ADAPTACOES`, `LANCAMENTOS`, `CONVENCAO`, `LANCAMENTO`), enquanto os status são traduzidos.

#### Passos para reproduzir

1. Acessar `/dashboard/news`.
2. Observar a coluna Categoria.
3. Acessar `/dashboard/events`.
4. Observar a coluna Tipo.

#### Dados utilizados

Dados seed existentes.

#### Resultado esperado

Labels legíveis e localizados em pt-BR, coerentes com os demais campos do painel.

#### Resultado obtido

Códigos internos em caixa alta e sem acentos são exibidos diretamente.

#### Evidências

Snapshots DOM da auditoria e listagens observadas no navegador.

#### Frequência

Sempre, em todos os registros das duas páginas.

#### Impacto

Inconsistência textual e menor legibilidade, sem impedir a operação principal.

#### Observações técnicas

Os status usam labels de domínio, mas categoria/tipo aparentemente renderizam o enum cru.

## Limitações e itens não concluídos

- O navegador integrado não ficou disponível nas três sessões de agentes paralelos. A sessão principal executou testes dirigidos em todos os módulos, mas não repetiu CRUD completo em cada um.
- Não foram submetidas alterações em dados reais de Usuários, Grupos, Pagamentos ou Assinaturas.
- Editoras, Lojas, Notícias e Eventos tiveram formulários e cancelamentos inspecionados, mas o CRUD completo não foi executado por falta de tempo seguro após o bloqueio paralelo e para evitar resíduos em módulos cuja exclusão não estava comprovada.
- Upload de arquivo local não apareceu como opção nos formulários testados; Notícias/Eventos usam URL externa. Nenhum arquivo inválido ou grande foi transmitido.
- A superfície de navegador disponível expôs console, mas não um painel de rede; por isso status HTTP e corpos de respostas não foram capturados. Mensagens da UI e persistência foram verificadas diretamente.
- Ordenação por colunas não estava exposta nas tabelas percorridas.
- O teste deixou somente `AUDITORIA_ADMIN_AUTORES_20260801_1` (ID 13, nacionalidade normalizada para `BR`) porque ADM-007 impede sua exclusão. Título, Capítulo e Tag de auditoria foram removidos e a ausência foi confirmada após reload.

## Ordem sugerida de correção

1. **ADM-008 — Receita anual incorreta:** indicador financeiro materialmente errado.
2. **ADM-009 — Assinaturas expiradas marcadas como ativas:** risco de acesso indevido e resumo incorreto.
3. **ADM-004 — Tag perde nome após sucesso:** cria dados sem identificação e confirma uma divergência de persistência.
4. **ADM-003 — Obra ausente no seletor de capítulo:** bloqueia cadastro editorial para parte do catálogo.
5. **ADM-007 — Exclusão de autor bloqueada:** impede operação administrativa e limpeza de dados.
6. **ADM-005 — Pesquisas com erro interno:** falha comum em três módulos e piora com crescimento de dados.
7. **ADM-001 e ADM-002 — Métricas/status/relacionamentos de títulos:** restaurar coerência do catálogo e dashboard.
8. **ADM-006 — Validação de nacionalidade:** impedir novos dados fora do contrato.
9. **ADM-010 — Logs sem caminho para UUID:** completar o fluxo de auditoria de assinaturas.
10. **ADM-011 — Labels de categoria/tipo:** uniformizar i18n e legibilidade.

## Evidências disponíveis

Todas as capturas foram sanitizadas e não contêm senha, token ou cookie:

- `.audit-admin/evidence/root/overview-dashboard.jpg`
- `.audit-admin/evidence/root/titles-status-inconsistent.jpg`
- `.audit-admin/evidence/root/chapter-title-relationship-missing.jpg`
- `.audit-admin/evidence/root/tag-name-blank-after-reload.jpg`
- `.audit-admin/evidence/root/search-500-authors.jpg`
- `.audit-admin/evidence/root/author-delete-disabled.jpg`
- `.audit-admin/evidence/root/financial-summary-inconsistent.jpg`
- `.audit-admin/evidence/root/subscriptions-status-dates.jpg`

Relatórios auxiliares dos agentes, preservados como evidência da limitação de paralelismo:

- `.audit-admin/agent-catalogos.md`
- `.audit-admin/agent-noticias-eventos.md`
- `.audit-admin/agent-comunidade-financeiro.md`
