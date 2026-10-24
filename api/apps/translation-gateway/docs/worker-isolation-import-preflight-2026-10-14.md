# Importação privada do runtime — pré-flight documental, 2026-10-14

**Pesquisa pública e checklist; nenhum import, upload ou recurso criado.**
Continua a [integração local de montagem](worker-isolation-prepull-mount-2026-10-13.md).
Ruan pediu continuar. Foram lidas documentação oficial e tabelas públicas;
nenhuma consulta autenticada ao projeto, ADC/CLI, grant ou chamada OCR/tradução.
020 `in-progress/open`, 021 bloqueada; defaults, disco e performance preservados.

## 1. Caminho candidato e o que permanece hipótese

[Images create](https://docs.cloud.google.com/sdk/gcloud/reference/compute/images/create)
admite archive tar gzip de dados RAW. A
[API images.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/insert)
aceita `rawDisk.source` com URL de Storage e `containerType=TAR`, e exige
`compute.images.create`. A intenção é usar o control plane direto, sem o
importador/Cloud Build, helper VM, tradução de SO ou pacotes novos.

O arquivo local tem somente `disk.raw`, ext4 de dados sem partição/bootloader,
hash e readback já registrados. **Suporte documental não comprova aceitação
desse archive exato**. Sua importação precisa terminar `READY` e ser conferida
antes de criar qualquer VM diagnóstica. Erro não autoriza fallback para importador,
IAM amplo, filesystem diferente ou reconstrução silenciosa.

Não marcar `UEFI_COMPATIBLE`, adicionar guest features ou chamar isso de disco
de boot: COS continua sendo a imagem de inicialização separada. RAW de 1 GiB
não será crescido/reformatado no host para facilitar a montagem.

## 2. Tamanho mínimo e custos adicionais

A [tabela oficial de Persistent Disk](https://docs.cloud.google.com/compute/docs/disks/add-persistent-disk)
informa mínimo **10 GiB para pd-standard zonal**. Portanto, a candidatura deve
orçar um **disco auxiliar provisionado de pelo menos 10 GiB**, além do boot disk
de 10 GiB. Nem 191 MiB locais alocados nem 1 GiB lógico são tamanho faturável
presumido do disco cloud. Attachment deve ser `READ_ONLY` e `boot=false`.

[Preços de discos/imagens](https://cloud.google.com/compute/disks-image-pricing)
cobram espaço de disco provisionado, usado ou não; custom image também tem custo
de armazenamento. O tamanho restaurado pode ser diferente do RAW local: seu
hash integral não é automaticamente o hash do block device criado de 10 GiB.
Conferência de filesystem/conteúdo/modes é própria, sem reparo/grow no boot.

Custos a incluir, não autorizados nesta parcela:

| Item novo de entrega              | Base a confirmar antes de autorizar                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Storage Standard privado regional | Archive de 62.359.506 bytes, operações, localização, duração e soft-delete/retirada.            |
| Custom image privada              | Local de armazenamento explícito, tamanho faturável observado e duração.                        |
| Disco de dados pd-standard        | Pelo menos 10 GiB, zona da VM, duração até exclusão, não só até STOP.                           |
| Retirada/espera                   | Coleta, retries somente de cleanup autorizado, políticas de retenção e confirmação de exclusão. |

VM, boot disk, registry e Cloud DNS continuam itens adicionais da receita
anterior; sua cotação histórica não vale como teto ou aprovação atual.
Storage: [preços públicos](https://cloud.google.com/storage/pricing).
Não presumir créditos/faixa gratuita, descontos, impostos ou moeda BRL.

Na consulta pública, a página de discos iniciou em Iowa. Seletores de disco e
custom image foram alterados para São Paulo, mas os valores exibidos permaneceram
iguais aos defaults: USD 0,000054795/GiB-h e USD 0,000068493/GiB-h respectivamente.
**Não publicados como tarifa regional validada**: não foi possível atestar a
atualização dos dados da tabela, e a tarifa de disco diverge da captura regional
histórica de 12/10 (USD 0,000082192/GiB-h). Não substituir essa divergência por
um total financeiro aparentemente preciso. Cotação regional atual permanece
pendente, assim como Storage, operações e política de retenção. Nenhum Console
de faturamento, acordo, purchase ou saldo foi consultado.

## 3. IAM: responsabilidades separadas, sem grants

[Permissões Storage](https://docs.cloud.google.com/storage/docs/access-control/iam-permissions)
separam criação de bucket/objeto e leitura. A identidade que cria/consulta a
imagem e o principal efetivo que acessa seu arquivo privado precisam ser
identificados; não presumir que todo service agent ou a SA da VM precise ler
o bucket. Nenhuma identidade de importação foi validada no projeto nesta parcela.

| Responsabilidade futura       | Permissões/cuidado a conferir                                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Operador cria imagem          | `compute.images.create`, leitura da operação/imagem e políticas efetivas; labels, se usadas, têm permissão própria.                            |
| Upload privado create-only    | `storage.objects.create`, condição de geração zero e verificação posterior de tamanho/hash/generation.                                         |
| Leitura da origem pelo import | `storage.objects.get` para o principal efetivo identificado; apenas objeto/prefixo ou bucket exclusivo, conforme recurso/condições suportados. |
| Criar disco da imagem         | `compute.disks.create` e acesso de uso da imagem; conferir por recurso e API vigente.                                                          |
| Anexar disco read-only        | Permissões da instância/disco, mode explícito e identidade imutável; source ainda não preenchido na proposta local.                            |
| Retirada                      | Permissões de delete apenas para alvos exatos criados e autorizados; não iniciar limpeza de recursos existentes.                               |

É checklist, não proposta de conceder todos esses papéis. Não criar custom role,
conceder Storage Admin/Compute Admin ou papel de service agent a pessoa/SA por
conveniência. Caso os direitos existentes bastem, não criar grant novo.

Bucket de staging será exclusivo, privado, acesso uniforme e public access
prevention enforced. Sem URL assinada/token em metadata ou reutilização de OCR.
Sem overwrite de objeto durante importação; registrar geração/hash, manter origem
até confirmação e não repetir mutação ambígua. Nenhum comando mutante preparado
como execução imediata neste checklist.

## 4. Próxima consulta, sujeita à confirmação de credencial

Proposta de **somente leitura** no projeto `toonlira-rm`, com credencial existente:

- Confirmar projeto, APIs Compute/IAM/Storage, SDK disponível e service agents
  existentes, sem login, impersonação nova ou instalação de componente.
- Consultar IAM do projeto e testar a lista explícita de permissões do operador;
  `testIamPermissions` é POST semanticamente de leitura, não grant ou create.
- Registrar somente resultados sanitizados e hashes; não imprimir tokens,
  credencial, política IAM integral ou dados pessoais dos principals.

Não incluir upload, download de objetos privados, criação de bucket/imagem/
disco/VM/DNS, enable API, grant, chamada de provider ou consulta de saldo.
Não testar permissão por uma mutação de verdade. API/permissão ausente vira
pendência. Essa consulta não comprovará importação ou boot nem autorizará seus
custos. Segurança JRE/COS/DNS permanece gate separado.

## 5. Estado e verificação local

| Gate                                | Estado atual                                                               |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Pacote/launcher local               | Preparados e testados anteriormente; inalterados nesta pesquisa.           |
| RAW direto e disco de dados         | Caminho documentado candidato; archive exato ainda não aceito pelo Google. |
| Mínimo pd-standard                  | Validado documentalmente: 10 GiB zonal.                                    |
| IAM efetivo/principal de importação | Pendente de consulta autorizada; nenhum grant.                             |
| Tarifas regionais e custo total     | Pendentes; divergência da UI pública registrada, sem teto aprovado.        |
| Provisionar/upload/boot             | Bloqueados até escopo, segurança e aprovação financeira próprios.          |

Às **05:10 de Brasília**, os mesmos 61 testes Node locais passaram, zero failures/
skips; sem providers ou novos testes de importação cloud. Conclusões de 13/10
preservadas, sem novo scan ou prova COS. Não reexecutar/redatar Maven/web/mobile/
SDD por essa pesquisa sem fontes/contratos/status alterados. Documentos serão
conferidos por links, Prettier direcionado e diff-check; falhas globais alheias
ficam separadas. Nenhum cache pesado ou arquivo de performance alterado.

Fechamento local: 25 links relativos conferidos, Prettier direcionado e
diff-check do gateway aprovados. Hashes da cloud-config montada, recibo de disco
e binding do runtime iguais aos registros de 13/10. Diff-check global mantém
somente o EOF externo em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`;
arquivo não corrigido por esta parcela. Aba temporária de preços públicos
fechada; seletor São Paulo ainda mostrava os valores defaults, mantidos como
divergência/inconclusão, não cobrança observada. Próxima consulta autenticada
permanece aguardando confirmação explícita de uso da credencial existente.

Após Ruan responder «Sim», a [consulta autorizada de IAM/APIs foi concluída](worker-isolation-import-iam-2026-10-14.md),
com SDK/IAM mantidos, APIs ativas e agente Compute existente. Teste no projeto
retornou 23 de 29 permissões; seis de Storage precisam do contexto do recurso,
não são justificativa para grant. Erro local de argumentos do papel foi
preservado e corrigido em recibo separado. Nenhum recurso, upload, instalação
ou mudança IAM. Cotação, identidade efetiva de import, aceitação do archive
e prova COS continuam pendentes; a autorização foi apenas de consulta.

Na continuação, a [cotação regional e a receita privada](worker-isolation-import-recipe-2026-10-14.md)
resolveram a divergência de preços por leitura dos dados regionais públicos,
sem credenciais. Staging, imagem, disco e VM ficaram separados em parcelas com
retirada e autorizações próprias. Nenhum upload/recurso; aceitação RAW, leitura
privada pelo importador e segurança/boot continuam pendentes.
