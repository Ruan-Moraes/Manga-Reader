# OOM no worker — protocolo local, 2026-10-07

Parcela de TASK-002/005/007/008 e AC-006, mantendo libwebp lossless/exact,
limites/texto/deadline, contratos, produção e configuração cloud inalterados.
Primeira reprodução anterior falhou no máximo com texto a 2 GiB; a inspeção
posterior mostrou exit=1 com métricas finais gravadas pelo pai. Docker
OOMKilled=true não identificava sozinho a vítima. Não implementar correção
de produção a partir da hipótese de morte do pai sem confirmar o comportamento.

## Prova antes de qualquer mudança de runtime

Estender somente o harness Java de testes já existente:

1. Worker Spring/SQL/storage/renderer reais com providers sintéticos; container
   limitado a 2 GiB, sem swap, uma CPU, 64 PIDs, scratch finito/rede SQL interna.
2. Original máximo sintético multicolor 80M readonly, 1.024 regiões e textos
   nos totais máximos. Não reduzir a página ou mudar parâmetros para evitar OOM.
3. Exigir evento real de kernel em memory.events, não um SIGKILL artificial.
   Medir memory.oom.group e contadores; valor ausente/ambíguo não vira zero.
4. Exigir pai vivo, job/stage FAILED com erro sanitizado e sem saída/manifesto
   final, referências íntegras e staging possuído limpo. Reentrega não repete
   OCR/tradução/render. Original reutilizável não é apagado pelo cleanup remoto.
5. No mesmo contexto/container, processar outra mídia sintética pequena readonly
   até READY, conferir hashes/manifesto/etapas, preservação do original e reentrega.

O sucesso dessa prova significa **falha atual isolada e recuperação observadas**,
não sucesso do job máximo nem aprovação do orçamento. Não garante a escolha da
vítima em outras cargas/kernel/política cloud. memory.oom.group=1 pode matar o
grupo inteiro; isso não será desabilitado no host/cloud para tornar teste verde.

Testes precedem os helpers/novo cenário. Se a recuperação falhar, investigar a
causa e corrigir com regressão sem enfraquecer invariantes; se passar, registrar
o comportamento já implementado em vez de fazer uma correção desnecessária.

## Fontes primárias

- [Moby ProcessEvent](https://github.com/moby/moby/blob/master/daemon/monitor.go):
  evento OOM atualiza o flag de estado, separadamente do evento de exit.
  Inspeção upstream não prova a vítima na versão local, que exige execução.
- [Linux cgroup v2](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html):
  memory.events conta processos mortos e memory.oom.group controla morte agrupada.

Não criar cgroup privilegiado, alterar OOM score/kernel, usar ADC/provider,
baixar dependência, alterar schema ou implementar mobile. Gateway/worker/layout
cloud continuam disabled; 020 in-progress/open, 021 approved/blocked.

## Finding confirmado no gate global e plano de correção

Três repetições focais passaram, mas o global subsequente reprovou uma:
container exit=137/OOMKilled=true, sem relatório final, pai não chegou aos
marcadores de recuperação. Portanto a seleção da vítima não está isolada de
forma confiável; não repetir até obter verde nem enfraquecer o teste.

A restrição acima descrevia a investigação sem alteração de runtime. Agora
implementar proteção **somente da filha possuída**: elevar seu próprio
oom_score_adj para +1000 e reler o valor, antes de dumpable=0/fontes/mídia.
Não torna o pai imune, não reduz score de terceiros nem altera host/sysctl/
daemon/IAM/cloud. Elevação self-only é não privilegiada; recusa termina a
filha sanitizadamente, sem fallback. Não usar proteção -1000 ou root.

Exigir cgroup v2 em namespace privado 0::/, memory.oom.group=0 e score do
supervisor <=0. Pai apenas inspecionado no bean opt-in e antes do lançamento;
filha revalida o grupo. Grupo kill=1/namespace desconhecido/campo ausente ou
write ignorado são configurações não admitidas, não são alterados pelo código.
Não é cgroup delegado, cota RSS ou garantia universal do kernel: orçamento,
ambiente cloud, bootstrap e outras cargas continuam exigindo admissão própria.

Referências: [oom_score_adj](https://man7.org/linux/man-pages/man5/proc_pid_oom_score_adj.5.html)
e [dumpable/ownership de proc](https://man7.org/linux/man-pages/man2/PR_SET_DUMPABLE.2const.html).
Escrever antes de mudar dumpabilidade evita depender de privilégios sobre
inode /proc de processo não dumpable. Nenhum acesso nativo adicionado ao pai.
Testes puros de grupo/namespace/scoring/recusa/ordem precedem a implementação;
prova Linux exige score real da filha e pai inalterado, além de repetir o
cenário de OOM/recovery já reprovado. CLI/TRN2 históricos permanecem separados.

## Experimento preventivo separado — endereço virtual

O score +1000 não resolveu a morte do supervisor. Antes de modificar outra vez
o runtime, acrescentar um cenário **exclusivo dos testes** `address-bounded`:
mesmo worker Spring, mídia máxima/textos/codec/heap/deadline, mas RLIMIT_AS da
filha em 1.536 MiB dentro do container de 2.048 MiB. Seu bean e propriedade
`renderer.probe.preventive-address` existem somente no harness, nunca no JAR
de produção. O modo runtime continua com o teto anterior de 3 GiB.

Exigir três repetições sem OOM de kernel, falha sanitizada do job máximo sem
artefatos finais, limpeza/redelivery íntegros e a página pequena seguinte
READY no mesmo contexto. Preservar o teste de OOM real com o teto anterior;
não substituí-lo, ignorá-lo ou admitir o orçamento pelo novo teste.

Três repetições passaram. Isso demonstra uma estratégia preventiva nesse
cenário, **não atendimento da página máxima**. Não alterar capabilities,
lossless/exact ou RAM cloud para ocultar essa diferença. RLIMIT_AS limita
espaço virtual; não cobre o pai, page cache, tmpfs ou memória total da instância.
Uma política operacional precisará conciliar atendimento dos limites aceitos
com reserva total e contenção, sem transformar uma medição em margem garantida.
Resultados e fotografia técnica estão no registro de evidência vinculado.

O [contrato Cloud Run](https://docs.cloud.google.com/run/docs/container-contract)
exige Linux x86_64 e encerra a instância quando o limite de memória é excedido.
O pacote/prova ARM64 local não demonstra compatibilidade AMD64 nem isolamento
no serviço. Não supor cgroup delegado ou segurança de OOM por preferência.
O filesystem gravável também conta como memória; volume limitado não equivale
a uma cota total da aplicação. São requisitos do alvo ainda não validados,
sem usar credenciais ou alterar recursos cloud nesta investigação.

## Controle restrito da preferência OOM — 2026-10-11

Diagnóstico adicional com as [novas imagens Java 25/Boot 4](native-base-update-2026-10-11.md),
sem alterar produção ou instalar pacote. Não substitui o protocolo integral
acima: nenhum worker, job, SQL, codec, modelo, provider ou imagem real participou.
O probe Java temporário carrega a **implementação real de `LinuxOomPolicy` do
JAR preservado**, mas não prepara `LinuxWorkerMemoryAdmission`: os tetos reduzidos
abaixo seriam recusados pelo bean operacional atual de 8 GiB.

O supervisor PID 1 confirma cgroup privado/ungrouped, swap zero e score próprio
zero. Uma filha possuída chama `prepareChild`, confirma score +1000 e toca páginas
de buffers diretos sintéticos limitados. O pai exige exit 137, exatamente um
`oom_kill`, nenhum `oom_group_kill` e score próprio inalterado; depois exige outra
filha concluir com exit zero sem novo OOM. Nenhum terceiro é modificado ou tornado
imune; não há cgroup privilegiado, kernel/sysctl alterado ou pressão fora do teto.

| Rodada                | Arquitetura    | Cgroup  | Resultado terminal                | Evidência / limite                                                                                                      |
| --------------------- | -------------- | ------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Inicial               | ARM64          | 128 MiB | Exit 0; Docker `OOMKilled=true`   | Filha pressure exit 137, um OOM kill, zero group kills; pai sobrevive e filha de controle conclui.                      |
| Inicial               | x86_64 emulado | 128 MiB | Exit 2; Docker `OOMKilled=false`  | Falha sanitizada sem relatório de recuperação. Duração compatível com deadline de 45 s, mas fase/causa não comprovadas. |
| Deadline 120 s        | x86_64 emulado | 128 MiB | Exit 137; Docker `OOMKilled=true` | Sem relatório final ou log. Não confirma preparo do score da filha nem sobrevivência do supervisor; permanece falha.    |
| Novo teto diagnóstico | x86_64 emulado | 256 MiB | Exit 0; Docker `OOMKilled=true`   | Filha pressure exit 137, um OOM kill, zero group kills; pai sobrevive e filha de controle conclui.                      |

As quatro execuções foram preservadas separadamente. A última não aprova nem
substitui as duas falhas x86_64 a 128 MiB. Alterar teto no diagnóstico não modifica
capabilities, qualidade, política operacional ou Terraform. **Não há garantia
universal de escolha da vítima** nem admissão de render/worker/Cloud Run a 256 MiB.
Emulação também não é hardware x86_64 nativo. Os resultados não são benchmark.

Nas execuções com recuperação comprovada, o daemon marcou `OOMKilled=true` mesmo
com PID 1 terminando normalmente (exit zero). Métricas internas e a segunda filha,
não o flag isolado, sustentam a conclusão limitada. Ausência do flag não aprova
uma execução que terminou com erro.

### Artefatos e repetição local

Fontes e resultados estão em diretório diagnóstico privado ignorado pelo Git.
Nenhum JAR, imagem de teste ou relatório OCR anterior foi alterado. Parser de
`memory.events` testado red antes da implementação e depois aprovado: campos
obrigatórios, duplicatas, negativos, overflow e tamanho excessivo são recusados.
Erros/representações não expõem conteúdo ou paths pessoais.

| Artefato preservado                       | SHA-256                                                            |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Probe inicial 128 MiB / 45 s              | `6c865f839d99dc7cc36c4d2ba81228ecf017b925dcfea6ae61923de2ab1cc4a9` |
| Probe 128 MiB com fase sanitizada / 120 s | `2dcde964aafc019962b8838fdd8a0bfcf9f88c685c384049bb3710ade6d29cc9` |
| Probe final 256 MiB / 120 s               | `79c973079705d9c255538e688a6e99d637b9cd8412904f32013899eff1875217` |
| Testes do parser                          | `a5c160250505236780fb5cebbd0aa5b7e03531fc085e3335fa8ed7c06c63a51c` |
| Resultado ARM64 inicial                   | `3fe49d803c646bcbe7b22f0e86edd1399a0d7f622f4dec9c3efdffd36f1e4a56` |
| Falha x86_64 inicial                      | `ef3e254d6f742969278fa3291798c507b2f830134a1a29647b0f7dedf9895577` |
| Falha x86_64 com novo deadline            | `9b10f74aec6779276fcfb04e05e5cd2c3a4dbaa0052bd2b43ccd5f8ab0553b66` |
| Resultado x86_64 256 MiB                  | `47947a9b901fe583cd7bd0ba1389117b9ad09c0dfd87f875b4ea976c71e973ff` |
| Recibo dos fontes, execuções e horários   | `d75364cb31342f4e29710a66f04e4cbbffa82fbfebc2706ec9915bb9bc966205` |

Repetição opt-in: compilar probe/checks pelo JDK 25 existente contra
`target/classes` e executar checks; montar somente classes readonly em `/probe`
na imagem worker exata. Invocar `OomVictimProbe parent` pelo `PropertiesLauncher`,
com `loader.main/path/config` fixos, heap 32 MiB, Serial GC e uma CPU. Usar rede
none, root readonly, capabilities removidas, `no-new-privileges`, 32 PIDs, swap
zero e `/work` tmpfs de 8 MiB. O probe confirma o teto esperado; alterar somente
o Docker sem alterar a fixture não é admitido. Filhas têm ambiente limpo e
deadline finito; só filhos possuídos são encerrados. Capturar saída e estado
antes de remover o container específico. Nada é automático em task/teste comum.

### Decisão

F-020-02 continua aberto: preferência isolada não é contenção agregada/reserva
atômica. Worker completo/serviço alvo e orçamento ainda exigem validação.
TASK-002/006/007/008 e 020/021 não são promovidas. Fonte/configuração auditada
inalteradas: 400 arquivos / checksum técnico
`40c140568670d3ac826a40e485bf533d1f95a10da32c528cc4e76f44aea149b6`.
Segurança residual e aprovação de instalação do candidato Ubuntu são
[pendências separadas](native-residual-security-2026-10-11.md). Gates globais
anteriores conservam suas datas; não são cobertura integral deste probe.

Fechamento documental: checks do parser, cinco links relativos, Prettier
direcionado e diff do gateway aprovados; `pnpm specs:check` passou com 24 testes,
validação SDD e links mobile. Diff global mantém a falha externa de linha em
branco em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`, preservada.
Os quatro containers temporários foram removidos somente após conferir estado
terminal e preservar recibos. Imagens, fontes e resultados locais permanecem;
uma repetição cria novos containers, nunca reutiliza a captura anterior.
