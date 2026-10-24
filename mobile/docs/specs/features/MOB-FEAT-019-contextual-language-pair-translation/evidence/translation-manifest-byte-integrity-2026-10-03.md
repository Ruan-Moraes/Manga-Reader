# Integridade dos bytes do manifesto traduzido — 2026-10-03

Parcela da TASK-005/007 da `MOB-FEAT-019`, `in-progress/open`, com a 018 em
`verification-pending`. O incremento implementa somente validação local de bytes
já adquiridos; não faz download, gravação remota, ACK, renderer ou chamadas Google.
As tasks permanecem abertas e os gates 020/021 bloqueados.

## Plano e fronteiras

Aplicação de `sdd-executor` sob os guardrails atuais, que admitem execução em
andamento com dependência em verificação. Contrato aprovado: associação íntegra
dos mesmos IDs, variantes distintas e rejeição integral de payload inválido.
Nenhum requisito foi alterado para acomodar o código.

Pela `fsd-architecture`, o primitivo agnóstico SHA-256 permanece em
`shared/files`; a verificação de manifesto/job/idiomas pertence ao modelo da
entity existente `local-translation-result`. Os barrels públicos foram ampliados
sem novo slice ou import horizontal. A referência linguística usa a API `@x`
existente. Não há controles de UI nem abertura de fluxo remoto incompleto.

Nenhuma escrita de dados ou mudança de schema: SQLite v9 e PostgreSQL V1–V4
permanecem intactos. O artefato OCR e o manifesto traduzido `1.0` não mudaram.

## Implementação e evidências

- `sha256Bytes` usa o `digest` da dependência Expo Crypto já instalada. O
  hash de arquivos continua usando o mesmo primitivo, com teste de regressão.
- `parseLocalTranslationManifestBytes` exige `Uint8Array`, SHA-256 esperado
  hexadecimal minúsculo e referência OCR válida. Rejeita vazio/excesso antes
  de hashing. O limite de 4 MiB é o já existente em `TranslationManifestService`,
  não um novo orçamento ou limite do provider.
- Copia bytes e referência antes do primeiro `await`, evitando que alteração
  pelo chamador faça o JSON interpretado divergir dos bytes verificados.
- Confere o hash antes de decodificar/interpretar; inclui BOM e espaços na
  identidade do artefato. Subarrays não incluem bytes vizinhos do buffer.
- UTF-8 usa `fatal: true`, sem substituir sequências inválidas. Há teste com
  o decoder real da versão instalada do Expo, além do decoder do ambiente Jest.
- Após JSON, reutiliza a validação integral de job, idiomas, OCR hash,
  modelo, IDs, ordem e limites UTF-16. Não interpreta HTML nem normaliza texto.
- Erros nativos, UTF-8, JSON e contrato produzem somente
  `localTranslation.invalidRemoteManifest`, sem texto remoto ou causa bruta.

O hash esperado deve vir de metadados confiáveis vinculados ao job. Calcular um
hash do próprio arquivo e fornecê-lo como expectativa não prova autenticidade.
O parser de objetos continua público para usos/testes já existentes, mas não é
apresentado como verificação de integridade dos bytes.

Fontes e testes:

- [Manifesto e fronteira de bytes](../../../../../src/entities/local-translation-result/model/localTranslationManifest.ts).
- [Testes da fronteira](../../../../../src/entities/local-translation-result/model/__tests__/localTranslationManifestBytes.test.ts).
- [Hash compartilhado](../../../../../src/shared/files/fileIntegrity.ts) e
  [regressão de arquivos](../../../../../src/shared/files/__tests__/fileIntegrity.test.ts).
- [Limite correspondente no gateway](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/TranslationManifestService.java).

## TDD e validação

Os testes foram escritos antes das funções: 33 casos da fronteira falharam pela
ausência da API, e o novo teste de bytes do shared falhou; o hash de arquivo já
existente passou. A execução verde, ampliada com Expo/BOM, passou com três suítes
e 65 testes. Fixtures são sintéticas, com digest do SDK substituído por SHA-256
real do Node nos testes; não constituem evidência de qualidade de tradução ou
integração nativa de criptografia.

Comando focalizado em `mobile/`:

```bash
./node_modules/.bin/jest --runInBand \
  src/entities/local-translation-result/model/__tests__/localTranslationManifest.test.ts \
  src/entities/local-translation-result/model/__tests__/localTranslationManifestBytes.test.ts \
  src/shared/files/__tests__/fileIntegrity.test.ts
```

Gates executados nesta parcela, sem reinstalação de dependências:

| Verificação                                                                      | Resultado corrente                                                                                                                        |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Focalizado Jest acima                                                            | três suítes, 65 testes aprovados                                                                                                          |
| `mobile/`: `pnpm check` completo                                                 | exit 0; 113 suítes/753 testes Jest; 30 de performance, 24 SDD e seis de boundaries; TypeScript, ESLint, FSD, links e formatação aprovados |
| `api/`: `./mvnw -o -q test`, com Docker/loopback local                           | exit 0; no gateway, 43 relatórios/295 testes, zero falhas, erros ou skips; cadeia V1–V4 em PostgreSQL 17                                  |
| `web/toonlira/`: `./node_modules/.bin/tsc -b`                                    | exit 0                                                                                                                                    |
| SDD/links, Prettier direcionado e `git diff --check` após estabilizar documentos | aprovados; referências correntes de checksum rebaseadas sem renovar conclusões históricas                                                 |

Warnings `act` já existentes no mobile e avisos do agente Mockito/JDK não foram
corrigidos fora do escopo. Nenhum lockfile foi alterado por esta parcela. Não
reutilizar esses testes funcionais como evidência de qualidade ou execução real.

A primeira cadeia completa passou SDD/links/TypeScript e parou no ESLint por
ordenação de imports dos dois testes novos. Ajuste restrito a esses imports,
sem autofix global nem alteração de funcionalidade alheia; a cadeia repetida
passou integralmente. No type-check focalizado, o helper foi tipado com
`Uint8Array<ArrayBuffer>` para respeitar `BufferSource` do SDK instalado, sem
cast de `SharedArrayBuffer` ou cópia adicional ocultada no primitivo.

## Performance e limites de evidência

Aplicada `mobile-performance`/MOB-DEC-007 proporcionalmente ao impacto:
uma página, bytes limitados a 4 MiB antes da cópia, uma chamada de digest, nenhum
cache/fila/efeito de UI. Hashing/decoding são lineares nos bytes e associação nos
IDs, com os limites já aprovados. O caso no teto comprova aceite funcional, não
memória/CPU/latência nativa. Não houve medição física Android/iOS nem afirmação
de melhoria ou ausência de regressão em aparelho. O futuro download deve impor
o limite durante aquisição; este parser não controla memória alocada a montante.

Gateway permanece na fotografia técnica de 180 arquivos:
`e5c89f79c460b4d5b0a482aed1e72f4875b108ead5527b0469f785c6aa9d8c98`.
Nenhum fonte/teste/configuração Java foi alterado nesta parcela. O checksum
mobile corrente fica na review/drift; hashes e conclusões históricos são mantidos.

Pendentes: aquisição autenticada, promoção/gravação do resultado local, retorno
e ACK, qualidade do provider e validação operacional. Integração com renderer e
leitor remoto não foi antecipada. Não houve uso de ADC, alteração legal, deploy
ou habilitação de uploads.
