# Tasks — MOB-FEAT-019, revisão volátil

- Spec aprovada: `spec.md`, direção de Ruan em 2026-11-01.
- Estado no planejamento: `approved/open`, abertura sequencial em 2026-11-02.
- Dependência 018: `verification-pending`, após revisão independente, provas da
  candidata 4 e gate documental. A autorização está na DEC-008.
- Backend externo permanece fora do workflow mobile. Esta etapa verifica sua
  integração vigente e só altera mobile se houver lacuna comprovada de contrato.

## Rastreabilidade

| Critério | Tasks                                  | Evidência planejada                                                               |
| -------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-005                     | 42 pares representáveis, somente habilitados, endpoint/modelo explícitos          |
| AC-002   | TASK-002, TASK-006                     | documento contextual único, IDs/ordem preservados; benchmark de coerência         |
| AC-003   | TASK-001, TASK-003                     | Hans/Hant distintos em request, resultado, fixtures e contrato local              |
| AC-004   | TASK-002, TASK-004                     | IDs/payload/texto hostis falham integralmente sem render                          |
| AC-005   | TASK-004, TASK-005                     | vazio sem chamada, indisponibilidade/interrupção sem avanço/cancelamento fictício |
| AC-006   | TASK-002, TASK-004, TASK-005, TASK-007 | limite completo 30000 codepoints, sem persistência/retry e só primeira página     |

## Checklist

- [x] TASK-001 — Conferir matriz direcional, capability/par ativo e contrato global general/translation-llm, sem troca silenciosa de origem/destino/modelo.
- [x] TASK-002 — Conferir documento contextual completo e orçamento incluindo HTML/marcadores; validar exatamente os IDs e limites antes do renderer, sem truncar/dividir ou fallback.
- [x] TASK-003 — Conferir códigos Hans/Hant e contratos locais de regiões/tradução, sem promover aquisição 021 bloqueada.
- [x] TASK-004 — Conferir zero chamada no vazio, falhas/timeout/replay/retorno tardio e ausência de conteúdo em persistência/logs.
- [x] TASK-005 — Executar testes focados do adapter/codec/validator/use case e validar provas privadas atuais de SDK/HTTP/render; registrar evidência, revisão independente, coverage, drift e checksum.
- [ ] TASK-006 — Concluir benchmark de naturalidade, contexto e nomes próprios com referências/revisão humana independente, incluindo variantes chinesas e pares habilitados; não inferir qualidade de gRPC sintético.
- [ ] TASK-007 — Conferir política publicada, limites/práticas atuais do provider e configuração/admissão operacional antes de ativação pública.

## Arquivos prováveis e plano de dados

- Gateway: TranslationPort, CloudTranslationAdapter, TranslationEnvelopeCodec,
  TranslationValidator, ConfiguredTranslationPairs, factory/config e use case volátil.
- Mobile: contrato de manifesto/regiões e persistência já existente, somente se
  a análise apontar lacuna nesta fronteira. Nenhuma aquisição/reader 021 agora.
- Não há persistência de conteúdo no servidor ou migration prevista: textos são
  valores limitados em memória; recibos de metadados pertencem à 017. Migração
  local futura exige plano próprio antes do código.
- Não autoriza provider pago, mídia de usuário, novo recurso cloud ou deploy.
  As provas são locais, com fixtures sintéticos e SDKs em loopback privado.

## Gates e limites

Testes focados no reactor `api/`, raiz backend se houver mudança real, e
`pnpm specs:check` para governança. Runtime mobile exige `pnpm check` completo.
TASK-006/007 são verificações reais; não podem mascarar código faltante.
`verification-pending` exige código/testes técnicos e revisão independente
concluídos, sem transferir aceites de etapas anteriores ou da candidata antiga.

## Resultado técnico em 2026-11-02

Revisão independente confirmou a correção dos fences antes de cada etapa.
Candidata 5: HTTP máximo8/7, matriz nativa8/22, visual9/9 e raiz backend2859
testes sem falhas/erros;115skips opt-in executados separadamente quando
aplicáveis. TASK-006/007 permanecem abertas; não constituem código ausente.
Ver [evidência específica](evidence/volatile-contextual-verification-2026-11-02.md).
