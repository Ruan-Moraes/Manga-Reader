# Importação de imagem de dados: preparação local — 2026-10-14

**Código de observação e testes entregues; nenhuma imagem cloud criada.**
Continua a [prova privada de staging](worker-isolation-private-staging-2026-10-14.md).
O turno anterior foi progresso: upload/integridade e retirada ativa reais.
Nesta continuação, o objetivo completo da renderização permanece ativo;
preparação offline não é substituto para admissão operacional da 020.
020 `in-progress/open`, 021 bloqueada. Runtime/defaults/performance intocados.

## 1. Pendências normativas revalidadas

Spec/tasks/review atuais mantêm TASK-002/006/007/008 abertas. F-020-01..04
separam segurança residual, admissão/orçamento no serviço alvo, distribuição
operacional e qualidade/revisão humana. Não promover a 020 a partir de um
bucket privado ou fixture de importação. Nenhuma lacuna de código será
reclassificada como mera ausência de benchmark.

Há fonte/codec/worker/retenção implementados anteriormente e provas locais;
esta parcela não implementa renderer alternativo, provider, schema ou feature
mobile. A importação é preparação diagnóstica para testar o ambiente candidato,
não consumo da imagem por uma VM ou decisão de operação.

## 2. Limite novo de contrato: geração da origem

A [API images.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/insert)
documenta RAW, origem como URL de Storage, container TAR, localização da imagem
e UUID de requisição. Não declara um campo próprio de geração do objeto nem
documenta explicitamente seleção por query/fragment nesse URL. A leitura do
SDK 583.0.0 existente mostrou que `images/create.py` entrega o resultado do
parser de URI ao campo `rawDisk.source`; isso não prova que o serviço remoto
consumirá uma geração selecionada.

Não copiar o suporte de `generation` do Cloud Build para esse contrato. Não
publicar URL pública/assinada, tornar objeto público, usar SHA-1 depreciado como
binding SHA-256 ou trocar para importador/Cloud Build automaticamente.

O candidato preserva **`?generation=<geração>`** no URL HTTPS de um objeto com
nome derivado do hash, em bucket exclusivo. Aceitação dessa query pelo importador
e leitura exata da geração continuam hipóteses. Não remover a query como
fallback silencioso. Mesmo um eco idêntico de URI em metadata e `READY` não
prova os bytes do filesystem: conferência de conteúdo/topologia em disco ainda
terá sua parcela própria. `sourceGenerationSelectionVerified=false` e
`filesystemVerified=false` permanecem explícitos.

## 3. Implementação local entregue

Pacote ignorado: `image-import.aX3g1r`; apenas JavaScript, sem dependências novas.

- `makePlan`: projeto/região fixos, RAW/TAR, sem família/guest features/KMS,
  nonce/UUID e hash/tamanho exatos, source privado/conferido. Cópias defensivas
  e congelamento recursivo; não aceita opção de projeto, URI arbitrária ou alias.
- Summaries: validam IDs/labels, nascimento, resource link, localização e tamanho.
  Não copiam principal, statusMessage, erro bruto, texto ou credencial do provider.
- `observe`: recebe **portas de leitura**, não client Google. Operation ID,
  request UUID e target ID devem corresponder; faz polling limitado, com reads
  de até 10 s, espera de até 5 s e orçamento de até 10 min/120 polls.
- DONE com erro não vira sucesso. READY exige imagem própria/ID correto e
  conferência posterior da geração/tamanho/hash metadata da origem. Metadata
  declarativa não substitui SHA-256 do readback anterior ou prova do filesystem.
- Perda de ACK, timeout, cancelamento e falha de observação mantêm a origem;
  não repetem create nem afirmam que a operação cloud parou. O mesmo handle
  deve ser retomado numa consulta autorizada futura, não numa nova criação.
- Retirada: produz somente candidato por nome/UUID após identidade e estado
  terminal; exige nova leitura antes de executar. Não executa delete. A
  [API images.delete](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/delete)
  não fornece precondição atômica por ID: conferir ID não elimina o intervalo
  leitura→delete. Não inventar `ifImageIdMatch` ou claim de proteção equivalente
  à generation precondition de Storage. Colisão/drift impede retirada.

Cap de inspeção: imagem restaurada até 10 GiB e archive até 1 GiB. São limites
locais de admissão desta prova, **não enforcement de custo antes do create**.
Uma imagem observada acima deles é finding; sua retirada exige identidade
própria, não contornar a validação para aprovar a candidata.

Não foi criado transport autenticado/mutante ou runner de produção. Uma futura
execução precisa compor staging com o helper de corpo vazio corrigido, journal
create-only, preflight, create uma vez e leitura/retirada autorizadas. Não
executar `run.mjs` histórico de staging para iniciar rodada nova ou repetir
uma tentativa cujo resultado foi ambíguo.

## 4. Testes, fixture e hashes

Dezesseis testes novos, red antes de implementação. Três regressões adicionais
reproduziram: geração da origem alterada depois de DONE; HTTP error com lista de
erros vazia; cancelamento durante leitura que antes liberava a origem. Todas
corrigidas no tooling antes de nova validação. Uma inserção de guard no escopo
errado gerou ReferenceError local, corrigida e revalidada; não houve efeito cloud.

**99 testes Node locais aprovados**, zero failures/skips, incluindo regressões
anteriores. Os 16 novos usam portas sintéticas, não autenticação ou rede.

```bash
node --test .local/worker-isolation/image-import.aX3g1r/import.test.mjs
```

`prepare.mjs --offline-fixture` verificou o archive local real por SHA-256 e
exercitou observação com imagem/operação/bucket/geração **simulados**. Gravou
`fixture.json` create-only, com `fixtureOnly=true`, `notExecutable=true`,
zero recursos e aprovação operacional false. O `ready-observed` da fixture
não é READY observado no Google. Não sobrescrever a fotografia para datá-la
novamente; usar pacote/diretório novo quando necessário.

| Artefato                    | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Código de import/observação | `c04940ac7e9f7c8c22a75d9ea92ddb607e49760ec5b5ef9c23b928b769856f15` |
| Testes sintéticos           | `45606e27400e62b7b8e248d33359d78c3d92291e9554c2550ea9afb2a4366502` |
| Preparador offline          | `b1449760504de3ba78c35297cf0920f804f63a15054a8e8252e125c3aeef672e` |
| Fixture local               | `7906ebda682995b68228113dfa36cd551c93ca37fc815b0c4e2dc32c5128c57a` |

`verification.json` vincula esses arquivos à conclusão real anterior de staging
(`d92f1c92…4656`) sem mudar seus recibos. Os mesmos 419 arquivos da fotografia
técnica mantêm `1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Esse escopo não cobre Dockerfile/mobile ou substitui auditoria CVE.

## 5. Próxima ação e autoridade necessária

Proposta ainda não executada: uma rodada nova com bucket privado/um archive,
**uma tentativa** de custom image regional de dados usando a query candidata,
observação e retirada dos alvos próprios; sem disco, VM, DNS, registry, provider,
grant, enable API ou instalação. Falta de acesso/aceitação vira finding, sem
fallback ou permissão ampla. Não restaurar o bucket anterior.

A [cotação pública de 14/10](worker-isolation-import-recipe-2026-10-14.md) fornece
USD 0,00010274/GiB-h para custom image. Cenário de 24 h com imagem faturável de
1 GiB, somado ao staging/readback/soft-delete anteriormente estimados: cerca
de **USD 0,011**; com imagem de 10 GiB: cerca de **USD 0,033**. Não é teto, fatura
ou preço da conta. Taxas/serviços preexistentes/tamanho real são desconhecidos.
Operação pendente após timeout não autoriza apagar sua origem; pode manter
custo até resolução/retirada. Orçamento da VM continua separado.

Precisam ser aprovados uso da credencial, novo upload e create/retirada de
imagem. Esta continuação geral não aprova essas mutações. A meta permanece
ativa e a 020 aberta; qualidade geral e ambiente operacional não concluídos.
Nenhuma credencial, arquivo enviado, imagem cloud, scan novo ou instalação
nesta parcela. Só pesquisa pública, leitura do SDK existente e trabalho local.
Maven/web/mobile/SDD não reexecutados/redatados por esse tooling sem alteração
de runtime/status; performance preservada.

Fechamento: 30 links relativos nos dois documentos conferidos, Prettier dos
três fontes/testes e dois documentos, whitespace/EOF e diff-check direcionado
do gateway aprovados. Global mantém somente o EOF externo observado em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`; não corrigido.
Mac reportava 24 GiB disponíveis. Esta parcela criou apenas tooling/JSON/docs
pequenos, sem download/cópia pesada; não atribuir a diferença global de espaço
a este trabalho ou limpar arquivos de performance de outro trabalho.
