# Escrita local das regiões de tradução — 2026-10-03

## Plano anterior ao código

Continuidade autorizada por Ruan para implementar a 019 com qualidade e avançar
condicionalmente à 020. Esta parcela da TASK-005 prepara o adapter SQLite de
regiões remotas, sem iniciar aquisição, renderer, ACK ou mudança de estado local.
Gate da 019 aberto, 018 em `verification-pending`; 020/021 continuam bloqueadas.

### Banco escolhido

SQLite privado v9, já existente, para texto necessário à leitura offline.
PostgreSQL e bucket remoto não mudam. Não guardar um resultado parcial em tabela
paralela para contornar a dependência do renderer.

### Modelo BCNF

Reutilizar `text_regions`: `id → page_id, ordem, texto, metadados, overflow,
created_at`. Reutilizar `text_region_vertices`: `(region_id, vertex_index) → x, y`.
O resultado pai e seu attempt já identificam a página. Idiomas continuam no
projeto. Todo determinante permanece chave candidata.

### Integridade

O adapter recebe um executor da transação exclusiva do chamador. Exige resultado
pai `REMOTE`, attempt da mesma página/job em estado remoto `READY`, par do projeto
igual ao manifesto e ausência de regiões anteriores. Não cria esse resultado,
não altera estados, não calcula overflow e não substitui uma tradução existente.

Reutilizar o mapper para validar todo o manifesto e a referência OCR antes de
escrever; exigir flags de overflow explícitas para exatamente os mesmos IDs,
fornecidas pelo renderer futuro. Copiar os dados antes do primeiro await. Erro
sanitizado interrompe a transação do chamador; inserts de regiões/vértices e pai
devem sofrer rollback juntos. FKs cascade, UNIQUEs e CHECKs existentes permanecem.

### Índices

Consultas pontuais por PK de página, attempt e resultado; regiões por prefixo
da UNIQUE `(page_id, reading_order)`. Nenhum índice novo ou redundante.

### Derivados

Nenhum contador, cache ou estado adicional. Timestamp representa aquisição
local, não horário comprovado do provider. Geometria vem do OCR, não da tradução.

### Migration e arquivos

Nenhuma migration: SQLite v9 e Java V1–V4 preservados. Novo adapter em
`entities/local-translation-result/api`, teste SQLite real em `api/__tests__`,
barrel público e coverage. Sem feature, tela, instalação de dependência ou rede.

## Validação planejada

TDD: manifesto reordenado, Unicode/HTML/linhas e variantes; metadados/vértices;
pai ausente, demo, página/attempt/job/par divergentes, cancelamento e regiões
existentes; flags faltantes/extras/duplicadas; snapshot durante await; rollback
por falha no segundo insert, vertices ou commit; cascade e reabertura. Fixtures
sintéticas e estados `READY` apenas no banco isolado, não resultado real.

Gates: suíte focada, typecheck/lint mobile, `pnpm check`, Maven global offline
com Docker, type-check web, SDD/links, Prettier direcionado e diff.

## Execução e resultados

O teste inicial falhou por ausência do adapter. A primeira implementação passou
26 cenários de SQLite. O teste no teto demonstrou 5.120 escritas SQL individuais;
batching de 64 regiões e 200 vértices por statement passou o mesmo cenário com
37 escritas, no máximo 800 bind parameters por statement, sem alterar conteúdo
ou integridade. Não é medição de latência/memória nativa.

A rodada focalizada final aprovou 80 testes em três suítes: 30 novos do adapter,
45 do mapper e cinco da migration v9. Type-check web e ESLint focalizado passaram.
Os gates integrais são registrados ao final desta execução, sem tratar o
resultado da rodada anterior como validação do código novo.

```bash
# Em mobile/
./node_modules/.bin/jest --ci --runInBand --runTestsByPath \
  src/entities/local-translation-result/api/__tests__/remoteTranslationRegionsStorage.test.ts \
  src/entities/local-translation-result/api/__tests__/localTranslationMigration.test.ts \
  src/entities/local-translation-result/model/__tests__/localTranslatedRegions.test.ts
```

- [Adapter](../../../../../src/entities/local-translation-result/api/remoteTranslationRegionsStorage.ts).
- [Testes SQLite](../../../../../src/entities/local-translation-result/api/__tests__/remoteTranslationRegionsStorage.test.ts).
- [Parser/mapper](../../../../../src/entities/local-translation-result/model/localTranslationManifest.ts).

Review: nenhuma alteração de schema, arquivo, estado público ou texto da spec;
vínculos inválidos, FK desligada, replay e erros nativos falham sem conteúdo nas
exceções. Fonte/hash confiável e transação exclusiva continuam dever do chamador.
O teste injeta pai remoto `READY` exclusivamente no banco em memória; não afirma
que renderer ou aquisição real estejam implementados.

## Limites

O chamador futuro deve verificar bytes/hashes do OCR, tradução e resultado
renderizado antes de iniciar a transação de aquisição da 021. Esta função não
autentica arquivos nem autoriza criar resultado pai artificialmente. Sem chamador
de produção neste incremento, nenhum arquivo é adquirido e nenhuma página é
promovida. O commit integral de aquisição continua na 021.

Performance: queries pontuais e volume máximo de 1.024 regiões/quatro vértices,
sem materialização de outras páginas. Node/SQLite não equivalem a latência,
memória ou teste físico de Expo SQLite. Revisão de performance proporcional,
sem cache ou otimização preventiva.

## Gates integrais da parcela

`pnpm check` completo aprovou 116 suítes/857 testes Jest, 30 de performance,
24 SDD e seis de boundaries. Type-check, ESLint, FSD, links e formatação
passaram. Avisos preexistentes de `act` não foram alterados fora do escopo.

Maven global foi reexecutado após a leitura estrita e o transporte integrado:
exit 0 com Docker, 333 testes no gateway, zero falhas/erros/skips. Web `tsc -b`
também exit 0. Ver a
[evidência de transporte](translation-grpc-integration-2026-10-03.md) para o
snapshot técnico posterior; o checksum mobile não cobre esses fontes Java.

A contagem foi corrigida para excluir quatro relatórios históricos `*IT`
não selecionados pelo comando padrão. Nenhuma evidência histórica foi removida.
