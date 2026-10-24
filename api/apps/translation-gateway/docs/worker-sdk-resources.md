# SDKs no worker Linux — protocolo local, 2026-10-09

Complementar a prova de [loopback no worker](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/worker-sdk-loopback-2026-10-09.md)
com medição do processo Linux inteiro. Somente harness Java exclusivo de testes:
SDKs e adapters oficiais, serviços gRPC sintéticos em loopback, PostgreSQL em
rede Docker interna, storage local e renderer supervisionado real. Não usar ADC,
Google, modelo ONNX, mídia privada ou download. Runtime/defaults/cloud iguais.

Antes da implementação do cenário, o teste exige três READY sequenciais no mesmo
contexto e apenas três RPCs OCR/dois de tradução após reentregas. Imagem PNG
multicolor de 80M pixels, fontes/codec/qualidade/caps atuais e hashes íntegros.
Os clients permanecem vivos durante o render e são encerrados junto do contexto.
Métrica cgroup inclui clientes e servidores sintéticos, não separa seu custo.

O limite aprovado do provider é 30.000 pontos de código incluindo HTML. Logo a
fixture de 1.024 IDs não cabe nesse request; não aumentar limite ou simular uma
aceitação impossível. Usar 64 regiões de 256 unidades de entrada e 8.192 de
saída: a saída chega ao máximo total de 524.288 unidades UTF-16. Outro controle
usa uma região de 4.096 unidades de entrada/8.192 de saída, e outro zero regiões.
Os máximos de OCR isolados mantêm suas provas distintas. Respostas artificiais
não comprovam expansão provável, texto pintado ou qualidade linguística.

Mesmas imagens Java 23/libwebp fixadas e somente leitura, teto diagnóstico
cgroup 8 GiB sem swap, pai/filha AS 3 GiB, heap pai 512 MiB/filha 128 MiB,
tmpfs finito, CPU/PIDs limitados. Conferir métricas do kernel, cleanup, original,
manifesto, reentrega, schema e rotas públicas inacessíveis. Primeiro ARM64,
depois x86_64 emulado; emulação não representa performance cloud nativa.

Teste precede o helper; falta do novo cenário é red de scaffolding, não finding
de produção. Falha posterior será diagnosticada sem reduzir mídia/qualidade,
silenciar asserção ou trocar tecnologia. Sucesso não admite cloud 1 GiB, ONNX,
GCS/Tasks, OOM agregado ou todos os formatos/falhas. 020 permanece aberta.
