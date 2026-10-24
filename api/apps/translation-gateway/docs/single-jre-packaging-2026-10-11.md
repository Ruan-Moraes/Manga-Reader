# Contextos reproduzíveis do worker experimental — 2026-10-11

**Auditoria posterior:** a [comparação física dos archives](rootfs-archive-audit-2026-10-11.md)
reprovou duas mudanças de nome Unicode não visíveis nos registros capturados.
O comando corrente exige também headers/conteúdo físicos e rejeita os recibos
históricos abaixo. Este texto preserva a execução anterior, não é admissão atual.

Continuação da [distribuição local com um JRE](single-jre-runtime-2026-10-11.md).
020 permanece `in-progress/open`; 021 `approved/blocked`. Nenhuma instalação,
chamada real, credencial, cloud, publicação ou alteração do runtime default.

## Entrega

O comando [render-single-jre-image.mjs](../scripts/render-single-jre-image.mjs)
prepara um contexto local separado usando o JAR, codec e recibo existentes.
Não cria a base, executa Docker, extrai arquivos, instala dependências, inicia
o worker, chama providers ou publica uma imagem. O Dockerfile copiado é o
[Dockerfile.native](../Dockerfile.native), sem alteração dos defaults disabled.

O caminho comum [render-native-image.mjs](../scripts/render-native-image.mjs)
continua usando Temurin ou a prova estrita de seus dois patches. Ele **não**
aceita o novo recibo como substituto dessa prova. O opt-in experimental exige
`--base-proof` e seu SHA-256, sem fallback nem override arbitrário de registry.

O [verificador](../scripts/single-jre-proof.mjs) confere:

- recibo readonly, hash fornecido explicitamente e arquitetura;
- todos os artefatos declarados, com nomes restritos e leitura limitada;
- hashes/tamanhos dos dois archives por streaming, sem extração;
- listas de entradas, mtree, hardlinks e exclusões fixas pela
  [política](../scripts/single-jre-policy.mjs);
- correspondência entre nomes das listas e do mtree, sem normalizar Unicode;
- configuração capturada da base: Ubuntu, uma camada vinculada ao rootfs,
  entrypoint, arquitetura e labels de procedência;
- JAR/pacote/licenças com pins e criação exclusiva do contexto, reutilizando
  os guards existentes de integridade e isolamento.

A primeira conferência real revelou nomes UTF-8 codificados em octal no mtree.
Um teste reproduziu a divergência antes da correção. O decoder agora interpreta
os bytes como UTF-8 estrito, sem converter cada byte em um caractere isolado,
normalizar nomes, modificar os archives ou dispensar comparação.

Os inputs históricos graváveis foram recusados. Foram criadas cópias readonly
em destino privado novo; os arquivos e recibos anteriores ficaram intactos.
Nenhum arquivo do filesystem foi extraído no host.

## Como repetir

Usar caminhos absolutos/canônicos. O diretório-pai do destino deve existir e
ser privado; o destino deve ser novo. O pacote nativo, recibo, seus artefatos e
os dois archives ao lado dele devem estar readonly. Não alterar recibos para
aceitar outro modelo de preparação. A obtenção/preparação da base é etapa
separada, sujeita à aprovação de instalação e validação própria.

```bash
node /caminho/absoluto/api/apps/translation-gateway/scripts/render-single-jre-image.mjs \
  --jar /caminho/absoluto/gateway.jar \
  --jar-sha256 <sha256-do-jar> \
  --distribution /caminho/absoluto/codec-readonly \
  --manifest-sha256 <sha256-do-manifesto-nativo> \
  --platform linux-aarch64-glibc \
  --base-proof /caminho/absoluto/provas-readonly/result.json \
  --base-proof-sha256 <sha256-do-recibo> \
  --destination /caminho/absoluto/novo-contexto
```

Para x86_64, usar `linux-x86_64-glibc` e seus próprios pins/recibo/codec.
Os placeholders devem ser substituídos; não são comando executável pronto.
O JSON de retorno contém `contextSha256`, hashes e `buildArguments` com os
nomes exatos `RUNTIME_IMAGE`, `CODEC_MANIFEST_SHA256` e `GATEWAY_JAR_SHA256`.
Não contém caminhos pessoais ou arquivos de credenciais. A lista de arquivos
do contexto é restrita a Dockerfile, ignore, JAR, metadata e cinco assets nativos.

Preparação retorna `prepared-not-built`, nunca segurança/operacional aprovadas.
ID/destino repetido não sobrescreve o vencedor. Falha após reservar o destino
retorna `native-image-incomplete`; guardar para diagnóstico e usar outro destino,
sem limpeza abrangente ou retomada automática. Antes da reserva, o erro é
`native-image-unavailable`. Regenerar contexto não chama nenhum provider.

## Limites da prova

`sealed-captured-records` significa que os registros capturados e archives
correspondem ao recibo pinned. O hash **não autentica o autor** nem substitui
assinatura ou revisão da origem. O comando revalida os registros, mas não
regera listas/mtree a partir dos headers do tar nem consulta a imagem atual
no daemon. O import/build é separado e precisa de verificação própria.

`xattrs-acls-capabilities-pending` permanece explícito: mtree não cobre
exaustivamente esses metadados. Não se afirma equivalência completa de todos
os atributos de filesystem ou build bit-reproducível após novo export/import.
Os timestamps Docker de novas imagens variam; somente o snapshot dos inputs
e o checksum de contexto são determinísticos para inputs idênticos.

A matriz anterior de 40 testes pertence às imagens identificadas no registro
anterior, não é uma nova execução nesta entrega. Nenhum resultado real de
OCR/tradução ou novo teste de qualidade foi produzido. Os 18 findings OS,
memória operacional, assinatura/proveniência e revisão humana continuam abertos;
nenhum waiver, VEX ou redução do orçamento cloud foi aplicado.

## Verificação desta parcela

As provas ARM64/x86_64 passaram a partir das cópias readonly, sem alteração dos
recibos ou do JAR anterior. Contextos SHA-256:
ARM64 `93e8481d4998dabeeefc276528426d051542c1e1c32cdcea7746603deefb2ca0`;
x86_64 `b1797474f43ac66f45edfcc54119f86bd68c5798a6e1f0b333d41b01daebe4aa`.

| Alvo           | Worker local do empacotador versionado                                    | Bytes, `image inspect Size` |
| -------------- | ------------------------------------------------------------------------- | --------------------------: |
| ARM64          | `sha256:01a3e852b484c28db2adf624c8d353500189d64985524c4e658e044874ba80ec` |                 351.215.231 |
| x86_64 emulado | `sha256:96b2bbad14e3f184525b5dfd4c224fdbae38beb8f3fe062d6a5b1ed35b02c900` |                 352.823.393 |

Build clássico sem pull/rede/instalação, memória 1 GiB e CPU 1; os dois preflights
retornaram `admitted-not-operational`, zero imagens/providers. Ambos têm sete
camadas; a primeira corresponde ao rootfs filtrado. Conferência readonly/sem
rede/512 MiB: Java Ubuntu 25.0.4.1, UID 1000, certificados presentes, cópia/hook
Temurin ausentes, todos os modos disabled. Essa prova de bootstrap não é
profiling nem prova do pipeline completo no orçamento de 512 MiB/1 GiB.

O primeiro comando diagnóstico de build omitiu os pins ao usar nomes incorretos
de ARG. O preflight rejeitou; log preservado e somente o container intermediário
parado desse build foi removido. Os nomes foram corrigidos em outro destino;
nenhum validador foi enfraquecido. O retorno do preparador agora fornece os
nomes exatos em `buildArguments`. Avisos de builder legado foram preservados.

Gates desta execução:

- 13 testes novos de política/prova/contexto, incluindo regressão Unicode e
  checksum idêntico ao preparar os mesmos inputs em destinos diferentes;
- tooling completo: 127 testes aprovados, um skip opt-in, zero falhas;
- Maven global offline com Docker: sete módulos `SUCCESS`, 2.741 testes,
  zero falhas/erros, 103 skips opt-in, 7min05s; gateway incluído;
- web `tsc -b`, `pnpm check` mobile integral: 116 suítes/892 testes,
  SDD, links, lint/FSD, type-check e formatação aprovados, sem reinstalação;
- links relativos do gateway, Prettier direcionado e diff do gateway aprovados.
  Diff global segue vermelho pelo baseline externo em
  `web/landing-page/src/shared/component/PlatformBadge.tsx:44`, sem correção alheia.

A matriz nativa de 40 testes e os scans do registro anterior não foram
reexecutados nem atribuídos às imagens desta parcela. O runtime/JAR/codec
permanecem os mesmos; não se afirma nova cobertura de segurança ou de qualidade.

Snapshot técnico novo: **407 arquivos**, SHA-256
`c20bee55bc54f45e828ab7cd8dceb40b67e77492a9b328fb2a705c1b7afb2aab`.
Escopo: `src/`, `scripts/`, `openapi/`, `pom.xml`, `.tf`/`.tfvars.example` diretos
de `infra/terraform/`; ordenar caminhos relativos e concatenar caminho + NUL +
bytes completos + NUL antes de SHA-256. Docs, Dockerfiles, target e arquivos
privados ficam fora; os hashes dos contextos cobrem o Dockerfile copiado.
O hash histórico de 402 arquivos foi preservado como fotografia anterior.
O checksum mobile não é cobertura do tooling JavaScript nem do código Java;
não foi renovado, pois nenhum arquivo mobile foi alterado.

## Próximo trabalho, sem aprovação presumida

1. Auditar headers PAX/xattrs/ACLs/capabilities e distribuição/proveniência;
   o comando atual permanece limitado aos registros capturados selados.
2. Completar a triagem de segurança residual, sem supressões automáticas ou
   instalações novas não autorizadas.
3. Dimensionar memória agregada no ambiente alvo antes de qualquer ativação;
   os picos históricos maiores que 2 GiB não admitem o teto cloud de 1 GiB.
4. Fechar qualidade/revisão e validação operacional antes da decisão da 020.

Não fecha a 020, não abre a 021 e não autoriza ativação de uploads/deploy.
