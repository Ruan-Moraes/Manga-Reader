# Timeout e cancelamento no worker admitido — 2026-10-08

Parcela de TASK-002/005/007/008, AC-001/005/006. 020 `in-progress/open`,
verdict `changes-requested`; 021 `approved/blocked`. Providers/imagens são
sintéticos exclusivos dos testes. Sem credenciais, rede Google, custo,
deploy, migrations, alteração legal, mobile runtime ou qualidade/caps menores.

## Lacuna reproduzida e correção de produção

O worker libera seu arquivo inspecionado ao retornar do RenderPort; uma
operação privada pode continuar depois do timeout. O teste novo
`timedOutCallerCanDeleteBorrowedInputWithoutDeletingTheLateChildsOwnedSnapshot`
falhou antes do fix: a entrada da filha era exatamente o path emprestado
apagado pelo chamador. Falha de posse confirmada, não benchmark pendente.

IsolatedRenderAdapter agora cria snapshot comprimido próprio `original.bin`
no staging privado, depois de adquirir capacidade e revalidar admissão.
Copia por blocos de 8 KiB, limita bytes por política/metadata e confere bytes
exatos/SHA-256/prazo/interrupção antes do launcher. Original emprestado nunca
é sobrescrito. Só a operação privada elimina o snapshot depois de terminar
processos/cleanup; o chamador não recebe sua posse. Não duplica raster ou muda
WebP lossless/exact. Mais um arquivo comprimido limitado entra no tmpfs/cgroup.
Testes também rejeitam entrada adulterada/mais longa antes de lançar filha,
eliminam staging e mantêm capacidade única. RenderPort/IPC/HTTP/schema intactos.

## Injeção e limites da prova

Mesma fábrica/preparação/admissão de produção, pacote readonly pinado e pai
com cap real 3 GiB; filhas normais 3 GiB. Harness Spring/MockMvc com filtros,
PostgreSQL 17 privado, storage local e codec real. Só src/test pausa a primeira
filha viva/possuída do worker PID 1 via SIGSTOP e confirma State no kernel.
Sinalização usa comando do sistema em Java, ambiente vazio, sem script ou C
próprio, credencial ou FFM no pai. Fora da filha possuída o helper recusa.
Não sinaliza processos do computador ou parentes/árvore indiscriminadamente.

- Timeout: deadline experimental 15 s, filho pausado e launcher retido;
  chamador retorna 204 com job/etapa FAILED/internal-error. Enquanto o filho
  ainda vive, snapshot próprio permanece íntegro e capacidade responde BUSY,
  sem novo decode. Ao liberar o launcher, supervisor termina/recolhe a filha
  antes de remover staging e permitir a sucessora.
- Cancelamento: caso de uso transacional concorrente marca CANCEL_PENDING
  enquanto etapa RENDERING está RUNNING e filho vivo. Capacidade responde BUSY.
  SIGCONT retoma a filha; renderer/codec terminam, mas commit recusa READY,
  termina job/etapa CANCELLED sem erro e elimina artefatos. Não promete abort
  imediato da downcall por cancelamento HTTP.

A suspensão é falha artificial de agendamento, não diagnóstico de hang do
libwebp nem comprovação de sua fase nativa exata. Exit 137 no timeout vem da
terminação controlada; `oom_kill=0` impede confundi-lo com OOM de kernel.
Conta-se uma injeção e duas filhas reais por container, nenhuma viva ao fim.
Reentrega não repete OCR/tradução; original reutilizável permanece hash-idêntico.

Imagem máxima PNG multicolor: 10.000 × 8.000 (80M pixels), 7.322.972 bytes,
SHA-256 `15e8bc69f58a1905ecd2805ce56267ee652e6dd6a69674663662ae8d5b25469c`,
1.024 regiões. Recuperação: 320 × 220, uma região, três etapas SUCCEEDED e
WebP de 9.734 bytes, SHA-256
`25bf96a61025d14bef4290977c65cd32654c5ef57842a7da75dcd8df81db72c9`.
Uma CPU, swap zero, 64 PIDs, tmpfs 512 MiB, cgroup 8 GiB diagnóstico somente;
RAM cloud 1 GiB/defaults disabled inalterados. Não há admissão operacional.

## Provas concluídas por alvo

| Caso                        | Rodada | Pico cgroup (bytes) | Tempo total (s) | Exit primeira → sucessora | Resultado         |
| --------------------------- | ------ | ------------------- | --------------- | ------------------------- | ----------------- |
| Cancelamento                | 1      | 2444414976          | 32,181          | 0 → 0                     | CANCELLED → READY |
| Cancelamento                | 2      | 2326532096          | 34,337          | 0 → 0                     | CANCELLED → READY |
| Cancelamento                | 3      | 2345115648          | 31,044          | 0 → 0                     | CANCELLED → READY |
| Timeout                     | 1      | 579792896           | 24,040          | 137 → 0                   | FAILED → READY    |
| Timeout                     | 2      | 610660352           | 23,643          | 137 → 0                   | FAILED → READY    |
| Timeout                     | 3      | 592101376           | 23,917          | 137 → 0                   | FAILED → READY    |
| Timeout x86_64 emulado      | 1      | 977563648           | 43,919          | 137 → 0                   | FAILED → READY    |
| Cancelamento x86_64 emulado | 1      | 2746171392          | 63,064          | 0 → 0                     | CANCELLED → READY |

Zero OOM, snapshots/staging limpos, original/providers/estados/hashes conferidos
em todas. Duração inclui bootstrap e recuperação; não é comparação de ganho,
SLA ou medição de todos os consumidores/formatos no limite. x86_64 é emulação
local, não hardware nativo/Cloud Run. Foco terminou exit 0: 49 testes, zero
failures/errors/skips, incluindo oito rodadas de timing e oito regressões de
AS/scratch, além dos testes leves/configuração. Pressão scratch mudou para
512.933.888 bytes: snapshot comprimido próprio também ocupa o tmpfs. Espaço
útil voltou a 536.846.336 depois do cleanup. Sem mudança de cap para passar.
Provas positivas posteriores terminaram exit 0: 20 testes/zero failures/errors/
skips. IsolatedNativeRenderLinuxTest valida PNG/JPEG/WebP, todos os pixels com
decoder independente, alpha/cores invisíveis, máximas e falhas; CLI supervisionado
também foi revalidado. São probes independentes, não admissão operacional.
Worker frio pela fábrica/preparação de produção concluiu três máximas sequenciais
por alvo, sem helper de teste/pausa/port artificial nesse cenário:

| Alvo           | Pico cgroup (bytes) | Tempo total (s) | Jobs concluídos |
| -------------- | ------------------- | --------------- | --------------- |
| ARM64          | 2407231488          | 57,064          | 3 READY         |
| x86_64 emulado | 2816417792          | 116,775         | 3 READY         |

As duas formas de limite textual são 1.024 × 256/512 caracteres e 64 ×
4.096/8.192; terceiro job tem zero regiões, sem tradução. Saídas concordam
entre alvos: 132.976 bytes/`260a8b2b25a78c7c3f585dbc58ae71d47bbe34f41b51dd625e749d57a206cb77`,
130.480 bytes/`20f8a7520fc336c860788a3e65d763e2050cd5a1e9360caaa5b14ce678412534`
e 24.738 bytes/`07d6f608433046d70748047730c61374557ea86fc0fe8eac37bd0342a31d1d3e`.
Estágio/job/hash/manifests/original/cleanup/reentrega conferidos; zero OOM.
Filesystem final ainda retém resultados privados READY até ACK/TTL, por contrato;
staging próprio foi removido. Providers continuam falsos, não são traduções reais.
Maven global padrão offline/Docker terminou exit 0, sem chamadas reais.
Contagem de XMLs frescos desde `2026-10-08T16:20:17Z` é registrada na review
corrente antes da suíte leve. Green padrão não aprova opt-ins não selecionados
ou o extended completo. Node: 92 pass/um opt-in não selecionado, zero failures;
web `tsc -b`: exit 0. JAR atualizado foi empacotado antes de todas as provas.
Sem containers `toonlira-render-*` vivos ao fim dessas execuções.

O RED de posse falhou antes da correção; REDs de compilação dos novos métodos
da fixture precederam implementação. Imports ausentes List/IOException no
harness foram reparados antes do foco verde. Nenhuma asserção/runtime/budget
foi relaxada para corrigir esses erros. Contagens positivas são os 20 casos
dos quatro XMLs terminais, não estimativa de métodos parametrizados.

Após estabilizar esta evidência/tasks/mapa e formatação dirigida, rebasear
somente headers correntes do checksum SDD e executar `pnpm check` integral.
Resultados terminais de suíte leve/mobile/SDD/links/formatação/diff constam da
[review corrente](../review.md); essa review/drift são excluídas do checksum,
mas a presente evidência não. Não inserir hash SDD autorreferente nesta página
ou renovar conclusões históricas das outras features.

## Reprodução e integridade

Preparar JAR offline pelo reactor em `api/` com
`./mvnw -o -q -pl apps/translation-gateway -am package -DskipTests`.
Reutilizar pins/opt-ins locais de
[memória admitida](rendering-admitted-memory-fault-2026-10-08.md), sem pull/install,
selecionando NativeRenderingWorkerLinuxTest e NativeRenderingWorkerAmd64LinuxTest:
`admittedWorkerTimesOutWithoutReleasingLiveChildOrInputAndRecovers` /
`admittedWorkerHonorsConcurrentCancellationBeforeCommitAndRecovers` (AMD64
usa prefixo `admittedAmd64Worker`). Incluir regressões de AS/scratch e testes
leves IsolatedRenderCallDeadlineTest, IsolatedRenderAdapterTest,
RenderCallSupervisorTest, AdmittedRenderFaultsTest, RenderingConfigurationTest.

Snapshot técnico source/tests/config gateway: 352 arquivos, receita caminhos
relativos ordenados + NUL + bytes + NUL, SHA-256
`66e42dbbce77a89650f10f69df3d87f18f02a70e689367c719087b70b882eab3`.
JAR reempacotado após fix:
`9d0c63570e85fe6ed55f22bd3f5d81c15d9f3284d4c19a67543687d7b8e99131`.
9003da67…d7e/6c824691…13f são snapshots anteriores preservados, não renovados.
Checksum de governança mobile é separado e será registrado em review/drift,
nunca inserido na evidência que ele inclui. Performance mobile N/A: somente
governança neste módulo; métricas Linux não equivalem a Android.

TASK-002/006/007/008 permanecem abertas para orçamento completo, extremos de
mídia/SDK/layout, interleavings/retenção integral, qualidade e operação. Testes
históricos de kernel OOM permanecem intactos. Green com opt-ins não selecionados
não aprova o extended completo ou AC-006 integral.
