# Entrega privada nas consultas — plano anterior ao código

Parcela da 020/TASK-006/AC-005. Não abre a 021, não baixa arquivos no mobile,
não usa credenciais e não modifica defaults, task interna ou manifesto OCR.

## Banco escolhido

PostgreSQL para estado, ownership e metadados; bucket privado para arquivos.
Assinatura e consulta de metadata do storage ficam fora de transação de banco.

## Modelo BCNF

Reutilizar V1–V6: `processing_jobs.id`/`job_ref` determinam instalação,
dimensões e estado; `(job_id, stage)` determina hashes/chaves/tamanho da imagem
e conclusão do render. Projeção estreita owner-scoped junta essas duas tabelas,
exigindo `READY` e `RENDERING/SUCCEEDED`. Não duplicar tamanho do manifesto:
ele será observado pelo adapter de storage e limitado a 4 MiB.

## Integridade e índices

Preservar PKs, FK cascade, CHECKs de artefatos V6 e UNIQUE de job/idempotência.
Buscar pelo `job_ref` único, conferir instalação e usar a PK `(job_id, stage)`;
nenhum índice redundante. A projeção bloqueia o job durante o snapshot curto.
Se um ACK ocorrer entre leitura do estado e projeção, reler o estado em vez de
inventar resultado. Validar novamente dimensões, chaves e hashes em domínio.

## Derivados e migration

Nenhum contador/cache novo, texto remoto ou URL em banco. Nenhuma V7.
Coordenar porta, JDBC, casos de uso, DTO, OpenAPI, parser existente e testes.
Validar cadeia V1–V6, isolamento e plano SQL em PostgreSQL 17.

## Contrato e segurança

As duas consultas GET recebem `result` somente em READY:

```json
{
  "manifestVersion": "1.0",
  "widthPx": 100,
  "heightPx": 200,
  "expiresAt": "2026-10-04T13:00:00Z",
  "image": {
    "url": "https://storage.googleapis.com/...",
    "mimeType": "image/webp",
    "byteSize": 1024,
    "sha256": "...",
    "expiresAt": "2026-10-04T12:05:00Z"
  },
  "manifest": {
    "url": "https://storage.googleapis.com/...",
    "mimeType": "application/json",
    "byteSize": 2048,
    "sha256": "...",
    "expiresAt": "2026-10-04T12:05:00Z"
  }
}
```

O envelope mantém versão 1.0 e oito rotas. `serverTime` nas consultas é o
instante da resposta, não o timestamp da última mudança do job. GET READY
exige os dois artefatos; assinatura desabilitada ou objeto inválido falha com
503/storage-unavailable, nunca URL fictícia ou par parcial. Respostas de
mutação/replay continuam podendo omitir `result`; a aquisição futura usa GET.
Cada URL dura no máximo 300 segundos e nunca além do prazo do resultado,
calculado pela conclusão de render e retenção válida de até uma hora.

Snapshot inicial → assinatura fora de transação → novo snapshot owner-scoped
com TTL → comparar referências e validar prazos/metadados → resposta no-store.
Falha de assinatura também reconsulta: ACK/TTL confirmado retorna expired sem
URLs; READY ainda disponível retorna erro sanitizado, sem causa. Não há retry
explícito nem nova chamada OCR/tradução. Não logar DTO/URL/chaves.

O ACK pode acontecer depois da última conferência. URLs já emitidas não têm
revogação instantânea garantida; validade curta e exclusão durável limitam essa
janela. Hash declarado não comprova bytes baixados: essa validação é da 021.

## FSD e performance mobile

Estender apenas o contrato em `entities/remote-processing-attempt/model`,
com schema estrito, limites por artefato/URL e coerência de estado/prazos.
Não criar slice, UI, download, cache ou persistência de URLs. A entidade é dona
do envelope; consumers usam sua API pública já existente. Duas URLs limitadas
a 8192 caracteres, sem mídia/texto materializados, acrescentam trabalho
limitado de validação. Não alegar medição nativa ou ganho de performance.

## Verificação

Testes primeiro: owner incorreto/ACK/TTL/falha durante assinatura, alteração de
referência, metadata inválida, disabled, nenhuma transação durante I/O, contratos
GET e ausência de URLs nos demais estados; parser e regressões existentes.
Gates globais offline/Docker, mobile completo, web type-check, SDD, links,
formatação direcionada e diff-check. Retenção terminal integral e distribuição
do codec continuam parcelas abertas da 020, não cobertas por este incremento.
