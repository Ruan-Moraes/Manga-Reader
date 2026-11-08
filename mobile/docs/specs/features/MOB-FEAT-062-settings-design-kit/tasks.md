# Tasks — MOB-FEAT-062

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: MOB-FEAT-057 (`verification-pending`, primitivas executadas)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                   |
| -------- | ------------------ | --------------------------------------------------------------------- |
| AC-001   | TASK-001           | RNTL do `SettingsIndex` e da página do índice                         |
| AC-002   | TASK-002           | RNTL da linha de escolha (abrir, escolher, cancelar por cada meio)    |
| AC-003   | TASK-003           | RNTL dos controles de aparência (tiles, empilhamento)                 |
| AC-004   | TASK-004           | RNTL de idioma e região com persistência                              |
| AC-005   | TASK-005           | testes do editor de idiomas e RNTL da adição                          |
| AC-006   | TASK-006, TASK-007 | RNTL da página do leitor por folha; testes do painel do leitor verdes |
| AC-007   | TASK-008           | RNTL das confirmações de privacidade                                  |
| AC-008   | TASK-009           | RNTL das confirmações e estados de dados                              |
| AC-009   | TASK-010           | testes das specs 008, 031 e 032 verdes                                |
| AC-010   | TASK-011, TASK-012 | chaves nos três locales; RNTL com `fontScale` 2; capturas iOS         |
| AC-011   | TASK-013           | `pnpm lint:fsd`, `pnpm typecheck`, testes, `coverage.json`            |

## Checklist

- [x] TASK-001 — Em `src/widgets/settings-index/ui/SettingsIndex.tsx` e `SettingsSections.tsx`, usar `ListRow` com tile de ícone (64) e cabeçalho de grupo com barra 4 × 16; preservar ordem, status e bloqueio de login; atualizar os testes do widget e da página.
- [x] TASK-002 — Criar em `src/shared/ui` a linha de escolha (`ChoiceRow`) que abre `BottomSheet` com `ChoiceGroup` empilhado; testes de abrir, escolher e cancelar.
- [x] TASK-003 — Em `features/manage-settings/ui/AppearanceAccessibilityControls.tsx`, trocar o tema por três tiles com prévia e descrição ativa (empilhando em tela estreita ou fonte ampliada); testes.
- [x] TASK-004 — Em `features/manage-settings/ui/InterfaceLanguageRegionControls.tsx`, usar a linha de escolha para idioma, formato de data (com exemplo) e fuso; testes de persistência.
- [ ] TASK-005 — Em `features/manage-content-languages/ui/ContentLanguagesEditor.tsx`, número em círculo de 24 e linhas "+ Adicionar"; testes.
- [ ] TASK-006 — Em `src/pages/settings-reader/ui/SettingsReaderPage.tsx`, organizar as cinco linhas com folhas (Navegação, Imagem, Comportamento, Gestos, Texto e aparência), adicionando em `features/configure-chapter-reader` as categorias necessárias sem mudar as usadas pelo painel do leitor; preservar o ajuste Original, a qualidade condicionada, limites e persistência.
- [ ] TASK-007 — Criar testes da página do leitor por folha e manter verdes os testes de `ReaderSettingsControls`, `ReaderGestureControls`, `TextReaderControls` e do painel do leitor.
- [ ] TASK-008 — Em `features/update-privacy/ui/PrivacyControlsPanel.tsx`, trocar os `Alert` por `ConfirmSheet` com o texto atual; testes de confirmar e cancelar.
- [ ] TASK-009 — Em `features/data-controls/ui/DataControlsPanel.tsx`, reagrupar em "Neste dispositivo", "Dados offline" e "Dados da conta", manter o uso de armazenamento, mostrar o tamanho em "Limpar cache" e trocar os `Alert` por `ConfirmSheet`; testes.
- [ ] TASK-010 — Aplicar o padrão de grupo das subpáginas (barra, título `section`, cartão com blocos) em `pages/settings-*` e em `SettingsAboutPage.tsx` (links como linhas de tile), e rodar os testes das specs 008, 031 e 032.
- [ ] TASK-011 — Adicionar as chaves novas nos namespaces envolvidos (`pt-BR`, `en-US`, `es-ES`) e testar a paridade.
- [ ] TASK-012 — Verificar fonte a 200%, 320 × 568, paisagem, alto contraste e temas; capturas do índice, das subpáginas e das folhas no iOS Simulator (fica aberta se não for executada).
- [ ] TASK-013 — Mapear arquivos no `coverage.json`, rodar `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:ci` e `pnpm check`, e registrar review e drift.

`implemented` exige todos os checkboxes concluídos. Quando o código estiver pronto, mas uma verificação real ainda estiver aberta, usar `verification-pending` e manter a task correspondente desmarcada.

## Riscos e bloqueios

- `pnpm check` falha antes desta feature pelos 13 checksums de review divergentes; registrar separadamente.
- `features/configure-chapter-reader` também alimenta o painel do leitor (054, `verification-pending`): as categorias novas não podem alterar as existentes.
- `ChoiceRow` é uma primitiva nova em `shared/ui` exigida pelo AC-002 desta spec, não pela 057.
- Maior pacote dos quatro: executar em commits por seção.
