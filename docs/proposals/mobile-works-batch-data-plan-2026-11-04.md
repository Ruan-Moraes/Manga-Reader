# Plano de dados para obras e capítulos locais — 2026-11-04

Estado: proposta para MOB-FEAT-055 em draft; não é autorização de migration.

## Levantamento

O mobile já usa SQLite privado, não a API Core para biblioteca. A versão atual
é 10: `translation_projects` identifica projetos, `translation_pages` possui FK
`project_id` e posição única por projeto; resultados e tentativas referenciam
páginas, e progresso referencia projeto/posição. Arquivos originais e renderizados
vivem em namespaces privados. A biblioteca consulta projetos, não obras. O
processamento remoto escolhe expressamente a primeira página. Importação múltipla,
reordenação e validação já existem e serão reutilizadas.

## Banco e forma normal

SQLite permanece dono dos metadados locais transacionais e das relações; arquivos
binários permanecem no armazenamento privado do app. Não há necessidade de
PostgreSQL, MongoDB, Flyway nem conteúdo do usuário no servidor para esta área.

Proposta relacional, sujeita à aprovação da spec e à prova de migration:

- `local_works`: `id TEXT` PK; `name TEXT NOT NULL` com `trim(name) <> ''`;
  `cover_filename TEXT NULL` privado; `created_at` e `updated_at INTEGER` com
  valores positivos e ordem coerente. `id → name, cover_filename, timestamps`.
  Nome não é chave: obras homônimas são permitidas. A capa padrão é asset do
  aplicativo e não cria arquivo privado por obra.
- Reutilizar `translation_projects` como capítulo, sem duplicar suas páginas,
  resultados ou tentativas. Acrescentar `work_id TEXT NULL` e
  `chapter_label TEXT NULL`, com vínculo obrigatório e rótulo não vazio para
  novos capítulos vinculados. Projetos antigos sem obra permanecem explicitamente
  desvinculados e acessíveis até associação deliberada; não inventar títulos.
  `project.id → work_id, chapter_label, idiomas, status, timestamps`; rótulos
  iguais são permitidos. A ordenação de capítulos deve ter critério determinístico
  estável definido no contrato e não usar comparação lexical ingênua de números.
- `translation_pages` continua com PK por página, FK para projeto e chave
  candidata `(project_id, position)`. `page.id` determina conteúdo e estado;
  `(project_id, position)` determina a página. Resultados, tentativas e progresso
  permanecem filhos existentes; não duplicar estado nem contador agregado.

Não acrescentar objeto JSON para páginas, ordem ou relacionamentos. Sem caches de
contagem: progresso é derivado de estados das páginas. Estados existentes são
`DRAFT`, `QUEUED`, `PROCESSING`, `READY`, `FAILED` e `CANCELLED`; a apresentação
pode agrupá-los sem recriar enums divergentes ou tratar resposta ambígua como
falha que autorize reenvio.

## Integridade e índices

- FK de projeto para obra com `ON DELETE CASCADE` somente após confirmação de
  exclusão; FK das páginas/resultados/tentativas/progresso já existentes deve
  continuar válida. A exclusão deve respeitar jobs em curso e impedir commit
  tardio, além de reconciliar arquivos privados após commit transacional.
- `CHECK` deve assegurar que obra/rótulo estejam ambos ausentes para legado ou
  ambos presentes com rótulo não vazio; validações de nome, timestamps e
  localidade do nome de arquivo da capa devem ser verificadas também no código.
- Índice por `translation_projects(work_id, created_at, id)` para listar capítulos;
  o índice de ordenação de páginas já coberto por `(project_id, position)` não
  deve ser duplicado. Definir ordenação natural sem guardar dois valores de
  ordenação inconsistentes. Criar índice adicional apenas se plano de consulta
  e requisitos de ordem o justificarem.
- Falhas de cópia de capa não devem sobrescrever capa antiga. Usar arquivo
  temporário privado, commit coordenado, remoção idempotente e reconciliação de
  órfãos. Não apagar arquivo de outro projeto; validar paths controlados.

## Migration e validação

Planejar versão SQLite subsequente à atual com backfill não destrutivo e FKs
habilitadas; alterar tabela ou reconstruí-la transacionalmente conforme as
restrições suportadas e as FKs descendentes, sem perda de IDs nem dados. Testar
upgrade a partir de versões antigas suportadas e v10 com projetos/recibos reais
sintéticos, `foreign_key_check`, rollback/interrupção e inicialização concorrente.
Definir estratégia exata antes da implementação e executar testes com SQLite
real, não somente mocks. Adaptar repositórios, importação, biblioteca, exclusão,
lifecycle, backup, leitores e testes em conjunto. `READY` deve representar o
estado da página, sem promover capítulo parcialmente pronto a sucesso integral.

## Decisões a confirmar na Target Spec

Ordenação natural e empate de rótulos, limites de nome/capa, semântica de
exclusão durante tentativa ambígua, operação de associação dos projetos legados,
recuperação entre transação SQLite e filesystem, e a política de tentativa sob
quota/admissão devem ser explícitas antes da derivação de tasks. Nenhuma limpeza
ou substituição de dado existente está autorizada por esta proposta.

## Refinamento antes da implementação — vínculo aditivo

Para preservar as FKs descendentes de projetos sem reconstruí-los, implementar o
vínculo como `local_work_chapters(project_id TEXT PRIMARY KEY, work_id TEXT NOT
NULL, label TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT
NULL)`, com FK `project_id → translation_projects(id) ON DELETE CASCADE` e FK
`work_id → local_works(id) ON DELETE RESTRICT`. A PK garante no máximo uma obra
por projeto; projetos sem linha continuam legados acessíveis. `project_id` é o
determinante de obra, rótulo e timestamps; nomes de capítulos não são chaves.
Criar índice `local_work_chapters(work_id, created_at, project_id)` para listar
capítulos; a PK já indexa a outra FK. Obras não podem ser removidas enquanto
houver vínculos, impedindo perda silenciosa de projeto; a operação de produto
precisa primeiro excluir de forma coordenada os projetos e arquivos associados.
O critério natural de rótulos será aplicado sobre a lista em memória com empate
estável por data/ID, sem contadores derivados. Tabelas e índice serão criados
transacionalmente em migração aditiva após as inicializações existentes de
projetos, recibos e resultados, com `PRAGMA user_version` 11 e verificação de
FKs. Se houver falha, nada deve avançar parcialmente; testes usarão SQLite real.

Para exclusão coordenada, a operação SQLite deve usar transação exclusiva,
verificar a versão esperada da obra e recusar capítulos com página em
processamento ou tentativa ativa/ambígua; um `ACCEPTED` de página já `READY`
pode ser mantido como histórico e não bloqueia. A transação remove primeiro os
projetos associados (e suas FKs descendentes), depois a obra, e devolve os IDs
para limpeza idempotente dos namespaces privados fora da transação. Uma queda
entre commit e limpeza deixa somente arquivos órfãos, a reconciliar; não deve
apagar arquivos antes da confirmação dos metadados. O controlador precisa
apresentar erro recuperável quando a exclusão for bloqueada por processamento.
