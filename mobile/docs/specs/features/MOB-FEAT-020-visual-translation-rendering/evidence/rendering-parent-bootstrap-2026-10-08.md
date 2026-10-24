# Preparação do próprio pai no runtime — 2026-10-08 UTC

Parcela TASK-002/005/007/008, AC-001/004/005/006. 020 in-progress/open,
changes-requested; 021 approved/blocked. Sem migration, dependência nova,
credencial/provider pago, mídia privada, mobile, deploy ou mudança de RAM cloud.

[Coordenador](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeWorkerParentPreparation.java),
[helper](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeWorkerParentLimitMain.java),
[política](../../../../../../api/apps/translation-gateway/docs/rendering-memory-admission.md).

## Alteração e segurança

O renderer selecionado pré-valida PID 1, cgroup privado, memória/swap/PIDs,
scratch, margem e VmSize antes de qualquer alteração. Cap já confirmado é
reutilizado; caso contrário, helper curto em diretório privado recebe FFM.
Pai não recebe native access; ambiente da filha é vazio. Helper só admite
getppid=1, mesmo executável e cgroup privado, sem PID/path/job na linha de comando.
Não eleva soft/hard herdados. Cap menor não validado, VmSize cheio/desconhecido,
recusa/write ignorado ou escopo perdido falham sanitizadamente.

Helper tem heap/CPU/AS/arquivo/FD/dumpabilidade limitados. IPC fixo WPL1 de 12
bytes contém somente versão e cap; create-only, sem texto/hash de job ou saída
bruta. Depois de término confirmado, pai relê kernel; confirmação não substitui
readback. Timeout/interrupção matam e aguardam a filha antes de limpar apenas
seu diretório. Default disabled e cloud 1 GiB não mudam. Piso diagnóstico 8 GiB
continua sem aprovação operacional; teto virtual não garante RAM/OOM agregado.

## Testes

RED por contratos/coordenador ausentes, depois pure tests green. Escopo,
limites herdados/readback, tamanho/versão do IPC, timeout/interrupção, symlink,
erro sanitizado e allowlist/ambiente/flags do launcher cobertos. Default
inválido ainda impede bootstrap; port primário não prepara default não usado.

Primeiro foco: 49 casos, dois failures no probe final por NoClassDefFoundError:
ele referenciava parser do helper histórico de teste, não montado no cenário
frio. Produção preparou o cap e três jobs READY antes dessa falha. Referência
corrigida para parser de produção, sem alterar asserções/budgets/fixtures.
Foco corrigido: 49 casos, exit 0. Primeira falha preservada, não aprovada.

Recusa real em 1 GiB nos dois alvos revalidada e depois fortalecida: limites
do pai antes/depois idênticos, zero filhos vivos/beans provider, sem imagem ou
ADC. Ambos passaram; não são contadores de OCR real. Suíte leve completa exit 0.

## Worker frio completo

`runtime-parent` não monta/invoca o helper de teste. Pai inicialmente unlimited,
sem flag native access; bootstrap de produção confirma AS 3.221.225.472 bytes,
zero helper vivo e mesmo cap ao finalizar. Banco PostgreSQL 17/Flyway V1–V7,
MockMvc/filtros/storage/codec reais, OCR/tradução falsos. Máxima multicolor
10.000×8.000, 7.322.972 bytes; shapes 1.024×256/512 UTF-16, 64×4.096/8.192 e
zero regiões. Três READY por alvo, integridade/limpeza/reentrega conferidas.

| Plataforma     | memory.peak total (bytes) | VmSize pai final (bytes) |
| -------------- | ------------------------- | ------------------------ |
| ARM64          | 2.479.013.888             | 1.359.003.648            |
| x86_64 emulado | 2.742.374.400             | 1.805.660.160            |

oom_kill=0, score do pai 0 preservado; hashes WebP anteriores:
260a8b2b25a78c7c3f585dbc58ae71d47bbe34f41b51dd625e749d57a206cb77,
20f8a7520fc336c860788a3e65d763e2050cd5a1e9360caaa5b14ce678412534,
07d6f608433046d70748047730c61374557ea86fc0fe8eac37bd0342a31d1d3e.

## Reprodução e fotografia

Pins/caches da [prova x86_64](rendering-amd64-2026-10-07.md), reactor/JAR offline;
selecionar os métodos productionBootstrapPreparesOwnParentAndCompletesMaximumJobs
e productionBootstrapAmd64PreparesOwnParentAndCompletesMaximumJobs, com opt-ins
worker.resources/amd64 e diretórios/hash preparados. Cenário específico fixa
8 GiB, sem aceitar esse valor no seletor comum 2/4 GiB. Sem pull/restart/Google.

350 fontes/testes/configurações, receita path+NUL+bytes+NUL:
584973078c9eace435b34395d1f6d7bff6b1de9738f6d4add0183d7fef009199.
JAR 6e6b3b5562f54b80edea7f645f242a88d1d484b4eb5e430232459bd87d12dc88.
Checksum mobile separado; gates correntes na [review](../review.md).
Performance mobile N/A. Fault injection em ambiente plenamente admitido,
extremos/SDK/layout residentes, retenção integral, qualidade/operação e gate
experimental completo continuam abertos. Não aprovar AC-006 por pico nominal,
cap aplicado ou green padrão com opt-ins não selecionados. História preservada.
