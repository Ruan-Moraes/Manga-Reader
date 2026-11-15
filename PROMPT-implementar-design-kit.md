# Prompt: implementar no app mobile o design validado no Design System

> Cole este arquivo como primeira mensagem de um chat novo, com o diretório de trabalho na raiz do repositório (`Manga-Reader`).

---

## Objetivo

Levar para o app real (`mobile/`, React Native + Expo) o design que prototipamos e validamos no **kit mobile do Toonlira Design System**. O kit é um protótipo clicável em HTML/React. O app real tem arquitetura, i18n, tema e fluxo SDD próprios. **O kit é referência visual e de comportamento, não código para copiar.**

Nesta primeira sessão **não escreva código de produção**. Entregue o diagnóstico e o plano descritos em "Primeira entrega".

## Fontes do design (leia antes de qualquer coisa)

- Artifact (versão publicada, 42 no momento): https://claude.ai/artifact/GQYgxZxu6gTTcgtgugMeQf
- Cópia local, atualizada junto com o artifact: `~/Toonlira-Design-System/project/`
  - Para ver o protótipo: dê duplo clique em `~/Toonlira-Design-System/abrir.command` (serve por HTTP em `localhost:8765`).
  - Kit mobile: `project/ui_kits/mobile/`. Páginas: `App.html` (app clicável), `index.html` (comparação), `states.html` (galeria de estados).
  - Tokens: `project/tokens/*.css` e `project/tokens.json`. Componentes do DS: `project/components/<Nome>/`.
  - Leia `project/README.md` e `project/ui_kits/mobile/README.md` (padrões e hierarquia de texto).
- Não existe sincronização automática: se precisar de algo mais novo que a cópia local, peça para eu baixar de novo.

Arquivos do kit por tela:

| Tela | Arquivo do kit |
|---|---|
| Início (módulos) | `LauncherScreen.jsx` |
| Biblioteca | `LibraryScreen.jsx` (cabeçalho de seção, "Continuar lendo") |
| Obra | `WorkScreen.jsx` |
| Leitor (inclui "Ajustes do leitor") | `ReaderScreen.jsx` |
| Traduzir capítulo (3 etapas) | `TranslateScreen.jsx` |
| Conta: Entrar, Criar conta, Esqueci a senha | `AccountScreen.jsx` |
| Configurações (7 seções) | `SettingsScreen.jsx` |
| 404 | `NotFoundScreen.jsx` |
| Estados vazio, erro, sem conexão, carregando | `StateView`, `EmptyBlock`, `LoadingBlock`, `LibrarySkeleton`, `ListSkeleton` em `kit-parts.jsx` |
| Controles de formulário e folhas | `KitField`, `KitSegmented`, `KitSlider`, `KitSwatches`, `KitChoices`, `SettingsGroup`, `SettingsRow`, `SectionHeader`, `SectionAction` em `kit-parts.jsx` |

## Regras do projeto (obrigatórias)

Leia, nesta ordem, antes de propor qualquer coisa:

1. `CLAUDE.md` (raiz) e `AGENTS.md` (raiz).
2. `mobile/AGENTS.md` e `mobile/README.md`.
3. `mobile/docs/specs/README.md`, `docs/specs/registry.md` e `docs/specs/coverage.json`.
4. As specs e baselines das telas tocadas (`docs/specs/features/` e `docs/specs/baseline/`).

Pontos que não podem ser violados:

- **SDD:** mudança de comportamento exige Target Spec `approved` por uma pessoa **antes** de tasks ou código. Você não aprova specs. Bug com spec correta é corrigido com teste de regressão. Mudança de intenção volta ao Spec Architect.
- **Gates:** respeite `implementation_gate`. `MOB-FEAT-056` (fluxo de tradução em 3 etapas) está **bloqueada** por `MOB-FEAT-055` (em andamento). Não crie `tasks.md`, não implemente e não crie UI fictícia para contornar o gate.
- **FSD:** `src/application` é a app layer, `src/app` só tem as cascas do Expo Router. Respeite os boundaries e as APIs públicas (barrels) dos slices. Componentes compartilhados ficam em `shared/ui`.
- **Sem texto ou cor hardcoded.** Tudo vem de tokens de tema e de i18n, com chaves nos **três idiomas** (pt-BR, en-US, es-ES).
- Todo arquivo novo em `src/` precisa de entrada individual em `docs/specs/coverage.json`.
- **Testes:** todo requisito novo ou alterado tem teste. Não apague testes sem justificativa.
- Antes de concluir qualquer etapa: `pnpm check` dentro de `mobile/`. Commits pequenos e focados.
- Combine o estilo dos vizinhos. Não rode formatadores automáticos que reescrevam arquivos inteiros.
- Reporte com honestidade: se algo falhou, não foi verificado ou foi pulado, diga.

## O que o design define (padrões a portar)

Estes valores foram padronizados no kit. Verifique cada um contra os tokens reais do app (`shared/theme`) e **use o token existente**. Se um token não existir, registre a lacuna em vez de criar valor solto.

- **Hierarquia de texto (8 papéis):** display 32/800, título 24/700, seção 20/700, corpo 14/400, rótulo 14/700, legenda 12/400, eyebrow 11/800 maiúsculas com espaçamento, botão 14/700.
- **Ícones:** 16, 20 e 24 apenas.
- **Raios:** só por token (sm 8, controle 12, cartão 16, destaque 24, pílula).
- **Alturas de controle:** 40, 44, 52. **Linhas de lista:** 56 ou 64. **Área de toque mínima:** 44.
- **Espaçamento:** margem lateral 20, entre seções 32, entre grupos 24, entre itens 12, padding de cartão 16.
- **Folhas (bottom sheets):** cabeçalho com título, descrição e botão de fechar; ritmo de 24 entre campos; ação secundária no rodapé.
- **Controles unificados:** segmentado em contêiner único (opção ativa em acento), controle deslizante com pílula de valor e mínimo/máximo, amostras de cor de mesma largura, escolhas empilhadas (rádio) com descrição.
- **Cabeçalho de seção:** título, contagem em pílula e ações em chips de 36px (área de toque de 44).
- **Cartões:** superfície neutra com borda cinza. O amarelo de acento fica reservado ao botão principal, ao rótulo/eyebrow e ao estado selecionado.
- **Estados padrão:** vazio não é erro e oferece a ação que resolve. Erro diz o que falhou e sempre tem "Tentar de novo". Sem conexão é aviso e lembra o que funciona offline. Carregando usa esqueleto quando o formato é conhecido. 404 sempre oferece "Voltar ao início".
- **Rodapé fixo (botão primário):** só o botão, sem texto de erro ou informação acima dele.

## O que NÃO portar (existe só no protótipo)

- Resultados roteirizados do fluxo de tradução (4ª página falha, 6ª incerta), páginas simuladas e capas de exemplo.
- Credenciais de demonstração do login. O app real já tem `DemoCredentials` em `__DEV__`, mantenha esse comportamento.
- Login simulado, e-mail de recuperação simulado e "conectado" em memória.
- Estado salvo em `localStorage`, `TLMBoundary`, `PhoneFrame`, barra de status falsa, comparador e galeria (`index.html`, `states.html`).
- Configurações que no protótipo só guardam estado, sem efeito. Só implemente o que tiver efeito real, senão fica bloqueado (regra de gate).
- No leitor do protótipo, só valem de verdade modo, direção, ajuste, fundo, saturação e espaçamento. Qualidade, pré-carregamento e gestos de exibir controles são só estado.

## Pacotes de trabalho sugeridos (nesta ordem)

Cada pacote só começa depois da spec correspondente aprovada. Se a spec já cobre o comportamento e muda só a aparência, diga isso explicitamente e proponha o caminho mais curto dentro do SDD.

0. **Fundação visual:** conferir tokens e escala de texto; criar em `shared/ui` os componentes que faltam (`StateView`, esqueleto de lista, `SectionAction`, controles de formulário unificados), reaproveitando `EmptyState`, `Skeleton`, `StatusMessage`, `SegmentedControl`, `RangeSlider`, `SwatchPicker`, `ChoiceCards` e `SettingsRow`/`ListRow` quando já existirem.
1. **Estados padrão e 404:** existe `pages/not-found`. Alinhar vazio, erro, sem conexão e carregando nas telas já existentes.
2. **Início (launcher):** dois módulos (Traduzir capítulo e Plataforma de leitura), conforme `MOB-FEAT-010`. Já existe `pages/launcher`.
3. **Biblioteca e Obra:** cabeçalho de seção, cartão "Continuar lendo", cartões de capítulo.
4. **Conta:** `pages/login`, `pages/register`, `pages/forgot` (o app já tem fluxo e textos em `auth.json`). Portar só a apresentação.
5. **Configurações:** `pages/settings-*` (as sete seções originais), folhas e controles unificados. Confirmar que o app real preserva todas as opções do original.
6. **Leitor:** botão "Ajustes do leitor" na barra superior, abrindo folha de ajustes. **Comportamento novo: exige spec.**
7. **Traduzir capítulo (3 etapas):** **bloqueado** por `MOB-FEAT-055`. Apenas prepare o mapeamento e deixe claro o que falta para abrir o gate.

## Primeira entrega (esta sessão)

Não altere código em `mobile/src`. Entregue, em um único documento de resposta:

1. **Diagnóstico por tela:** o que o app real já faz igual, o que diverge do kit (visual e comportamento) e o que já existe em `shared/ui` para reaproveitar.
2. **Lacunas de tokens:** valores do kit sem token equivalente no app.
3. **Mapa spec → mudança:** para cada pacote, quais Target Specs existem, quais precisam ser criadas ou alteradas, e o status e o gate de cada uma.
4. **Pontos de decisão para mim:** divergências entre o kit e as specs aprovadas, e qualquer escolha que não seja sua (por exemplo, o que priorizar).
5. **Plano:** ordem de execução, riscos, e o que pode rodar em paralelo sem tocar os mesmos arquivos.

Pare ali e espere minha resposta. Depois da aprovação das specs, use as skills SDD (`sdd-spec-architect`, `sdd-task-planner`, `sdd-executor`, `sdd-reviewer`, `sdd-drift-auditor`) e implemente um pacote por vez.

## Como me responder

Em português do Brasil, direto, sem rodeios. Cite arquivos com caminho relativo. Quando algo estiver incerto ou não verificado, diga.
