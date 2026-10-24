# Falha controlada por cap AS no worker admitido — 2026-10-08 UTC

TASK-002/005/007/008, AC-001/005/006. 020 in-progress/open, changes-requested;
021 approved/blocked. Sem schema/migration, dependência, credencial/provider
real, mídia privada, mobile, deploy ou alteração de RAM/defaults cloud.

## Implementação e escopo

A fábrica package-private do NativeRenderingConfiguration é compartilhada
com o bean padrão; um launcher de teste não pula pacote, preparação real do
pai, admissão ou revalidação antes da filha. Não há propriedade de fault
injection em produção. O bootstrap continua antecipado e respeita port primário.

[Injetor exclusivo de teste](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/AdmittedRenderFaults.java)
altera somente oito bytes do cap AS da primeira filha no TRN3: 3 GiB → 1.536 MiB.
Não muda mídia, IDs, textos, polígonos, ordem, política, CPU/arquivo/FD ou formato.
Segunda filha usa os limites normais. Teste byte a byte com CJK/emoji/markup/
quebra e região não vazia confere integridade. Primeira verificação comparava
identidade de RenderRequest; corrigida para todos os campos, sem alterar domínio.
Não afirmar RED funcional a partir desse erro de comparação.

## Worker e resultados observados

Novo cenário `runtime-memory-fault`: mesma fábrica de produção, pai inicialmente
unlimited → cap 3 GiB confirmado antes de task e ao finalizar, sem FFM no pai
ou helper vivo. Container local 8 GiB, swap zero, scratch 512 MiB e 64 PIDs;
PostgreSQL 17/Flyway V1–V7/MockMvc/filtros/storage/renderer reais. OCR/tradução
sintéticos, modo público desabilitado e nenhuma chamada Google.

Foco 13 casos, exit 0: nove puros/configuração e quatro execuções completas
(três ARM64, uma x86_64 emulada). Cada execução exige duas filhas e exatamente
uma injeção, job pesado FAILED sem artefatos, seguinte READY/três etapas
SUCCEEDED, marcadores do pai vivo, cleanup, original reutilizável íntegro e
reentrega sem repetir providers. 80M pixels/bytes/limites textuais não reduzidos.

Picos transcritos: ARM64 1.108.529.152 bytes, x86_64 emulado 1.406.492.672.
Outros dois picos ARM64 não transcritos; não inventar zero/média ou usar estes
valores como pior caso. As três repetições aprovadas constam do foco, não de
metadados fabricados. XMLs padrão posteriores substituíram saídas dos opt-ins;
separar o resultado completo do foco da observação numérica retida.

oom_kill=0 nas quatro execuções. Hash da imagem de recuperação nos dois alvos:
25bf96a61025d14bef4290977c65cd32654c5ef57842a7da75dcd8df81db72c9.
Isso prova falha controlada sob cap AS e recuperação, NÃO kernel OOM
compartilhado, pressão posterior/externa, hardware cloud ou operação aprovada.
O teste antigo de OOM real permanece com asserções intactas.

## Reprodução, fotografia e pendências

Pins/JAR/caches da [preparação fria](rendering-parent-bootstrap-2026-10-08.md),
reactor offline e opt-ins worker.resources/amd64. Selecionar
AdmittedRenderFaultsTest, RenderingConfigurationTest e os métodos
admittedWorkerIsolatesAllocationFailureAndRecoversFollowingPage e
admittedAmd64WorkerIsolatesAllocationFailureAndRecoversFollowingPage.
O cenário fixa 8 GiB local; seletor comum 2/4 GiB e Terraform 1 GiB conservados.

352 fontes/testes/configurações, receita path+NUL+bytes+NUL:
bc0a32a099d71696870d3304ccc6f0c6d9d202fac2a7b5228cc4a5a0a90a7760;
JAR 6c8246919b0ef2151b7c273140202f0313ff7fe48b6f72ca715d71e623ec113f.
Checksum mobile separado; gates atuais na [review](../review.md).
Continuam implementação/verificação pendentes: OOM agregado/prevenção total,
disco/timeout/cancelamento em worker admitido, extremos/SDK/layout residentes,
retenção integral, qualidade/operação e extended completo. Não promover AC-006
por fail-fast ou green padrão com opt-ins não selecionados. Performance mobile N/A.

## Instrumentação fortalecida posterior

Contar invocações do launcher não bastava para confirmar processos reais.
O probe passou a guardar os Process iniciados e exigir saída não zero da
primeira filha, zero da segunda e nenhuma filha viva ao finalizar. Foco de
13 casos reexecutado após fortalecer asserções, exit 0; dados/budgets intactos.
As quatro execuções mediram exit 1 → exit 0 e FAILED → READY, uma única
injeção e zero OOM kernel, mantendo cap do pai e hash da página seguinte.

Picos retidos da repetição fortalecida (bytes): ARM64 1.108.426.752,
928.727.040 e 894.083.072; x86_64 emulado 1.375.866.880. Valores não são
worst-case/média nem admissão cloud. Controle não captura exceção bruta do
codec; a classificação correta é falha controlada por teto AS, sem inventar
diagnóstico adicional. Guard/kernel OOM agregado continuam exigindo prova própria.

Fotografia posterior dos testes fortalecidos: 352 arquivos,
f2d75d6d46fc2b3faec9dae37c154c61e75a5ce9d5fb14a7ecefb1af6cec0986.
JAR de produção inalterado em relação ao primeiro foco; hashes anteriores
permanecem como fotografias. Gates atuais na review.
