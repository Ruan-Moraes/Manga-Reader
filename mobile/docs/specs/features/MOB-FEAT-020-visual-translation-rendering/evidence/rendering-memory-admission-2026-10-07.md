# Pré-requisito de memória integrado — 2026-10-07

TASK-002/005/007/008, AC-001/004/005/006. Runtime do bean nativo alterado;
020 in-progress/open, changes-requested, 021 approved/blocked. Defaults e RAM
cloud intactos; sem schema/migration, dependência nova, credencial, provider
pago, mídia privada, mobile ou deploy. Performance do aplicativo N/A.

[Política e limites](../../../../../../api/apps/translation-gateway/docs/rendering-memory-admission.md),
[admissão](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxWorkerMemoryAdmission.java),
[testes puros](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxWorkerMemoryAdmissionTest.java),
[prova de recusa](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeWorkerMemoryAdmissionLinuxTest.java).

## Falha anterior e alteração

Global anterior: 2.576 testes, três failures do OOM/recovery; pai morreu antes
da recuperação. Os relatórios/hashes anteriores permanecem na review. O antigo
teste real de OOM não foi removido, enfraquecido nem repetido para buscar verde.

NativeRenderingConfiguration agora exige orçamento/caps/scratch/escopo conhecidos
antes de entregar o RenderPort. Revalidação ocorre sob capacidade única antes de
staging ou launch; pressão posterior à construção pode recusar uma página sem
copiar/decode/filha e sem reter capacidade indefinidamente. Só NIO Java no pai,
sem FFM, alteração de limite/kernel ou privilégio. Não admite OOM por heurística.

Isso é pré-requisito experimental, não reserva atômica ou operação aprovada.
Requer cap real do pai: helper ainda exclusivo dos testes; bootstrap de um JVM
sem cap não passa. O diagnóstico 8 GiB não altera Terraform 1 GiB. Caminhos
gerenciados antigos de 1/2/4 GiB sem admissão deixam de iniciar; fixtures/testes
históricos incompatíveis não podem ser aprovados ou apagados por conveniência.

## Testes executados

RED por tipo de admissão ausente; sete testes puros passaram após implementação.
Nova regressão do supervisor RED por construtor de admissão ausente, depois
green: mudança de pressão não lança filha nem cria staging, libera capacidade,
preserva original e relê a condição na próxima chamada. Contextos disabled/
configuração inválida existentes preservados.

Primeiro foco restrito: um teste antigo de deadline recebeu render-unavailable,
não timeout. Mesmos fontes/comando fora das restrições passaram 20 casos;
nenhuma asserção/prazo foi alterada. Diferença de ambiente observada, causa exata
não exposta pelo erro sanitizado; não apagar o resultado anterior.

Foco com dois probes negativos reais e regressões: 22 casos, exit 0.
Relatório negativo depois fortalecido para exigir presença/tipos e valores
medidos: ambos os probes reexecutados, exit 0. Cgroup real 1 GiB, codec/ELF/hash
admitidos previamente; bean recusado, zero filhos vivos/beans provider, sem
flag native access no pai. Esses valores não são contadores de chamadas reais.
Prova usa contexto slim sem provider/ADC ou imagem, não operação cloud.

## Pipeline positivo com o runtime novo

Foco: sete testes puros mais os dois cenários completos, exit 0. Mesma fixture
máxima 10.000×8.000, 7.322.972 bytes e limites textuais preservados. Spring,
Flyway V1–V7, PostgreSQL 17, storage, MockMvc/filtros e renderer reais; providers
sintéticos. Teto do pai preparado pelo helper possuído antes do Spring;
pai/filha AS 3 GiB, container 8 GiB/scratch 512 MiB/swap zero/64 PIDs.

| Plataforma     | memory.peak total (bytes) | Jobs READY |
| -------------- | ------------------------- | ---------- |
| ARM64          | 2.537.951.232             | 3          |
| x86_64 emulado | 2.725.310.464             | 3          |

Shapes: 1.024 regiões com 256/512 UTF-16; 64 com 4.096/8.192; vazio. Etapas,
hashes/vínculos, original reutilizável, staging e reentrega conferidos; nenhum
OOM observado. Hashes WebP coincidem com a prova anterior:
260a8b2b25a78c7c3f585dbc58ae71d47bbe34f41b51dd625e749d57a206cb77,
20f8a7520fc336c860788a3e65d763e2050cd5a1e9360caaa5b14ce678412534,
07d6f608433046d70748047730c61374557ea86fc0fe8eac37bd0342a31d1d3e.

## Fotografia e pendências

346 fontes/testes/configurações, receita path+NUL+bytes+NUL:
817853e68137a245e57aa9cb75b0d2134b25ebf64c3462033e0da50d143ea018.
JAR novo 6690a0db204d2c93fc9d3f210ce9c2b8235344f55da6e42bf67eb87f629146bf.
Checksum mobile separado; resultados globais/independentes correntes na
[review](../review.md). Não reutilizar verde global do JAR antigo.

Continuam abertos: admissão operacional/launcher suportado do pai, orçamento
agregado sob falhas de memória/disco/timeout/cancelamento, todos os extremos
de mídia e SDK/layout residentes, retenção integral, qualidade e operação.
Não provar isolamento de OOM de kernel por uma recusa de configuração ou por
sucesso com mais RAM. TASK-002/006/007/008 e 021 continuam conservadoras.

## Global e correção de bootstrap — 2026-10-08 (UTC)

Global iniciado em 2026-10-07T23:54:18Z terminou exit 1: 2.586 testes/823
classes; gateway 1.115/107, 12 failures, zero errors/skips. XMLs frescos contados
antes de novos focos/suíte leve. Ambientes 1/2/4 GiB sem admissão recusaram o
bootstrap; isso não é OOM recuperado. Máximos parent-bounded passaram: três
READY por alvo, mesmos hashes, picos 2.446.159.872/2.712.743.936 bytes.

Três failures preventivos expuseram também a criação indevida do default nativo
quando um RenderPort primário de teste havia sido fornecido. Regressão unitária
reproduziu o erro com port falso e distribuição não preparada. Correção: default
lazy, com SmartInitializingSingleton eager resolvendo o port selecionado antes
de concluir bootstrap. Default inválido ainda impede refresh; não apenas adiar
o guard para uma task potencialmente cobrada. Sem configuração operacional nova.

Foco após correção: 21 casos puros/configuração/supervisão exit 0. Probes
preventivos originais, sem mudar asserções/budgets/fixtures, passaram três
repetições: FAILED sem saída, seguinte READY, oom_kill=0, cleanup/reentrega
e hashes conferidos. Port primário do teste e cap da filha 1.536 MiB não
equivalem à admissão do default nativo. Recusas slim em 1 GiB nos dois alvos
também passaram novamente; cinco casos Linux exit 0. Teste real de OOM mantido,
não repetido para obter verde. Suíte leve completa posterior exit 0; nenhum
container possuído do renderer ativo ao término, cache preservado.

Fotografia posterior: 346 fontes/testes/configurações,
636a8e576d5500783cde7de2da458e7bd1e56f04848cd0eeb5406e9a6804adf4;
JAR 70a9f47f42b750e0b5ea434ebfb041070f8188e7588692b515af26de5198cc57.
Hashes/contagens anteriores são fotografias, não gates do JAR novo. Gates
atuais na review. Preparação suportada do cap do próprio pai e fault injection
em ambiente plenamente admitido continuam implementação pendente. Não cortar
qualidade, reescrever a spec ou transferir o orçamento para cloud.
