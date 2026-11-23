# Mapa consolidado de cobertura dos requisitos Mobile

> Documento informativo. Mapeia requisitos de produto para specs existentes ou
> planejadas. Uma spec planejada não existe normativamente e não pode receber
> tasks até ser criada `draft`, aprovada por uma pessoa e ter gate aberto.

## Fontes consideradas

Foram considerados integralmente os documentos `01` a `10` do pacote
`toonlira-mobile-requisitos-completos`, além de `mobile/AGENTS.md`, specs,
decisions, baselines, registry, coverage, código em `mobile/app` e `mobile/src`, e
contratos relevantes de `/api` e `/web` usados apenas como contexto.

## Status do mapa

| Status                 | Significado                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `DONE`                 | Coberto por Target Spec implementada.                            |
| `VERIFICATION_PENDING` | Código executado, mas evidência real exigida segue aberta.       |
| `READY_FOR_SPEC`       | Requisitos e dependências suficientes para criar a próxima spec. |
| `APPROVED_GATE_OPEN`   | Target Spec aprovada e liberada para tasks/implementação.        |
| `APPROVED_BLOCKED`     | Target Spec aprovada aguardando dependência normativa.           |
| `BACKLOG`              | Capacidade planejada, ainda aguardando dependências anteriores.  |
| `BLOCKED`              | Decisão/contrato externo necessário antes da spec ou execução.   |
| `DEFERRED`             | Deliberadamente posterior à validação do núcleo.                 |
| `OUT_OF_SCOPE`         | Não pertence ao produto Mobile prioritário desta evolução.       |

## Foundation e comportamento existente

| Requisitos/capacidade                     | Contrato                       | Milestone | Status               | Observação                                          |
| ----------------------------------------- | ------------------------------ | --------- | -------------------- | --------------------------------------------------- |
| SDD, baseline ≠ target, gates e evidência | MOB-DEC-001..004; MOB-BASE-001 | M0        | DONE                 | Paridade brownfield verde.                          |
| Tema, acessibilidade e design system      | MOB-FEAT-001/002/009/011       | M1        | DONE                 | RNF-ACC-\*, RNF-UX-004/005 parcialmente realizados. |
| Idioma da interface e i18n trilíngue      | MOB-FEAT-003                   | M1        | DONE                 | Não confundir com idioma da tradução local.         |
| Idiomas de conteúdo da plataforma         | MOB-FEAT-004                   | M1        | DONE                 | Contrato distinto de RF-LNG-\*.                     |
| Leitor de capítulos publicados            | MOB-FEAT-005                   | M1        | VERIFICATION_PENDING | Matriz física iOS/Android aberta.                   |
| Privacidade/settings/data controls        | MOB-FEAT-006..008              | M1        | DONE                 | Não equivale à política de mídia remota.            |
| Guest entry e shell                       | MOB-FEAT-010                   | M2        | DONE                 | Shell será parcialmente substituído por 012.        |

## Requisitos funcionais do núcleo

| Grupo de requisitos                                           | Spec(s)                                            | Milestone | Status               |
| ------------------------------------------------------------- | -------------------------------------------------- | --------- | -------------------- |
| RF-IMP-001..003; RF-MED-001..005                              | MOB-FEAT-012 Local Media Import Draft              | M2        | IMPLEMENTED          |
| RF-IMP-004..008                                               | MOB-FEAT-013 Import Review and Ordering            | M2        | IMPLEMENTED          |
| RF-LNG-001/002; RF-LNG-004..006 (seleção)                     | MOB-FEAT-014 Translation Language Selection        | M2        | IMPLEMENTED          |
| RF-VAL-001..005; RF-SEC-005..008                              | MOB-FEAT-015 Media Validation                      | M2        | IMPLEMENTED          |
| RF-INC-001                                                    | MOB-FEAT-016 Translation Project and Page State    | M3        | VERIFICATION_PENDING |
| RF-PRV-001..005; RF-THD-001..004; RF-RET-001..003             | MOB-FEAT-017 Remote Processing Consent and Gateway | M3        | APPROVED_GATE_OPEN   |
| RF-TRN-001..008                                               | MOB-FEAT-018 Multilingual OCR and Regions          | M3        | APPROVED_BLOCKED     |
| RF-TRN-009..019; RF-LNG-003..006 (processamento)              | MOB-FEAT-019 Contextual Language-pair Translation  | M3        | APPROVED_BLOCKED     |
| RF-TRN-021..026                                               | MOB-FEAT-020 Visual Translation Rendering          | M3        | APPROVED_BLOCKED     |
| RF-RDR-001/002/009; UX-RDR-001..006                           | MOB-FEAT-021 Local Translation Result Reader       | M3        | APPROVED_BLOCKED     |
| RF-INC-002..004/007/009/010; RF-TRN-012; RF-CST-004           | MOB-FEAT-022 Incremental Processing Scheduler      | M4        | BACKLOG              |
| RF-INC-005/006; UX-PRG-001..005                               | MOB-FEAT-023 Processing Progress UX                | M4        | BACKLOG              |
| RF-INC-008; RF-RES-001..004; RF-CST-001..003                  | MOB-FEAT-024 Page Failure and Retry                | M4        | BACKLOG              |
| RF-RDR-003/004                                                | MOB-FEAT-021/022/023                               | M3–M4     | BACKLOG              |
| RF-LIB-001..010; UX-LIB-001..005; UX-DEL-001..003             | MOB-FEAT-025 Local Translation Library             | M5        | BACKLOG              |
| RF-OFF-001..004; RF-RDR-005/006; UX-HOME-002..004; UX-LIB-006 | MOB-FEAT-026 Offline Reading and Resume            | M5        | BACKLOG              |
| Persistência/upgrade/recovery                                 | MOB-FEAT-027 Local Data Migration and Recovery     | M5        | BACKLOG              |
| RF-RDR-007/008; RF-EDT-001..006; UX-EDT-001..004              | Original Compare + Region Editing                  | M6        | BACKLOG              |
| RF-FBK-001..004                                               | Translation Feedback                               | M6        | BACKLOG              |
| RF-TRN-016..018                                               | Work Glossary                                      | M6        | BACKLOG              |
| RF-TRN-020                                                    | Onomatopoeia evolution                             | M10       | DEFERRED             |
| RF-LNG-007; RF-RDR-010; RF-TRN-008                            | Language detection/Vertical Reader expansion       | M10       | DEFERRED             |

## UX, navegação e estados

| IDs                                 | Capacidade/spec               | Milestone | Status                   |
| ----------------------------------- | ----------------------------- | --------- | ------------------------ |
| UX-HOME-001; UX-GEN-001/005/006/008 | MOB-FEAT-010 + 012            | M2        | PARTIAL / READY_FOR_SPEC |
| UX-IMP-001..005                     | MOB-FEAT-012                  | M2        | IMPLEMENTED              |
| UX-REV-001..005                     | MOB-FEAT-013                  | M2        | IMPLEMENTED              |
| UX-LNG-001..004                     | MOB-FEAT-014                  | M2        | IMPLEMENTED              |
| UX-PRG-001..005; UX-GEN-002/007     | MOB-FEAT-023                  | M4        | BACKLOG                  |
| UX-RDR-001..007                     | MOB-FEAT-021 + Quality specs  | M3/M6     | APPROVED_BLOCKED         |
| UX-LIB-001..006                     | MOB-FEAT-025/026              | M5        | BACKLOG                  |
| UX-EDT-001..004                     | Region Editing                | M6        | BACKLOG                  |
| UX-DEL-001..003                     | MOB-FEAT-025                  | M5        | BACKLOG                  |
| UX-ONB-001/002                      | Onboarding/Privacy disclosure | M3/M8     | BACKLOG                  |
| UX-GEN-003/004                      | MOB-FEAT-024                  | M4        | BACKLOG                  |

## Conta, identidade, quota e abuso

| IDs                                                    | Spec/capacidade                     | Milestone | Status                           |
| ------------------------------------------------------ | ----------------------------------- | --------- | -------------------------------- |
| RF-ANO-001; RF-AUT-002; RF-ACC-011/012; UX-IDN-001/002 | MOB-FEAT-010 e política guest-first | M2        | DONE                             |
| RF-ANO-002/003/005; RF-QTA-001..015; UX-QTA-001..005   | Anonymous Identity + Usage Quota    | M7        | BACKLOG                          |
| RF-ANO-004; RF-MIG-001..006; RF-ACC-004; RF-DVC-003    | Account Upgrade/Merge               | M7        | BACKLOG                          |
| RF-AUT-001/003..007; RF-ACC-001..006; UX-IDN-003..005  | Auth/account optional after value   | M7        | PARTIAL / BACKLOG                |
| RF-ACC-007..009                                        | Account Deletion                    | M7/M8     | BACKLOG                          |
| RF-ABU-001..008                                        | Abuse Protection                    | M7        | BLOCKED até contrato server-side |
| RF-DVC-001/002; RF-ACC-010; RF-MIG-006                 | Multi-device/sync                   | M10       | DEFERRED                         |

## Monetização e sustentabilidade

| IDs                                               | Capacidade                            | Milestone | Status   |
| ------------------------------------------------- | ------------------------------------- | --------- | -------- |
| RF-MON-001..007; RF-MON-023..031; RF-MON-061..064 | Free tier/cost measurement/protection | M7–M9     | BACKLOG  |
| RF-MON-008..012/019/020/035..040/043/044/053..055 | Credits/consumption/compensation      | M9        | DEFERRED |
| RF-MON-013..018/032..034/041/042/045/046/056..060 | Subscription/paywall/fair use         | M9        | DEFERRED |
| RF-MON-021/022/024..030/064                       | Economic analytics                    | M8–M9     | BACKLOG  |
| RF-MON-047..052                                   | Promotions/referral/expiration        | M10       | DEFERRED |

Nenhum preço, quantidade de páginas ou modelo comercial é assumido antes de
baseline real de custo, falha, uso e retenção.

## Privacidade, segurança e copyright

| IDs                                               | Spec/capacidade                                              | Milestone | Status                       |
| ------------------------------------------------- | ------------------------------------------------------------ | --------- | ---------------------------- |
| RF-MED-001..005                                   | MOB-FEAT-012                                                 | M2        | READY_FOR_SPEC               |
| RF-PRV-001..005; RF-THD-001..004; RF-RET-001..003 | MOB-FEAT-017 + Provider Privacy                              | M3/M8     | APPROVED / PENDING EXECUTION |
| RF-PRV-006..008; RF-DEL-001..003                  | MOB-FEAT-025/026                                             | M5        | BACKLOG                      |
| RF-DEL-004..007                                   | Account Deletion/Support diagnostics                         | M7/M8     | BACKLOG                      |
| RF-LOG-001..004; RF-PRV-009..011                  | Privacy-safe Observability/Analytics                         | M8        | BACKLOG                      |
| RF-SEC-001..013                                   | Gateway, validation, auth, incident and provider kill switch | M3/M7/M8  | PARTIAL / BACKLOG            |
| RF-CPR-001..006/008; RF-CNT-002/004/005/008       | Product scope/terms/release gate                             | M2/M8     | DECIDED / BACKLOG            |
| RF-CPR-007; RF-PRV-018/021; RF-DEL-007            | Export/backup/support evolution                              | M10       | DEFERRED                     |
| RF-CNT-001/003/006/007/009; RF-CPR-009/010        | Terms, audience, AI disclosure and editing                   | M6/M8     | BACKLOG                      |
| RF-PRV-012..017/019/020                           | Privacy policy, Data Safety and contextual consent           | M3/M8     | BACKLOG                      |

## Analytics, qualidade e aprendizado

| IDs                                         | Spec/capacidade                       | Milestone | Status                    |
| ------------------------------------------- | ------------------------------------- | --------- | ------------------------- |
| NSM-001; MET-FUN-001..012; MET-ACT-001..003 | Event Registry + Product Analytics    | M2–M8     | BACKLOG                   |
| MET-PER-001..006                            | Pipeline/reader performance telemetry | M3/M4/M8  | BACKLOG                   |
| MET-ERR-001..004                            | Processing and release errors         | M3/M4/M8  | BACKLOG                   |
| MET-RET-001..008                            | Library/continuation retention        | M5/M8     | BACKLOG                   |
| MET-QLT-001..009                            | Quality Benchmark/Feedback            | M6/M8     | BACKLOG                   |
| MET-CST-001..009                            | Cost Analytics                        | M7–M9     | BACKLOG                   |
| MET-PRV-001..004                            | Analytics Privacy                     | M8        | BACKLOG                   |
| MET-EXP-001                                 | Experiment Registry                   | M8+       | DEFERRED até amostra útil |

## Google Play e release

| IDs                              | Spec/capacidade                   | Milestone | Status                  |
| -------------------------------- | --------------------------------- | --------- | ----------------------- |
| RF-PER-001..006                  | MOB-FEAT-012                      | M2        | READY_FOR_SPEC          |
| RF-PER-007                       | Permission/Manifest Audit         | M8        | BACKLOG                 |
| RF-PLY-001..009; RF-API-001/002  | Android Identity/Build/App Access | M8        | BACKLOG                 |
| RF-DAT-001..004; RF-PRP-001..005 | Privacy Policy/Data Safety        | M8        | BLOCKED pelo build real |
| RF-PLY-010..016; RF-LST-001..011 | App content/Listing/Policy review | M8        | BACKLOG                 |
| RF-TST-001..006                  | Internal/closed/device matrix     | M8        | BACKLOG                 |
| RF-QLT-001..004; RF-REL-001..011 | Release Gate/rollout/containment  | M8        | BACKLOG                 |

Requisitos temporais da Play devem ser revalidados em fonte oficial na spec de
release; este mapa não congela API target nem regra de testes.

## Requisitos não funcionais transversais

| IDs              | Aplicação planejada                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------ |
| RNF-GEN-001..003 | Todo AC relevante define evidência; não inventar metas antes de baseline.                  |
| RNF-PER-001..014 | Startup/first value/memória/rede distribuídos entre 012, 017, 022, 026 e Release Gate.     |
| RNF-STA-001..006 | Page State, Retry, Library e Migration/Recovery.                                           |
| RNF-AVL-001..003 | Offline Reading and Resume.                                                                |
| RNF-RES-001..010 | Gateway, Page State, Scheduler, Retry e Recovery.                                          |
| RNF-SEC-001..010 | Import/validation, gateway server-side, auth, dependency/license audit.                    |
| RNF-PRV-001..004 | Consent, logs, analytics e release artifact audit.                                         |
| RNF-SCL-001..006 | Gateway/queue, cost control e expansão de idiomas.                                         |
| RNF-STO-001..007 | Library, Offline e Migration/Recovery.                                                     |
| RNF-CMP-001..008 | Android matrix, i18n e layouts das specs visíveis.                                         |
| RNF-ACC-001..006 | Todos os fluxos visíveis, com testes automáticos e matriz física proporcional.             |
| RNF-MNT-001..007 | SDD, FSD, APIs públicas e decisões próximas à mudança.                                     |
| RNF-TST-001..013 | Evidência por risco, integração de fronteiras, poucos E2E críticos e fixtures autorizadas. |
| RNF-OBS-001..008 | Event Registry, pipeline traces e release observability.                                   |
| RNF-REL-001..006 | Build/ambiente/rollout/backward compatibility.                                             |
| RNF-UX-001..005  | Progresso, erro acionável, design system e tema em toda spec visível.                      |

## Benchmark e estratégia

| Hipótese/direção                               | Destino                                             |
| ---------------------------------------------- | --------------------------------------------------- |
| H-COMP-001 incremental reduz frustração        | M4; medir TTFV e stall.                             |
| H-COMP-002 PT-BR superior aumenta confiança    | M3/M6; benchmark autorizado.                        |
| H-COMP-003 feedback acelera aprendizado        | M6.                                                 |
| H-COMP-004 poucos idiomas com qualidade        | M3 primeiro; expansão M10.                          |
| H-COMP-005 páginas são unidade comercial clara | M7/M9, após dados.                                  |
| H-COMP-006 conta opcional aumenta ativação     | Já orienta M2; medir em M8.                         |
| H-COMP-007 URL import só após validar fricção  | M10/DEFERRED.                                       |
| H-MON-001..005                                 | M9, condicionadas a custo/retenção/qualidade reais. |

## Próximo handoff SDD

```text
MOB-FEAT-014
→ status atual: verification-pending
→ implementado: `zh-Hans`, `zh-Hant`, 42 pares e migration v6

MOB-FEAT-017
→ status atual: approved
→ implementation_gate: open
→ blocked_by: [MOB-FEAT-016]
→ próximo handoff: executar tasks sem aplicar cloud sem aprovação externa
```

`MOB-FEAT-016` continua aguardando somente a restauração em Android físico após
encerramento forçado. `MOB-FEAT-017` está aprovada e aberta; `MOB-FEAT-018..021`
também são Target Specs aprovadas, mas permanecem bloqueadas sequencialmente até
as dependências anteriores serem implementadas ou entrarem em verificação.
