# Fonte CC0 e preparação vertical offline — 2026-09-27

Parcela de preparação da TASK-004 da MOB-FEAT-018, ainda `in-progress`.
Não conclui benchmark independente, OCR vertical real ou operação da TASK-005.
Esta entrega não usou credenciais, Vision remoto, uploads, tradução ou deploy.

## Alteração delimitada

- Adicionado `ja-tokyo-puck-1909-cover`: original JPEG com hash fixado, sem
  transformação, da capa histórica Tokyo Puck/Rijksmuseum declarada CC0 no
  [item do Commons](https://commons.wikimedia.org/wiki/File:Tokyo_Puck_-_Februari_1909,_RP-P-2005-572.jpg).
- Allowlist específica de ID, URL e página, sem liberar outros itens do Commons.
  `local-original` exige restauração explícita e impede fetch mesmo em `download`.
- Categoria histórica, orientação mista e escopo multilíngue obrigatórios. O hint
  `ja` não classifica toda a página; o possível chinês segue não confirmado por
  revisor independente. Não inferir direção de layout a partir do idioma.
- Crédito CC0 e limitações aparecem na galeria e no relatório OCR. Sem tradução
  editorial pt-BR inventada e sem atribuir CC BY aos novos bytes.
- Os 14 registros existentes permanecem compatíveis com as cópias guardadas nas
  rodadas; não há mudança de contratos, Java, schema ou migrations.

## Verificações observadas

1. Red: dois testes novos falharam antes da implementação: origem individual
   ainda recusava CC0 e o fetch falso era chamado para `local-original` ausente.
2. Suíte Node dos três scripts: **41 testes, zero falhas**, também após formatação
   direcionada. Cobre fonte/licença forjadas, metadados obrigatórios, ausência
   sem rede, hash divergente, symlink, preservação dos bytes e escape HTML.
3. `verify` e `gallery`: **15 arquivos íntegros, zero downloads**. A nova cópia
   usa criação exclusiva; original adquirido preservado. SHA-256
   `fae14af46babf127984602fdc463d11e8b30a813d681595c606997c16b4122ed`,
   4.876.506 bytes, 3982 × 5734.
4. Execução manual **offline**, com PostgreSQL 17 temporário e gRPC falso:
   `SUCCEEDED`/`TRANSLATING`, `rpcCalls=1`, captura `synthetic=true`,
   `credentialMode=none`, `cleanupPending=false`. Uma região de texto sintético;
   não reconheceu texto nem geometria real da imagem. V1–V3 aplicadas pelo harness.
5. Manifesto e captura revalidados por `loadRun`; relatório coincide com renderização
   dos artefatos e mantém banner de simulação, CC0 e ressalva multilíngue. Comando
   `report` regenerou o HTML sem executar harness/provider.
6. As **14 rodadas reais históricas** continuam legíveis e íntegras via `loadRun`,
   sem reexecução, alteração de texto, captura ou manifesto.
7. Type-check web `./node_modules/.bin/tsc -b`: aprovado.
8. `pnpm specs:check`: 24 testes, validação SDD e links aprovados. Não houve
   alteração mobile ou renovação artificial de checksums.

9. Maven global `./mvnw -o -B test` em `api/`, com Docker: **BUILD SUCCESS** em
   2 min 14 s; todos os módulos aprovados, zero falhas/erros. Nenhuma dependência
   instalada; testes manuais de chamadas reais não são selecionados por esse gate.
10. Prettier direcionado aos oito arquivos alterados, 18 links documentais locais
    e `git diff --check`: aprovados. Não houve formatação global ou correção de
    funcionalidades fora deste incremento.

## Reprodução

```bash
node --test api/apps/translation-gateway/scripts/ocr-samples.test.mjs api/apps/translation-gateway/scripts/ocr-evaluation.test.mjs api/apps/translation-gateway/scripts/ocr-layout.test.mjs
node api/apps/translation-gateway/scripts/ocr-samples.mjs verify
node api/apps/translation-gateway/scripts/ocr-samples.mjs gallery
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs run --sample ja-tokyo-puck-1909-cover --mode offline --run-id NOVO-ID
```

Usar ID novo em letras minúsculas; o comando do exemplo tem placeholder, não
um diretório reutilizável. Maven offline e dependências já disponíveis. Não
executar `vision` para refazer HTML. [Instruções do executor](manual-test.md) e
[restauração local](local-samples.md).

Continua pendente a decisão sobre ensaio real desta capa histórica, com autorização
específica de custo/upload. Não é balão de mangá contemporâneo, referência humana
ou preenchimento de `OCR-015`. Defaults desabilitados permanecem intactos.
