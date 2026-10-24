# Testing Support

JAR interno, usado exclusivamente durante testes dos serviços do backend. Ele
centraliza fixtures e configurações compartilhadas de Testcontainers, sem
conter contratos ou código de produção.

Atualmente fornece `Mongo8TestContainerFactory`, a fonte única da imagem,
timeout e workaround operacional do MongoDB 8 usado nos testes de integração.

O módulo é resolvido pelo reactor de [`../../pom.xml`](../../pom.xml). Para compilar
ou testar um consumidor, execute a partir de `api/`:

```bash
./mvnw -pl apps/core -am test
./mvnw -pl apps/jobs/trending-aggregator -am test
```
