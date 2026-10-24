# Evidência parcial — worker do renderer, 2026-10-04

Gate 020 aberto; status in-progress; 021 bloqueada. Sem provider pago, ADC,
nova imagem, deploy, recursos cloud, Termos ou mudança de runtime mobile.

## Plano e implementação

[Plano anterior ao código](../../../../../../api/apps/translation-gateway/docs/rendering-worker.md):
PostgreSQL e BCNF existentes, PK/FK/constraints V6, storage privado para pixels
e texto. Nenhuma V7, tabela, índice, contador/cache ou mudança pública de enum.
Transações somente nos wrappers de persistência; nenhum I/O/render/provider
durante uma transação. OCR acrescenta consulta pela PK para prova chave/hash
e distingue falha pré-reserva de falha possuída.

ProcessRenderingTaskUseCase revalida OCR/tradução/original, vínculos/dimensões,
hashes e limites antes da reserva. Original com uma hora ou mais é recusado;
o prazo é conferido novamente antes de upload/commit. RenderPort executa uma
vez; WebP/manifesto são verificados contra a requisição, e uploads create-only
usam chaves aleatórias distintas. Commit grava ambos e READY atomicamente.
O upload da imagem usa o snapshot comprimido verificado, não um path mutável
depois da verificação. Saída externa ao diretório, symlink ou alias do input
não é aceita para upload nem apagada arbitrariamente.

Erro público permanece internal-error. Não há logging de texto, referências,
URLs, paths, bytes ou causas. Falha anterior à reserva não encerra outra execução;
commit ambíguo só é comprovado pelos dois vínculos exatos. DB indisponível
conserva objetos incertos para TTL; rollback/cancelamento remove apenas outputs
próprios não referenciados. ACK posterior não invalida a prova de commit.

O controller worker mantém task {jobRef} e filtros ativos, e chama OCR →
tradução → renderer na ordem. Rotas /v1 permanecem inacessíveis nesse perfil.
Configuração disabled/local, default disabled: somente worker/local prepara
tools previamente admitidos com path/hash/versão e fontes classpath verificadas.
Configuração incompleta falha fechada com mensagem sanitizada, sem fallback,
download, shell, PATH ou ADC. Nenhuma dependência instalada neste incremento.

OCR bem-sucedido não apaga mais o original necessário ao renderer. Erro/
cancelamento terminal confirmado ou commit válido do render remove-o; o
failsafe existente de uma hora não foi ampliado. A confirmação perdida do OCR
agora conserva manifesto por chave/hash mesmo em RENDERING/READY/RESULT_EXPIRED,
não apenas TRANSLATING. Proteção de preclaim foi separada para não matar
ou apagar o original de outra chamada RUNNING.

## Evidência automatizada e limites

- ProcessRenderingTaskUseCaseTest: 31 casos de orquestração com port fake e
  headers WebP sintéticos. Não comprova codec ou qualidade; cobre default sem
  resolver recursos/I/O, jobs/inputs inválidos, hash, TTL, pares/dimensões,
  reserva concorrente, cancelamento, uploads, rollback, confirmação perdida,
  DB incerto, propriedade/limpeza e preservação da imagem reutilizável.
- RenderingConfigurationTest: três casos, default sem recursos, perfil público
  sem renderer e configuração local incompleta fail-closed.
- RenderingWorkerIntegrationTest: dez casos com controller/filtros reais,
  PostgreSQL 17, fontes e libwebp 1.6.0 locais reais. Somente OCR/tradução são
  falsos exclusivos de teste. Página vazia/textual, READY, hashes/manifesto,
  reentrega, cancelamento durante tradução/commit, storage, rollback real,
  confirmação perdida após commit e ACK, concorrência e originais intactos.
- ProcessOcrTaskUseCaseTest: quatro novas regressões para confirmação perdida
  em três estados posteriores e preclaim concorrente; teste histórico ajustado
  para retenção intencional, sem excluir cenário.
- RenderingPersistenceTest: três novas provas de preclaim e referências OCR
  após ACK. Cadeia V1–V6/upgrade e constraints preservadas. Fixture histórica
  de TTL agora conta também original retido; cancelamento continua removendo-o.

Os testes precederam os tipos/configuração e APIs novas (red de compilação).
A primeira rodada de fixtures falhou porque reconfigurar mock com when executou
o answer anterior com argumento nulo. Ajuste para doAnswer/doThrow preservou
as falhas de produto cobertas, sem relaxar assertions/constraints. A prova de
ack perdido é injetada depois do wrapper real commitado, não dentro do TX.

## Matriz parcial

| Critério | Prova desta parcela                                                                       | Ainda aberto                                  |
| -------- | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| AC-001   | input privado revalidado e original reutilizável intacto; cancelamento/rollback sem saída | consolidação integral de retenção/operacional |
| AC-002   | fontes/compositor reais no worker, evidência anterior dos sete destinos preservada        | revisão visual/linguística                    |
| AC-003   | manifesto vinculado ao renderer sem alterar texto/IDs/ordem                               | consumo final e revisão visual                |
| AC-004   | worker entrega WebP real e manifesto vazio sem provider de tradução                       | qualidade/validação operacional               |
| AC-005   | dois arquivos íntegros, commit/ACK real e confirmação perdida protegida                   | URLs assinadas e expiração consultável        |
| AC-006   | um render nativo por JVM, cleanup isolado e falhas de storage/commit                      | deadline global, memória/disco e profiling    |

## Fotografia e comandos

242 arquivos técnicos: `d04a4629bfc0544d94736fcde18a3afc9c72a459826c819c409aadc916d5731b`.
Algoritmo reproduzível: ordenar paths relativos de src/scripts/openapi, pom.xml,
Terraform tf/tfvars.example e calcular SHA-256 de path + NUL + bytes + NUL.
Docs/build/artefatos privados excluídos. Históricos anteriores preservados;
checksum mobile é de governança, não substitui o técnico Java.

```bash
cd api
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=RenderingWorkerIntegrationTest,ProcessRenderingTaskUseCaseTest,RenderingPersistenceTest,GatewaySchemaMigrationTest,ProcessOcrTaskUseCaseTest \
  -Dsurefire.failIfNoSpecifiedTests=false -Drenderer.native.enabled=true \
  -Drenderer.cwebp.path=CAMINHO_ABSOLUTO_ADMITIDO -Drenderer.cwebp.sha256=HASH_ADMITIDO \
  -Drenderer.dwebp.path=CAMINHO_ABSOLUTO_ADMITIDO -Drenderer.dwebp.sha256=HASH_ADMITIDO
```

Preparação explícita dos tools no [protocolo do codec](../../../../../../api/apps/translation-gateway/docs/rendering-codec.md).
Nenhuma instalação/rede Google é autorizada pelo comando. Testes focados e
suíte leve passaram; gates integrais serão registrados na review após execução.
MOB-DEC-007: runtime mobile não alterado, medição Android não aplicável a esta
parcela Java; profiling integral permanece na TASK-008, sem ganho presumido.

## Próximo trabalho

URLs/consulta/expiração, consolidação dos caminhos terminais e TTL, distribuição
do codec e perf/qualidade. Esta entrega não habilita uploads nem produz READY
local no app. Defaults desabilitados e contratos OCR/tradução preservados.
