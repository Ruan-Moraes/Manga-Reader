# Tasks — MOB-FEAT-061

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: MOB-FEAT-057 (`verification-pending`, primitivas executadas)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                           |
| -------- | ------------------ | ------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-005 | RNTL das três páginas (papéis tipográficos, imagem de 152)    |
| AC-002   | TASK-002, TASK-005 | RNTL dos erros do cadastro                                    |
| AC-003   | TASK-003, TASK-005 | RNTL da tela de enviado (sucesso, falha, espera de reenvio)   |
| AC-004   | TASK-004           | testes existentes de `features/authenticate` e do gate verdes |
| AC-005   | TASK-005           | RNTL que confirma ausência dos controles sem contrato         |
| AC-006   | TASK-006, TASK-007 | chaves nos três locales; RNTL com `fontScale` 2; capturas iOS |
| AC-007   | TASK-008           | `pnpm lint:fsd`, `pnpm typecheck`, testes, `coverage.json`    |

## Checklist

- [x] TASK-001 — Aplicar o cabeçalho padrão (eyebrow, título `display`, texto de apoio) em `src/pages/login/ui/LoginPage.tsx`, `src/pages/register/ui/RegisterPage.tsx` e `src/pages/forgot/ui/ForgotPage.tsx`, e a imagem de login de 152 com raio `card` (ajustando `features/authenticate/ui/AuthHeader.tsx` se necessário); rodapés em `TextAction`.
- [x] TASK-002 — Trocar os erros de termos e gerais do cadastro por `AppText` (`caption`, tom de perigo, papel de alerta).
- [x] TASK-003 — Reescrever a tela de enviado da recuperação com ilustração, pílula, título `display`, texto neutro, "Link enviado para <e-mail>", cartão de próximos passos e reenvio com a espera atual, sem `Text` cru.
- [x] TASK-004 — Confirmar que requests, validações, retorno seguro, recuperação neutra e credenciais demo não mudam, rodando os testes atuais.
- [x] TASK-005 — Criar `src/pages/login/ui/__tests__/LoginPage.test.tsx`, `src/pages/register/ui/__tests__/RegisterPage.test.tsx` e `src/pages/forgot/ui/__tests__/ForgotPage.test.tsx` cobrindo AC-001, AC-002, AC-003 e AC-005.
- [x] TASK-006 — Adicionar as chaves novas em `auth.json` (`pt-BR`, `en-US`, `es-ES`) e testar a paridade.
      Execução: nenhuma chave nova. A tela de enviado reaproveita `sentNextSteps`, `sentStep1..3`, `sentSubtitle` e `sentExpiry*`, que já existiam sem uso; `sentStep1` e `sentStep2` ficaram genéricos nos três idiomas (sem citar assunto do e-mail). O prazo do link continua vindo da resposta da Core (`expiresInSeconds`) ou do texto de validade limitada.
- [ ] TASK-007 — Verificar fonte a 200%, 320 pt, alto contraste e temas; capturas das três telas e da tela de enviado no iOS Simulator (fica aberta se não for executada).
- [ ] TASK-008 — Mapear arquivos no `coverage.json`, rodar `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:ci` e `pnpm check`, e registrar review e drift.

`implemented` exige todos os checkboxes concluídos. Quando o código estiver pronto, mas uma verificação real ainda estiver aberta, usar `verification-pending` e manter a task correspondente desmarcada.

## Riscos e bloqueios

- `pnpm check` falha antes desta feature pelos 13 checksums de review divergentes; registrar separadamente.
- As páginas de auth não têm testes de página hoje; os novos testes precisam simular `features/authenticate` sem chamar a Core.
- "Manter sessão ativa", novidades e prazo do link ficam fora (D6).
