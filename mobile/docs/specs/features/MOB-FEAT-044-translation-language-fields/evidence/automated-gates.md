# Evidência automatizada — MOB-FEAT-044

Data: 2026-08-31. Execução sobre a working tree compartilhada, sem alterar banco,
controller, fluxo de navegação ou dependências.

## Testes

- Red anterior à implementação: 3 suítes falharam, 9 testes falharam e 32 passaram;
  falhas esperadas por ausência dos novos campos/variante e pela hierarquia antiga.
  Log da sessão: `/tmp/manga-language-red-tests.log`.
- Suíte completa final: 87 suítes, 501 testes aprovados. Log da sessão:
  `/tmp/manga-language-full-tests.log`.
- Painel: duas listas independentes, sete opções, PT-BR prioritário, descrição
  recomendada somente na folha, cancelamento por botão/scrim/escape/back, par
  inválido, persistência, confirmação, rollback/retry e busy/reabertura/reconfirmação.
- Shared UI: default preservado, input com superfície aplicada em View,
  foco visual, callbacks assistivos com refs simuladas, temas claro/escuro,
  movimento reduzido e nomes sem limite de linhas. Isso não substitui medição
  nativa de fonte ampliada ou uso de VoiceOver/TalkBack.
- Integração da página: dois campos após revisão e ausência de HTTP.
- Testes existentes de controller/repository, matriz de pares e demais telas
  permaneceram na suíte completa; nenhum teste foi eliminado para liberar o gate.

## Gates

- `pnpm typecheck`: pass.
- `pnpm lint`: pass.
- `pnpm lint:fsd`: pass (5 testes do validador + Steiger + validação local).
- `pnpm format:check`: pass no mobile completo, sem format/--fix.
- `pnpm check`: bloqueado no specs:check pelos checksums de reviews históricas
  que já falhavam antes da primeira edição. Não foram regravados nem autoaprovados;
  os 23 testes dos validadores passam e os demais gates foram rodados separadamente.
- Web, `npx tsc -b`: pass, sem alteração de código web.
- Backend, `./mvnw test`: falha de ambiente, incluindo Docker/TestContainers
  indisponível (`/var/run/docker.sock` ausente). Nenhum código backend foi alterado.

## Ajuste de padronização — 2026-09-01

- A variante `input` usa `layout.controlHeight` (52 px), ainda respeitando o
  alvo mínimo de toque da plataforma; a variante padrão não foi alterada.
- A seta entre origem e destino mede 28 px, continua decorativa e permanece
  fora da árvore de acessibilidade.
- Testes focados: 2 suítes e 37 testes aprovados com
  `pnpm exec jest --runInBand src/shared/ui/__tests__/sharedUi.test.tsx src/features/select-translation-languages/ui/__tests__/TranslationLanguageSelectionPanel.test.tsx`.

Os logs em `/tmp` são auxiliares da sessão; o resumo, critérios e capturas deste
diretório são os artefatos persistidos. Uma falha temporária em testes de legendas
do ProgressSteps ocorreu durante edições concorrentes e desapareceu na suíte
final; esse componente não foi alterado por esta implementação.
