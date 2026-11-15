# Tasks — MOB-FEAT-064

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-008`, `MOB-FEAT-017` e `MOB-FEAT-061`

## Decisões de implementação

- Os destinos ficam em `app.json` (`expo.extra.externalLinks.terms` e `.privacy`), o mecanismo de MOB-FEAT-008.
  Sem destino configurado, Login e Cadastro não mostram os links (sem affordance falsa).
- No Cadastro, os links ficam numa linha própria abaixo da caixa de aceite, e não dentro do texto dela: dentro da
  caixa o leitor de tela não alcança os links e um toque errado marcaria o aceite.
- No consentimento de tradução, os destinos continuam vindo da capability. Apontar `GATEWAY_TERMS_URL` e
  `GATEWAY_PRIVACY_POLICY_URL` para o site do app é configuração de implantação do gateway, fora deste código.

## Rastreabilidade

| Critério | Tasks                        | Evidência planejada                                                                                    |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| AC-001   | TASK-001, TASK-002, TASK-003 | `LoginPage.test.tsx`: links abrem os destinos; campos preservados; falha mostra erro e nova tentativa. |
| AC-002   | TASK-002, TASK-004           | `RegisterPage.test.tsx`: links não mudam o aceite; envio bloqueado com a caixa desmarcada.             |
| AC-003   | TASK-001, TASK-005           | `SettingsAboutPage` lista os dois links configurados; nova tentativa já existente.                     |
| AC-004   | TASK-006                     | Testes de página única e lote: link abre o destino da capability; falha mostra erro e nova tentativa.  |

## Checklist

- [x] TASK-001 — Configurar `expo.extra.externalLinks` com os destinos de termos e privacidade.
- [x] TASK-002 — Criar em `features/authenticate/ui` a linha de links legais com erro localizado e nova tentativa.
- [x] TASK-003 — Usar a linha no Login.
- [x] TASK-004 — Usar a linha no Cadastro, abaixo da caixa de aceite.
- [x] TASK-005 — Conferir Sobre com os links configurados.
- [x] TASK-006 — Tratar a falha de abertura nos consentimentos de página única e de lote.
- [ ] TASK-007 — Testes, `coverage.json`, gates e verificação no simulador iOS (feitos em 2026-11-13: Termos abriu no Safari, Sobre lista os dois links). Falta a abertura real no Android.

## Notas de execução

- O botão de nova tentativa diz "Tentar abrir de novo" porque o painel de lote já tem um "Tentar novamente" para o
  serviço de tradução.
- Os rótulos usam a mesma caixa de Sobre e do site ("Termos de uso", "Política de privacidade"); o texto da caixa
  de aceite do Cadastro foi alinhado.

## Riscos e bloqueios

- Abertura real em Android não verificada nesta sessão.
- O gateway implantado precisa expor os mesmos destinos; não verificável sem o gateway.
