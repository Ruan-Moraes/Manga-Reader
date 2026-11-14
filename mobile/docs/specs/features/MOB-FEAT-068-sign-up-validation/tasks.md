# Tasks — MOB-FEAT-068

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependência implementada: `MOB-FEAT-061`, `verification-pending`

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                            |
| -------- | ------------------ | ------------------------------------------------------------------------------ |
| AC-001   | TASK-001, TASK-003 | `RegisterPage.test.tsx`: quatro e-mails inválidos e um com espaços nas pontas. |
| AC-002   | TASK-001, TASK-003 | `RegisterPage.test.tsx`: envio com formulário vazio sem erro na confirmação.   |
| AC-003   | TASK-001, TASK-003 | `RegisterPage.test.tsx`: confirmação vazia, diferente e igual (envio uma vez). |
| AC-004   | TASK-002, TASK-004 | Chaves nos três `auth.json`; suíte de `pages/{login,register,forgot}` verde.   |

## Checklist

- [x] TASK-001 — Em `pages/register/ui/RegisterPage.tsx`, checar o formato do e-mail aparado e aplicar as regras da confirmação descritas na spec.
- [x] TASK-002 — Ajustar o texto pt-BR de `validation.emailInvalid` para "Formato de e-mail inválido.".
- [x] TASK-003 — Escrever os testes da matriz acima e mapear no `coverage.json`.
- [x] TASK-004 — Rodar testes, `pnpm typecheck`, `pnpm lint:fsd`, Prettier nos arquivos tocados e `pnpm specs:check`.

## Riscos e bloqueios

- Nenhum bloqueio. O servidor continua sendo a validação final do e-mail.
