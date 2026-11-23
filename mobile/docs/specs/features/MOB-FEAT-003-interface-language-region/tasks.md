# Tasks — MOB-FEAT-003

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-001`

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                             |
| -------- | ------------------ | ------------------------------------------------------------------------------- |
| AC-001   | TASK-001           | Normalização do locale no i18n e hidratação do settings store                   |
| AC-002   | TASK-002           | Integração store/i18n com troca sem remontagem e persistência                   |
| AC-003   | TASK-003           | Testes do cliente HTTP para request comum, autenticação e refresh               |
| AC-004   | TASK-004           | Query consumidora real e teste do invalidator por metadata dependente de locale |
| AC-005   | TASK-005           | Gate Jest de paridade trilíngue e consumidor por namespace                      |
| AC-006   | TASK-006           | Leitor apresenta literalmente label localizado recebido da API                  |
| AC-007   | TASK-007           | Testes unitários dos três formatos, locale ativo e ano                          |
| AC-008   | TASK-007           | Testes de virada de dia, timezones aceitos e fallback seguro                    |
| AC-009   | TASK-008           | Teste do settings store para atualização local, PATCH integral, falha e retry   |
| AC-010   | TASK-003, TASK-006 | Integração entre locale da UI, header e cadeia autenticada mantida pela Core    |

## Checklist

- [x] TASK-001 — Consolidar normalização de idioma, formatos de data e timezones suportados.
- [x] TASK-002 — Aplicar a troca de idioma imediatamente pelo settings store e preservar a hidratação local-first.
- [x] TASK-003 — Garantir `Accept-Language` em requests comuns, autenticação e refresh sem vínculo com idioma de conteúdo.
- [x] TASK-004 — Invalidar seletivamente queries marcadas como dependentes de locale.
- [x] TASK-005 — Expandir o gate automatizado de namespaces para paridade e consumidores reais.
- [x] TASK-006 — Preservar labels de domínio já localizados pela Core sem tradução paralela.
- [x] TASK-007 — Implementar formatadores compartilhados de data, número e moeda com fallback seguro.
- [x] TASK-008 — Evidenciar sincronização regional autenticada, erro pendente e retry pelo contrato de settings.
- [x] TASK-009 — Executar testes focados, typecheck e lint FSD e registrar as evidências.

## Riscos e bloqueios

- A cadeia de idiomas de conteúdo permanece responsabilidade de `MOB-FEAT-004`; esta implementação não cria nem promove preferências de conteúdo.
- A invalidação seletiva depende de queries consumidoras declararem explicitamente metadata de dependência de locale.
- Não existem novas superfícies de configurações nesta spec; a navegação continua reservada a `MOB-FEAT-008`.

## Evidências executadas

- `CI=true pnpm check`: specs, TypeScript, ESLint, Steiger, formato e 32 suítes/121 testes aprovados, sem snapshots.
- `pnpm typecheck`: aprovado.
- ESLint e Prettier focados nos arquivos da MOB-FEAT-003: aprovados.
- `pnpm lint:fsd`: aprovado sem novas exceções ou regras desabilitadas.
