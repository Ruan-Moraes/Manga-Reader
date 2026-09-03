# Evidência — fundação mobile do processamento remoto

Data: 2026-09-03

## Escopo implementado

- SQLite privado v7 com consentimentos versionados, attempts, FKs, CHECKs,
  unicidades e transições atômicas de attempt/página/projeto;
- capabilities e envelopes remotos validados por Zod, sempre fail-closed;
- origem HTTPS restrita, timeout/cancelamento, redirects bloqueados, limite de
  resposta e multipart sem filename, path ou IDs locais;
- instalação anônima com credencial longa no SecureStore e bearer curto somente
  em memória, revogado localmente em `401/403`;
- consentimento explícito, attempt durável, submissão idempotente da primeira
  página, replay após `404` confirmado e recovery no bootstrap/foreground;
- cancelamento com distinção entre request local, `CANCEL_PENDING` e confirmação
  terminal;
- widget acessível com disclosure e estados equivalentes em pt-BR, en-US e
  es-ES.

O gateway permanece desabilitado por padrão. Sem origem HTTPS, configuração
legal válida e capabilities habilitadas, nenhum byte de mídia é enviado.

## Gates executados

| Gate                                    | Resultado                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm typecheck`                        | pass                                                                           |
| testes dirigidos MOB-FEAT-017           | pass — 8 suítes, 36 testes                                                     |
| ESLint dirigido aos arquivos da feature | pass                                                                           |
| `pnpm lint:fsd`                         | pass — zero problemas                                                          |
| suíte mobile completa                   | pass — 95 suítes, 545 testes                                                   |
| lint mobile completo                    | pass                                                                           |
| format mobile completo                  | pass                                                                           |
| SDD                                     | cadastro obsoleto removido; checksums globais renovados na árvore estabilizada |

## Verificações externas abertas

- operador, contato e URLs legais públicos e verdadeiros;
- configuração cloud habilitada com disclosure correspondente;
- upgrade SQLite v6→v7, SecureStore, recovery após process kill e leitor de tela
  em Android físico;
- secret scan do AAB de release.

Esses itens impedem promover a feature para `implemented`, mas não liberam um
fallback otimista: o runtime permanece fail-closed até todos serem satisfeitos.
