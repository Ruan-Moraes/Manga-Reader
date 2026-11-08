# Tasks — MOB-FEAT-057

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: nenhuma (`blocked_by: []`)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                                 |
| -------- | ------------------ | ----------------------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-002 | `appearance.test.ts`/`ThemeProvider.test.tsx` por densidade; busca por literais     |
| AC-002   | TASK-003           | teste das quatro paletas e contraste; RNTL de `StatusMessage` por tom               |
| AC-003   | TASK-004, TASK-005 | RNTL do `BottomSheet`; testes existentes do `SelectField` (042) verdes              |
| AC-004   | TASK-006           | RNTL de `ActionSheet` e `ConfirmSheet` (fechar→executar, cancelar sem efeito)        |
| AC-005   | TASK-007           | RNTL por `kind` e modo; `@ts-expect-error` para ações obrigatórias; `EmptyState` verde |
| AC-006   | TASK-008           | RNTL de rótulo/anúncio de `LoadingBlock` e `ListSkeleton`; movimento reduzido        |
| AC-007   | TASK-009           | RNTL de `SectionHeader`, `SectionAction` e `TextAction` (tons e área de toque)       |
| AC-008   | TASK-010           | RNTL de seleção, geometria estável, área de toque e empilhamento do segmentado      |
| AC-009   | TASK-011           | testes existentes do `RangeSlider` (034) verdes e RNTL da apresentação               |
| AC-010   | TASK-012           | RNTL do `SwatchPicker` com largura medida simulada; captura iOS claro/escuro         |
| AC-011   | TASK-013           | RNTL do `ChoiceGroup` empilhado (altura, rádio, descrição, geometria)                |
| AC-012   | TASK-014           | RNTL das alturas do `ListRow` e regressão dos consumidores atuais                   |
| AC-013   | TASK-015           | registro de presença e tamanho dos assets em `evidence/`                            |
| AC-014   | TASK-016           | RNTL com `fontScale` 2 e largura 320; capturas no iOS Simulator; Android físico     |
| AC-015   | TASK-017, TASK-018 | barrel, `coverage.json`, i18n nos três idiomas, `pnpm lint:fsd`, `typecheck`, testes |

## Checklist

- [ ] TASK-001 — Adicionar ao tema os grupos de medida (ícones, tiles, linhas, alturas de controle, chips, ritmo com `itemGap` por densidade, barra de acento, sombras, movimento) em `src/shared/theme/appearance.ts` e expô-los no contexto de `ThemeProvider.tsx` e no barrel `src/shared/theme/index.ts`.
- [ ] TASK-002 — Testar os grupos de medida por densidade e o zeramento das durações com movimento reduzido efetivo (`appearance.test.ts`, `ThemeProvider.test.tsx`).
- [ ] TASK-003 — Adicionar `dangerSoft`, `successSoft` e `warnSoft` em `tokens.ts` (claro/escuro) e nas paletas de alto contraste de `appearance.ts`; aplicar a superfície suave por tom em `StatusMessage.tsx`; testar paletas, contraste AA e `StatusMessage`.
- [ ] TASK-004 — Criar `src/shared/ui/BottomSheet.tsx` (cabeçalho com título/descrição/fechar, ritmo `lg`, rodapé com divisória, raio `feature`, scrim, sombra `sheet`, safe area, altura máxima parametrizável com padrão 85%, back Android, sem animação com movimento reduzido) e seus testes.
- [ ] TASK-005 — Montar a folha do `SelectField.tsx` sobre `BottomSheet`, preservando 82%, opções de 56 dp, padding `xl`, área de 28 dp e cancelamento sem `onChange`; manter verdes os testes da 042.
- [ ] TASK-006 — Criar `ActionSheet.tsx` e `ConfirmSheet.tsx` sobre `BottomSheet`, com grupos destrutivos separados, execução após o fechamento e cancelamento por botão, scrim e back sem confirmar; testes.
- [ ] TASK-007 — Criar `StateView.tsx` (`empty`/`error`/`offline`/`notfound`, tela cheia e inline, ilustração substituível, semântica `alert`/`status`, ações obrigatórias tipadas para `error` e `notfound`, ilustração oculta com fonte ampliada ou altura baixa); manter `EmptyState` compatível; testes, incluindo de tipos.
- [ ] TASK-008 — Criar `LoadingBlock.tsx` e `ListSkeleton.tsx` (composto de `Skeleton`, linhas `double`, rótulo acessível); testes com movimento reduzido.
- [ ] TASK-009 — Criar `SectionHeader.tsx`, `SectionAction.tsx` e `TextAction.tsx` com os tons e as alturas da spec e área de toque mínima; testes.
- [ ] TASK-010 — Ajustar `SegmentedControl.tsx` ao contêiner único (segmento visual 40, raio `sm`, ativo em acento, borda de espessura constante, área de toque ≥ alvo mínimo), preservando o empilhamento da 032; testes.
- [ ] TASK-011 — Ajustar a apresentação de `RangeSlider.tsx` (pílula de valor, trilho, polegar preenchido, rótulos de mínimo e máximo) sem alterar a interação da 034/AC-004; testes.
- [ ] TASK-012 — Reescrever a apresentação de `SwatchPicker.tsx` para amostras separadas por `sm`, mesma largura numérica medida, altura 48, borda constante e check em círculo, com rótulo abaixo (substitui 034/AC-003); testes.
- [ ] TASK-013 — Ajustar `ChoiceGroup.tsx` empilhado (altura mínima 56, rádio 22 centralizado, descrição por opção, seleção sem mudança geométrica); testes.
- [ ] TASK-014 — Adicionar a `ListRow.tsx` o tile de ícone opcional e as alturas `single`/`double`, sem mudar os usos atuais; testes de regressão dos consumidores.
- [ ] TASK-015 — Copiar `triste`, `duvida` e `404` do Design System para `assets/images/mascot-*.png`, otimizados, e registrar origem, dimensões e tamanhos em `evidence/assets.md`.
- [ ] TASK-016 — Verificar fonte a 200%, largura 320, densidade compacta, alto contraste e movimento reduzido nas primitivas; capturas no iOS Simulator em claro e escuro; validação em Android físico (fica aberta se não for executada).
- [ ] TASK-017 — Exportar as primitivas novas em `src/shared/ui/index.ts`, adicionar as chaves internas em `common.json` (`pt-BR`, `en-US`, `es-ES`) e uma entrada individual por arquivo novo em `docs/specs/coverage.json`.
- [ ] TASK-018 — Executar `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:ci` e `pnpm check`; registrar `review.md`, `drift-audit.md` e o resultado, separando as falhas de checksum pré-existentes.

`implemented` exige todos os checkboxes concluídos. Quando o código estiver pronto, mas uma verificação real ainda estiver aberta, usar `verification-pending` e manter a task correspondente desmarcada.

## Riscos e bloqueios

- `pnpm check` está vermelho antes desta feature por checksums de review divergentes em 017, 018, 019, 021, 025, 026, 027, 049, 050, 051, 052, 053 e 054. Sem re-revisão humana, TASK-018 não fica verde por esse motivo.
- TASK-005, TASK-010 a TASK-014 mudam a aparência de consumidores existentes (Configurações, leitor, tradução); os testes desses consumidores precisam continuar verdes.
- `SegmentedControl`, `RangeSlider` e `SwatchPicker` são usados pela folha do leitor (`widgets/content-reader`, área da 055 em execução); esta feature não edita arquivos do widget.
- Validação em Android físico depende de aparelho; sem ela, a feature termina em `verification-pending`.
