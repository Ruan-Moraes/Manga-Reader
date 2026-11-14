# runtime/

| Arquivo | Função |
| --- | --- |
| `gateway-runtime.test.mjs` | Verifica no `pom.xml` as versões de Java/Spring Boot do gateway e que o restante do reactor (core, jobs, testing-support) permanece em Java 23. |

> Falha no baseline: o teste espera Java 25 no gateway e o `pom.xml` declara 23.
