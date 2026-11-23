# Auditoria de implantação cloud — 2026-09-07

## Escopo

Verificar a prontidão do projeto Google Cloud associado ao Firebase para a
implantação fail-closed do Translation Gateway, sem criar recursos faturáveis e
sem habilitar upload remoto.

## Evidências

- Google Cloud CLI `583.0.0` instalado e autenticado pelo operador.
- Projeto `toonlira-rm` localizado com estado `ACTIVE`.
- O projeto retornou `billingEnabled: false`.
- Nenhuma conta de faturamento ativa ficou disponível para vinculação pela conta
  autenticada.
- `terraform fmt -check -recursive` passou.
- `terraform validate` passou fora do sandbox, onde os providers locais puderam
  iniciar normalmente.
- O exemplo de variáveis mantém `gateway_enabled = false` e ainda exige uma
  imagem imutável real.

## Resultado

Nenhum `terraform plan` ou `apply` foi executado: as APIs e os recursos previstos
incluem Cloud Run, Cloud SQL, Cloud Storage, Cloud Tasks e Artifact Registry, que
não devem ser criados sem billing ativo e revisão de custos. Além disso, o
`worker_url` não pode ser preenchido porque o worker de OCR, tradução e
renderização pertence a `MOB-FEAT-018..020` e ainda não existe no repositório.

## Próximo gate

1. O operador cria ou disponibiliza uma conta de faturamento e a vincula ao
   projeto `toonlira-rm`.
2. Implementar `MOB-FEAT-018..020` para produzir uma imagem e URL reais do
   worker.
3. Construir/publicar imagens imutáveis, executar `terraform plan` e revisar os
   custos antes do primeiro `apply` com `gateway_enabled = false`.

## Continuação após ativação do billing

O operador ativou o faturamento no mesmo dia. Nova consulta confirmou
`billingEnabled: true`, e as Application Default Credentials foram configuradas
com o projeto de quota `toonlira-rm`.

O primeiro `terraform plan`, ainda sem `apply`, resultou em **40 recursos a
criar**, incluindo Cloud SQL PostgreSQL 17 zonal `db-custom-1-3840`, Cloud Run,
dois Cloud Run Jobs, Artifact Registry, Storage, Cloud Tasks, Scheduler, rede
privada, IAM, Secret Manager e Monitoring. O plano também confirmou dois gates:

- a imagem ainda é o placeholder `replace-with-immutable-image-reference`;
- o worker continua ausente e o gateway permanece `gateway_enabled = false`.

Nenhum recurso foi criado nessa rodada. Antes do `apply`, é necessário escolher
conscientemente o tier do Cloud SQL, preparar estado Terraform remoto e publicar
a imagem imutável.

### Decisão de custo

O operador considerou inviável o custo do `db-custom-1-3840`. A configuração do
alpha foi reduzida para `db-f1-micro`, sem SLA, com 10 GiB iniciais de SSD e teto
de 20 GiB para crescimento automático. A promoção para um tier dedicado fica
condicionada a carga real e decisão explícita de produção.
