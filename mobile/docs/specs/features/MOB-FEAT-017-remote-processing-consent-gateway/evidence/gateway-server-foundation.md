# Evidência — fundação server-side do gateway

Data: 2026-09-02

## Escopo implementado

- oito rotas `/v1`, OpenAPI e respostas `application/problem+json`;
- capabilities fail-closed, 7 idiomas/42 pares, ETag e validade curta;
- instalação anônima com Argon2id e sessão opaca de 256 bits persistida somente
  por SHA-256;
- upload temporário limitado com inspeção real de JPEG/PNG/WebP, fingerprint,
  storage privado, idempotência e remoção best effort de órfão;
- quota UTC 20/instalação e 100/global, job+outbox atômicos, dispatch com lease,
  task determinística e retry limitado;
- consulta, cancelamento imediato ou `CANCEL_PENDING`, ACK fail-closed e cleanup;
- Terraform declarativo para GCP, com kill switch desligado e nenhum `apply`.

OCR, tradução, renderização, provider, worker e qualquer slice mobile permanecem
fora deste marco.

## Gates executados

| Gate                                   | Resultado                                                   |
| -------------------------------------- | ----------------------------------------------------------- |
| suíte completa do gateway              | pass — 53 testes, 0 falhas/erros                            |
| package do gateway                     | pass                                                        |
| TypeScript web (`npx tsc -b`)          | pass                                                        |
| busca dirigida por segredos/tokens     | pass — nenhum padrão encontrado                             |
| `git diff --check` dirigido            | pass                                                        |
| PostgreSQL Testcontainers              | pass — PostgreSQL 17.10, 8 testes de integração             |
| `terraform init -backend=false`        | pass — providers resolvidos e lockfile gerado               |
| `terraform fmt -check -recursive`      | pass                                                        |
| `terraform validate -no-color`         | pass                                                        |
| FSD web                                | pendente no host — `EMFILE` ao abrir watchers               |
| SDD mobile                             | pass — cadastro atualizado e checksums históricos renovados |
| reactor Maven completo (`./mvnw test`) | pass — 7 módulos, `BUILD SUCCESS`                           |

Os testes PostgreSQL cobrem migration/constraints, idempotência concorrente,
quotas, isolamento, rollback job+outbox, leases e sessões expiradas/revogadas.
A execução com Docker identificou e permitiu corrigir o carregamento indevido da
configuração de segurança servlet em processos headless e os binds JDBC de
`Instant` para `timestamptz` no PostgreSQL.

O Terraform foi somente inicializado e validado localmente. Nenhum `plan` ou
`apply` foi executado e nenhum recurso remoto foi criado.

Esta evidência fecha o marco server-side “Gateway primeiro”. O `MOB-FEAT-017`
continua aberto para SQLite v7, SecureStore, consentimento e integração mobile.
