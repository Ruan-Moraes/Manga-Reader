# Prompt: design kit mobile — fase 2 (Biblioteca e Obra, Leitor, adendo do fluxo de tradução)

> Cole este arquivo como primeira mensagem de um chat novo, com o diretório de trabalho na raiz do repositório
> (`Manga-Reader`). Ele continua o trabalho de `PROMPT-implementar-design-kit.md` (fase 1).

---

## Objetivo

Terminar de levar para o app mobile (`mobile/`, React Native + Expo) o design validado no **kit mobile do Toonlira
Design System**. Faltam três frentes:

1. **MOB-FEAT-060 — Biblioteca em grade e tela da obra.** Spec aprovada, gate **bloqueado** pela MOB-FEAT-055.
2. **MOB-FEAT-063 — Leitor no padrão do kit.** Spec ainda **não redigida**.
3. **Adendo da MOB-FEAT-056 — fluxo de tradução em 3 etapas.** Revisão da spec ainda **não redigida**; gate continua
   **bloqueado** pela MOB-FEAT-055.

O kit é referência visual e de comportamento, não código para copiar. Nada aqui dispensa o fluxo SDD do mobile.

## Estado na transferência (2026-11-08)

| Spec | Status | Gate | Observação |
| ---- | ------ | ---- | ---------- |
| 057 Fundação visual (tokens e primitivas de `shared/ui`) | `verification-pending` | open | Falta só captura no Simulator e Android físico |
| 058 Estados padrão e 404 | `verification-pending` | open | Falta captura no Simulator |
| 059 Início | `verification-pending` | open | Falta captura no Simulator |
| 061 Conta | `verification-pending` | open | Falta captura no Simulator |
| 062 Configurações | `verification-pending` | open | Falta captura no Simulator; decisão D17 removeu o tamanho do cache |
| **060 Biblioteca e Obra** | `approved` | **blocked** | `blocked_by: [055, 057]`; sem `tasks.md` |
| **055 Obras, capítulos e lote** | `in-progress` | open | TASK-001..010 abertas; ver `MOB-FEAT-055-META.md` |
| **056 Fluxo de tradução** | `approved` | **blocked** | `blocked_by: [055]`; sem `tasks.md` |
| **063 Leitor** | não existe | — | Próximo ID livre: `MOB-FEAT-063` |

Primitivas já disponíveis em `mobile/src/shared/ui` (057/062): `BottomSheet`, `ActionSheet`, `ConfirmSheet`,
`StateView`, `LoadingBlock`, `ListSkeleton`, `SectionHeader`, `SectionAction`, `TextAction`, `ChoiceRow`, e
`ListRow` com `icon` (tile 40, linhas 56/64). Tokens de medida, sombras e movimento em `useTheme()`
(`metrics`, `shadows`, `motion`); cores suaves `dangerSoft`, `successSoft` e `warnSoft`.

## Fontes do design

- Artifact (versão 42): https://claude.ai/artifact/GQYgxZxu6gTTcgtgugMeQf
- Cópia local: `~/Toonlira-Design-System/project/` (abrir com `~/Toonlira-Design-System/abrir.command`, porta 8765).
- Kit mobile: `project/ui_kits/mobile/`:
  - Biblioteca: `LibraryScreen.jsx`, `WorkCard`/`NewWorkTile`/`LibrarySkeleton`/`CoverArt` em `kit-parts.jsx`.
  - Obra: `WorkScreen.jsx` e `ManageScreen.jsx`; folhas globais em `MobileApp.jsx` (`workMenu`, `chapterMenu`,
    `orphanMenu`, `link`, `move`, `cover`, `confirm`).
  - Leitor: `ReaderScreen.jsx` (barras, folha "Ajustes do leitor", lista de capítulos, fim de capítulo, estados).
  - Tradução: `TranslateScreen.jsx` (3 etapas, seletores De/Para, cartão "Salvar em", consentimento em camadas).
- Brief que originou o kit: `mobile/docs/ui-captures/DESIGN-BRIEF.md`.

## Regras do projeto (obrigatórias)

Leia antes de qualquer coisa: `CLAUDE.md`, `AGENTS.md`, `mobile/AGENTS.md`, `mobile/README.md`,
`mobile/docs/specs/README.md`, `mobile/docs/specs/registry.md` e as specs citadas abaixo.

- **SDD:** mudança de comportamento exige Target Spec `approved` por uma pessoa antes de tasks ou código. Você não
  aprova specs. Use as skills `sdd-spec-architect`, `sdd-task-planner`, `sdd-executor`, `sdd-reviewer` e
  `sdd-drift-auditor` (em `mobile/.agents/skills/`).
- **Gates:** spec com `implementation_gate: blocked` não recebe `tasks.md`, não entra em execução e não ganha UI
  fictícia para contornar a trava. O gate só abre quando todas as specs de `blocked_by` estiverem `implemented` ou
  `verification-pending` **e** uma pessoa abrir o gate.
- **Spec aprovada:** o validador exige `tasks.md` assim que a spec vira `approved` com gate `open`.
- **FSD:** `src/application` é a app layer; `src/app` só tem cascas do Expo Router. Respeite barrels e boundaries.
  Componentes reutilizáveis em `shared/ui`.
- **Sem texto ou cor fixos:** tokens de tema e i18n com chaves nos três idiomas (`pt-BR`, `en-US`, `es-ES`).
- Todo arquivo novo em `src/` precisa de entrada individual em `mobile/docs/specs/coverage.json`, ligada a `AC-*`.
- Todo requisito novo ou alterado tem teste. Testes antigos só mudam quando a spec altera o comportamento que eles
  codificam, e a review registra isso.
- Combine o estilo dos vizinhos. Não rode formatadores que reescrevam arquivos inteiros que não são seus.
- Reporte com honestidade: o que falhou, o que não foi verificado e o que foi pulado.

### Armadilhas conhecidas desta branch

- **`pnpm check` já está vermelho:** `specs:check` falha por checksums de review divergentes em 017, 018, 019, 021,
  025, 026, 027, 049, 050, 051, 052, 053 e 054. Rode as etapas separadamente (`pnpm typecheck`, `pnpm lint`,
  `pnpm lint:fsd`, `pnpm format:check`, `pnpm test:ci`) e reporte essa falha à parte. `format:check` também acusa
  arquivos com mudanças anteriores (`coverage.json` da working tree, spec 056, `startRemoteProcessing.ts`,
  `OfflineTranslationPage.test.tsx`, `LocalTranslationLibraryPage.tsx`).
- **Árvore de trabalho suja:** a branch `feat/auth-refresh-rotation` tem centenas de mudanças não commitadas do
  usuário. Commite só as suas linhas. Em arquivos já modificados (`registry.md`, `coverage.json`, alguns locales e
  testes), monte o conteúdo a partir de `git show HEAD:<arquivo>` com apenas as suas alterações e use
  `git update-index --cacheinfo`, ou gere um patch das suas linhas e aplique com `git apply --cached`. Nunca
  `git add` em arquivo que já estava sujo.
- **`coverage.json`:** reserializar o JSON muda a formatação; preserve a ordem das entradas e a linha `ignored`.
- **Ambiente Jest:** o React Native simula `fontScale` 2; o `StateView` esconde a ilustração nesse caso. Elementos com
  `accessibilityElementsHidden` exigem `{ includeHiddenElements: true }` nas queries.
- **Reanimated:** ler `.value` dentro de um objeto de estilo dispara o plugin de shared values; extraia para uma
  constante antes.

---

## Frente 1 — MOB-FEAT-060 (Biblioteca em grade e tela da obra)

Spec: `mobile/docs/specs/features/MOB-FEAT-060-library-and-work-screens/spec.md` (aprovada, 13 AC).

### Antes de começar

1. Confirme no registry e no `tasks.md` da 055 que ela chegou a `verification-pending` ou `implemented`. Hoje está
   `in-progress` com as 10 tasks abertas. **Se continuar assim, pare e informe: não crie `tasks.md` da 060.**
2. Peça à pessoa para abrir o gate (`implementation_gate: open` na spec e no registry). Você não abre o gate.
3. Releia a 055 (spec e código integrado): a 060 só muda apresentação e reutiliza as operações de obra, capa,
   capítulo, vínculo, lote e retry da 055.

### Decisões já aceitas na aprovação

- **D7:** esperar a 055 (não revisar a 055 para absorver o redesenho).
- **D14:** ordem "Recentes/A–Z" válida só na sessão.
- **D15:** capa ausente usa a capa padrão da 055, não as iniciais do kit.
- **D16:** capítulos sem obra exibem "Capítulo de <data de criação>", derivado e nunca persistido.

### Execução (depois do gate aberto)

1. `sdd-task-planner`: derive `tasks.md` com uma linha por AC (AC-001..AC-013).
2. Ordem sugerida de implementação, em commits pequenos:
   - `StatusChip` em `shared/ui` (aguardando, processando, salva, falhou, incerta; ícone, rótulo e cor suave) — AC-011.
   - Biblioteca: esqueleto, "Continuar lendo", `SectionHeader` "Obras" com ordenação e seleção, grade 2:3, "Nova obra"
     em folha, "Sem obra" com `ListRow`, rodapé fixo "Traduzir capítulo" — AC-001..AC-005.
   - Rotas novas `/work/[workId]` e `/work/[workId]/manage` (`ROUTES`, cascas em `src/app`, páginas em `src/pages`) —
     AC-006, AC-008, AC-012.
   - Menus em `ActionSheet`, exclusões em `ConfirmSheet` (troca dos `Alert` de `LocalWorksPanel` e
     `LocalTranslationLibrary`), folhas de capa, renomear, vínculo e mover — AC-004, AC-005, AC-007, AC-008.
   - Estados vazio e de erro com `StateView` — AC-010.
3. Reaproveite testes da 025 e da 055; eles precisam continuar verdes (AC-013).
4. Review e drift como nas features 057–062; captura no iOS Simulator e Android físico ficam como task aberta se não
   forem executadas (`verification-pending`).

---

## Frente 2 — MOB-FEAT-063 (Leitor no padrão do kit) — redigir a spec

Não existe spec. Use `sdd-spec-architect` para criar
`mobile/docs/specs/features/MOB-FEAT-063-reader-design-kit/spec.md` como `draft` e pare para aprovação.

### Escopo proposto (a partir de `ReaderScreen.jsx`)

- Barra superior: voltar, nome do capítulo e obra, botão **"Ajustes do leitor"** (`options-outline`) e botão
  **"Lista de capítulos"** (desabilitado com menos de 2 capítulos), abrindo folha com os capítulos da obra e o atual
  marcado.
- Barra inferior: capítulo anterior/próximo, progresso com "p / T" e alternador **"Traduzido / Original"** (hoje fica
  dentro da aba Aparência do painel).
- Fim do capítulo (só no vertical): "Ler próximo capítulo" ou "Voltar para a obra".
- Estados bloqueantes no modo traduzido: "Tradução em andamento" e "Não foi possível traduzir", com "Tentar de novo"
  (seguindo o retry explícito e o consentimento da 055) e "Ler original".
- Folha de ajustes no padrão `BottomSheet` da 057 (raio `feature`, cabeçalho com título, descrição e fechar), com
  rodapé "Todos os ajustes do leitor" que abre Configurações > Leitor (062).

### Conflitos que a spec precisa resolver (decisões humanas)

- **D2 — abas ou folha única.** A 054/AC-002 aprovou abas Leitura, Aparência e Gestos; o kit usa folha única. A spec
  deve alterar a 054 explicitamente se seguir o kit.
- **Ajuste "Original":** o kit removeu; a 005 exige. Recomendação: manter.
- **Qualidade:** o kit mostra as cinco opções sempre; a 005/AC-004 proíbe opções sem fontes distintas. Recomendação:
  manter a regra atual.
- **Cores das barras:** o kit usa hex fixos escuros (`PANEL`, `INK`, `DIM`); o app usa tokens temáticos (051).
  Recomendação: manter os tokens.
- **Lista de capítulos e anterior/próximo:** dependem dos capítulos da obra da 055; não existem no leitor da plataforma
  (`pages/reader`). A spec deve dizer em quais leitores cada controle aparece.

### Contratos que não podem mudar

- 005 (modos, direção, ajuste, qualidade, saturação, espaçamento, pré-carregamento, progresso), 051 (leitor unificado,
  overlay de demonstração, erro por página), 052 (gestos e modos de exibir controles), 053 (leitor de texto), 054
  (painel, salvo o que a spec alterar), 055 (zoom, marcador de falha, retry seletivo), DEC-008 (sem reenvio
  automático).

### Gate proposto

`blocked_by: [MOB-FEAT-055, MOB-FEAT-057, MOB-FEAT-062]`, gate `blocked` enquanto a 055 estiver `in-progress` (mesmos
arquivos: `widgets/content-reader`, `ZoomableSurface`, leitor local).

### Não portar

Páginas simuladas (`PagePlaceholder`), limite de 30 páginas, retry roteirizado (3500 ms), toasts de protótipo e a
paleta fixa do leitor.

---

## Frente 3 — Adendo da MOB-FEAT-056 (fluxo de tradução) — redigir a revisão

Spec: `mobile/docs/specs/features/MOB-FEAT-056-translation-flow-redesign/spec.md` (aprovada, gate bloqueado). Mudar a
intenção de uma spec aprovada é revisão: ela volta para aprovação humana e o gate continua `blocked` pela 055.

### Divergências entre o kit e a 056 (decisão D3, ainda em aberto)

| Item | 056 hoje | Kit (`TranslateScreen.jsx`) |
| ---- | -------- | --------------------------- |
| Idiomas | linha única "origem → destino" | dois seletores "De" e "Para" com botão de trocar; o idioma usado no outro lado fica desabilitado |
| Consentimento | fora do escopo | folha "Antes de enviar" com 3 itens (o que sai do aparelho, retenção, respostas incertas) e "Ver detalhes" |
| Destino do capítulo | **não previsto** (conferido em 2026-11-08) | cartão "Salvar em: obra / Sem obra" com folha de escolha, antes de traduzir |
| Progresso | 3 passos com o atual rotulado | barra de 3 segmentos e "Etapa N de 3" |

### O que o adendo deve conter

1. Para cada linha acima, a escolha da pessoa (seguir o kit ou manter a 056) e os AC alterados ou novos.
2. Se o consentimento em camadas entrar: os textos continuam fiéis à 017 e à DEC-008 (nenhuma chamada antes do aceite;
   chave por tentativa; sem reenvio automático). "Ver detalhes" precisa abrir o texto completo real, não um toast.
3. Se o cartão "Salvar em" entrar: ele usa as obras e o vínculo da 055 e respeita a falha de vínculo já prevista na 056
   ("Tentar vincular de novo").
4. O que **não** portar do kit: resultados roteirizados (4ª página falha, 6ª incerta), data fixa "08/11/2026",
   destinos fixos de "Abrir no leitor" e "Retomar último capítulo", validação simulada a cada 420 ms.

### Depois da aprovação do adendo

Nada de `tasks.md` enquanto o gate da 056 estiver `blocked`. Quando a 055 chegar a `verification-pending` e a pessoa
abrir o gate, planeje e execute a 056 com as mesmas regras da Frente 1.

---

## Ordem e paralelismo

1. **Agora (sem esperar a 055):** redigir a spec 063 e o adendo da 056, e parar para aprovação. São documentos em
   arquivos diferentes; podem ser feitos na mesma sessão.
2. **Quando a 055 chegar a `verification-pending` e os gates forem abertos:** 060, depois 063, depois 056. As três
   tocam a biblioteca, o leitor e o fluxo de tradução em arquivos próximos; execute em sequência, não em paralelo.
3. Pendência comum a todas (inclusive 057–062): capturas no iOS Simulator em claro, escuro, fonte ampliada e 320 pt,
   e validação em Android físico. Sem build no Simulator, isso fica como task aberta.

## Primeira entrega desta sessão

1. Diagnóstico curto do estado da 055 (tasks, status, o que falta para `verification-pending`).
2. Draft da spec **MOB-FEAT-063** com AC, gate e as decisões em aberto listadas.
3. Draft do **adendo da MOB-FEAT-056** com a tabela de divergências e as opções para a pessoa escolher.
4. Registry atualizado (063 como `draft`), `pnpm specs:check` rodado e resultado reportado.

Pare aí e espere a aprovação. Responda em português do Brasil, direto, citando arquivos com caminho relativo.
