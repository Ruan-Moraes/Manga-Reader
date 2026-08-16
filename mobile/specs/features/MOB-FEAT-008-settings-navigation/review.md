# Review — MOB-FEAT-008

- Spec revisada: `spec.md`
- Implementação/revisão: commit 177e7f3b5c97ee524227421dff075fe1a2fb8ebe
- Gate na entrada do planejamento: `open`
- Dependências verificadas: `MOB-FEAT-002`, `MOB-FEAT-003`, `MOB-FEAT-004`, `MOB-FEAT-005`, `MOB-FEAT-006` e `MOB-FEAT-007` (`implemented`)
- Verdict: `approved`

## Findings e resolução

1. **Resolvido — segundo ciclo para o mesmo `returnTo`.** `SessionGate` agora associa o consumo ao par `identityEpoch + route`. Rerenders da mesma tentativa não repetem `replace`, enquanto logout/expiração e autenticação posterior incrementam a identidade e permitem retornar novamente ao mesmo destino. O teste cobre dois ciclos sucessivos para `/settings/privacy`, além de rejeição de URL externa.
2. **Resolvido — flash de preferências guest/default.** `SettingsAccountBoundary` bloqueia sincronicamente a subtree quando a identidade do store não corresponde à sessão ou a hidratação autenticada ainda está em `syncing` sem pending. A UI só é liberada após `synced` ou quando existe edição pendente válida; erro inicial mantém os valores desmontados e oferece retry localizado. Testes com promise controlada cobrem hidratação, frame A→B, erro/retry e restauração guest no logout.
3. **Resolvido — evidência de navegação, acesso e hidratação.** A nova integração renderiza Profile, índice e as sete pages reais, verifica os sete destinos, back, remount com edição preservada e zero request `/users/me` para content languages, privacy e ações privadas de data em guest. `SessionGate.test.tsx` cobre path preservado em cold hydration, rerender warm sem duplicação, unknown sem loop, allowlist e contagem de `replace`. `coverage.json` agora contém evidência explícita para `AC-006`.

Nenhum finding acionável permanece.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                                                      | Resultado               |
| -------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| AC-001   | sim          | manifesto e índice possuem exatamente sete capacidades reais; ausências Web/notificações verificadas                                      | pass                    |
| AC-002   | sim          | Profile → índice, sete destinos, pages localizadas, back e remount preservando edição confirmada                                          | pass                    |
| AC-003   | sim          | cold hydration preserva path, warm rerender não navega novamente, unknown segue ao not-found sem loop e root registra settings/+not-found | pass                    |
| AC-004   | sim          | matriz local/mixed/private, allowlist de retorno, dois ciclos do mesmo destino e Axios Mock Adapter provando zero `/users/me` em guest    | pass                    |
| AC-005   | sim          | projeções canônicas por grupo, pending/syncing/synced/error, resposta obsoleta e retry da versão mais nova                                | pass                    |
| AC-006   | sim          | boundary síncrono e promise remota controlada impedem montar valores selecionáveis antes da hidratação autenticada                        | pass                    |
| AC-007   | sim          | metadados opcionais, filtro HTTPS, configuração vazia, abertura nativa, falha e retry localizado                                          | pass                    |
| AC-008   | sim          | ordem, roles, labels/hints, live regions, reflow e alvos mínimos possuem evidência automatizada; matriz física não executada              | pass com risco residual |
| AC-009   | sim          | dois ciclos de sessão, A→B/logout síncronos, URL externa rejeitada, falhas recuperáveis e ausência de redirects duplicados                | pass                    |

## Cobertura e FSD

- Todos os arquivos runtime e de evidência da MOB-FEAT-008 estão classificados individualmente em `coverage.json`; arquivos descobertos: **0**.
- Todos os `AC-001`…`AC-009` possuem ao menos uma evidência mapeada; `AC-006` aponta ao teste específico do `SettingsAccountGate`.
- `pnpm lint:fsd` passou. Cascas Expo permanecem finas, pages usam APIs públicas e não há import horizontal entre features.
- Os catálogos `pt-BR`, `en-US` e `es-ES` mantêm paridade e fallback `pt-BR`.
- Não há URLs externas inventadas nem notificações, importação, newsletter, footer, atalhos, reload ou quota expostos como controles.
- Registry, `MOB-BASE-008/OBS-002` e reconciliação permanecem coerentes com a substituição parcial da composição do Profile.

## Gates

| Comando                                                             | Resultado                                                                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| testes focados da segunda revisão                                   | pass — 6 suítes, 31 testes, 0 snapshots                                                        |
| `CI=true pnpm check`                                                | pass — 15 testes do validador; 19 artefatos; 372 arquivos; 56 suítes e 237 testes; 0 snapshots |
| `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format:check` | pass no gate completo                                                                          |

## Auditoria de drift

| Indicador                           | Resultado |
| ----------------------------------- | --------: |
| `mismatch` da MOB-FEAT-008          |         0 |
| evidências obsoletas/inadequadas    |         0 |
| `undocumented`                      |         0 |
| arquivos runtime descobertos        |         0 |
| matriz física iOS/Android executada |         0 |

Não foi identificada mudança de intenção, supersession incompleta ou violação de gate. Os três findings anteriores eram código/evidência divergentes e foram reconciliados pelo Executor sem alterar a Target Spec.

## Mudanças fora da spec

Nenhuma. As capacidades Web proibidas e notificações permanecem fora da superfície.

## Limitações de ambiente

- A matriz física iOS/Android com VoiceOver/TalkBack, fonte ampliada, alto contraste e densidade compacta **não foi executada** e não é alegada como evidência.
- A navegação foi verificada em integração de componentes/pages com os adapters do Expo Router controlados; não foi executado E2E em dispositivo. Os riscos automatizáveis de path, contagem, acesso e remount estão cobertos, e a validação física permanece checklist de release conforme `MOB-DEC-002`.

## Conclusão

Os três findings da primeira rodada foram resolvidos e possuem testes de regressão proporcionais ao risco. Todos os nove critérios estão implementados, os gates estão verdes, não há arquivo descoberto ou drift documental, e os contratos de guest, conta, hidratação e retorno permanecem isolados. O verdict é `approved`; MOB-FEAT-008 pode ser promovida para `implemented`.
