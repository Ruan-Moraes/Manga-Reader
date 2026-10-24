# Evidência automatizada — MOB-FEAT-034

Data: 2026-08-24

## Cobertura dirigida

- `sharedUi.test.tsx`: switch, cards de tema, paleta sem borda selecionada,
  estado otimista e regressão matemática do slider em 0, 5, 20, 95 e 100;
  frame externo mantém os insets 47/34 e o conteúdo rolável não duplica padding
  de safe area.
- `ReaderSettingsControls.test.tsx`: cinco fundos, patches independentes,
  manutenção da escolha de fundo, sliders de saturação, espaçamento e
  pré-carregamento e switch.
- `AppearanceAccessibilityControls.test.tsx`: tema e status passivos.
- `SettingsIndex.test.tsx` e `SettingsIndexPage.test.tsx`: status opcional sem
  perda de login ou ação.

## Gates

| Gate                | Resultado                                     |
| ------------------- | --------------------------------------------- |
| testes dirigidos    | 5 suítes, 32 testes, zero falhas              |
| `pnpm specs:check`  | pass; zero drift e zero arquivo sem cobertura |
| `pnpm typecheck`    | pass                                          |
| `pnpm lint`         | pass                                          |
| `pnpm lint:fsd`     | pass; zero problemas                          |
| `pnpm format:check` | pass                                          |
| `pnpm test:ci`      | 84 suítes, 434 testes, zero falhas            |

## Revalidação dirigida — 2026-08-29

- Fundo, saturação, espaçamento e pré-carregamento passaram nos testes do
  leitor e na integração com o store: 2 suítes e 8 testes.
- Paleta e regressões do slider passaram: 3 testes dirigidos.
- O slider mantém o draft no componente durante o pan e envia somente o valor
  final ao consumidor, eliminando persistência por frame.
- TypeScript, ESLint e boundaries FSD passaram.
- A suíte completa executou 84 suítes e 441 testes: 83 suítes e 440 testes
  passaram; permanece uma expectativa anterior do padding do `SelectField`,
  fora desta alteração.

## Revalidação da faixa de fundos — 2026-09-01

- `SwatchPicker` mede a largura real da trilha e atribui largura numérica
  equivalente às células e aos rótulos, sem centralização ou largura fixa.
- Os testes direcionados de `sharedUi`, `ReaderSettingsControls` e da integração
  de navegação comprovam a distribuição, o toque na célula inteira e a atualização
  do `settingsStore` para `PAPER`.
- `pnpm typecheck`, `pnpm lint:fsd`, ESLint e Prettier nos arquivos alterados
  passaram. `pnpm check` foi bloqueado antes das demais etapas por checksums
  divergentes preexistentes em 22 features do working tree; esta evidência não
  substitui a revisão nem a auditoria nativa pendentes.

## Revalidação do controle nativo — 2026-09-03

- O `NativeSlider` permanece visualmente substituído pela trilha tokenizada, mas
  volta a integrar explicitamente a árvore acessível; labels de incremento e
  decremento são encaminhados como ações assistivas.
- As regressões do componente, dos controles do leitor e da navegação passaram:
  3 suítes, 42 testes e zero falhas.
- A suíte completa passou com 95 suítes e 545 testes. TypeScript, ESLint,
  boundaries FSD e Prettier também passaram sem erro.

## Revalidação do gesto no UI thread — 2026-09-05

- `sharedUi.test.tsx` passou com 40 testes. A cobertura do AC-004 inclui as
  margens geométricas, arraste para ambos os sentidos, prop atrasada, evento de
  movimento tardio, cancelamento, toque no trilho, reinício de `translationX`
  pelo Android e ponto terminal presente somente no `onEnd`.
- `pnpm typecheck`, ESLint e Prettier dos arquivos alterados e `pnpm lint:fsd`
  passaram sem erro.
- `pnpm test:ci` passou integralmente: 95 suítes, 553 testes e zero falhas.
  A execução emite avisos preexistentes de `act()` em testes de outros
  componentes, sem falhas ou regressões.
- `pnpm specs:check` executou os 23 testes internos com sucesso e validou esta
  feature; a etapa global termina vermelha somente pelos checksums divergentes
  de 22 reviews preexistentes (`MOB-FEAT-012..017`, `028..033`, `035..040` e
  `042..045`). Não há divergência de registry, cobertura ou checksum para
  `MOB-FEAT-034`.
