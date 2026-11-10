# Consulta somente de leitura do gateway — 2026-10-29

Ruan autorizou a inspeção de bucket e scheduler existentes. Como não indicou
outro ambiente, foi usada a configuração isolada histórica do projeto
`toonlira-rm` e a região `southamerica-east1`, identificadas no
[plano anterior](worker-isolation-cloud-plan.md). Isso não identifica todos os
projetos possíveis nem autoriza criar recursos, habilitar APIs ou publicar.

Com Cloud SDK 590.0.1 e uma cópia temporária privada da configuração existente:

- `gcloud storage buckets list --project=toonlira-rm --format=json` terminou com
  sucesso. Havia um bucket no projeto, mas não o nome previsto pelo Terraform,
  `toonlira-rm-translation-gateway-temporary`, nem outro nome contendo
  `translation-gateway`. Os metadados do outro bucket não foram registrados.
- `gcloud scheduler jobs list --project=toonlira-rm --location=southamerica-east1`
  com filtro do gateway falhou com `SERVICE_DISABLED` para
  `cloudscheduler.googleapis.com`. A presença ou ausência de jobs não foi
  determinada; a API não foi habilitada.

Não foi possível inspecionar as políticas do bucket esperado, permissões ou
execução do scheduler. Nenhum objeto foi acessado e nenhum recurso foi alterado;
a cópia temporária da configuração e credenciais foi removida. O recibo
sanitizado em `.local/worker-isolation/repro-020-2026-10-26/`
`cloud-readonly-2026-10-29/result.json` tem SHA-256
`7545ff0184fc999f59d9f252f94c7d3ce49ea3a4bb5229390350d192f57f7e42`.
O recibo resume a observação e não contém dados da conta nem metadados do outro
bucket. TASK-006/008 e o status `in-progress` permanecem abertos.
