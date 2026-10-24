# Plano da prova do worker Spring em Linux

Parcela de TASK-002/005/007/008, posterior aos
[limites da filha](rendering-native-limits.md). Somente harness Java de testes,
sem novo adapter/endpoint, migration, dependência, provider, credenciais Google
ou infraestrutura de produção. Reutiliza código/arquivos/cache já preparados.
Não altera 1 GiB cloud/defaults; 020 in-progress/open, 021 blocked.

## Prova implementada, com admissão de orçamento pendente

- Boot JAR real, perfil worker, Flyway V1–V7 e PostgreSQL 17 temporário.
- RenderPort real selecionado por supervised-native e pacote readonly relocável;
  pai sem native access, filha guardada. LocalObjectStorageAdapter real.
- OCR/tradução exclusivamente falsos, marcados como sintéticos; beans de teste
  não são empacotados. Contexto inicial com providers disabled não procura ADC.
  Somente o fixture de teste permite a etapa de tradução falsa após bootstrap.
- Controller real por MockMvc com filtros reais. Tomcat com connector desativado
  (server.port=-1 e porta local -1), sem listener ou porta bindada;
  task continua somente jobRef. GET /v1/capabilities deve ser recusado no worker.
- Instalação/job/outbox pelos casos de uso existentes; claim/confirmação local
  do dispatch não chama Cloud Tasks. Metadados consultados em transação.
- Banco em rede Docker interna, sem publicar portas. Nenhum acesso a DB
  compartilhado; nenhum recurso ou instalação/download automático.
- Bibliotecas de suporte MockMvc já resolvidas no cache Maven, readonly e com
  hashes conferidos, não novas dependências de produção ou executor distribuído.

## Cenários e orçamento

Container do worker: imagem Java já fixada, root/package readonly, non-root,
cap-drop ALL/no-new-privileges, uma CPU, swap zero, 2 GiB **experimentais**.
PIDs e tmpfs finitos, staging próprio. PostgreSQL usa container separado na
rede interna; consumo do motor SQL não entra no memory.peak do worker. Pool,
drivers, Spring, arquivos, fontes e filha pertencem ao cgroup medido.

1. Página pequena sem texto e página pequena com texto: estados reais,
   hash dos dois artefatos e manifesto, original reutilizável preservado.
2. Página 80M multicolor com 1.024 regiões: origem 256 unidades UTF-16 por
   região (262.144 total), destino 512 por região (524.288 total).
3. Mesma mídia com 64 regiões: 4.096 unidades de origem e 8.192 de destino
   por região, mesmos totais. Overflow mantém texto integral no manifesto.
4. Reentrega não chama providers/renderer novamente. Execuções sequenciais
   no mesmo contexto, com arquivos temporários possuídos removidos após cada job.

Exigir READY e três etapas SUCCEEDED, hash/vínculo/tamanho/regiões corretos;
204 isolado não é sucesso. O relatório permite números/metadados sintéticos,
nunca texto, objetos/URLs ou resposta de provider nos logs. Falha de qualquer
caso não pode virar evidência aprovada; não reduzir imagens/texto/qualidade,
aumentar deadline ou mudar RAM cloud para tornar teste verde.

Este primeiro harness não admite automaticamente memória do SDK cloud,
layout experimental residente, operação GCS/IAM, falhas de OOM/cancelamento,
quota total de staging ou isolamento atômico. Esses cenários precisam parcelas
próprias e continuam abertos. Fixtures não aprovam legibilidade multilíngue.
Cada conclusão deve apontar para sua rodada e código auditados, separadamente
do checksum de governança mobile.

## Execução posterior — 2026-10-07

Docker recuperou sem reinício autorizado/executado. Harness corrigido para
nomes binários de classes aninhadas e distinção Connector/listener do Boot.
Ambiente server.port=-1 e localPort=-1 comprovam ausência de bind real.
Spring/SQL/storage/renderer e reentrega passaram na pequena a 2 GiB;
máxima com texto terminou em OOM no mesmo teto. Diagnóstico explícito com
`renderer.worker.memoryMiB=4096` concluiu três jobs máximos sequenciais.
Default do harness continua 2048; nenhum teto cloud/qualidade/prazo foi alterado.
Não converter o verde diagnóstico em admissão operacional ou de 2 GiB.
Valores e limites estão na
[evidência datada](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-worker-linux-2026-10-07.md).

## Estado da primeira tentativa — 2026-10-05

Parcela seguinte: [protocolo OOM](rendering-worker-oom.md) e
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-worker-oom-2026-10-07.md)
medem evento real/vítima, falha sem saída e recuperação no mesmo contexto.
Não alteram o resultado histórico nem aprovam o candidato de memória.

Harness preparado/compilado, ainda sem resultado: Testcontainers aguardando
client Docker. OrbStack status Running, ping no socket timeout de três segundos
sem resposta. Handle vivo não foi tratado como fim nem reexecutado. Recuperação
do engine exige autorização por poder interromper cargas desconhecidas; nenhum
restart/reset ou remoção abrangente executado. Resultado funcional, consumo
e gates completos permanecem pendentes, não aprovados por leitura do código.
