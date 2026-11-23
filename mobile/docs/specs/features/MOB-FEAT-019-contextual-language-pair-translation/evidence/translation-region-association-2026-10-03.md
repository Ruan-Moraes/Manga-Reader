# Associação local OCR → tradução — 2026-10-03

Parcela executada da TASK-005/007 da 019, `in-progress/open`, com a 018 em
`verification-pending`. O pedido humano de continuidade autoriza a execução
incremental do contrato aprovado, não chamadas pagas ou abertura de 020/021.

## Plano anterior ao código

Entregar um mapper puro na entity `local-translation-result`, sem escrita,
rede, download, ACK, renderer ou mudança para `READY`. Recebe referência OCR
confiável com IDs/ordem/texto/polígonos, manifesto traduzido e timestamp de
aquisição fornecido pelo chamador. Valida a página integralmente e associa por
IDs usando o parser já existente. Texto e coordenadas permanecem exatos.

Saída contém somente ID, ordem, texto fonte/traduzido, vértices indexados e
metadados de tradução. Não inventa página/attempt, filename, estado, overflow
ou horário da chamada ao provider. O timestamp local não é prova do horário
de tradução remota. Coleções, vértices e metadados são copiados e congelados.

### Banco escolhido

SQLite privado v9 continua sendo o destino futuro dos dados finais no mobile.
PostgreSQL conserva somente metadados de etapas; texto remoto continua no
bucket efêmero. Este incremento não persiste nada em nenhuma tecnologia.

### Modelo BCNF

Reutilizar no futuro `text_regions`, cuja chave candidata é `id` e cujo
determinante `id → texto, ordem, metadados` já existe; `(page_id, reading_order)`
continua único. Polígonos continuam em `text_region_vertices`, com determinante
`(region_id, vertex_index) → x, y`. Idiomas derivam do projeto, sem duplicação.
Nenhuma tabela de resultado parcial é criada para contornar o gate do renderer.

### Integridade

Preservar FKs cascade resultado→página/attempt, região→resultado e
vértice→região; CHECKs de source/status/hash/timestamps/metadados em conjunto.
O mapper valida limites fonte/saída, IDs, ordem e geometria antes de produzir
qualquer região. Não representa promoção ou commit local.

### Índices

Nenhuma query ou índice novo. PKs e UNIQUE existentes permanecem suficientes
para a futura associação por página/região; evitar índices redundantes.

### Derivados

Nenhum contador, cache, fila ou estado público adicional.

### Migration e código

Nenhuma migration: SQLite v9 e PostgreSQL V1–V4 intactos. Implementação
restrita ao modelo/barrel existentes e teste novo do modelo. Reutilizar
limites OCR (1.024 regiões, 4.096 UTF-16 por região, 262.144 por página), saída
2× já aprovada e quadriláteros convexos normalizados como `OcrGeometry` Java.
Sem ajuste de coordenadas, normalização Unicode ou heurística textual.

## Implementação e validação

Testes escritos antes do código: reordenação por ID, preservação de Unicode/HTML/linhas,
variantes chinesas, página vazia, metadados, cópias/imutabilidade, IDs/ordem
inválidos, geometria inválida, limites máximos/acima e erros sanitizados.
Usar fixtures sintéticas, sem capturas privadas ou credenciais.

As 37 regressões iniciais falharam porque a função não existia. Após a
implementação, três suítes e 100 testes passaram. A cobertura foi ampliada
com referências externas inválidas e o limiar geométrico exato; rodada final
com 108 testes aprovados, sendo 45 do mapper. Type-check e ESLint focalizados
passaram. Não há fixture obtida de chamada real ou referência humana aprovada.

Comando reproduzível em `mobile/`:

```bash
./node_modules/.bin/jest --ci --runInBand --runTestsByPath \
  src/entities/local-translation-result/model/__tests__/localTranslatedRegions.test.ts \
  src/entities/local-translation-result/model/__tests__/localTranslationManifest.test.ts \
  src/entities/local-translation-result/model/__tests__/localTranslationManifestBytes.test.ts
```

Fontes:

- [Mapper e parsers existentes](../../../../../src/entities/local-translation-result/model/localTranslationManifest.ts).
- [Testes da associação](../../../../../src/entities/local-translation-result/model/__tests__/localTranslatedRegions.test.ts).
- [API pública da entity](../../../../../src/entities/local-translation-result/index.ts).
- [Contrato dos dados locais](../../../../../src/entities/local-translation-result/model/localTranslationResult.ts).
- [Geometria normativa já usada pelo gateway](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/domain/OcrGeometry.java).

Gates executados em 2026-10-03, sem provider, credenciais ou reinstalação:

| Verificação                                               | Resultado                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm check` em `mobile/`                                 | Aprovado integralmente; 115 suítes e 827 testes Jest.                                 |
| Checks de performance / integridade SDD dentro do `check` | 30 / 24 testes aprovados; specs, links, TypeScript, ESLint, FSD e Prettier aprovados. |
| `./mvnw -o -q test` em `api/`, com Docker                 | Exit 0 no reactor; gateway com 43 relatórios, 295 testes, zero falhas/erros/skips.    |
| `./node_modules/.bin/tsc -b` em `web/toonlira/`           | Exit 0.                                                                               |
| ESLint focalizado do modelo, barrel e teste novo          | Exit 0.                                                                               |

Avisos existentes de `act` nos testes React e logs de encerramento do Mongo
no reactor não alteraram os resultados. Não houve correção automática fora
da parcela. Revalidação final: specs/links, Prettier direcionado e
`git diff --check`. A rebase dos headers não renova os verdicts históricos
de outras features.

## Fronteiras SDD/FSD e performance

Aplicar `sdd-executor`, reviewer e drift sob os guardrails atuais. Manter a
matriz com uma linha por AC e somente TASK-001 encerrada. Pelo FSD, associação
e validação pertencem ao modelo da entity existente; o futuro caso de uso
de aquisição/promoção não pertence ao modelo e não é criado nesta parcela.
Expor somente a função/tipos pelo barrel, sem importação horizontal nova.

Aplicar `mobile-performance`/MOB-DEC-007: associação linear com Map, texto e
regiões limitados, quatro vértices por região e cópias limitadas. Não introduzir
cache ou paralelismo preventivo. Testes funcionais não medem memória/latência
Android/iOS nem provam qualidade de tradução ou autenticidade da referência.

O chamador futuro deve fornecer OCR verificado contra seus bytes/hash e usar
a entrada de bytes do manifesto traduzido quando fizer aquisição. O mapper
de objetos não substitui autenticação, hash ou download limitado. Não libera
overflow ou reader antes de renderização íntegra e commit final.

## Review e drift da parcela

Contrato entregue é associação local, não persistência de resultado parcial ou
final. Reutiliza a validação integral do manifesto: não incorpora geometria
do provider de tradução, não perde regiões nem converte variantes chinesas.
O mapper exige timestamp inteiro positivo e conserva coordenadas inclusive
na orientação inversa, sem arredondamento. Erros ficam limitados a
`localTranslation.invalidRemoteManifest`, sem referência, texto ou causa bruta.

FSD/modelagem mantiveram a função no domínio da entity existente, sem novo
slice ou schema; a porta de aquisição/promoção continua pendente. Pela revisão
SDD, 020/021 continuam bloqueadas. Implementação final, qualidade real, retorno,
gravação local e ACK não foram reclassificados como simples benchmark.
Somente TASK-001 permanece marcada; verdict parcial `changes-requested`.

Snapshot técnico gateway revalidado e inalterado: 180 arquivos,
`e5c89f79c460b4d5b0a482aed1e72f4875b108ead5527b0469f785c6aa9d8c98`.
O checksum mobile corrente está nos headers da review/drift, sem substituir
hashes técnicos/históricos Java ou renovar conclusões de outras features.
