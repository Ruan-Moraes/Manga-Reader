# Worker local, pacote e entrega privada — 2026-10-26

Parcela restrita de TASK-002/006/007/008. A 020 permanece `in-progress/open`;
a 021 está `implemented`. Esta prova não aprova qualidade multilíngue,
segurança, operação cloud ou publicação. Providers, uploads e publicação
continuam desabilitados por padrão.

## Pacote

Dois builds ARM64 limpos, sem rede, usaram builder por ID, fonte libwebp 1.6.0
por SHA-256, flags fixas e `SOURCE_DATE_EPOCH`. Os cinco arquivos dos pacotes
foram comparados byte a byte; manifesto SHA-256
`bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`.
Duas compilações limpas e independentes do JAR com timestamp fixo produziram
SHA-256 `6aa86b3fe3a45137a6daf221a62dbdf728310fad754c4c3cc48a039cbe6eec9c`.
O [inventário](../../../../../../api/apps/translation-gateway/docs/worker-jar-inventory-2026-10-26.json)
registra 200 dependências/fontes/licenças e seus hashes. Receita, versões,
arquivos de entrada e limites estão na
[documentação do gateway](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

O builder e o parent diagnóstico foram exportados em `.local/worker-isolation/
repro-020-2026-10-26/`, com hashes separados. A imagem de prova usa JAR novo
sobre parent local anterior: seu ID foi
`sha256:9b388f0a7eb2d1680f466a20d9d165060a5c1d429aef8413e134070abeceb313`.
Preflight retornou `admitted-not-operational`. Não há afirmação de reprodução
byte a byte do OCI ou reconstrução do builder sem o archive preservado.

## READY, download e ACK

`NativeRenderingWorkerImageLinuxTest#armWorkerDeliversPrivateArtifactsAndAcknowledgesIdempotently`
passou no worker ARM64 local, PostgreSQL 17 emulado e providers sintéticos.
O renderer produziu `READY`, três etapas `SUCCEEDED`, imagem WebP 320×220 de
9.154 bytes e manifesto íntegro. Hashes: imagem
`7513040237e614b8e82cb6aeb9cb0da52b6a513cc640488b67123bee2dd27c8f`,
manifesto `2f0bd89d63298d139d1e908652787378657614a0c8cf17dcf2ce6bddee49f6cc`.

A consulta foi exercitada no controller existente com principal de teste; o
transporte isolado validou assinatura HMAC efêmera, geração e expiração e
transferiu os bytes por loopback. Assinatura adulterada recebeu 403. Dois ACKs
retornaram 202, produziram uma única intenção SQL e o cleanup confirmou a
remoção de imagem e manifesto. O original remoto e temporários foram conferidos
pelo probe. Não houve sessão autenticada real nem GCS: autenticação do filtro,
assinatura GCS e interleavings possuem testes existentes separados.

## Memória e falha

`NativeRenderingWorkerImageLinuxTest#armWorkerRecoversAfterControlledMemoryFailure`
passou: limite test-only da filha 1.536 MiB, imagem 10.000×8.000, job `FAILED`
sem artefatos, filhos encerrados, original remoto e intermediários removidos;
a página seguinte chegou a `READY`. Pico cgroup 1.029.173.248 bytes, teto 8 GiB,
swap zero, PIDs 64, scratch 512 MiB e caps pai/filha 3 GiB; zero OOM kernel.
Concorrência, timeout, cancelamento e disco contam com provas anteriores e
testes existentes, não foram reclassificados como operação admitida.

Os dois testes passaram juntos, zero falhas/erros/skips. XML preservado na pasta
local acima, SHA-256 `036dd7255325e9558dc1c4a1727bd27d0aaf0cbf051028195ebf9370d705391c`.
A primeira tentativa falhou no bootstrap porque o harness não montava a classe
`RecordedWorkerPage`; a montagem foi corrigida e a execução repetida. O builder
BuildKit também tentou resolver o parent como nome remoto e falhou antes do
build; a prova válida usou builder clássico e parent local conferido.

Repetição final sobre a imagem da receita versionada
`sha256:cfb22b702099051229cb59cd36d27d3bc9160349ec6902672ad8980be7c70682`:
dois testes passaram sem skips. O ACK foi seguido por consulta `RESULT_EXPIRED`
sem URLs; original, OCR, tradução, WebP e manifesto estavam ausentes após o
cleanup. A imagem teve o mesmo hash acima; o manifesto, que inclui o job novo,
teve SHA-256 `2b68395c9b931dfbaa74ccacfd21c5adc38fe11bccf8dd4251f04ccf4a3df7a9`.
Picos agregados: 541.749.248 bytes na página e 1.132.924.928 bytes na falha;
zero OOM kernel, dois filhos encerrados e sucessora `READY`. XML final:
`1963198b24688c2ae87048fa5c6ec7d92bbb09c05ba0d8b3eee8fa83216359d7`.

Continuação local: a primeira receita copiava o JAR e herdava o codec do
parent. A receita agora copia os cinco arquivos do pacote reconstruído e
`image-inputs.json` com o ID real do parent. O novo preparador valida os pins
e reserva contexto exclusivo; 149 testes Node passaram, um opt-in foi pulado.
Codec reconstruído, contexto e imagem tiveram respectivamente manifesto
`bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`,
contexto `d40cae87d18641c3c99ef2a1f03e0391d9e5cbf9456c0e3144a2a2b0596f1075`
e imagem `sha256:53cbed42631f5acbd8eff68e9e79f130a9b87a2141c861787450d5d3362c11d5`.
O preflight e a conferência dos hashes dentro da imagem passaram. O worker da
mesma imagem executou `READY`, downloads íntegros e dois ACKs com cleanup;
imagem `7513040237e614b8e82cb6aeb9cb0da52b6a513cc640488b67123bee2dd27c8f`,
manifesto `fa21d3c273bef3a7efcb16c323beeea8d915aab396a8f9fc9b3d8d7a26af627e`.
O XML dessa repetição está preservado localmente, SHA-256
`8197bccbaeb6231089b17f58fc68cd6fbabfefe52d396466fa3ea45e5c6505d4`.
O teste de falha de memória da imagem anterior não foi repetido: o codec e o
JAR foram conferidos com os mesmos hashes e a implementação não mudou.

## Gates

- Node gateway: 148 passaram, um opt-in de fonte não executado.
- Web `tsc -b` e FSD passaram; FSD foi repetido com polling após `EMFILE`.
- Mobile `pnpm check`: 121 suítes/953 testes passaram antes da atualização
  documental; avisos conhecidos de `act(...)` preservados.
- Maven global offline/Docker: sete módulos aprovados; 2.728 testes, zero
  falhas/erros, 106 skips opt-in no gateway. As provas nativas acima foram
  selecionadas e executadas separadamente.
- Inventário de dependências: dois testes Python passaram. O primeiro uso do
  teste apontou o alias de `/var` no macOS; o teste passou após usar realpath.

## Atualização de ACK e verificação — 2026-10-28

O ACK agora responde 202 após exclusão e confirmação durável; falha parcial
ou lease concorrente retorna 503 para retry. A prova ARM64 com JAR atualizado
`569f649ff2a4dcca9e433eeb5f70f6dafb2b87b0dd39ae4af3e58616b28b0070`
passou em READY/download/ACK e falha de memória com recuperação. O XML está em
`.local/worker-isolation/repro-020-2026-10-26/gcs-generation-2026-10-28/worker.xml`,
SHA-256 `ca5d9aeed1cb9ea575f4bf671a83826c0a6ecf57d65fe327c7ae5bad39a33d53`.
A integração HTTP/PostgreSQL com SDK GCS simulado cobriu gerações, falha parcial
e retry; XML de retenção SHA-256
`e28632df19b40b24a1e55df94792bc45d3b515b8b8b0e9faa5de0374cf2edcda`.
A execução local não verifica IAM, GCS real ou retenção por soft delete.

O Maven global offline passou nos sete módulos: 2.800 testes, zero falhas ou
erros, incluindo 106 opt-ins ignorados no gateway. Os dois testes ARM64 foram
executados separadamente, sem skips. O `pnpm check` mobile passou com 121
suítes/953 testes; `tsc -b` e FSD web passaram. As evidências atuais e seus
limites estão na [review](../review.md); a 021 está implementada. Não há
aprovação de qualidade, orçamento operacional ou publicação.
