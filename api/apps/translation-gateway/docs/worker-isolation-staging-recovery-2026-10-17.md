# Recuperação de staging parcial — plano e execução local

Continuação do [produtor e handoff](worker-isolation-staging-transport-2026-10-17.md).
Implementação testada localmente; não é aprovação operacional, cleanup real
ou encerramento da 020. Código em `.local/worker-isolation/mount-staging-recovery.AkMrqy/`;
fontes e recibos históricos não serão alterados. Nenhum recurso cloud será
criado/excluído nos testes, nem serão usadas credenciais ou imagens de mangá.

## Banco escolhido

PostgreSQL permanece dono do estado do produto, sem mudança de schema, entidade,
repository ou migration. Não introduzir MongoDB ou banco temporário para este
tooling. A exceção local é o store de arquivo limitado, privado, com CAS/lock de
SO/fsync do helper Java já auditado. Registro separado do journal do produtor;
nunca resetar ou editar a história de upload para permitir outra tentativa.

## Modelo lógico e integridade

- `runId → plano de staging`: nomes/projeto/archive/janela originais fixados.
- `hash do plano de recuperação → plano original, hash do snapshot parcial,
janela de cleanup e identidades observadas do bucket/objeto`: binding imutável.
- `(hash do plano de recuperação, operação) → intenção de delete e confirmação
de ausência ativa`: no máximo um DELETE por objeto/bucket, sem retry automático.

Cada determinante seria chave candidata numa representação relacional. O
snapshot local limitado é uma exceção deliberada, não uma tabela BCNF ou uma
transação distribuída com GCP. Só metadados técnicos; sem texto, mídia, tokens,
identidades IAM ou respostas brutas persistidas. Campos exatos, formato
versionado, hashes, gerações decimais sem arredondamento e datas UTC canônicas.

O snapshot original precisa conter intenção de bucket e não pode conter fonte
verificada nem handoff. O produtor deve ser uma instância conhecida, vinculada
ao plano, irreversivelmente fechada e realmente settled, inclusive operações
que ignorem abort. Isso será conferido por identidade de objeto privada, não
por um booleano fornecido pelo chamador, arquivo de lock ou relógio sem processo.
Assim, nenhum produtor legítimo ainda poderá publicar objeto/verify em paralelo.
Instâncias novas recusam as intenções existentes; o handoff recusa fonte parcial.

Após crash sem handle vivo, a ferramenta **não presume quiescência**: não há
delete automático. Inventário/manual de recuperação e comprovação externa de
que o produtor parou continuam necessários. O mesmo vale para staging verificado
ou já transferido, que precisa do protocolo de retirada do ciclo completo.

## Protocolo proposto

1. Admissão explícita de recuperação, janela própria de até 15 minutos, sinais
   e dependências explícitos. Default nega antes de arquivo, credencial ou rede.
2. Confirmar produtor vinculado/fechado/settled e snapshot parcial íntegro.
3. Observar somente o bucket exclusivo e objeto fixado; conferir projeto,
   labels, tempo de criação original, proteções e gerações já observadas quando
   presentes. Um objeto sem intenção de upload é desconhecido e bloqueia cleanup.
4. Enumerar versões sem prefixo/delimiter, em resposta limitada e completa.
   Recurso extra, página seguinte ou item incompatível bloqueia a operação;
   não limpar o bucket por varredura. Conferir bytes/SHA/MD5/MIME do objeto
   contra o archive existente, sem copiá-lo ou baixar seu conteúdo para cleanup.
5. Criar journal separado vinculado a essas observações antes do DELETE.
   Confirmar intenção durável, revalidar snapshot, admissão e recurso.
6. Excluir somente a geração de objeto fixada com precondições. Depois de GET
   404 e lista vazia, confirmar ausência ativa. Excluir bucket vazio apenas
   após nova conferência de identidade/metadados e precondição de metageneration.
7. Confirmar ausência por GET. HTTP 204 isolado não comprova cleanup; confirmação
   perdida impede outro DELETE automático. Uma reabertura só poderá confirmar
   ausência já observada, não repetir uma exclusão ambígua.

Conforme [Objects.delete](https://docs.cloud.google.com/storage/docs/json_api/v1/objects/delete),
geração e precondições de geração/metageneration podem restringir o delete.
[Buckets.delete](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/delete)
oferece precondição de metageneration, não de geração do bucket; releituras não
são garantia atômica contra um administrador externo recriar o nome. Essa
limitação fica explícita, sem parâmetro inventado. A admissão operacional
deverá considerar o namespace exclusivo e quem pode alterá-lo.

[Objects.list](https://docs.cloud.google.com/storage/docs/json_api/v1/objects/list)
permite enumerar versões e informa paginação; não tratar resposta incompleta
como vazia. Ausência ativa não encerra soft delete, retenção ou cobrança.

## Índices, derivados e migration

Sem índice, contador, cache ou migration. Acesso direto por rodada/operação;
nenhum índice redundante ou replicação do banco de negócio. Helpers antigos
permanecem pinados. Implementação coordenada: wrapper de posse, política/plano,
journal de recuperação, transporte HTTP restrito e testes antes do código.

## Verificação

Testes devem cobrir produtor ativo/errado/cancelamento ignorado, configuração
ausente, recurso estrangeiro, listagem incompleta, drift de geração, concorrência
de claims, falha de persistência, delete com confirmação perdida, reabertura sem
retry, ausência inicial e cleanup parcial sem upload/Compute/providers. Usar
HTTP/identidades sintéticos, archive fixado e CAS/locks reais nas integrações.
Preservar os 718 casos anteriores e seus recibos; registrar os novos resultados
separadamente. O finding do paralelismo padrão continua aberto.

Skill `database-design`: modelo e transições definidos antes do código;
PostgreSQL/migrations da aplicação, defaults, fontes/codec e performance intactos.

## Implementação local

`owner.mjs` encapsula o produtor anterior sem alterar seu fonte. Identidade da
instância e referência exata do journal são mantidas privadamente em `WeakMap`.
Uma cópia da fachada, outro journal do mesmo plano, produtor não tentado ou
operação ainda viva não comprovam término. Não depende de PID presumido ou de
um campo `quiescent=true` enviado pelo chamador.

`journal.mjs` define plano imutável e registro separado de recuperação. Usa o
helper Java existente, com CAS/lock/fsync, e não altera o snapshot do produtor.
Intenção durável de objeto/bucket é exclusiva; ausência ativa de objeto precede
intenção de delete do bucket. Reabertura mantém intenções, mesmo após confirmação
perdida. `priorPlan` explícito preserva o binding das gerações originais; não
criar plano novo para reautorizar um DELETE já tentado.

`recovery.mjs` oferece somente leituras e deletes de dois paths fixados no
endpoint Storage. Não aceita URL/caminho de objeto livre, não cria upload,
Compute, grants ou clientes Google. Arquivo de runtime é lido/hasheado, não
copiado. Resposta JSON e listagem são limitadas; paginação ou itens extras
interrompem a operação, sem varrer ou limpar outros objetos. O journal original
é reconferido, assim como o owner, antes dos efeitos.

O DELETE de objeto usa geração e precondições exatas; bucket usa somente a
precondição suportada de metageneration, com releituras e nome exclusivo. Após
timeout/resposta ambígua, não há retry de DELETE. Uma reabertura com o plano
anterior pode conferir 404, confirmar ausência e prosseguir para o próximo
recurso; se o alvo continuar presente, exige recuperação explícita e não o apaga
novamente. Nem 204 nem listagem incompleta são sucesso de cleanup.

Erros sanitizados e flags distinguem ausência ativa de remoção permanente.
`operationalApproved` e `permanentAbsenceConfirmed` permanecem falsos. Soft delete,
fatura, crash sem handle, fonte verificada/handoff e privilégios administrativos
externos não são aprovados pelo ensaio. O wrapper deve ser usado desde a criação
do produtor para oferecer a prova de posse, não adicionado depois de um crash.

## Testes e regressões

Primeira rodada dirigida: 21 casos passaram, com duas integrações que usam os
journals reais de staging/recuperação e o archive existente; HTTP/identidade/
gerações e efeitos são falsos. Rodadas posteriores reforçaram três defeitos,
todos reproduzidos red antes do fix:

- admissão vencida durante as leituras finais ainda permitia DELETE; o prazo
  agora é conferido no envio, não somente na decisão de admissão;
- owner do mesmo plano podia ser combinado com outro objeto journal; exige-se
  identidade exata do journal capturado na criação do produtor;
- `observation:null` podia passar como ausência de observação; o schema agora
  distingue propriedade omitida de valor explicitamente inválido.

Os casos adicionais cobrem source drift, metadata acima do limite, resposta
HTTP tardia/cancelada e o deadline real de dez segundos com adapter que ignora
abort. A capacidade e o handle continuam retidos até o término real, sem delete
tardio. O resultado integral está registrado no fechamento abaixo.

```bash
node --test .local/worker-isolation/mount-staging-recovery.AkMrqy/*.test.mjs
node .local/worker-isolation/mount-staging-recovery.AkMrqy/verify.mjs
```

O verificador executa toda a suíte privada com quatro arquivos simultâneos,
sem excluir testes ou ampliar timeouts. Preserva recibos/fontes anteriores,
ledger, snapshot do gateway e TAP exclusivo. Não executa Maven/web/mobile/SDD
nem os redatará com este resultado. A instabilidade registrada com paralelismo
padrão continua aberta, independentemente da execução controlada.

## Fechamento controlado — 16:50:03 UTC

`verify.mjs` terminou com exit 0: **741 testes em 62 arquivos**, sem falhas,
cancelamentos, skips ou TODOs; duração 510.427 ms, quatro arquivos simultâneos.
São os 718 casos anteriores mais 23 novos, sem alterar ou excluir os anteriores.
O timeout de dez segundos foi realmente aguardado no teste adversarial; um
adapter ignorando abort manteve a capacidade ocupada até sua resposta tardia.

Recibo privado exclusivo `mount-staging-recovery.AkMrqy/verification.json`:
`0efc9fb8a631faba7186ee173fd047e2680d9e78cd9b5eefdfcf03873a2b7555`.
TAP completo em `tests.tap`; nove arquivos novos de tooling têm seus hashes no
recibo. Produtor/helper/journals/fontes pinados anteriores e seus recibos foram
reconferidos sem mudanças. A instabilidade da execução anterior com paralelismo
padrão não foi considerada resolvida.

Conferidos sintaxe, Prettier dirigido, 167 links relativos e diff do escopo.
Ledger com duas reservas intacto, zero novas reservas; não é confirmação de
fatura ou teto cloud. A fotografia técnica do gateway permaneceu igual nos
419 paths/bytes auditados, SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Ela não cobre Dockerfile, documentos, mobile ou tooling privado. Nenhum arquivo
de performance foi alterado. O diff global preserva o EOF alheio de
`PlatformBadge.tsx:44`; Maven/web/mobile/SDD não foram redatados.

O fechamento documental foi acrescentado após o recibo e reconferido à parte.
Não houve acesso autenticado ao Google Cloud, instalação, reserva, provider,
upload ou DELETE real. A preparação nova ocupa cerca de 236 KiB, sem outra cópia
do archive. O runtime e os defaults continuam inalterados; 020 aberta e 021
bloqueada. Recuperação pós-crash sem handle, IAM COS, geração de import,
segurança, custo completo e prova nativa continuam pendentes.

## Correção posterior — limite de execução já implementado

O resumo anterior deste fechamento tratou o limite da VM como candidato ainda
não implementado. A conferência posterior do fonte canônico mostrou que isso
estava incorreto: `mount-requests.498LRD/requests.mjs` já fixa
`maxRunDuration.seconds="600"` e `instanceTerminationAction="DELETE"`, com
rejeição de drift nos testes e no binding. Nenhum controle novo foi introduzido
para corrigir este resumo. Ver a
[revisão posterior de admissão](worker-isolation-admission-review-2026-10-17.md).

O [guia da plataforma](https://docs.cloud.google.com/compute/docs/instances/limit-vm-runtime)
confirma o recurso, mas isso não é prova de término observado no COS nem hard
cap financeiro. O disco de dados tem `autoDelete=false`; imagem e staging também
precisam de retirada própria. Essas pendências permanecem, sem remover guards,
inventar campo HTTP ou substituir a admissão atual por `true`.
