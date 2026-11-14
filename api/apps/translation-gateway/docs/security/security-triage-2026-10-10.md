# Triagem de segurança do gateway — 2026-10-10

Fotografia anterior à remediação. O usuário autorizou a migração isolada;
acompanhar a execução e pendências no [registro Boot 4](boot4-execution-2026-10-10.md).
As versões e o scan abaixo permanecem como baseline histórico, não novo scan.

Investigação local e consulta a fontes públicas, sem alteração de dependências,
downloads de pacotes, uso de credenciais, chamadas a providers ou deploy.
Não é aprovação de produção nem nova execução dos gates Java.

## Evidência de entrada

Relatório Trivy da imagem x86_64, descrito na
[verificação Java 25](java25-verification-2026-10-10.md#scan-local-e-triagem).
O SHA-256 foi conferido novamente nesta triagem:
`bfc656e9fd3ea946f25e577cf8cf12f47d088d47b94b3d19827ce04d0d2014f7`.
O relatório privado contém 25 ocorrências Java (sete CRITICAL, oito HIGH,
dez MEDIUM) e 18 Ubuntu (14 MEDIUM, quatro LOW). São ocorrências, não
necessariamente vulnerabilidades distintas nem provas de exploração.

Não houve novo scan, PoC, supressão ou waiver. O checksum técnico anterior
continua sendo fotografia dos fontes auditados naquela rodada; esta parcela
acrescenta somente documentação.

## Dependências Java

Versões abaixo são candidatas de remediação, **não dependências já resolvidas
ou testadas**. Uma versão mínima indicada pelo scanner não define sozinha
o conjunto compatível da aplicação.

| Família               | Versão na imagem | Candidato de correção          | Encaminhamento                                                                               |
| --------------------- | ---------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| Jackson core/databind | 2.21.4           | 2.21.7 na linha 2              | Atualizar família coordenada; preservar contratos e hashes dos manifestos.                   |
| gRPC Netty shaded     | 1.70.0           | 1.75.0 ou superior             | Resolver pelo BOM Google compatível; não substituir Netty isoladamente dentro do shaded JAR. |
| OpenTelemetry API     | 1.49.0           | 1.62.0                         | Indicação do scanner; conferir BOM e dependentes antes da alteração.                         |
| Commons Lang3         | 3.17.0           | 3.18.0                         | Indicação do scanner; testar consumidores transitivos.                                       |
| Log4j API             | 2.24.3           | 2.25.5 ou 2.26.1               | Conferir alinhamento da família, sem trocar o backend de logging.                            |
| Tomcat embed          | 10.1.55          | 10.1.58 na linha 10            | Se houver migração Boot 4, resolver a linha compatível em vez deste override.                |
| Bouncy Castle         | 1.80             | 1.85                           | Revalidar Argon2id e compatibilidade com credenciais existentes.                             |
| PostgreSQL JDBC       | 42.7.11          | 42.7.12                        | Revalidar conexão e autenticação, sem migration de schema.                                   |
| Spring MVC            | 6.2.19           | 6.2.20 enterprise ou 7.0.9 OSS | Exige decisão de linha de framework; não aplicar upgrade major silencioso.                   |

Fontes primárias consultadas: [Jackson core](https://github.com/FasterXML/jackson-core/security/advisories/GHSA-7hhh-6rmp-j9qf),
[Jackson databind](https://github.com/FasterXML/jackson-databind/releases/tag/jackson-databind-2.21.7),
[correção gRPC](https://github.com/grpc/grpc-java/commit/6462ef9a11980e168c21d90bbc7245c728fd1a7a),
[Log4j](https://logging.apache.org/security.html#CVE-2026-49844),
[Bouncy Castle](https://github.com/bcgit/bc-java/wiki/CVE%E2%80%902026%E2%80%908763),
[PostgreSQL JDBC](https://github.com/pgjdbc/pgjdbc/security/advisories/GHSA-j92g-9f8w-j867)
e os avisos Spring abaixo. Os demais candidatos permanecem indicações do
relatório do scanner, não confirmação primária independente de todos os IDs.

## Condições observadas e limites da investigação

- Spring: não foi encontrado uso explícito de `XsltView` ou SSE com fragments.
  O fornecedor classifica [CVE-2026-47884](https://spring.io/security/cve-2026-47884/)
  como MEDIUM e [CVE-2026-47890](https://spring.io/security/cve-2026-47890/)
  como LOW, diferentemente do scanner. Ambos informam correção enterprise na
  linha 6.2 e aberta na 7.0. A divergência não remove os alertas.
- Jackson: manifestos são desserializados de bytes/JSON limitados. Não foi
  encontrado parser Jackson baseado em `DataInput`, condição específica do
  aviso consultado para CVE-2026-89425. `DataInputStream` existe nos protocolos
  binários, mas isso não comprova aquele caminho Jackson. Outros alertas
  JSON continuam relevantes à triagem; não foram encontrados usos explícitos
  de default typing, `JsonView` ou `JsonUnwrapped`.
- Bouncy Castle: uso identificado via `Argon2PasswordEncoder`; não foram
  encontrados consumidores explícitos de GOST, LDAP ou validação de nomes
  X.509. Isso não constitui prova de ausência de caminhos transitivos.
- gRPC: clients de saída Vision/Translation; servidores falsos ficam em testes.
  Ausência de servidor de produção não é waiver geral para o transporte.
- Tomcat: autenticação observada via filtros Spring Security stateless; não
  foi encontrada configuração explícita de realms DIGEST/FORM ou constraints
  de servlet descritas nos avisos. Manter patch e regressão de segurança no plano.
- Não foram encontrados usos explícitos de Baggage, `MapMessage` ou
  `ClassUtils` relacionados aos demais avisos. Autoconfiguração e dependências
  transitivas ainda precisam de revisão.

Esses resultados são **inferências limitadas de busca no código**, não análise
completa de reachability, VEX aprovado ou justificativa para publicar a imagem.

## OS, JRE e codec: frente separada

O scanner indica atualização disponível para `libfreetype6`
(CVE-2026-95512) e `libpng16-16t64` (CVE-2026-46675) do Ubuntu da imagem.
Não confundir esses pacotes com cópias embarcadas no JRE. Os demais alertas OS
não têm versão corrigida indicada nesse relatório; consultar backports e
condições do fornecedor antes de propor exclusões ou mudanças de base.

O inventário de JRE/codec permanece no
[registro Java 25](java25-migration.md). FreeType/libpng/zlib embarcados e
libwebp manual exigem análise própria; a ausência na contagem Trivy não prova
segurança. A [CVE-2026-85091 do zlib](https://ubuntu.com/security/CVE-2026-85091)
continua pendente de confirmação de correção/backport e reachability nas cópias
embarcadas. Nenhum pacote foi removido ou imagem reconstruída nesta triagem.

## Decisão proposta, ainda não executada

O [plano em quatro etapas](boot4-migration-plan.md) identifica as superfícies
do código e os gates de implementação; continua pendente de aprovação.

Recomenda-se planejar migração **somente do gateway** para uma versão estável
Boot 4 que resolva os avisos Spring, coordenando também as outras famílias.
Core/jobs permanecem Java 23/Boot 3.4.3. Atualizações compatíveis na linha atual
são alternativa intermediária, mas não entregam as correções abertas Spring
acima. Suporte enterprise não será contratado implicitamente.

A [migração oficial Boot 4](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
envolve Framework 7, Servlet 6.1, novos módulos/starters e Jackson 3 preferencial.
O plano deve decidir explicitamente a estratégia Jackson, preservando `/v1`,
task `{jobRef}`, bytes/contratos de manifestos, segurança e isolamento de perfis.
Não basta trocar o parent. Nenhuma versão final Boot/BOM está escolhida aqui.

Antes da execução: aprovação do escopo e dos downloads locais necessários;
inventário dos consumidores; testes de regressão antes da alteração; atualização
coordenada; renovação dos pins/hashes das fixtures e imagens; testes leves,
Maven global serial com Docker e matrizes nativas opt-in; novo scan sanitizado.
Não enfraquecer admissões exatas, limites ou validadores para obter testes verdes.

Triagem, patches e rescan são gates separados de admissão cloud/memória e
qualidade humana. A 020 permanece `in-progress`, a 021 bloqueada e todos os
defaults operacionais desabilitados. Esta investigação não autoriza deploy,
novas imagens de avaliação, uso Google ou chamadas pagas.
