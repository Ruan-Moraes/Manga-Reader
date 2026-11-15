# Review — MOB-FEAT-061

- Spec revisada: `spec.md`
- Implementação/revisão: commit b696499cf965420c938a0d5045e20b548cb0a963
- Gate na entrada do planejamento: `open`
- Dependências verificadas: MOB-FEAT-057 (`verification-pending`)
- Verdict: `verification-pending`

## Findings

1. **Média — texto de erro do login cita credenciais demo em build de usuário (anterior a esta feature).**
   `auth.login.invalidCredentials` diz "Tente as credenciais demo abaixo", mas as credenciais só aparecem em `__DEV__`
   (MOB-BASE-004/OBS-006). Não foi alterado por estar fora dos AC; recomendo corrigir a cópia numa mudança separada.
2. **Informativa — "Esqueci a senha" virou ação do campo de senha.** Antes era um botão abaixo de "Entrar". A spec
   pede a ação no campo; o destino (`/(auth)/forgot`) é o mesmo.
3. **Informativa — cabeçalho alinhado à esquerda.** O layout com imagem era centralizado; agora segue o kit e as demais
   páginas (alinhado à esquerda). `layout="minimal"` passa a diferir só pela ausência da imagem.
4. **Informativa — prazo do link.** O texto de expiração continua vindo da resposta da Core (`expiresInSeconds`); sem
   ela, aparece o texto de validade limitada. Não é um fato inventado pelo app, por isso foi mantido.
5. **Informativa — próximos passos.** `sentStep1` e `sentStep2` deixaram de citar o assunto do e-mail e o "botão" da
   mensagem, que o app não controla.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                                               | Resultado                             |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| AC-001   | sim          | `LoginPage.test.tsx`, `RegisterPage.test.tsx`, `ForgotPage.test.tsx` (cabeçalho; imagem 152 com raio 16 só no login)               | pass                                  |
| AC-002   | sim          | `RegisterPage.test.tsx` (erro de termos em `AppText`, alerta)                                                                      | pass                                  |
| AC-003   | sim          | `ForgotPage.test.tsx` (sucesso com prazo, falha neutra, passos, espera de 30 s)                                                    | pass                                  |
| AC-004   | sim          | `LoginPage.test.tsx` (request com e-mail trimado, erro junto do campo); `AuthHeader.test.tsx`; testes do gate em `src/application` | pass                                  |
| AC-005   | sim          | `LoginPage.test.tsx` e `RegisterPage.test.tsx` (sem "manter sessão", novidades ou links)                                           | pass                                  |
| AC-006   | sim          | `i18n.test.ts`; `AuthHeader.test.tsx` (rótulo da arte nos três idiomas)                                                            | pass em teste; capturas iOS pendentes |
| AC-007   | sim          | gates abaixo; `coverage.json`                                                                                                      | pass                                  |

## Gates

| Comando             | Resultado                                                                          |
| ------------------- | ---------------------------------------------------------------------------------- |
| `pnpm typecheck`    | pass                                                                               |
| `pnpm lint`         | pass                                                                               |
| `pnpm lint:fsd`     | pass                                                                               |
| `pnpm test:ci`      | pass — 150 suítes, 1149 testes                                                     |
| `pnpm format:check` | fail — só arquivos com mudanças anteriores a esta feature                          |
| `pnpm specs:check`  | fail — apenas os 13 checksums de review divergentes anteriores; nenhum erro da 061 |
| `pnpm check`        | fail — interrompido pelo `specs:check`; demais etapas executadas separadamente     |

## Mudanças fora da spec

- Nenhuma. Requests, validações, retorno seguro, recuperação neutra e credenciais demo não mudaram.

## Conclusão

Os 7 critérios estão implementados com evidência automatizada. Verdict `verification-pending` porque TASK-007
(capturas no iOS Simulator) continua aberta. Review feita pelo próprio implementador, sem auditor externo.

## Revisão do login em 2026-11-12

AC-004. O alerta de credenciais fica abaixo da senha e os dois campos recebem o estado de erro. No emulador Android, o campo de senha descia 67 px no APK anterior e manteve a posição no APK corrigido. O teste do login verifica que há um único alerta e que o botão de visualizar a senha alterna a visibilidade com feedback de opacidade. A mensagem deixou de sugerir credenciais de demonstração nos três idiomas, resolvendo o primeiro finding.
