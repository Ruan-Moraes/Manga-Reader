# Evidência automatizada — MOB-FEAT-043

Data: 2026-08-30

## Manutenção dos TODOs

- `reviewSortGeometry.test.ts`: limites de linha/coluna, slots com altura medida,
  grade de coluna única, auto-scroll por tempo com limites e ordem sem perda.
- `LocalMediaReviewPanel.test.tsx`: movimento dos slots sem render React ou
  callback RN por destino; indicador sem alterar bordas; auto-scroll com dedo
  parado; segundo gesto após scroll; cancelamento, resize e finalize duplicado;
  redução de movimento; ícone branco nos temas; ordem otimista, persistência,
  rollback/retry, acessibilidade, i18n e virtualização de 100 páginas.
- `reviewLocalMediaImport.test.ts`: contrato de ordem completa e ações assistivas.
- Regressão iOS: clipping desativado durante início/cancelamento/drop em Grade
  e Lista com 100 imagens; 2 casos falharam antes da mitigação e passaram depois.
  O slice passou com 3 suítes / 37 testes na investigação do crash.
- `AuthHeader.test.tsx`: descrição da arte em pt-BR, en-US e es-ES.
- Testes visuais antigos foram reconciliados com a copy curta e o botão compacto
  já presentes na working tree. No `sharedUi.test.tsx`, apenas a expectativa de
  padding/altura do SelectField foi ajustada ao componente previamente editado;
  seu runtime não foi alterado por esta manutenção.

## Gates executados

- 4 suítes dirigidas, 39 testes aprovados.
- `pnpm typecheck`, `pnpm lint` e `pnpm lint:fsd`: aprovados.
- Exportação Expo para iOS/Hermes: aprovada em `/tmp/mobile-todos-ios-export`.
- `pnpm check`: resultado final registrado no review; inclui a suíte completa.

## Limite da evidência

O mock de animação reavalia estilos ao ler SharedValues, sem causar render React.
Ele cobre as transições e o contrato JS, mas não mede FPS nem substitui o gesto
real. O atraso de 200 ms nunca foi reduzido para facilitar validação.

## Refinamento aprovado do arraste

A suíte final do refinamento passou com 87 suítes / 495 testes. As três suítes
dirigidas do slice passaram com 51 testes, incluindo espera de animação/layout,
rollback rápido, ref nativa vazia e ref de célula reutilizada em Lista. Os
exports Hermes Android e iOS passaram. Ver `drag-polish.md` para regressões
red/green, testes nativos de callbacks e a matriz física ainda pendente.

## Preview compartilhado — 2026-09-01

- Três suítes dirigidas passaram com 43 testes: componente compartilhado,
  Ordenação e Validação.
- A suíte completa passou com 88 suítes e 511 testes.
- `pnpm typecheck`, `pnpm lint:fsd` e `pnpm format:check`: aprovados.
- Os 23 testes do gate SDD passaram; a validação final de checksums continua
  bloqueada pelo snapshot compartilhado divergente, agora com 22 specs listadas.
- RNTL confirmou Grade → folha → preview e Lista → preview, mesma `pageSheet`,
  safe area, copy localizada, fechamento duplo e ausência de URI visível.
