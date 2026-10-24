# IAM e APIs da entrega privada — 2026-10-14

**Consulta autorizada somente leitura, concluída; importação não executada.**
Continua o [pré-flight documental](worker-isolation-import-preflight-2026-10-14.md).
Ruan respondeu «Sim» ao uso da credencial existente apenas para consultar IAM,
APIs e service agents do `toonlira-rm`, sem grants, recursos ou arquivos enviados.
020 `in-progress/open`; 021 bloqueada. Defaults/performance preservados.

## 1. Resultados observados

Consultas entre **05:37:59–05:40:50 de Brasília**. Parcela privada/ignorada
`import-iam.JFh6Fu`; onze ações registradas, dez validadas e uma recusa local de
argumentos do SDK, resolvida em recibo separado. Nenhuma mutação solicitada.

| Item                  | Observado                                                                          | Limite                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Projeto               | `toonlira-rm`, ACTIVE.                                                             | Não reserva recursos nem comprova cobrança/billing.                                          |
| Credencial            | Mesma fonte previamente conferida, sem impersonação/override; validação TLS ativa. | Cache/refresh usuais do CLI podem ocorrer; não houve login ou ADC novo.                      |
| APIs                  | Compute, IAM, Storage e Service Usage habilitadas; 52 APIs na lista.               | Nenhuma habilitada/desabilitada por esta consulta.                                           |
| IAM do projeto        | Dez bindings, zero bindings públicos; hash igual antes/depois.                     | Não prova bucket privado futuro, IAM deny/políticas de recurso ou sucesso de import.         |
| Compute Service Agent | Binding existente não condicionado para `roles/compute.serviceAgent`.              | Não criar/reutilizar SA por pressuposição; principal efetivo de import ainda não comprovado. |
| Papel Compute         | GA; 102 permissões, incluindo `storage.objects.get`.                               | Presença no papel é capacidade declarada, não prova de acesso ao objeto privado específico.  |
| Google APIs Agent     | Binding existente para `roles/compute.instanceGroupManagerServiceAgent`.           | Nenhum papel concedido ou removido. Não tratar como principal de import automaticamente.     |
| Contas listadas       | Três na listagem, zero desabilitadas.                                              | Listagem comum não comprova presença/ausência de todos os agentes gerenciados Google.        |
| SDK/IAM               | Manifests do SDK e IAM mantidos; sem instalação ou grant.                          | Não renova scan CVE nem valida runtime/COS.                                                  |

Hash de IAM antes/depois:
`bd92ef9e6bdb05eebb8aafd45e0759b86289914d74686095b6cb0563dd0d1ab9`.
Hash dos manifests SDK:
`b41ae1c25a4626cfed1e0a50877af1e831e6988ccea0d4d666174fd9187109d3`.
São fotografias de metadata, não hash dos binários ou auditoria de segurança.

## 2. Teste de permissões: interpretar o escopo correto

Um POST semanticamente somente leitura à API Resource Manager
`projects/toonlira-rm:testIamPermissions` solicitou 29 permissões e retornou 23.
Incluiu criação/leitura/remoção/uso de imagem e disco, operações, attach/metadata,
consulta IAM/APIs e criação/remoção de bucket. **Testar essas permissões não
autoriza executar nenhuma delas.**

Seis não retornadas: `storage.buckets.get`, `storage.buckets.getIamPolicy`,
`storage.buckets.setIamPolicy`, `storage.objects.create`, `storage.objects.get`
e `storage.objects.delete`.

O campo `missing` nos recibos significa **não retornado nesta consulta de
projeto**, não diagnóstico conclusivo de falta de acesso em bucket/objeto.
Não conceder Storage Admin ou outro papel a partir desse resultado. As
[orientações IAM](https://docs.cloud.google.com/iam/docs/testing-permissions)
direcionam testes ao método de cada recurso; o
[teste IAM de bucket Storage](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/testIamPermissions)
avalia permissões no bucket específico. Não foi feita essa consulta, pois o
bucket exclusivo de staging ainda não existe. Não usar OCR/site para substituir
o alvo pretendido ou testar permissão criando objeto de verdade.

Logo: **pré-flight de projeto observado, acesso ao recurso e identidade de
importação ainda pendentes**. O papel existente do agente é uma pista para
desenho mínimo, não autorização de grant, impersonação ou prova do canal.

## 3. Recusa local corrigida e proteção da evidência

A chamada inicial tinha `roles/compute.serviceAgent` junto de `--project`.
O SDK 583.0.0 existente, em `GetRoleName`, recusa essa combinação antes da
requisição de papel; papéis pré-definidos usam `roles/...` sem parent custom.
Código do SDK foi apenas lido, não modificado/instalado ou executado como
helper próprio. A correção foi somente remover esse flag nessa consulta global
de definição de papel, sem mudar projeto das demais consultas.

`preflight.json`/ações originais permanecem intactos. `completion.json` vincula
o hash da tentativa inicial e contém a conclusão; nenhuma mutação ou chamada
cobrada de provider foi repetida. Não alegar que a primeira consulta teve êxito.

Token foi obtido pelo CLI autorizado e mantido apenas em memória para o POST
IAM; descartado após a consulta. Nunca persistido em argumentos, stdout final,
recibo ou logs HTTP próprios. Credenciais/política IAM integral/e-mails privados
não foram copiados para os artefatos. Erros receberam códigos sanitizados.
CLI sem prompts/update check/telemetria/file logging; SDK mantido.

## 4. Recibos e verificações

| Artefato privado         | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `preflight.json` inicial | `c243e1a859dd5019abff5dfaebf14a49e34f23201675e7dbacb1fb7e51825b73` |
| `completion.json`        | `35168530ba3b328fc5fa8365436fabf0ec8519b1cc9e4383a4ac3f4efe886043` |
| `inspect.mjs`            | `fabc90b44867c24c983664b47bec74c2028c29315362f1e243c680502078c96a` |
| `finish.mjs`             | `e214b3086d555061c64658f409d5f662136a1a92d3834bebd925ca1ce3141912` |
| Sanitização JS           | `1876566b8d6fadbc1effb4cc3d4bf6a675ebc13d44911505561189a87c1a31fe` |
| Testes sintéticos        | `39f5903bbe4f9dd05db78abbdaae6aa33fb71004d3e4f5e135358b139cdb4077` |

Cinco testes novos cobrem classificação sem identidades, condições/publicidade,
limite da listagem de contas, permissões solicitadas e formas inválidas. Red
antes do sanitizador; **66 testes Node locais aprovados**, zero failures/skips,
incluindo regressões anteriores. Testes não usam credenciais ou rede.

Scan local dos quatro recibos/logs de ações não encontrou padrões de token,
Bearer ou chave privada. Não é auditoria exaustiva. Comandos registrados são
somente leitura; sua repetição futura não dispensa autorização de credencial.
Nenhum Storage bucket/objeto lido, imagem enviada, VM/disco/DNS criado, grant,
API enable, provider, instalação ou limpeza cloud. Não tocar performance.

Maven/web/mobile/SDD não redatados por tooling local e documentação sem alterar
fontes/contratos/estado. Verificar links, Prettier e diff-check direcionados;
falhas globais alheias devem permanecer separadas.

## 5. Próximo passo

Fechar cotação regional e a receita mínima de staging privado/imagem/disco
10 GiB, com identidade de leitura e retirada explícitas, mantendo o desenho
RAW direto como candidato. A aceitação do archive e o acesso no recurso
precisarão de prova própria quando houver alvo autorizado, sem fallback de
Cloud Build, IAM amplo ou filesystem alterado.

Não criar o bucket ou conceder papéis agora. Nova ação que instale, gere custo,
publique/envie arquivos ou provisione exige confirmação delimitada. Segurança
JRE/COS/DNS, boot/systemd/montagem e isolamento da 020 permanecem gates abertos;
consulta IAM não promove 020, libera 021 ou habilita uploads.

Fechamento local: 28 links relativos nos três documentos conferidos,
Prettier direcionado e diff-check do gateway aprovados. Os bytes dos 419
arquivos da fotografia técnica mantêm
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Global mantém o EOF alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`; não corrigido.
Mac reportava 27 GiB livres, sem downloads/caches grandes ou arquivos de
performance removidos. Nenhum gate global foi redatado como aprovado.
