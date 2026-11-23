# Revisão de admissão: tempo de vida e acesso à imagem COS

Data: 2026-10-17. Continuação da
[recuperação parcial](worker-isolation-staging-recovery-2026-10-17.md).
020 continua `in-progress/open`; 021 bloqueada. Nenhum recurso criado, grant,
troca de identidade, instalação, upload, provider ou reserva nova. Não é
aprovação de boot, isolamento do worker, qualidade ou faturamento.

## 1. Correção de uma pendência descrita incorretamente

O resumo anterior chamou o limite de execução da VM de controle ainda não
implementado. A leitura do código atual contradiz isso:

- `mount-requests.498LRD/requests.mjs` já inclui `maxRunDuration.seconds="600"`,
  `instanceTerminationAction="DELETE"` e `automaticRestart=false` no request
  canônico. O hash do corpo é ligado ao journal, não acrescentado após validação.
- `requests.test.mjs` confere esses valores e recusa aumento do prazo.
- `mount-binding.NIN2si/binding-v2.mjs` exige o mesmo schedule no snapshot;
  as regressões anteriores rejeitam prazo removido e `STOP` no lugar de `DELETE`.
- Boot disk tem `autoDelete=true`; **data disk tem `autoDelete=false`**. Não há
  expiração automática de custom image/staging demonstrada por esse schedule.

O controle já estava nos fontes pinados e coberto pelas execuções anteriores;
não foi implementado nesta revisão. O erro estava no resumo corrente, corrigido
com registro explícito. Não renovar o checksum técnico como se houvesse patch.

O [contrato oficial de tempo de vida](https://docs.cloud.google.com/compute/docs/instances/limit-vm-runtime)
documenta término por duração/horário e admite atraso para iniciar stop/delete.
Não interpretar 600 segundos como faturamento máximo observado ou garantia de
retirada de todos os recursos. Mantêm-se as premissas conservadoras do
[suplemento de custo](worker-isolation-cost-supplement-2026-10-17.md), inclusive
retirada de discos/imagem e soft delete; o envelope ainda é provisório.

## 2. Consulta real delimitada

Usada a autorização continuada para preparação somente leitura com a identidade
existente. Tooling privado em `.local/worker-isolation/mount-admission-review.2jzG0J/`.
Primeira tentativa terminou inconclusiva antes de qualquer request Compute/
Resource Manager: identidade e SDK conferidos, obtenção do token não confirmada.
Diagnóstico local sanitizado encontrou recusa de acesso a arquivo do cache de
credenciais. Não houve pedido de login, credencial impressa ou troca de conta.
Não foi alegado que a atividade OAuth interna do CLI tivesse sido auditada.

Tentativa separada, após revisão da execução fora do sandbox para permitir
acesso normal ao cache existente, começou às **16:58:26 UTC** e terminou às
**16:58:29 UTC**. Token só em memória; sem chave exportada ou resposta IAM bruta
persistida. Não sobrescreveu a primeira evidência nem reiniciou recurso cloud.

| GET autorizado                             | Resultado observado                                             | O que não comprova                                               |
| ------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| Projeto `toonlira-rm`                      | 200, ACTIVE e número correspondente ao hash fixado              | Não comprova IAM em cada recurso futuro                          |
| Imagem COS antes                           | 200, pin `cos-125-19216-739-5`, ID `3332869554998116417`, READY | Metadata não comprova uso para boot ou segurança                 |
| `images.getIamPolicy`, versão solicitada 3 | **403**                                                         | Nega inspeção dessa política; não prova negação de `useReadOnly` |
| Mesma imagem depois                        | 200, identidade/configuração retornada igual                    | Não converte a política não observada em autorização             |

O [método oficial](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/getIamPolicy)
é GET sem body; não muda políticas. As quatro requisições foram executadas uma
vez cada, sem fallback/override/retry. A identidade corresponde ao hash anterior,
TLS/proxy/credential overrides passaram no guard e os manifests do SDK ficaram
intactos. Isso não significa que o cache normal de tokens não tenha sido usado.

O 403 está preservado como `image-policy-unconfirmed`, não reparado com grant,
nova conta, outra imagem ou API adicional. A imagem pertence ao projeto Google
`cos-cloud`; não pedir papel administrativo no projeto do aplicativo como se
isso concedesse automaticamente leitura da política de outro projeto.

## 3. Observação de política não é autorização efetiva

`policy.mjs` mantém apenas versão, contagens e flags sobre bindings públicos do
papel `roles/compute.imageUser`. Membros privados e expressões não são retornados.
Binding condicionado nunca vira grant incondicional; política vazia não prova
ausência nem acesso. Mesmo uma fixture pública positiva mantém
`effectiveUseProven=false`, `authorizesBoot=false` e `operationalApproved=false`.
Nenhuma política real foi parseada com sucesso nesta tentativa, pois houve 403.

Este diagnóstico reduz as opções de inspeção, mas não elimina a verificação de
acesso para uma operação nativa autorizada. Não repetir a mesma leitura esperando
que prove boot; não habilitar Policy Troubleshooter ou ampliar IAM automaticamente.
O teste IAM vazio anterior continua inconclusivo e com data própria.

## 4. Segurança e decisões restantes

A [revisão COS anterior](worker-isolation-vm-security-2026-10-13.md) permanece
aberta. A consulta pública atual ao
[advisory Moby](https://github.com/moby/moby/security/advisories/GHSA-7cfq-22r6-qp73)
continua apontando correção upstream em 29.8.2; as
[release notes do milestone pinado](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m125)
não demonstraram novo backport do finding 92543 na pesquisa. Ausência de menção
não é auditoria de todos os patches/binários. Não executar pull com credencial
ou tratar o ensaio sem Docker/JRE como aprovação do worker completo.

Próximo trabalho: fechar revisão delimitada da prova mínima e o envelope de
custo/retirada, preservando schedule já existente, namespace privado, ausência
de SA/IP externo e admissão explícita. Fonte GCS/importação e comportamento
nativo ainda precisam ser demonstrados. A autorização financeira continua
US$ 5 **total**; não foi consumido novo slot nem consultada fatura nesta etapa.

## 5. Integridade e verificação local

| Evidência privada                                       | SHA-256                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| Primeira inspeção sem requests Compute/Resource Manager | `f8cabf329b33e1bc708f3fabba93fd6645703c1f5daf07ab9d5d732f7293c7b8` |
| Diagnóstico local sanitizado                            | `d848428f95b0a664e4a4752a3f64a46befee57761a38ac132764c65b335e952c` |
| Tentativa de quatro GETs, IAM 403                       | `9e5366f6cfc0ee92f90f0b64c2bb117713c7dade1ee465228565f798df985e0a` |

83 testes dirigidos passaram: quatro novos de resumo/prazo e 79 regressões
existentes de requests/binding. Fixtures são sintéticas; não são testes de
boot. A suíte integral anterior de 741 conserva sua data e não cobre os quatro
casos posteriores. Não somar execuções sobrepostas como casos disjuntos.

Runtime, migrations, defaults, imagens e auditoria de performance permanecem
intactos. Maven/web/mobile/SDD não foram reexecutados nem redatados por este
diagnóstico. O fechamento abaixo não altera a execução histórica de 741 casos.

## Fechamento dirigido — 17:03:36 UTC

`mount-admission-review.2jzG0J/verify.mjs` terminou com exit 0: 83 testes em três
arquivos, sem falhas, cancelamentos, skips ou TODOs; duração 265 ms. São quatro
casos novos e 79 regressões, não uma nova suíte integral. O verificador não usa
credenciais/rede: valida separadamente os recibos das consultas reais anteriores.

Recibo privado exclusivo `verification.json`, SHA-256
`05c9ee37d48a3187dee2ddc16d781c79bb316ecface222e5d8c25eddfc62e84c`.
TAP completo em `tests.tap`; cinco fontes/testes/verificador têm hashes no recibo.
Conferidos 173 links relativos, sintaxe, Prettier dirigido e diff do escopo.
Os 419 paths/bytes técnicos do gateway permanecem com SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Essa fotografia não cobre Dockerfile, mobile, documentos ou tooling privado.
Recibos/fontes anteriores pinados e ledger com duas reservas permanecem intactos.

O diff global preserva o EOF alheio de `PlatformBadge.tsx:44`; nenhum ajuste de
frontend ou performance. A instabilidade de paralelismo padrão e os gates
operacionais continuam abertos. Este fechamento documental foi acrescentado
após o recibo e reconferido à parte, sem sobrescrita ou nova consulta cloud.
