# Falhas de recursos da sessão — 2026-11-01

Continuação da MOB-FEAT-020, AC-005/AC-006. A feature permanece `in-progress/open`,
com TASK-006/008 abertas e review `changes-requested`. A 021 permanece implementada.
Este registro não altera requisitos, admite operação ou habilita uploads/providers.

## Reprodução e desenho da prova

Dois testes novos exigem que a sessão candidata falhe sem artefatos e recupere
uma página válida. Antes de adaptar o harness, ambos falharam: as injeções
anteriores atuavam somente no launcher do codec, que a sessão não utiliza.
O red está em `.local/mob020-session-faults-20261031/resource-red.log`.

A correção é exclusiva dos testes. O JAR de produção conserva SHA-256
`44ed5c4ed44c8808cde61a6e1426685119961f056bdb319c795647303511fe3c`;
os 210 hashes de main/POM da rodada anterior continuam iguais.

`RenderingSessionFaultChildMain`, montado no `/probe` readonly, delega à entrada
real da sessão. Um observador limitado do IPC preserva seus bytes e aplica a
injeção somente no primeiro CLAIM, após aquisição/validação e antes do decode.
Não substitui renderer, persistência, storage, texto, geometria ou qualidade.

- **Endereçamento:** conserva RLIMIT_AS de 3 GiB, conferido em `/proc/self/limits`.
  Reserva com `mmap(PROT_NONE)` o espaço virtual excedente a uma folga nominal de
  384 MiB. Não toca as páginas reservadas nem aumenta limites. A reserva torna
  indisponível o espaço necessário ao raster/codec. O recibo registra os bytes
  efetivamente reservados e a fase; é falha de endereçamento, não OOM do cgroup.
- **Scratch:** ocupa o tmpfs privado de 512 MiB até observar zero bytes úteis,
  em arquivos de até 32 MiB, respeitando o RLIMIT_FSIZE ativo de 64 MiB.
  O recibo é exportado para o diretório do teste, fora do tmpfs pressionado.

Os arquivos e a reserva permanecem sob posse da filha até o término e cleanup.
As duas tentativas seguintes de redelivery terminal também são conferidas:
com duas páginas e duas redeliveries há quatro sessões sequenciais, todas
encerradas, e uma única injeção. Jobs terminais não decodificam outra página nem
repetem OCR/tradução. A contagem anterior de duas filhas pertence ao caminho
antigo, que só lançava processos no renderer.

As primeiras adaptações foram rejeitadas pelos próprios testes: pressão durante
bootstrap, recibo que tentava alocar após reduzir AS e montagem incompleta de
classe auxiliar. Esses resultados não são prova de isolamento do renderer nem
foram promovidos a aceite. O harness final conserva HTTP 204, FAILED sem
artefatos, exclusão local, original reutilizável íntegro, redelivery sem provider,
cleanup de temporários e página seguinte READY. Não aceita HTTP 500 como sucesso.

## Resultado local comprovado

A execução de `resource-pressure.log` passou nos dois casos, sem skips:

| Cenário                   | Pico agregado do cgroup | Resultado                                   |
| ------------------------- | ----------------------- | ------------------------------------------- |
| Pressão de espaço virtual | 1114980352 bytes        | FAILED sem artefatos; página seguinte READY |
| Scratch esgotado          | 988827648 bytes         | FAILED sem artefatos; página seguinte READY |

No primeiro cenário foram reservados 2255294464 bytes de espaço virtual sem
tocar suas páginas. Em ambos: providers sintéticos, renderer/PostgreSQL reais,
limite agregado 8 GiB, swap zero, PIDs 64, AS pai/filha 3 GiB, scratch 512 MiB e
zero OOM kills. Os números não são pico universal nem prova no Compute admitido.
O source do harness foi depois consolidado para exigir HTTP 204 também no caso
de falha; a matriz final reexecuta os testes com essa asserção integral.

## Matriz final e gates

A consolidação final inclui os seis opt-ins: entrega pequena, máximas e os dois
faults da sessão nova; memória/disco do caminho anterior permanecem regressões
separadas. Comandos, métricas e recibos ficam na rodada local citada acima.
Maven global, web, Node e mobile são registrados no fechamento após execução.
Opt-ins ignorados por execução comum não contam como prova.

## Retenção e limites que continuam abertos

A confirmação de exclusão remota até o deadline, inclusive recusa ou
indisponibilidade, continua sem mecanismo verificável. A
[consistência GCS](https://docs.cloud.google.com/storage/docs/consistency)
se aplica após delete bem-sucedido;
[retries](https://docs.cloud.google.com/storage/docs/retry-strategy) admitem falhas,
e [lifecycle](https://docs.cloud.google.com/storage/docs/lifecycle) é assíncrono.
Não foi repetida a observação de uma hora nem provisionada nova infraestrutura.

As provas locais de memória/disco da sessão deixam de faltar. Permanecem a
matriz adicional afetada, a validação/admissão do pipeline no Compute privado
restrito e a revisão exigida. O aceite humano do pacote anterior não se transfere
por inferência. TASK-008 permanece aberta; TASK-006 continua aberta por retenção
absoluta e limites de I/O/kernel explicitados nos registros anteriores.

## Custo e retirada

Nenhum recurso cloud criado; US$ 4,98 permanece estimativa histórica, sem fatura
confirmada ou consulta de ausência cloud atual. A imagem e os containers próprios
da prova local são retirados no fechamento e sua ausência conferida. Os contextos,
logs e recibos são preservados; imagens/recursos preexistentes não são removidos.

## Consolidação final do artefato

O Maven global terminou com exit 0. A matriz final de seis opt-ins também
terminou com zero falhas/erros/skips e manteve HTTP 204 para as falhas tratadas.
O harness final não conserva a instrumentação temporária nem um caminho que
aceite HTTP 500. Dois casos novos comprovam diretamente a sessão candidata.

Imagem local desta rodada: `sha256:9b58cc163089b5db3d56f19a7938ad5c37eb2364c398585221a3a461f5689c80`.
Reconstruída do contexto fixado e do mesmo JAR, com base/codec em cache, sem
pull ou rede de build. O ID difere da rodada anterior; os bytes do JAR e os
210 hashes de produção/POM são os mesmos. Test classes ficam no `/probe` readonly.

| Prova final           | Pico agregado (bytes) | Escopo                               |
| --------------------- | --------------------- | ------------------------------------ |
| Entrega privada       | 533868544             | Sessão nova, READY/download/hash/ACK |
| Três máximas de 80 MP | 1565343744            | Sessão nova, três READY              |
| Pressão virtual       | 897646592             | Sessão nova, FAILED/cleanup/READY    |
| Scratch esgotado      | 1018265600            | Sessão nova, FAILED/cleanup/READY    |

As regressões do caminho anterior passaram separadamente: endereçamento
1092460544 bytes; disco 864849920 bytes. Essas linhas não foram usadas como
substitutas das provas da sessão. Todas as medições mantiveram caps e zero OOM kills.

Node: 153 casos aprovados e um opt-in ignorado. Web: `npx tsc -b` e FSD com
polling terminaram com exit 0. O `pnpm check` mobile é executado após esta
consolidação; o recibo final na rodada local registra seu resultado, sem atribuir
um gate antigo ao documento novo. Links/formato/diff também são conferidos.

A imagem própria é retirada após as provas; o recibo de retirada registra a
consulta posterior. Contextos e logs permanecem para reprodução. Os testes
não usaram mídia real nem recursos cloud novos.

### Comando da matriz final

A partir de `api/`, depois de `test-compile` pelo reactor e com a imagem no cache:

```sh
./mvnw -o -q -pl apps/translation-gateway -am surefire:test \
  '-Dtest=NativeRenderingWorkerImageLinuxTest#armStorageSession*+armWorkerRecovers*' \
  -Dsurefire.failIfNoSpecifiedTests=false -Drenderer.native.image.enabled=true \
  -Drenderer.native.image.arm64.id=sha256:9b58cc163089b5db3d56f19a7938ad5c37eb2364c398585221a3a461f5689c80 \
  -Drenderer.glibc.arm64.sha256=bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58 \
  -Drenderer.linux.docker.host=unix:///Users/ruanmoraes/.orbstack/run/docker.sock
```

Após a retirada, é necessário reconstruir a imagem do contexto registrado;
o comando não representa recurso que deva permanecer ativo.
