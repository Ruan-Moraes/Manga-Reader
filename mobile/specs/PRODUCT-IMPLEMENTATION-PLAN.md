# Plano de implementação do produto Mobile

> Documento informativo de planejamento. Não é Target Spec, não aprova comportamento
> e não abre gate de implementação. Requisitos normativos continuam nas fontes de
> produto e, quando criadas, em `features/MOB-FEAT-*/spec.md`.

## Executive Summary

### Onde estamos hoje?

- M0 e M1 estão validados: SDD brownfield, tema, i18n, settings, FSD e launcher
  público possuem contratos e gates verificáveis.
- O fluxo guest-first já importa, persiste, revisa, ordena, valida e confirma
  mídia por `MOB-FEAT-012..016`; o gateway remoto é o próximo handoff aprovado.
- O leitor de capítulos publicados (`MOB-FEAT-005`) está em
  `verification-pending`; ele pode fornecer primitivas técnicas, mas não modela
  projetos privados de tradução nem páginas em processamento.
- Catálogo, biblioteca real, fórum e perfil da plataforma continuam escondidos e
  não fazem parte do caminho crítico do produto local-first.

### Respostas operacionais

| Pergunta                   | Resposta                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Maior gap                  | A cadeia `mídia local → OCR → tradução → renderização → estado por página → persistência` não existe.                             |
| Primeiro milestone ativo   | M2 — Guest Entry + Local Import.                                                                                                  |
| Primeiro vertical slice    | Uma imagem autorizada → validar → usar idioma de origem escolhido → traduzir ao destino escolhido → renderizar → abrir no leitor. |
| Próximo handoff executável | `MOB-FEAT-017` gateway/consentimento, aprovado com gate aberto.                                                                   |
| Caminho crítico do MVP     | Importar → revisar/ordenar → escolher idioma → processar incrementalmente → ler → retry → biblioteca → continuar offline.         |
| Caminho crítico da Play    | MVP persistente → privacidade/permissões → custo/telemetria → AAB → testes físicos/fechados → Data Safety/listing → go/no-go.     |

## Decisões consolidadas

1. **Local-first remoto:** seleção, biblioteca, resultados e leitura ficam sob
   controle local. OCR, tradução e renderização podem depender de serviço remoto,
   com consentimento contextual e comunicação honesta sobre rede.
2. **Guest-first:** conta não é gate para importar, ler biblioteca local ou
   continuar conteúdo pronto.
3. **Fronteira externa:** o Mobile consome um gateway Spring Boot separado da
   Core. O slice autoriza criar esse serviço e atualizar páginas legais do Web,
   mas não modificar catálogo, auth ou endpoints da Core.
4. **Idiomas independentes:** origem e destino são escolhas separadas por projeto.
   O conjunto aprovado é japonês, inglês, espanhol, coreano, chinês simplificado,
   chinês tradicional e português brasileiro: 42 pares direcionais diferentes.
   JA → PT-BR permanece cenário prioritário de benchmark, não restrição.
5. **Gateway aprovado:** Cloud Run/Tasks/SQL/Storage em São Paulo, Vision OCR e
   Translation LLM nos EUA, conteúdo remoto efêmero, sessão anônima e quota alpha
   conforme [`docs/translation-gateway-plan.md`](../../docs/translation-gateway-plan.md).
6. **Diferencial P0:** uma página `READY` libera o leitor enquanto as seguintes
   continuam em `PROCESSING`/`QUEUED`.
7. **Anti-features do MVP:** URL import, browser, catálogo, comunidade, fórum,
   compartilhamento público e monetização complexa permanecem fora.

“Local” não significa “100% on-device”. A copy atual que promete ausência de rede
deve ser substituída antes de qualquer processamento remoto.

## Current State

| Capacidade                               | Classificação                                    | Consequência                                                                            |
| ---------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| SDD, registry, coverage e gates          | `IMPLEMENTED_AND_SPECCED`                        | Manter paridade zero antes de cada nova spec.                                           |
| FSD, tema, i18n e settings               | `IMPLEMENTED_AND_SPECCED`                        | Fundação disponível para novos slices.                                                  |
| Guest entry e launcher                   | `IMPLEMENTED_AND_SPECCED`                        | `MOB-FEAT-010` já elimina login obrigatório.                                            |
| Jornada local de tradução                | `PARTIALLY_IMPLEMENTED`                          | Import, review, validação e projeto existem; a copy remota ainda deve ser reconciliada. |
| Leitor da plataforma                     | `PARTIALLY_IMPLEMENTED`                          | Reuso apenas por API pública e após reconciliar o domínio local.                        |
| Auth/sessão/Core atual                   | `IMPLEMENTED_BASELINE_ONLY` para o produto local | Conta segue opcional e isolada da biblioteca local.                                     |
| Home/Library/Forum/Profile da plataforma | `PLACEHOLDER`                                    | Não promover rotas ou copy a requisitos do produto local.                               |
| Import/review/language/validation        | `IMPLEMENTED_AND_SPECCED`                        | Sete idiomas, 42 pares e migration v6 possuem evidência automatizada.                   |
| OCR/tradução/renderização                | `NOT_IMPLEMENTED`                                | Exige gateway externo, privacidade e benchmark.                                         |
| Incremental/retry                        | `NOT_IMPLEMENTED`                                | Exige máquina de estado e idempotência próprias.                                        |
| Biblioteca/offline                       | `NOT_IMPLEMENTED`                                | Projetos participam do storage; resultados e progresso local ainda não.                 |
| Analytics/observabilidade                | `PARTIALLY_IMPLEMENTED`                          | Há preferência de privacidade, mas não instrumentação real.                             |
| Android release                          | `NOT_IMPLEMENTED`                                | Nome/package temporários e ausência de EAS/listing.                                     |

## Product Target

```text
abrir
→ traduzir do dispositivo sem login
→ selecionar e revisar páginas
→ ordenar e escolher origem → destino independentemente
→ consentir com processamento remoto quando necessário
→ primeira página READY
→ começar a ler
→ próximas páginas continuam
→ salvar localmente
→ fechar e continuar depois, inclusive offline para o que está pronto
```

O produto P0 não inclui catálogo remoto, comunidade ou sincronização cloud. Uma
falha de página é localizada; resultados concluídos permanecem válidos; retry não
duplica resultado, processamento ou consumo.

## Milestones

### M0 — SDD Bootstrap

- **Prioridade/status:** P0, `VALIDATED`.
- **Objetivo:** manter baselines, decisions, registry, coverage e skills SDD
  íntegros.
- **Contratos:** `MOB-DEC-001..004`, `MOB-BASE-001..009` e RNF-MNT-004/005,
  RNF-TST-009.
- **Validação:** `pnpm specs:check` com zero arquivos descobertos, mismatch e
  undocumented.

### M1 — Mobile Foundation

- **Prioridade/status:** P0, `VALIDATED`.
- **Objetivo:** app, providers, tema, i18n, settings, FSD, UI e launcher prontos
  para M2.
- **Specs:** `MOB-FEAT-001..011`.
- **Pendência isolada:** executar a matriz física exigida por `MOB-FEAT-005` para
  promovê-la de `verification-pending`; isso não bloqueia o import local.

### M2 — Guest Entry + Local Import

- **Prioridade/status:** P0, `VALIDATED` (import/review/idiomas/validação
  entregues; projeto/página segue em verificação física isolada no M3).
- **Objetivo:** guest seleciona, revisa, remove, reordena e confirma mídia sem
  login.
- **Specs planejadas:** `MOB-FEAT-012..015`.
- **Requisitos principais:** RF-IMP-001..008, RF-VAL-001..005, RF-LNG-001/002,
  RF-MED-001..005, RF-PER-001..006 e UX de Home/import/review/language.
- **Resultado:** draft privado e ordenado pronto para processamento, sem sucesso
  fictício.
- **Validação:** picker real, cancelamento, acesso parcial/revogado, múltiplas
  imagens, cópia privada, review e mensagens localizadas.
- **Bloqueadores externos:** nenhum.

### M3 — Single-page Translation Proof

- **Prioridade/status:** P0, `NOT_STARTED`.
- **Objetivo:** uma página real autorizada percorre validação, OCR compatível
  com o idioma de origem, regiões, ordem, tradução contextual para o destino
  escolhido, render e chega a `READY`.
- **Specs planejadas:** `MOB-FEAT-016..021`.
- **Requisitos:** RF-TRN-001..015, RF-TRN-021..026, RF-INC-001 e RNFs de
  segurança, privacidade, timeout, memória, testabilidade e observabilidade.
- **Resultado:** primeiro teste real de valor com usuário.
- **Validação:** fixtures autorizadas reproduzíveis por escrita/par prioritário,
  IDs preservados ponta a ponta, texto horizontal e vertical quando aplicável,
  resultado legível e original recuperável.
- **Gates de execução real:** projeto Google Cloud/billing, publicação e revisão
  das URLs legais reservadas, disclosure versionado e política do provider;
  operador/contato já estão definidos e o benchmark mínimo continua gate de
  promoção de qualidade.

### M4 — Incremental Multi-page Reader

- **Prioridade/status:** P0, `NOT_STARTED`.
- **Objetivo:** primeira página libera leitura, próximas continuam e falhas ficam
  isoladas.
- **Specs planejadas:** `MOB-FEAT-022..024`.
- **Requisitos:** RF-INC-002..010, RF-RDR-001..004/009, RF-RES-001..004 e
  RF-CST-001..004.
- **Resultado:** `P1 READY`, `P2 PROCESSING`, `P3 QUEUED` com prioridade próxima
  à posição do leitor.
- **Validação:** atualização dinâmica, saída/retorno à tela de progresso, retry
  individual e páginas concluídas preservadas.

### M5 — Local Library + Offline Continuity

- **Prioridade/status:** P0, `NOT_STARTED`.
- **Objetivo:** persistir projetos, páginas prontas, estados e progresso.
- **Specs planejadas:** `MOB-FEAT-025..027`.
- **Requisitos:** RF-LIB-001..010, RF-OFF-001..004, RF-RDR-005/006 e RNF-STO-\*.
- **Resultado:** fechar/reabrir preserva obra e posição; leitura pronta funciona
  offline.
- **Validação:** migrations locais, escrita interrompida, upgrade, remoção
  confirmada, storage medido e recuperação sem perda silenciosa.

### M6 — Quality + Editing

- **Prioridade/status:** P1, `NOT_STARTED`.
- **Objetivo:** original/compare, edição, feedback, glossário e benchmark.
- **Specs futuras:** Original Compare, Region Editing, Translation Feedback,
  Work Glossary e Quality Benchmark.
- **Requisitos:** RF-RDR-007/008, RF-EDT-_, RF-FBK-_ e RF-TRN-016..020.
- **Gate:** M5 recorrente validado; não investir em glossário avançado antes da
  continuidade local.

### M7 — Identity, Quotas + Cost Control

- **Prioridade/status:** P0 antes de beta pública, `NOT_STARTED`.
- **Objetivo:** identidade anônima, quota, proteção contra abuso, migração para
  conta opcional e kill switch.
- **Specs futuras:** Anonymous Installation Identity, Usage Quota, Abuse
  Protection, Account Upgrade/Merge e Account Deletion.
- **Requisitos:** RF-ANO-_, RF-QTA-_, RF-ABU-_, RF-MIG-_, RF-ACC-_ e RF-AUT-_.
- **Gate:** limite e idempotência server-side são obrigatórios antes de exposição
  externa; conta continua posterior ao valor.

### M8 — Production Readiness

- **Prioridade/status:** P0 contínuo, fechamento depois de M5/M7.
- **Objetivo:** privacidade, telemetria segura, performance, release e Play.
- **Specs futuras:** Event Registry, Privacy-safe Analytics, Crash/ANR
  Observability, Android Identity/Build, Permission Audit, Privacy Policy/Data
  Safety, E2E/Device Matrix, Store Listing e Release Gate.
- **Resultado:** go/no-go auditável e build AAB testado.

### M9 — Monetization

- **Prioridade/status:** P2, `DEFERRED`.
- **Gate:** custo médio/P95, falhas, consumo, retenção e disposição a pagar com
  baseline real.
- **Escopo futuro:** free tier definitivo, modelo pago simples, billing,
  compensação de falha e fair use.

### M10 — Competitive Expansion

- **Prioridade/status:** P1–P3, `DEFERRED`.
- **Escopo candidato:** idiomas adicionais aos sete iniciais, variantes regionais
  além de `zh-Hans/zh-Hant`, webtoon, URL import, browser, sync e tradução premium.
- **Gate:** hipótese e evidência de usuário; comunidade e social permanecem P3.

## Feature Specs Required

| ID planejado | Título                                | Objetivo                                                                        | Depende de    | Gate inicial                    |
| ------------ | ------------------------------------- | ------------------------------------------------------------------------------- | ------------- | ------------------------------- |
| MOB-FEAT-012 | Local Media Import Draft              | Picker, seleção explícita 1..N, cancelamento, contagem e cópia privada durável. | MOB-FEAT-010  | implemented; gate open          |
| MOB-FEAT-013 | Import Review and Ordering            | Preview, adicionar/remover, reorder, duplicidade como aviso e confirmação.      | 012           | implemented; gate open          |
| MOB-FEAT-014 | Translation Language Selection        | Sete idiomas, 42 pares e revisão de `zh` legado.                                | 013           | implemented; gate open          |
| MOB-FEAT-015 | Media Validation                      | Formato real, integridade, limites seguros e falha localizada.                  | 012, 013, 014 | implemented; gate open          |
| MOB-FEAT-016 | Translation Project and Page State    | Projeto privado e máquina de estados persistível.                               | 013, 014, 015 | verification-pending; gate open |
| MOB-FEAT-017 | Remote Processing Consent and Gateway | Consentimento, sessão anônima, adapter, timeout, cancelamento e idempotência.   | 016           | approved; gate open             |
| MOB-FEAT-018 | Multilingual OCR and Regions          | Vision OCR por origem, regiões, coordenadas, IDs e ordem.                       | 017           | approved; gate blocked          |
| MOB-FEAT-019 | Contextual Language-pair Translation  | Translation LLM contextual e vínculo região→resultado.                          | 018           | approved; gate blocked          |
| MOB-FEAT-020 | Visual Translation Rendering          | Caixa limpa determinística, fallback e original preservado.                     | 019           | approved; gate blocked          |
| MOB-FEAT-021 | Local Translation Result Reader       | Download verificado, barra por etapas, auto-open e leitura offline.             | 020           | approved; gate blocked          |
| MOB-FEAT-022 | Incremental Processing Scheduler      | Primeira READY libera reader e próximas são priorizadas.                        | 016, 021      | blocked                         |
| MOB-FEAT-023 | Processing Progress UX                | Estados por página, agregado e atualização automática.                          | 016, 022      | blocked                         |
| MOB-FEAT-024 | Page Failure and Retry                | Falha/retry idempotente e preservação de concluídas.                            | 017, 022      | blocked                         |
| MOB-FEAT-025 | Local Translation Library             | Criar/listar/abrir/remover e mostrar progresso.                                 | 016, 021, 023 | blocked                         |
| MOB-FEAT-026 | Offline Reading and Resume            | Biblioteca/leitura/progresso offline e retomada remota.                         | 024, 025      | blocked                         |
| MOB-FEAT-027 | Local Data Migration and Recovery     | Upgrade, escrita interrompida e recovery.                                       | 025, 026      | blocked                         |

`MOB-FEAT-012..021` possuem Target Specs normativas no registry. IDs `022+`
continuam reservas informativas até seus arquivos serem criados.

## Dependency Graph

```text
MOB-FEAT-010
  ↓
MOB-FEAT-012
  ├──→ MOB-FEAT-015
  ↓
MOB-FEAT-013 → MOB-FEAT-014
  └──────────────┬──────────────┘
                 ↓
            MOB-FEAT-016
                 ↓
            MOB-FEAT-017
                 ↓
018 OCR → 019 Translation → 020 Render → 021 Reader
                 │                           │
                 └────────→ 022 Incremental ┘
                              ↓
                         023 Progress
                              ↓
                         024 Retry
                              ↓
                         025 Library
                              ↓
                         026 Offline
                              ↓
                         027 Migration
```

## Vertical Slices

1. **Prova de tradução:** uma imagem → validação → consentimento → OCR →
   par origem/destino escolhido → render → leitura. JA → PT-BR é uma
   fixture prioritária, acompanhada por ao menos um par latino no benchmark.
2. **Diferencial incremental:** múltiplas imagens → reorder → page states →
   primeira `READY` → reader → fila priorizada.
3. **Continuidade:** persistir → fechar → reabrir → continuar offline.
4. **Resiliência:** falha → retry → preservar concluídas e consumo.
5. **Qualidade:** original → edição → feedback → benchmark.

## Architecture and Interfaces

- Preservar `application → pages → widgets → features → entities → shared`.
- Entidades planejadas: `translation-project`, `translation-page`,
  `text-region` e `local-reading-progress`.
- Features planejadas: import, review, validate, process, cancel/retry, reorder,
  edit e manage library.
- Metadados relacionais e máquinas de estado usam banco local versionado;
  originais e resultados usam diretório privado. Cache não é fonte de dados
  críticos.
- O modelo local separa projetos, páginas ordenadas, regiões e tentativas. Cada
  projeto persiste origem e destino como campos independentes; a combinação é
  validada contra a matriz de capacidades do gateway, sem defaults acoplados.
  IDs e posições são únicos no seu escopo; exclusão coordenada remove filhos e
  arquivos.
- O gateway remoto é interface mobile substituível e exige idempotência por
  projeto/página, status consultável, IDs estáveis e erros por etapa.
- Secrets de provider nunca ficam no pacote mobile.
- Eventos usam nomes estáveis e propriedades minimizadas; imagem, diálogo e URL
  privada não entram em analytics.

Detalhes de tabelas, migrations, adapter e wire format pertencem às Target Specs
que introduzirem persistência/integração. Não antecipar implementação técnica no
roadmap.

## Critical Path to First Working Product

```text
012 Import
→ 013 Review
→ 014 Language
→ 015 Validation
→ 016 Page State
→ 017 Gateway/Consent
→ 018 OCR
→ 019 Translation
→ 020 Render
→ 021 Reader
→ 022 Incremental
→ 024 Retry
→ 025 Library
→ 026 Offline Resume
```

O primeiro teste de valor ocorre após 021. O MVP recorrente fecha após 026.

## Critical Path to Google Play

1. Completar o produto até M5 e os controles de custo de M7.
2. Fixar nome público, package, scheme, versionCode, Android mínimo e política de
   update.
3. Auditar Photo Picker, permissões transitivas, URI revogada, memória, ANR,
   transporte, secrets, dependências e licenças.
4. Publicar política web/termos/contato e preencher Data Safety conforme o build
   real.
5. Gerar AAB assinado e validar instalação, atualização e preservação de dados em
   hardware físico.
6. Executar internal testing e closed testing. Para conta pessoal criada após
   13/11/2023, revalidar a regra atual de 12 testadores opt-in por 14 dias
   contínuos antes do acesso à produção.
7. Revalidar target API antes da submissão. Expo SDK 54 declara target/compile SDK
   36; a regra Play vigente em agosto de 2026 exige API 36 para novos apps e
   updates a partir de 31/08/2026.
8. Publicar somente com fluxo P0 validado, política/Data Safety consistentes,
   custo contido, zero crash crítico conhecido e plano de incidente.

Referências temporais oficiais:

- <https://support.google.com/googleplay/android-developer/answer/14151465?hl=en>
- <https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-GB_ALL>
- <https://docs.expo.dev/versions/v54.0.0/>

## Decisões ainda abertas

| Decisão pendente                                                | Bloqueia               | Não bloqueia                                |
| --------------------------------------------------------------- | ---------------------- | ------------------------------------------- |
| Projeto/billing Google Cloud, operador, contato e URLs públicas | Deploy/upload real     | Código local, gateway e testes com adapters |
| Quota comercial e proteção Play Integrity                       | Beta pública e M9      | Alpha de 20 páginas/instalação/dia          |
| Nome/package/min Android/titular Play/público-alvo              | Specs de release       | Caminho funcional local                     |
| Política de backup Android dos arquivos privados                | MOB-FEAT-026/027       | Primeiro slice                              |
| Metas quantitativas de OCR/tradução/latência/SLO                | Promoção após baseline | Construção e medição                        |

Provider, contrato, regiões, retenção e variantes chinesas deixaram de ser
perguntas abertas; estão registrados nas Target Specs e no plano arquitetural.

## Próximo handoff executável

1. Executar as tasks aprovadas de `MOB-FEAT-017` com adapters falsos e
   infraestrutura declarativa, sem aplicar recursos cloud sem aprovação externa.
2. Promover `MOB-FEAT-018`, depois `019`, `020` e `021` sequencialmente conforme
   cada gate for aberto por implementação/verificação da dependência.
