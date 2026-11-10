# Review — MOB-FEAT-062

- Spec revisada: `spec.md`
- Implementação/revisão: commit 5392e31a95d4021e43e765b0a1c53236b5abff60
- Gate na entrada do planejamento: `open`
- Dependências verificadas: MOB-FEAT-057 (`verification-pending`)
- Verdict: `verification-pending`

## Findings

1. **Resolvida — "Limpar cache" sem o tamanho como valor.** A spec pedia o tamanho do cache como valor da linha, mas o
   app não mede o cache. Ruan Moraes decidiu remover o requisito (D17, registrada na spec); a implementação já estava
   assim.
2. **Baixa — caminho de confirmação dos Dados coberto indiretamente.** Os testes do painel verificam folha, textos,
   cancelar e o bloqueio para visitante; a execução após confirmar usa o mesmo `run` de antes e o fechar-antes-de-executar
   é coberto pelos testes do `ConfirmSheet` (057). Não há teste de ponta a ponta que confirme uma limpeza real.
3. **Informativa — folhas do Leitor usam os controles compactos.** São os mesmos do painel do leitor (054): sliders com
   ajuda expansível em vez de descrição fixa. Nenhuma opção foi removida; o ajuste Original e a regra de qualidade
   continuam.
4. **Informativa — `FormSection` em blocos.** O cartão de cada grupo agora separa cada controle em bloco com padding 16
   e divisória. Afeta todas as subpáginas de Configurações; o modo `compact` (painel do leitor) não mudou.
5. **Informativa — confirmações da privacidade.** O `Alert` nativo virou `ConfirmSheet` com o mesmo texto; cancelar,
   fechar, scrim e voltar não alteram nada. Para o "Não rastrear", o cancelamento é resolvido depois da confirmação no
   mesmo ciclo, para que confirmar nunca seja interpretado como cancelar.
6. **Informativa — testes antigos atualizados.** Testes da 003, 006, 007 e 008 que interagiam com controles inline ou
   com `Alert` agora abrem a folha antes, conforme as alterações previstas na spec (032/AC-001, 031/AC-003, AC-004 e AC-006).

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                                                                                         | Resultado                             |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| AC-001   | sim          | `SettingsIndex.test.tsx`, `SettingsIndexPage.test.tsx` (linhas com tile, bloqueio de login)                                                                                  | pass                                  |
| AC-002   | sim          | `ChoiceRow.test.tsx` (abrir, escolher, cancelar por quatro meios)                                                                                                            | pass                                  |
| AC-003   | sim          | `ThemeTiles.test.tsx`; `AppearanceAccessibilityControls.test.tsx`                                                                                                            | pass                                  |
| AC-004   | sim          | `InterfaceLanguageRegionControls.test.tsx` (idioma, data com exemplo, fuso em folhas)                                                                                        | pass                                  |
| AC-005   | sim          | `ContentLanguagesAdd.test.tsx`; `ContentLanguagesEditor.test.tsx`                                                                                                            | pass                                  |
| AC-006   | sim          | `SettingsReaderPage.test.tsx` (cinco folhas, Original, qualidade, gestos, restaurar no rodapé); `SettingsNavigation.integration.test.tsx`; testes do painel do leitor verdes | pass                                  |
| AC-007   | sim          | `PrivacyControlsPanel.test.tsx` (Não rastrear e analytics em folha)                                                                                                          | pass                                  |
| AC-008   | sim          | `DataControlsPanel.test.tsx` (folha com removido e preservado, uso de armazenamento, visitante)                                                                              | pass (ver finding 1)                  |
| AC-009   | sim          | testes da 008, 031 e 032 verdes; `SettingsAboutPage.test.tsx`                                                                                                                | pass                                  |
| AC-010   | sim          | `i18n.test.ts`; `ThemeTiles.test.tsx` (320 pt e fonte a 200%); testes com `fontScale` 2 do ambiente                                                                          | pass em teste; capturas iOS pendentes |
| AC-011   | sim          | gates abaixo; `coverage.json`                                                                                                                                                | pass                                  |

## Gates

| Comando             | Resultado                                                                          |
| ------------------- | ---------------------------------------------------------------------------------- |
| `pnpm typecheck`    | pass                                                                               |
| `pnpm lint`         | pass                                                                               |
| `pnpm lint:fsd`     | pass                                                                               |
| `pnpm test:ci`      | pass — 154 suítes, 1164 testes                                                     |
| `pnpm format:check` | fail — só arquivos com mudanças anteriores a esta feature                          |
| `pnpm specs:check`  | fail — apenas os 13 checksums de review divergentes anteriores; nenhum erro da 062 |
| `pnpm check`        | fail — interrompido pelo `specs:check`; demais etapas executadas separadamente     |

## Mudanças fora da spec

- Nenhuma. Nenhuma opção, rota, request ou regra de persistência foi removida ou criada.

## Ajuste visual posterior (2026-11-09, sem commit)

A pedido do usuário, na tela Configurações > Leitor (escuro, iPhone 18 Pro):

- O valor das linhas ("Vertical", "Automática", "18 sp") saiu da linha do título e virou coluna à direita, centrada com
  a seta, como o `SettingsRow` do kit. A mudança é da `ListRow` e vale para todas as telas que a usam.
- O grupo vem direto abaixo do topo, sem repetir "Leitor / Escolha uma área para ajustar." (o kit não tem); a chave
  `settingsNavigation.readerSheets.groupDescription` foi removida dos três idiomas.
- Linhas mais altas nesta tela: `ListRow size="large"` (20 de padding vertical e tile de 48). As alturas mínimas do
  057/AC-012 continuam valendo para o tamanho padrão.

Opções, rotas e persistência não mudaram. Captura: `docs/ui-captures/dark/design-kit-phase2-iphone18pro/062-settings-reader.png`.

Padronização das folhas de Leitor (mesmo dia, a pedido), escala de 4/8:

- **Rótulo e controle:** rótulo `label`, descrição `caption`, 4 entre eles e 8 até o controle (já vigente; conferido em
  todos os controles).
- **Entre controles:** 24 (`FormSection` compacto passou de 16 com borda inferior para 24 sem borda; a linha solta no
  fim de cada folha sumiu). Seções vizinhas continuam separadas pelo `SectionStack`.
- **Escolhas (Modo, Direção, Exibir controles):** o `ChoiceCards` compacto ignorava `layout="stacked"` e montava grade
  2 + 1 com alturas diferentes; agora empilha, com 2 px de borda (como o modo normal e o `ChoiceGroup`), raio 12,
  16 × 12 de padding e altura mínima de 56.
- **Select:** variante padrão com 16 de padding vertical (cerca de 75 pt de altura, antes 64), raio 12 e seta para
  baixo quando fechado (estava invertida). Testes de contrato do select seguem valendo.
- **Switch:** texto alinhado à margem dos rótulos (anel de foco fora da coluna) e coluna do switch de 52 → 64, porque o
  UISwitch do iOS 26 mede cerca de 62 pt e vazava da margem. O teste da `SwitchRow` foi atualizado para 64 com essa
  justificativa.
- O espaço visual maior em volta dos sliders vem do chip de 36 e da trilha de 44 (área de toque); mantido.

Capturas: `062-sheet-navigation.png`, `062-sheet-image.png`, `062-sheet-gestures.png`, `062-sheet-text.png`.

Rodapé das folhas colado à safe area (a pedido): `BottomSheet` e `ReaderPanel` passam a usar 8 acima da ação e, embaixo,
só a safe area (16 sem ela); botões só de texto no rodapé ("Restaurar ajustes do texto", "Todos os ajustes do leitor")
usam a altura compacta de 44. Rodapé da folha Texto: 102 → 86 pt. O teste 057/AC-003 do rodapé foi atualizado de 16
para 8 com essa justificativa.

Mais dois ajustes a pedido:

- **Fundo do leitor de texto** em amostras de cor (`SwatchPicker`), como o Fundo da imagem e o kit: Claro, Papel e
  Escuro com as cores do `textReaderPalette`; "Seguir aplicativo" dividido entre claro e escuro (`optionSplit`, novo e
  opcional no `SwatchPicker`).
- **Cabeçalho das folhas** com 16 de respiro e divisor: `headerDivider` do `BottomSheet` passou a valer por padrão e o
  `ReaderPanel` ganhou o mesmo divisor (com abas, a borda das abas já separa). A descrição não é mais cortada em duas
  linhas.

Ajuda em balão e rodapé (a pedido):

- **Ajuda dos sliders:** o `ControlHelp` (linha "ⓘ Sobre X" abaixo do controle) foi substituído pelo `HelpTooltip`: "?"
  ao lado do rótulo (`RangeSlider` ganhou `help`), que abre um balão ancorado no ícone; toque fora ou no "?" fecha, e o
  texto é anunciado ao leitor de tela. Vale para Saturação, Espaçamento e Pré-carregamento nas folhas compactas. O nome
  acessível segue "Sobre X" (054/AC-002); `ControlHelp` foi removido e o `coverage.json` aponta para o componente novo.
- **Rodapé:** a rodada anterior ainda deixava 56 pt sob o texto do botão. Agora o espaço sob a ação é a safe area menos
  16 (18 pt no iPhone; a barra de início ocupa os ~13 pt finais), mínimo 8, e 16 sem safe area
  (`resolveSheetFooterBottom`, usado pelo `BottomSheet` e pelo `ReaderPanel`). Rodapé da folha Texto: 102 → 72 pt.

Rodada seguinte (a pedido):

- **Select limpo:** a variante padrão do `SelectField` perdeu o tile de ícone à esquerda e a caixa da seta; fica o valor
  e uma seta simples (24), centrados na vertical. O campo "Qualidade" continua (062/AC-006: Automática e Original).
- **Animação das folhas:** o `Modal` do `BottomSheet` usava `slide`, que levava o fundo escuro junto com a folha. Agora o
  `Modal` não anima; o fundo faz fade e só a folha sobe (240 ms, desacelerando) e desce (180 ms). Durante a saída a
  camada fica oculta para acessibilidade e sem toque; com redução de movimento é instantâneo.
- **Ícones de Configurações > Leitor:** tile de 40, igual a Configurações (o tamanho `large` saiu da `ListRow`).
- **Voltar ("<"):** `BackButton` passa a ser quadrado com fundo `surface` e borda por padrão, igual ao fechar das folhas,
  em todas as telas (Entrar, Cadastrar, Esqueci a senha, Configurações, biblioteca, obra); o voltar do leitor ganhou o
  mesmo fundo. `NavigationHeader` tem 16 de respiro embaixo para nada encostar no botão.
- **Atalhos com ícone em fundo:** `TextAction` ganhou `iconTile` (ícone num quadro de 32 com fundo suave, centrado com o
  texto) e `align`; usado em "Abrir biblioteca local" (centralizado, como no kit) e "Retomar último capítulo".

Os testes do `SelectField` (tile, caixa da seta e `animationType`) foram atualizados com essa justificativa.

Depois, a pedido: as cinco linhas de Configurações > Leitor não mostram mais valor ao lado da seta ("Vertical",
"Automática", "18 sp"); o nome acessível passou a ser só o título e o teste de AC-006 foi ajustado. "Retomar último
capítulo" ficou centralizado.

## Conclusão

Os 11 critérios estão implementados com evidência automatizada. Verdict `verification-pending` porque TASK-012
(capturas no iOS Simulator) continua aberta. O finding 1 foi resolvido pela decisão D17.
Review feita pelo próprio implementador, sem auditor externo.
