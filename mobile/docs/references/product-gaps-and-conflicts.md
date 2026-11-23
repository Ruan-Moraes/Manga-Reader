# Gaps e conflitos do produto Mobile

> Relatório informativo reconciliado em 2026-08-15. Não altera baselines nem
> Target Specs. A resolução comportamental ocorre por Spec Architect e aprovação
> humana.

## Hierarquia aplicada

1. decisão explícita atual de produto;
2. Target Spec aprovada;
3. decision aplicável;
4. requisitos mestres;
5. `mobile/AGENTS.md`;
6. documentação arquitetural;
7. baseline;
8. código legado.

Código ou placeholder não vence a direção de produto apenas por existir.

## Conflitos

| ID      | Severidade | Conflito                                                           | Evidência atual                                                             | Resolução planejada                                                                                                     |
| ------- | ---------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| CON-001 | P0         | “Tradução offline” versus pipeline local-first remoto              | `MOB-FEAT-010/AC-003` e copy do launcher prometem ausência de rede          | `MOB-FEAT-012` substitui parcialmente o shell e adota “Traduzir do dispositivo”; `MOB-FEAT-017` comunica envio remoto.  |
| CON-002 | P0         | Login/plataforma versus guest-first                                | Auth e plataforma existem, mas o produto exige valor antes da conta         | `MOB-FEAT-010` já resolveu a entrada; toda spec local deve preservar essa regra.                                        |
| CON-003 | P0         | Leitor publicado versus leitor de projeto privado                  | `MOB-FEAT-005` recebe capítulo `PUBLISHED` e páginas prontas da Core        | Implementar `MOB-FEAT-021`, já aprovada; reutilizar apenas primitivas compatíveis, sem estender semanticamente Chapter. |
| CON-004 | P1         | Idiomas de conteúdo versus idioma de tradução                      | `MOB-FEAT-004` controla catálogo/UGC e `Accept-Language` separado           | `MOB-FEAT-014` mantém escolhas independentes e implementa sete idiomas/42 pares.                                        |
| CON-005 | P0         | Quota/identidade em M7 versus custo desde o primeiro processamento | Requisitos remotos têm custo marginal e risco de abuso                      | Alpha pode ser controlado; identidade anônima mínima, limite server-side e kill switch são gates antes de beta pública. |
| CON-006 | P1         | Roadmap antigo de plataforma versus produto prioritário            | README antigo lista catálogo, fórum, perfil e loja                          | Roadmap atual mantém plataforma escondida e fora do caminho P0/P1.                                                      |
| CON-007 | P1         | Biblioteca placeholder da plataforma versus biblioteca local       | `pages/library` é vazio e inacessível                                       | `MOB-FEAT-025` define biblioteca local independente; não preencher placeholder por paridade Web.                        |
| CON-008 | P1         | Analytics configurável versus analytics inexistente                | Preferência de privacidade existe, mas nenhum event registry/instrumentação | Criar Event Registry e Analytics Privacy em M8; nunca declarar coleta inexistente ou coletar sem refletir política.     |
| CON-009 | P1         | Prioridade Android versus evidência física pendente iOS/Android    | `MOB-FEAT-005` exige matriz das duas plataformas                            | Preservar a spec existente; pendência não bloqueia import Android, mas impede promover 005 a `implemented`.             |

## Gaps por categoria

### PRODUCT_GAP

- Delta de idioma `zh-Hans`/`zh-Hant` e revisão de seleções `zh` legadas.
- OCR multilíngue, escritas horizontal/vertical, regiões, tradução contextual
  entre pares suportados e renderização.
- Page state, scheduler incremental, progresso e retry isolado.
- Biblioteca privada, leitura offline e retomada após restart.
- Edição, glossário e feedback de qualidade.

### SPEC_GAP

- `MOB-FEAT-012..021` agora possuem contratos normativos. Specs de scheduler,
  retry, biblioteca, offline e recovery (`022+`) ainda são reservas.
- O contrato do gateway está aprovado, mas OpenAPI, serviço implantado e URLs
  legais reais ainda não existem.
- Event registry e contratos normativos de observabilidade continuam ausentes.

### ARCHITECTURE_GAP

- `translation-project` e `translation-page` já existem; faltam `text-region`,
  attempts/resultados e `local-reading-progress`.
- Banco local versionado, migration v6 e ownership dos originais existem;
  faltam resultados renderizados e remoção coordenada do novo conteúdo.
- Ausência de gateway assíncrono/idempotente para processamento remoto.
- Ausência de orquestração de prioridade baseada na posição do leitor.
- O registry já inclui projetos; ainda faltam participantes para resultados,
  regiões e progresso de leitura local.

### TEST_GAP

- Sem fixtures autorizadas e reproduzíveis que cubram os idiomas, escritas e
  pares prioritários.
- Sem integração real de picker/URI revogada em Android.
- Sem E2E do caminho `select → translate → read → persist`.
- Sem testes de migration/recovery do armazenamento local.
- Sem matriz física Android para memória, background, rede degradada e upgrade.
- `MOB-FEAT-005` ainda possui matriz real pendente.

### OBSERVABILITY_GAP

- Sem event registry e sem eventos do funil principal.
- Sem first-page-ready/read, reader stall ou latência por etapa.
- Sem correlação minimizada entre página, OCR, tradução e render.
- Sem crash/ANR reporting ou custo por página lida.

### PRIVACY_GAP

- Copy não explica que mídia poderá sair do dispositivo.
- Google Cloud, regiões e retenção operacional foram escolhidos. Falta validar
  configuração/contratos vigentes no deploy e publicar operador/contato reais.
- Não existe política pública que descreva o fluxo real de mídia.
- Não existe decisão de backup para originais/resultados privados.
- Logs e analytics do futuro pipeline ainda não possuem allowlist de campos.

### PLAY_STORE_GAP

- Nome, slug, scheme e package são temporários.
- Não há `eas.json`, versionCode, assinatura/release process ou AAB validado.
- Não há manifest permission audit, Data Safety, política URL, listing ou assets
  autorizados.
- Não há internal/closed testing, device matrix nem go/no-go persistido.

### QUALITY_GAP

- Nenhum baseline por idioma/escrita/par para OCR, ordem de balões, nomes
  próprios ou naturalidade do idioma de destino.
- Nenhum baseline de legibilidade/preservação da arte.
- Nenhuma medição de first value, stall, falha, retry ou memória.
- Não há SLO; isso é correto até existir baseline mensurável.

### TECHNICAL_DEBT

- `MOB-FEAT-005` permanece `verification-pending`.
- `secureKeyValueStorage` atende preferências pequenas, não biblioteca de mídia.
- A nomenclatura `offline-translation` ficará obsoleta e precisa de migração de
  rota/copy deliberada, sem quebrar deep link existente silenciosamente.
- Placeholders de plataforma aumentam superfície cognitiva, embora estejam
  corretamente escondidos.

### CANDIDATE_FOR_REMOVAL

- Home/Library/Forum/Profile e tabs da plataforma somente após decisão própria;
  não remover durante M2.
- Copy de comunidade, catálogo e “offline” incompatível deve ser removida ou
  substituída quando a spec proprietária autorizar.
- Constantes ou contratos sem consumidor não devem virar roadmap por acidente.

## Dependências externas

| Dependência                      | Necessária para | Política                                                                           |
| -------------------------------- | --------------- | ---------------------------------------------------------------------------------- |
| Photo Picker/seleção do sistema  | MOB-FEAT-012    | Preferir seleção pontual; não pedir acesso amplo por conveniência.                 |
| Gateway separado/Google Cloud    | MOB-FEAT-017+   | Arquitetura aprovada; implementar fora da Core e aplicar cloud só com autorização. |
| Vision/Translation/renderer      | M3              | Adapters substituíveis, benchmark autorizado, quota e kill switch.                 |
| Política/termos/contato públicos | M3/M8           | Atualizar antes do primeiro upload real e revisar novamente para release.          |
| Conta Google Play e testadores   | M8              | Confirmar tipo/data da conta antes de planejar closed testing.                     |

## Decisões pendentes e seus gates

| Pergunta                                    | Gate                             | Default até decisão                                |
| ------------------------------------------- | -------------------------------- | -------------------------------------------------- |
| Projeto/billing/operador/contato/URLs reais | Bloqueia deploy/upload real      | Código e adapters determinísticos.                 |
| Qual quota comercial?                       | Bloqueia beta pública/M9         | Alpha: 20 páginas/instalação/dia e 100 global/dia. |
| Qual package/nome/min Android/público?      | Bloqueia build/listing           | Não publicar configuração temporária.              |
| Arquivos entram em backup Android?          | Bloqueia 026/027                 | Excluir de backup até decisão explícita.           |
| Quais metas de qualidade/latência?          | Bloqueia promoção após benchmark | Medir baseline; não inventar número.               |

## Próximo responsável SDD

| Gap imediato      | Papel            | Ação                                                     |
| ----------------- | ---------------- | -------------------------------------------------------- |
| MOB-FEAT-017      | Implementer      | Executar tasks aprovadas; cloud apply exige autorização. |
| MOB-FEAT-018..021 | Spec Gatekeeper  | Abrir um gate por vez após dependência executada.        |
| MOB-FEAT-022+     | Nenhuma execução | Permanecem reservas até novo ciclo SDD.                  |
