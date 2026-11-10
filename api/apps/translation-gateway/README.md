# Translation Gateway

Serviço Spring Boot independente da Core para OCR, tradução contextual e
renderização de uma página, com processamento de conteúdo em memória e retorno
na mesma resposta autenticada. O aplicativo valida e armazena o resultado no
aparelho. A integração volátil está em implementação e permanece desabilitada.

O [contrato arquitetural vigente](../../../docs/volatile-processing-architecture.md)
e a [DEC-008](../../../mobile/docs/decisions/MOB-DEC-008-volatile-processing.md)
substituem o ciclo anterior. O [README anterior](README-pre-volatile-2026-11-01.md)
e as evidências anteriores são históricos; não aprovam a nova sessão ou operação.

## API vigente

| Rota | Finalidade |
| --- | --- |
| `POST /v1/anonymous/installations` | Identidade anônima independente da Core |
| `POST /v1/anonymous/sessions` | Bearer curto e revogável |
| `GET /v2/capabilities` | Contrato, limites, pares e disclosure volátil |
| `POST /v2/page-translations` | Corpo binário e resposta direta limitada |
| `GET /v2/page-translations/by-idempotency/{key}` | Recibo operacional próprio, sem conteúdo |

As rotas antigas de conteúdo, incluindo consulta, cancelamento e ACK de
`/v1/page-jobs`, `/v1/capabilities` e `/internal/tasks/ocr`, retornam `410` antes
do parsing do corpo. Multipart está desabilitado globalmente para evitar spool.
A identidade usa a versão existente; o transporte de processamento usa `2.0`.

A resposta binária usa `application/vnd.toonlira.translation+binary`:
`TVR1` (quatro bytes), tamanho unsigned big-endian do manifesto, JSON UTF-8,
tamanho da imagem e bytes WebP. O overhead é de doze bytes. Limites independentes:
original 12 MiB, manifesto 4 MiB, saída 64 MiB, dimensões até 12.000 por eixo e
80 milhões de pixels. Entradas estáticas JPEG, PNG e WebP são inspecionadas pelos
bytes reais. O servidor sinaliza `no-store`; não devolve URL de conteúdo.

## Providers e conteúdo

Vision usa `DOCUMENT_TEXT_DETECTION`, `BatchAnnotateImages` online com bytes
inline e endpoint regional US. Translation Advanced usa o modelo contextual
configurado no endpoint global. Somente pares explicitamente habilitados são
aceitos. As chamadas não têm retry automático após aceitação ambígua.

O limite de entrada do renderer é distinto do comportamento do provider: a
[documentação do Vision](https://docs.cloud.google.com/vision/docs/supported-files)
informa redimensionamento interno de imagens acima de 75 milhões de pixels para
OCR. A geometria e a qualidade desse caso precisam de validação específica;
um teste raster de 80 MP não comprova qualidade de OCR nesse tamanho.

Original, pixels, OCR, tradução, manifesto e resultado não entram em disco,
bucket, banco, fila persistente ou logs no caminho volátil. A filha nativa usa
pipes privados, pacote fixado e limites Linux aplicados antes do conteúdo.
Logs normais de segurança/operação permanecem sanitizados e não capturam corpo,
Authorization, nomes/caminhos, texto ou mensagens brutas dos providers.

## Recibos e idempotência

V10 adiciona `volatile_processing_attempts`, com FK para a instalação, chave
única por instalação e metadados permitidos: operação aleatória, status,
timestamps e código de falha sanitizado. A reserva/quota é transacional antes
dos providers; rede e renderização acontecem fora da transação.

UUIDv7 usa o horário de capabilities válidas e vence absolutamente após sete
dias. Replay é recusado, inclusive após purge; GET vencido retorna `404`.
`FINISHED` significa resultado produzido, sem comprovar entrega ou commit local.
Recibos com sete dias são candidatos ao purge em lotes, que só remove linhas
quando a chave também venceu. A disponibilidade do banco condiciona a remoção
física. Logs seguem política própria e não herdam esse prazo.

Perder a resposta não permite recuperar conteúdo no servidor. Nova execução
exige ação explícita do usuário, nova tentativa/chave e aviso de possível custo.
O cliente preserva o original e só assume `READY` após seu commit validado.

Para um ambiente de teste com orçamento restrito, a reserva pode aplicar um
limite adicional de tentativas em toda a janela usando
`GATEWAY_TEST_BUDGET_ENABLED`, `GATEWAY_TEST_BUDGET_MAX_ATTEMPTS` e
`GATEWAY_TEST_BUDGET_DEADLINE` (instante UTC ISO-8601). O controle é
desativado por padrão e não altera as quotas anunciadas do contrato; quando
ativado, configuração inválida ou limite esgotado recusa a operação antes de
qualquer provider. O contador agregado é efetivado com o recibo e não é
devolvido após falha. Ele não contém conteúdo nem identidade e não é apagado
pelo purge de recibos individuais. Esse limite de chamadas não constitui um
teto financeiro em dólares: cobrança de saída e registro de custos podem variar.
Ver [plano de dados e limites](docs/private-test-budget-design-2026-11-03.md).

## Configuração e execução

Java 25, Maven Wrapper e PostgreSQL dedicado. Executar a partir de `api/`:

```bash
./mvnw -pl apps/translation-gateway -am package -DskipTests
SPRING_PROFILES_ACTIVE=volatile java -jar apps/translation-gateway/target/translation-gateway-0.0.1-SNAPSHOT.jar
```

Banco usa `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` e
`SPRING_DATASOURCE_PASSWORD`. O comando acima mantém processamento desabilitado.
O perfil `volatile` desabilita storage, dispatch, URLs de resultado e layout
experimental. Não usar o perfil histórico `worker` para o serviço direto.

Ativação requer ambos `GATEWAY_ENABLED` e
`GATEWAY_VOLATILE_PROCESSING_ENABLED`, além das configurações compatíveis:

- `GATEWAY_OCR_MODE=vision` e `GATEWAY_GCP_PROJECT_ID`;
- `GATEWAY_TRANSLATION_MODE=google`, `GATEWAY_TRANSLATION_PROJECT_ID` numérico e
  `GATEWAY_TRANSLATION_ENABLED_PAIRS` explícitos;
- `GATEWAY_RENDERING_MODE=supervised-native`, diretório de runtime absoluto,
  distribuição nativa readonly e SHA-256 do seu manifesto;
- `GATEWAY_DISCLOSURE_VERSION=volatile-...`, operador, contato, URLs públicas dos
  termos/privacidade e política verificável dos providers.

A admissão exige Linux, limite agregado de memória, swap desabilitado,
contenção de processos e scratch, core dumps desabilitados no SO e JVM sem heap
ou crash dumps. O codec é carregado apenas na filha. Uma sessão pesada ocupa a
instância até término e descarte confirmados; timeout do chamador não libera
capacidade enquanto trabalho abandonado ainda a possui.

O perfil `volatile` limita Tomcat a 8 threads (2 ociosas), 32 conexões e backlog
16; cada SDK usa um executor explícito de 2 threads. Overrides que excedam o
orçamento HTTP são recusados na inicialização. A prova integrada deve observar
`pids.events` sem recusas, além de memória/oom; HTTP 200 isoladamente não comprova
que o teto agregado de 64 PIDs foi respeitado sem falhas de criação de threads.

Cada filha recebe um diretório privado de runtime, com permissão 0700, para
arquivos técnicos do JVM/fontes públicas. Imagem, raster, OCR, tradução e
manifesto continuam exclusivamente em memória/pipes. O diretório só é removido
após término confirmado da filha e do writer, sem seguir symlinks externos;
cleanup incerto mantém a capacidade indisponível.

O serviço público combinado exige admissão própria de recursos, políticas e
rede. A imagem/configuração histórica do worker privado não o aprova. Nenhum
comando deste README ativa ou implanta recursos cloud. Recursos e dados antigos
exigem inventário e encerramento explícitos; adapters de escrita antigos
recusam novas gravações, preservando acesso de retirada quando necessário.

## Testes

Na raiz `api/`, usar o reactor, pois `testing-support` é dependência de teste:

```bash
./mvnw -pl apps/translation-gateway -am test
./mvnw test
```

A matriz Linux do caminho em memória é opt-in em
`VolatileNativeImageLinuxTest`; exige imagem local, manifesto fixado e Docker.
Ela usa fixtures sintéticos autorizados, sem chamada de provider ou cloud.
`VolatileGatewayImageLinuxTest` acrescenta HTTP autenticado, SDKs reais com
serviços gRPC sintéticos internos, PostgreSQL e filho nativo em containers
separados, sem portas publicadas ou saída externa. Essa prova usa respostas
sintéticas de OCR/tradução e não valida a qualidade dos providers reais.
Recibos, concorrência, quota e purge usam PostgreSQL real em Testcontainers.
Falhas/posse de sessão, framing, autorização, limites e sanitização têm testes
próprios. A cobertura local não substitui a execução ponta a ponta no aparelho,
a qualidade real dos providers nem a aprovação operacional.

A [verificação local da candidata 3](docs/volatile-runtime-verification-2026-11-02.md)
registra uma fotografia anterior das provas e seus limites.

A [candidata 4](docs/volatile-runtime-candidate-4-verification-2026-11-02.md)
retira o wiring OCR por URI da produção e acrescenta provas de entrega ao cliente,
sete destinos, vazio e overflow. Políticas/qualidade real/ambiente alvo continuam
verificações separadas.

A [candidata 5](docs/volatile-runtime-candidate-5-verification-2026-11-02.md)
fecha a janela de início de etapa após abandono e revalida a entrega máxima,
os limites de processo e as amostras visuais no artefato atualizado.

A [verificação corrente da candidata 6](docs/volatile-runtime-candidate-6-verification-2026-11-03.md)
preserva a falha posterior de timeout da candidata 5 e comprova a correção local
do pipe nativo, com falhas controladas, restart real e entrega sem arquivos de
conteúdo no servidor. A [proposta privada AMD64](docs/volatile-private-verification-proposal-2026-11-03.md)
está preparada para revisão, sem autorização de execução. Provas no aplicativo
e admissão no ambiente alvo continuam abertas.
