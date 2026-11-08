# Tasks — MOB-FEAT-059

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: MOB-FEAT-057 (`verification-pending`, primitivas executadas)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                 |
| -------- | ------------------ | ------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-005 | RNTL do `ModuleSelector` (papéis tipográficos, proporção da imagem) |
| AC-002   | TASK-002, TASK-005 | RNTL do `AppModuleCard` (status, tile, altura mínima)               |
| AC-003   | TASK-003, TASK-005 | RNTL da folha para visitante e autenticado; fechar por cada meio    |
| AC-004   | TASK-004, TASK-005 | RNTL da navegação para a biblioteca                                 |
| AC-005   | TASK-004, TASK-005 | RNTL com `__DEV__` falso                                            |
| AC-006   | TASK-006, TASK-007 | chaves nos três locales; RNTL com `fontScale` 2; capturas iOS       |
| AC-007   | TASK-008           | testes da 010 verdes; `pnpm lint:fsd`, `pnpm typecheck`; coverage   |

## Checklist

- [ ] TASK-001 — Em `src/pages/launcher/ui/ModuleSelector.tsx` e `EditorialHero.tsx`, aplicar título `display`, texto de apoio muted e imagem 16:9 com raio `card` e borda `separator`.
- [ ] TASK-002 — Reestilizar `src/pages/launcher/ui/AppModuleCard.tsx` (altura 88, tile `feature`, ícone 24, título `section`, descrição `caption`, linha de status com ponto, chevron 20).
- [ ] TASK-003 — Em `ModuleSelectorPage.tsx`/`ModuleSelector.tsx`, abrir a `BottomSheet` da plataforma no toque do cartão; "Entrar na plataforma" leva visitante ao login com `returnTo` de `/platform/status` e autenticado a `/platform/status`; "Agora não", fechar, scrim e voltar só fecham.
- [ ] TASK-004 — Adicionar a `TextAction` "Abrir biblioteca local" para `/translation-library` e manter o atalho de preview de novel só em `__DEV__` (D13).
- [ ] TASK-005 — Atualizar `src/pages/launcher/ui/__tests__/ModuleSelectorPage.test.tsx` cobrindo AC-001 a AC-005 sem perder os casos da 010.
- [ ] TASK-006 — Adicionar as chaves novas em `launcher.json` (`pt-BR`, `en-US`, `es-ES`) e testar a paridade.
- [ ] TASK-007 — Verificar fonte a 200%, 320 pt, alto contraste e temas; capturas do Início e da folha no iOS Simulator (fica aberta se não for executada).
- [ ] TASK-008 — Mapear arquivos no `coverage.json`, rodar `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:ci` e `pnpm check`, e registrar review e drift.

`implemented` exige todos os checkboxes concluídos. Quando o código estiver pronto, mas uma verificação real ainda estiver aberta, usar `verification-pending` e manter a task correspondente desmarcada.

## Riscos e bloqueios

- `pnpm check` falha antes desta feature pelos 13 checksums de review divergentes; registrar separadamente.
- O retorno seguro do login (010/AC-005) não pode mudar; a folha só reaproveita o destino atual.
