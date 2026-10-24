# Tasks — MOB-FEAT-046

- Spec: `spec.md`
- Status da spec no planejamento: `implemented`
- Gate no planejamento: `open`
- Dependências implementadas: nenhuma

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                          |
| -------- | -------- | -------------------------------------------- |
| AC-001   | TASK-001 | manifesto, lockfile e `expo install --check` |
| AC-002   | TASK-002 | suíte de gates do módulo mobile              |
| AC-003   | TASK-003 | smoke test observado no Simulator            |
| AC-004   | TASK-004 | diagnóstico de toolchain e registro nativo   |

## Checklist

- [x] TASK-001 — Atualizar o grafo para Expo SDK 57 e remover módulos nativos ociosos.
- [x] TASK-002 — Adaptar incompatibilidades e executar os gates automatizados.
- [x] TASK-003 — Reiniciar e percorrer os fluxos críticos no simulador iOS.
- [x] TASK-004 — Registrar requisitos e executar/registrar a verificação Android física.

## Riscos e bloqueios

- Nenhum bloqueio aberto. JDK 17 e ADB estão disponíveis; o shell continua usando
  JDK 23 por padrão, então execuções Android locais devem definir `JAVA_HOME`
  explicitamente.
