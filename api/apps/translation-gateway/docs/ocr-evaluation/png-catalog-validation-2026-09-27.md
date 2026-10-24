# Catálogo misto e avaliação PNG - 2026-09-27

Parcela de preparação da TASK-004 da MOB-FEAT-018, que permanece `in-progress`.
Este incremento não conclui qualidade real, referência independente ou operação
da TASK-005. Não houve chamada Google, credencial, upload, tradução ou deploy.

## Entrega

- Catálogo v2 aceita PNGs derivados dos dois PDFs do Hong Kong Storybooks
  explicitamente selecionados, com licença CC BY 3.0, créditos e procedência
  individuais. A allowlist não admite qualquer host/arquivo encontrado na web.
- Os doze registros JPEG anteriores permanecem idênticos, para preservar a
  igualdade de metadados exigida pelas rodadas históricas. Defaults globais CC BY
  4.0/créditos são exclusivos dessas entradas legadas de Pepper&Carrot.
- PNG: assinatura, dimensões, CRCs, chunks, stream zlib, tamanho descomprimido e
  filtros conferidos; RGB/RGBA 8 bits não entrelaçado, sem APNG, limite local de
  64 MiB descomprimidos. O worker continua usando seu decoder real, com contrato
  de mídia inalterado. Não houve mudança de limites públicos do gateway.
- `download` não baixa ou converte PDFs em nome de uma amostra PNG. Derivação
  ausente pede restauração explícita; arquivo adulterado/symlink não é substituído.
- Galeria não inventa comparação pt-BR para livros de outras cenas. Relatórios
  OCR/layout indicam licença/fonte/alteração da própria amostra, com HTML escapado.
- Harness Java exclusivo de testes aceita JPEG/PNG e confronta MIME real com o
  declarado antes de inicializar adapter. Modo offline passa `-o` ao Maven.

## Verificação executada

1. Red: novos testes falharam por ausência de `inspectPng` e atribuição CC BY 4.0
   fixa no relatório, antes da implementação.
2. `node --test api/apps/translation-gateway/scripts/*.test.mjs`: **37 testes,
   zero falhas**. Inclui corrupção, CRC, MIME, inflação limitada, APNG, metadados,
   licença/origem falsas, derivação ausente, symlink, escape e direitos por item.
3. `node api/apps/translation-gateway/scripts/ocr-samples.mjs verify` e `gallery`:
   **14 amostras íntegras, zero downloads**. As duas novas cópias são byte a byte
   iguais às saídas da aquisição autorizada; PDFs e PNGs de origem preservados.
4. `./mvnw -o -B test`, na raiz `api/`, com Docker: **BUILD SUCCESS**, sem falhas
   ou erros. Módulo gateway: 158 testes; harness de avaliação: 15 testes, incluindo
   PNG `zh-Hant`, preservação de bytes e MIME divergente com zero chamadas ao falso.
5. Duas invocações do executor `run --mode offline`, uma por PNG, com IDs locais
   novos e exclusivos: ambas concluídas. PostgreSQL 17 temporário, gRPC falso,
   etapa OCR `SUCCEEDED`, job `TRANSLATING`, `rpcCalls=1`, `synthetic=true`,
   `credentialMode=none`, `cleanupPending=false`. Uma região sintética por rodada;
   isso não mede texto, geometria ou ordem reais dos livros. Nenhuma tradução.
6. Leitura via `loadRun` das 12 rodadas reais históricas: todas válidas, sem
   modificar evidências nem repetir chamada. Novos relatórios usam CC BY 3.0 e
   aviso permanente de simulação. `report` continua sem provider.
7. Type-check web (`./node_modules/.bin/tsc -b`): aprovado.
8. `pnpm specs:check` em `mobile/`: 24 testes SDD, validação e links aprovados.
   Nenhum artefato sob mobile foi alterado; não houve renovação artificial de
   checksums. Gates backend não são substituídos pelos checks SDD mobile.
9. Prettier direcionado, 17 links locais dos documentos alterados e
   `git diff --check`: aprovados. Os dois relatórios foram regenerados com
   `report`, sem iniciar harness ou provider, e as 14 imagens revalidadas.

A primeira tentativa Maven no sandbox falhou no acesso ao Docker/JVM. A primeira
solicitação de liberação também não executou por limite de uso do mecanismo de
aprovação; após o usuário pedir continuação, a execução liberada completou com
sucesso. Não foram instaladas dependências para contornar essas falhas.

## Reprodução e limites

Os comandos de catálogo estão em [amostras locais](local-samples.md); os comandos
do harness e interpretação da simulação, em [teste manual](manual-test.md).
Use os IDs `zh-hant-read-p03` e `zh-hant-anansi-p04`, sempre com nova rodada.
Não use `vision` para regenerar relatório nem reutilize diretórios de execução.

As imagens são livros ilustrados horizontais, não mangás com balões. Texto de
PDF/HTML publicado não foi convertido em referência humana aprovada. Revisão
linguística independente, OCR real de zh-Hant, verticais e página sem texto
continuam pendentes. O benchmark de 18 posições não foi declarado preenchido.
Defaults, rotas `/v1`, task, manifesto OCR `1.0`, banco e migrations V1-V3
permanecem inalterados. Não existe autorização implícita para chamada paga.
