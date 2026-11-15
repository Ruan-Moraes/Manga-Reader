# Sessão storage/render — 2026-10-30

Incremento candidato, sem aceite da feature. 020 `in-progress/open`, review
`changes-requested`, TASK-006 aberta e TASK-008 reaberta para o pipeline novo.
021 `implemented` preservada. Nenhum provider pago, upload de produto, deploy
ou recurso cloud foi criado nesta continuação.

[Desenho e matriz de viabilidade](../../../../../../api/apps/translation-gateway/docs/rendering-storage-session-2026-10-30.md).
O plano aprovado no chat precedeu a implementação. A escolha humana foi uma
filha por página, mesma identidade restrita, sem nova rodada cloud.

## Reprodução e implementação

O teste de framing foi escrito antes da classe e falhou por símbolo ausente.
Após a implementação, três cenários de framing passaram: round-trip, comprimento
excessivo antes da leitura e versão/truncamento inválidos.

`StorageBackedRenderingTaskProcessTest` usa uma JVM realmente possuída, com
stream sintético que ignora interrupt e close. Timeout e cancelamento recolhem
a filha, removem staging, preservam vizinho e permitem uma sessão seguinte.
A sessão seguinte do probe é controle de capacidade, **não renderer real**.
No sandbox, a enumeração de descendentes impediu a sessão seguinte; a mesma
asserção passou com acesso adequado. A prova não foi removida/enfraquecida.

`RenderingSessionDirectoryTest` executa duas JVMs para abandono e recuperação;
lock ativo impede recuperação, symlink é preservado e vizinho permanece íntegro.
Os testes anteriores de deadline, posse e inspeção continuam em execução nos gates.
O foco inicial passou em 67 testes (protocolo, processo, supervisor e aplicação).
O foco posterior de recuperação/configuração passou antes da adição da regressão
de roteamento. As regressões são reexecutadas no gate global corrente.

Node: 153 pass, um opt-in ignorado; web `tsc -b` e FSD passaram.
A primeira execução global alcançou gateway mas falhou na compilação de um
helper novo (RenderPort em vez de ObjectProvider). O teste foi corrigido para
usar o helper existente; nenhuma asserção foi retirada. A repetição global e
os opt-ins Linux atuais ainda precisam ser consolidados.

JAR candidato corrente: `44ed5c4ed44c8808cde61a6e1426685119961f056bdb319c795647303511fe3c`.
Imagem final foi testada a partir desse JAR, com hashes conferidos pelo harness.

## Matriz de aceite

| Critério    | Evidência desta parcela                                                 | Limite                                                                 |
| ----------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| AC-001..004 | Renderer/políticas reaproveitados                                       | Aprovação visual histórica não é aceite automático do novo pipeline    |
| AC-005      | Framing, isolamento da filha, recuperação e registros prévios ao upload | Retenção absoluta continua contrariada pelo cenário de delete recusado |
| AC-006      | JVMs reais com timeout/cancelamento e recuperação local                 | Perfil agregado do novo pipeline e nova admissão operacional pendentes |

## Custos e retirada

Sem novos compromissos cloud. US$ 4,98 permanece estimativa histórica acumulada,
sem confirmação por fatura. A ausência histórica de recursos não foi tratada
como consulta cloud atual. As três imagens locais sem tags criadas nesta rodada foram removidas por ID,
com ausência confirmada posteriormente. Imagens preexistentes foram preservadas.

## Consolidação final

A sessão é um opt-in adicional, `gateway.rendering.storage-process-enabled=true`,
com default `false`, exclusivo de `supervised-native`. A seleção ausente conserva
o caminho anterior; a seleção habilitada não recorre a storage no pai. Isso
permite conservar a evidência histórica sem atribuí-la à sessão candidata.

JAR final: `44ed5c4ed44c8808cde61a6e1426685119961f056bdb319c795647303511fe3c`.
Imagem final local (retirada após a prova):
`sha256:7dc4fdc30bea925eaa86816eee3b6fac56caf642f668f64c9931d70f36202648`.
O manifesto de hashes de 210 arquivos main/POM e os recibos estão em
`.local/mob020-process-session-20261030/`; não contêm credenciais.

| Cenário ARM64 local          | Caminho efetivamente executado | Pico agregado (bytes) | Resultado                                            |
| ---------------------------- | ------------------------------ | --------------------- | ---------------------------------------------------- |
| Entrega privada pequena      | Nova sessão, opt-in true       | 556343296             | READY, hashes/downloads e dois ACKs com uma intenção |
| Três páginas de 80 MP        | Nova sessão, opt-in true       | 1670287360            | Três READY, texto/overflow e zero regiões            |
| Falha controlada de endereço | Caminho anterior, opt-in false | 1132048384            | FAILED, filha encerrada e página seguinte READY      |
| Scratch esgotado             | Caminho anterior, opt-in false | 869519360             | FAILED, cleanup e página seguinte READY              |

Os quatro opt-ins executaram, zero falhas/erros/skips. Todos conservaram cap de
8 GiB, swap zero, PIDs 64, AS 3 GiB e scratch 512 MiB, com zero OOM kills.
Renderer e PostgreSQL reais, providers sintéticos, rede Docker interna, rootfs
readonly e usuário 1000. Docker local ARM64 com PostgreSQL AMD64 emulado; não
é o Compute admitido. As duas provas do caminho anterior não são fault injection
na nova sessão. A prova pequena anterior à introdução do seletor permanece no
log `native-delivery.log`, ligada ao JAR intermediário e sem promoção ao final.

### Gates executados

- Maven global pelo reactor: exit 0, incluindo PostgreSQL/Testcontainers.
- Snapshot das nove classes focadas: **102 testes, zero falhas/erros/skips**,
  incluindo protocolo, processo, configuração, deadline, inspeção e reinício.
- Node gateway: 153 pass, um opt-in ignorado (não promovido a prova).
- Web: `npx tsc -b` e `CHOKIDAR_USEPOLLING=1 pnpm lint:fsd`, exit 0.
- Mobile: `pnpm check`, 121 suítes/953 casos aprovados; SDD/links/formato válidos.
- O gate mobile é reexecutado após consolidar esta evidência e rebasear os
  cabeçalhos pelo checksum de `scripts/lib/sdd-integrity.mjs`.

Comandos principais, a partir de `api/`:

```sh
./mvnw -o -q test
./mvnw -o -q -pl apps/translation-gateway -am package -DskipTests
./mvnw -o -q -pl apps/translation-gateway -am surefire:test \
  '-Dtest=NativeRenderingWorkerImageLinuxTest#armStorageSession*+armWorkerRecovers*' \
  -Dsurefire.failIfNoSpecifiedTests=false -Drenderer.native.image.enabled=true \
  -Drenderer.native.image.arm64.id=sha256:7dc4fdc30bea925eaa86816eee3b6fac56caf642f668f64c9931d70f36202648 \
  -Drenderer.glibc.arm64.sha256=bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58 \
  -Drenderer.linux.docker.host=unix:///Users/ruanmoraes/.orbstack/run/docker.sock
```

O último comando exige reconstruir a imagem retirada a partir do contexto/hash
registrados; não representa imagem ainda disponível. O objetivo `surefire:test`
usou classes já compiladas pelo reactor/package, sem build concorrente de fonte.
Os logs de falhas iniciais foram preservados: framing ausente, helper de teste
incompatível, enumeração no sandbox, três documentos sem formatação e flag CPU
incompatível com o builder clássico. Foram corrigidos sem retirar asserções.

### Pendências e handoff de revisão

1. **TASK-006/AC-005:** falta garantia verificável de ausência de todas as gerações
   no deadline, inclusive recusa/indisponibilidade. O contraexemplo remoto permanece.
2. **TASK-008/AC-006:** faltam injeções de memória/disco no pipeline da sessão,
   matriz adicional afetada e validação/admissão no Compute restrito. O resultado
   máximo local não transfere o aceite histórico nem permite habilitação operacional.
3. A contenção possui prova de stream não cooperativo em JVM real e recuperação
   de snapshots, mas não promete morte pontual sob falha kernel/filesystem. SQL
   bloqueado/commit incerto conservam os limites descritos no desenho.
4. Review posterior ainda exigida; este registro do Executor não é autoaceite.

020 permanece `in-progress/open`, 6/8, review `changes-requested`; 021 preservada.
Não houve observação GCS de uma hora, alteração de requisito ou nova execução
cloud. Portanto, nenhuma evidência de pontualidade remota foi inventada.
