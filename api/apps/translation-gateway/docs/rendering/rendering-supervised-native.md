# FFM supervisionado — parcela local, 2026-10-05

Parcela de TASK-002/007/008 da 020, posterior à decisão humana de
[memória total](rendering-memory-policy.md). Reaproveita a supervisão existente,
sem habilitar renderer, worker cloud ou uploads. 020 in-progress/open e
021 approved/blocked; não é admissão operacional do worker completo.

## Implementação

- RenderProcessSettings é configuração selada interna, com alternativas
  explícitas: CLI existente ou NativeRenderChildSettings com paths/hashes das
  bibliotecas e prazo nativo. Nada vem da task ou do provider.
- IPC CLI TRN1 permanece legível; TRN2 seleciona somente FFM. Não há fallback
  se biblioteca/plataforma/hash falhar. Resultado TRS1, RenderPort, manifesto,
  OCR/tradução, estados e HTTP permanecem iguais.
- IsolatedRenderAdapter adquire capacidade antes de staging/decode, com a
  mesma supervisão/posse para ambos os codecs. Filha RenderChildMain não
  inicia Spring, DB, rede Google, ADC ou logs e não herda ambiente.
- RenderJvmLauncher concede native access somente à filha FFM selecionada,
  em classpath plano ou Boot JAR admitido. Pai não carrega bibliotecas.
  Não há download ou inferência de paths pelo ambiente.
- NativeFileRenderAdapter cria codec/raster na thread possuidora e mantém
  um buffer ARGB compartilhado durante decode → pintura → encode. PNG/JPEG
  usam destino JDK compartilhado; WebP usa BGRA externo. Sem PAM, int[] da
  página, Import/Copy integral ou resize. Buffers internos oficiais do
  libwebp continuam existindo e precisam entrar no orçamento total.
- Leitura WebP original usa teto de entrada; verificação de WebP gerado usa
  teto de saída. Saída pequena não restringe mídia original já admitida.
- Hash/MIME/bytes/dimensões/container são revalidados. Saída só é transferida
  após fechamento dos dois donos nativos; close falho elimina saída.
  Cancelamento/timeout não libera memória emprestada durante downcall.
  Supervisor espera terminação/cleanup antes de admitir outra página.
- Cleanup remove somente snapshots/arquivos possuídos e staging exclusivo,
  sem seguir symlink ou sobrescrever original. Cleanup falho mantém a
  capacidade indisponível; não cria fila/retry automático.

Fotografia desta primeira parcela: o bean RenderingConfiguration continua LocalFileRenderAdapter/CLI quando
explicitamente habilitado. FFM é construção explícita, ainda não selecionável
pela configuração operacional do worker. Default disabled não carrega FFM.
Bibliotecas verificadas são Linux ARM64/LP64/little endian; outra plataforma
falha, sem troca silenciosa de codec.

Parcela posterior: [distribuição portátil](rendering-native-distribution.md)
e NativeRenderingConfiguration permitem seleção local explícita
`supervised-native`, sem carregar FFM no pai. O CLI/default disabled continuam
iguais. A prova mínima do bean não é profiling/admissão do worker completo.

## Provas e limites

Testes precederam tipos/overload do launcher. RED de compilação confirmou
ausência da configuração nativa; o seam de teto de entrada também precedeu
implementação. Testes leves usam mocks para posse/close, sem afirmar qualidade
do encoder: cancelamento anterior à aquisição, metadata adulterada, symlink,
concorrência sem fila, lifetime do buffer, saída malformada, arquivo não
possuído e fechamento falho.

IsolatedNativeRenderLinuxTest usa JAR atual, supervisor real, filha Boot e
libwebp local oficial. PNG/JPEG/WebP, alpha/RGB invisível, pintura e comparação
por todos os pixels com compositor anterior usam dwebp independente. Máximas
plana/multicolor têm uma região sintética pequena, hash/manifesto e original
conferidos; não é benchmark de 1.024 regiões ou revisão linguística. Lib com
hash inválido/scratch insuficiente não produzem resultado; página seguinte
conclui em rodada independente.

Pai e filha compartilham cgroup: teto experimental 2 GiB, heap pai 128 MiB e
filha 256 MiB, swap zero, uma CPU, scratch tmpfs 128 MiB, 64 PIDs, network none,
root/inputs/libs readonly. memory.peak inclui JVMs, nativo, cache e temporários.
VmHWM registrado é só do pai, não soma RSS/pico da filha. Scratch é /work;
/export é bind de saída limitada, não quota agregada do host. Java 23.0.2+7,
Linux ARM64; pins anteriores preservados.

Preparar package offline pelo reactor. Repetir com
`-Dtest=IsolatedNativeRenderLinuxTest`, `renderer.shared.resources.enabled=true`
e paths verificados do [codec](rendering-native-codec.md). Docker precisa estar
no cache: pull never, sem aquisição implícita. Não inicializar Google ou usar
imagens privadas para repetir fixtures.

## Pendências funcionais antes da ativação

1. Distribuição operacional readonly/ABI da imagem: pacote local e RUNPATH
   portátil foram validados na parcela posterior, não publicados.
2. Contenção do filho e orçamento agregado: subprocesso/Xmx não protege pai
   de OOM do cgroup inteiro. A prova não configura cgroup no Cloud Run.
3. Provas integrais do opt-in no worker e profiling total: Spring/JVM pai, OCR/layout
   residentes, storage, staging/uploads, sequência, mídias máximas e volume
   textual/overflow.
4. Memória/disco/timeout/cancelamento/cleanup no caminho completo, incluindo
   terminação nativa. Só depois propor RAM/margem operacional.

Cloud permanece 1 GiB/defaults disabled. Nenhuma mudança de schema, migration,
dependência, C próprio/Python, ADC/provider, deploy, legal ou runtime mobile.
Gates/resultados/hashes estão na
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-supervised-native-2026-10-05.md).
