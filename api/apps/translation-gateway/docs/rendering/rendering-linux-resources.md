# Recursos e fault injection Linux — plano, 2026-10-04

Parcela de TASK-002/007/008 e AC-006 da MOB-FEAT-020. Não integra Docker ou
cgroup ao worker, não altera orçamento/capabilities e não conclui a feature.
Usar somente Java, imagem/codecs já autorizados, fixtures sintéticas e daemon
local com configuração própria vazia. Sem aquisição, credencial, Google ou cloud.

## Diagnóstico e decisão

Inspeção local da imagem fixada confirmou cgroup2 montado read-only dentro do
container sem privilégios. Não presumir delegação gravável nem acrescentar
capabilities/mount de host para obtê-la. Contenção por cgroup por chamada no
worker exige decisão/admissão operacional própria; snapshots/heap não a substituem.

Antes dessa integração, medir o renderer real e falhas de recursos no ambiente
Linux disponível. Estender somente o harness de testes: entrada/request e
JAR/codecs/probe Java read-only; scratch exclusivo em tmpfs com tamanho limitado;
export exclusivo recebe apenas output validado, IPC e métricas pequenas. Root
read-only, rede desligada, no-new-privileges/cap-drop ALL e 64 PIDs. A aquisição
anterior autoriza preparação/testes locais, não instalação ou produção.

## Cenários antes do harness

- Página sintética pequena sem texto: sucesso, hashes/manifesto e original íntegro.
- Página RGB uniforme de 10.000 × 8.000 (80 milhões de pixels): executar o caminho
  completo, registrar outcome/tempo/pico; não reduzir dimensões para obter verde.
- Memória de container deliberadamente insuficiente: observar OOMKilled/exit
  sanitizados, sem resultado falso, original intacto e execução seguinte independente.
- Repetir o máximo com 1 GiB total, orçamento atual do worker desabilitado;
  registrar o resultado sem aumentar o orçamento operacional silenciosamente.
- Scratch deliberadamente insuficiente: renderer falha sem artefato confirmado;
  registrar capacidade real, preservar original e conferir execução seguinte.
- Testes puros de argumentos/admissão, limites e parser de status. Nada é baixado
  por testes comuns. O profiling é opt-in distinto da prova Linux pequena.

Gerar PNG válido em Java por linhas/Deflater/CRC, sem raster completo no JVM pai,
sem transformar imagens do piloto. Probe exclusiva de testes chama os mesmos
adapters, fontes e protocolo do renderer empacotado, sem Spring ou provider.
Conferir o JAR atual; montar somente sua classe própria, não todo o test/workspace.

## Medidas e critérios

Ler somente memory.peak/max/swap.max, pids.max, VmHWM e capacidade do scratch.
Métricas ausentes permanecem null, nunca zero inventado. memory.peak inclui
descendants/cache/tmpfs, não somente heap; duração inclui preparação e renderer.
Após saída, inspeção Docker retorna somente exitCode/OOMKilled, sem env, logs
ou diagnóstico bruto. Sem amostragem host interpretada como pico do renderer.

Para o volume máximo, começar com orçamento experimental de 4 GiB total,
heap 1 GiB, scratch 512 MiB e uma CPU; codec preserva timeout de 60 segundos.
Esses números são configuração da medição, não orçamento de produção ou meta
aprovada. Se falhar, guardar finding e investigar; não enfraquecer o teste.
Export é bind limitado por validação de artefatos, não quota agregada; não alegar
contenção do daemon/pai nem sandbox de produção por esse harness.

Cada container tem nome próprio e cleanup no finally, incluindo confirmação
perdida de criação. Não há varredura/removal ampla ou reaproveitamento de rodada.
Timeout do harness limitado; stdout/stderr do renderer descartados. Registrar
somente métricas sanitizadas e hashes de fontes/fixtures, sem conteúdo OCR.

## Fontes e limites

[Docker memory](https://docs.docker.com/engine/containers/resource_constraints/)
e [tmpfs](https://docs.docker.com/engine/storage/tmpfs/) descrevem os limites;
tmpfs conta na memória do container. O
[contrato cgroup v2](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html)
define memory.peak/max e cgroup.kill; a inspeção local não comprova delegação
ou compatibilidade Cloud Run. Produção, licenças/distribuição, profiling com
conteúdo diverso, retenção integral e revisão visual continuam pendentes.

Gates: foco opt-in, regressão Linux/Boot/nativa, Maven global offline/Docker,
suíte leve, Node, web typecheck, pnpm check, SDD/links/formato/diff. Governança
mobile apenas; não inferir métricas Android ou qualidade por uma página uniforme.

## Reprodução e resultado

Adicionar `-Drenderer.linux.resources.enabled=true` ao comando global Linux da
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-linux-resources-2026-10-04.md).
O opt-in executa cinco casos reais do renderer, incluindo falhas deliberadas;
os testes comuns não criam containers de profiling nem baixam dependências.
Requer o JAR atual e os pins/flags de codec do harness Linux existente.

Baseline local ignorada: `.local/rendering-linux/baselines/resources-20261004-a.json`.
80 milhões de pixels uniformes passaram com teto experimental de 4 GiB, mas
falharam por OOM com 1 GiB. A leitura do source oficial também confirmou cópias
integrais em ReadPicture/ReadPNM/importação. AC-006 continua parcial: raster
Java compartilhado não prova ausência de cópias nativas. O build oficial local
autorizado será uma parcela separada; nenhum orçamento cloud foi alterado.
