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

Para iniciar Core ou jobs em um clone novo, inclua a preparação no mesmo reactor:

```bash
./mvnw -pl apps/core -am test-compile spring-boot:run
```

O agregador e esta biblioteca configuram o plugin Spring Boot com `skip=true`;
somente o serviço escolhido inicia. A biblioteca continua sendo um JAR comum de
escopo `test`, sem necessidade de instalação prévia no repositório Maven local.
