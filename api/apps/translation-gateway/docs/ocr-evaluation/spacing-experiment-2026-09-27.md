# OCR vertical — experimento limitado de espaçamento, 2026-09-27

## Escopo e autorização

O usuário autorizou implementar e executar integralmente o plano, sem novas
perguntas intermediárias. Limite preservado: até duas invocações OCR novas,
primeiro repetição do controle original (A), depois a variante (B) somente se a
omissão reaparecesse. Não foi autorização para retries, novas amostras, alterações
de cloud, deploy, tradução ou modificações no worker de produção.

Imagens: controles tipográficos sintéticos. Respostas: capturas reais Vision,
distintas da simulação offline usada antes do envio. A credencial impersonada
isolada e o bucket privado US existentes foram usados pelo harness, com preflight
de localização/acesso uniforme/bloqueio público, uma imagem por rodada, deadline
de 60 segundos e retries OCR desabilitados. Nenhuma nova credencial foi criada.
Valor faturado não foi consultado; operações e soft delete podem gerar cobrança.

## Preparação reproduzível

- Receita original `kanji-grid-1` preservada, ainda default.
- Receita allowlisted `kanji-grid-wide-1`: centros verticais x=768/432 em vez de
  x=710/490. Espaçamento 336 em vez de 220 pixels, sem alteração do centro conjunto.
- Mesmos 16 glifos, máscaras de pixels, fonte física/face, dimensão 1.200 × 1.200,
  tamanho de fonte, coordenadas verticais, sequência, quebras e ordem esperada.
  A imagem horizontal dos dois bundles é binariamente idêntica.
- JavaScript prepara/verifica; Java admite o bundle no harness. Ambos recusam
  receitas desconhecidas ou inconsistentes. Node mantém a validação integral de
  pixels e referências; Java também verifica os centros da receita selecionada.
- Somente scripts e classes de teste mudaram. Sem Python, biblioteca nova, schema,
  migration, heurística de produção ou alteração de defaults.

Comandos de preparação e recuperação estão em
[controles sintéticos](synthetic-calibration.md#variante-experimental-de-espaçamento)
e [executor](calibration-worker.md). A rodada offline da variante concluiu antes
das chamadas reais: comprova o pipeline, não reconhece os caracteres da imagem.

## Resultados observados

| Condição                     | Caracteres recebidos/associados | Referências ausentes | Substituições | Ordem relativa | Quebras    |
| ---------------------------- | ------------------------------- | -------------------- | ------------- | -------------- | ---------- |
| Captura anterior, 220 px     | 15/16                           | t08                  | 0             | correta        | diferentes |
| A: mesmos bytes, 220 px      | 15/16                           | t08                  | 0             | correta        | diferentes |
| B: colunas afastadas, 336 px | 16/16                           | nenhuma              | 0             | correta        | diferentes |

A repetiu a ausência do primeiro glifo da coluna esquerda. Seu protobuf não é
binariamente idêntico ao anterior; a conclusão é repetição da omissão, não
determinismo completo do provider. Após validar sucesso, hashes e limpeza de A,
a condição para a única chamada B foi registrada antes de sua execução.

B retornou todos os 16 símbolos, com sequência e ordem completas corretas,
sem geometria inválida ou associação ambígua. Ambas as novas rodadas concluíram
com `OCR=SUCCEEDED`, job `TRANSLATING` e manifesto/captura íntegros. O estado
`TRANSLATING` não significa que uma tradução foi executada.

Nas três capturas, a quebra entre colunas é `LINE_BREAK` e existe um
`LINE_BREAK` terminal adicional, ausente na referência. Não normalizar para
transformar diferença em acerto. Em A, cobertura incompleta também impede
igualdade integral de sequência/ordem/quebras; os 15 existentes não estão invertidos.

## Interpretação e decisão

Fato: neste experimento, a omissão reapareceu com a imagem original e não apareceu
com maior espaçamento. Isso é compatível com influência da disposição das colunas.
Hipótese ainda não provada: falha interna de detecção/segmentação causada pela
proximidade. Não isola causa, variabilidade temporal ou mecanismo interno do Vision;
um par não constitui evidência estatística nem avaliação linguística independente.

Não alterar o mapper, reorganizar páginas, separar colunas automaticamente ou
inserir texto esperado. Não ampliar o experimento silenciosamente. A autorização
foi encerrada após duas chamadas novas; próximos passos devem ser definidos à
parte. MOB-FEAT-018 permanece `in-progress`, TASK-004/005 e revisão humana abertas.

## Evidências e verificações

Resposta bruta, manifesto OCR, diagnósticos, comparação, hashes, timestamps e
relatórios visuais permanecem locais/ignorados pelo Git. Um relatório comparativo
liga as três rodadas e mostra as imagens A/B. Os 54 arquivos anteriores
fotografados no início permaneceram idênticos por SHA-256. Nenhuma captura foi
sobrescrita. Os dois resultados novos declaram `cleanupPending=false`; isso não
comprova eliminação de versões retidas por soft delete nem custo zero.

O teste novo de receita JS e o teste de admissão Java falharam antes da
implementação e passaram depois. Os testes verificam deslocamento somente em x,
compatibilidade do default, glifos iguais, receitas inválidas e referências
inconsistentes. O primeiro teste Docker foi bloqueado pelo sandbox antes do
container; reexecução com acesso ao socket local passou, sem invocação OCR real.

Gates finais executados nesta alteração:

- `OCR_CALIBRATION_FONT=<fonte-local> node --test api/apps/translation-gateway/scripts/*.test.mjs`:
  86 testes aprovados, nenhum ignorado, incluindo renderização física local.
- `./mvnw -o -B -pl apps/translation-gateway -am test -Dtest=CalibrationAdmissionTest,CalibrationWorkerTest -Dsurefire.failIfNoSpecifiedTests=false`:
  12 testes aprovados após acesso ao Docker; nenhuma chamada Google nesse gate.
- `cd api && ./mvnw -o -B test`: sete módulos aprovados, 175 testes do gateway,
  zero falhas/erros; duração 2 min 59 s. Execuções manuais Vision não são
  selecionadas pela suíte padrão. Cadeia Flyway V1–V3 revalidada em PostgreSQL 17.
- `cd web/toonlira && ./node_modules/.bin/tsc -b`: exit 0.
- SDD executado diretamente: 24 testes aprovados, `validate-specs.mjs` e
  `check-doc-links.mjs` aprovados. Nenhuma mudança em arquivos de implementação
  mobile cobertos por checksum; checksums inalterados não foram renovados.
- Prettier direcionado aos arquivos JS/Markdown alterados e `git diff --check`:
  aprovados. Seis links/imagens do relatório comparativo local resolvidos.

Não foi necessário instalar dependências ou modificar infraestrutura para fechar
estes gates. O resultado do experimento não encerra a avaliação geral da 018.
