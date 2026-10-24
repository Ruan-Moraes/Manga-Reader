# Tasks — MOB-FEAT-049

- Spec: `spec.md`
- Status da spec: `verification-pending`
- Gate no planejamento: `open`
- Dependências implementadas: nenhuma

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                             |
| -------- | -------- | ----------------------------------------------- |
| AC-001   | TASK-001 | manifesto Expo e testes de configuração         |
| AC-002   | TASK-002 | geração determinística e busca por divergências |
| AC-003   | TASK-003 | testes de storage e arquivos privados           |
| AC-004   | TASK-004 | paridade trilíngue e `pnpm check`               |

## Checklist

- [x] TASK-001 — Atualizar metadados Expo e configuração gerada.
- [x] TASK-002 — Centralizar nome, URLs e contatos no artefato gerado.
- [x] TASK-003 — Adotar nomes Toonlira no banco, chaves, arquivos e exportações.
- [ ] TASK-004 — Sanear o gate de formatação sem aplicar rewrite destrutivo de JSX.

## Riscos e bloqueios

- Não existe migração da instalação da marca anterior por decisão aprovada.
- `format:check` possui divergências anteriores e novas que exigem revisão manual.
