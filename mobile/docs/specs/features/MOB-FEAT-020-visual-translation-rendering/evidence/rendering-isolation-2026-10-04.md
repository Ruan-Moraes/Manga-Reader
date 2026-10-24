# Fronteira isolada de renderização — 2026-10-04

Parcela de TASK-002/007/008, AC-001..006, especialmente isolamento de falha.
020 permanece in-progress/open, review parcial changes-requested e 021 blocked.
Não é ativação de um novo modo operacional nem conclusão de AC-006.

## Escopo e implementação

[Plano anterior ao código](../../../../../../api/apps/translation-gateway/docs/rendering-isolation.md).
Fontes novos sob `api/apps/translation-gateway/src/main/java/`:
`infrastructure/rendering/RenderChildSettings`, `RenderSubprocessProtocol`,
`RenderJvmLauncher`, `RenderChildMain` e `IsolatedRenderAdapter`; erro TIMEOUT
interno sanitizado em RenderFileException. Não modifica RenderPort ou manifesto.

Filha Java sem Spring/provider, ambiente removido, stdout/stderr descartados,
heap explícito/ExitOnOutOfMemoryError e java.io.tmpdir na pasta privada própria.
IPC de request limitado a 8 MiB e resultado a 64 KiB, contagens/EOF/flags/IDs
validados; sem Java Serialization. Resultado transporta somente metadata e
placements; texto/ordem/geometria são reconstruídos da requisição do pai.
WebP revalidado por bytes/MIME/dimensões/hash, transferido atomicamente e 0600.
Original nunca é removido/escrito. Cleanup só usa o diretório exato criado pela
rodada e não segue symlinks. Erro de uma remoção não impede tentar a outra.

Não há bean/propriedade nova, alteração PostgreSQL/SQLite/migration, conexão com
pipeline ativo, download, credencial ou rede Google. Classpath Boot é recusado
explicitamente até admissão, em vez de tentar um launcher incompatível.

## Testes e diagnóstico

Primeira execução red: tipos ainda ausentes, antes da implementação. Primeiro
teste funcional no sandbox macOS revelou falha de enumeração (`sysctl`) e raw
exception no finally antes do kill. Corrigido para sempre tentar encerrar a JVM
diretamente possuída; regressão usa erro de enumeração e confirma morte real sem
diagnóstico exposto. Verificação exata não encontrou fixtures filhas restantes.
Testes de supervisão foram repetidos fora do sandbox com autorização local;
nenhuma supervisão foi desabilitada para obter resultado verde.

Testes novos, executados também na suíte global com opt-in nativo:

- RenderSubprocessProtocolTest: seis; round-trip preserva Unicode/HTML/quebras,
  IDs/ordem/geometria/política/hashes; limite/EOF/truncamento/versionamento,
  contagens antes de alocação, flags estritos, vínculo e symlink IPC.
- IsolatedRenderAdapterTest: seis; JVM real bloqueada encerrada por prazo,
  repetição sem staging, cancelamento, BUSY sem fila, heap esgotado em filha,
  ambiente/argumentos/heap, saída inválida e symlink sem corromper original,
  enumeração negada sanitizada. Nenhuma JVM de provider é criada.
- IsolatedRenderAdapterNativeTest: nove; sete destinos com texto sintético e
  PNG/WebP vazios usando libwebp previamente instalado. Resultado pixel a pixel
  idêntico ao renderer atual, manifesto estrito revalidado, hashes/original
  íntegros e somente WebP transferido, sem temporários órfãos nessas fixtures.

Essas provas são funcionais. Não demonstram qualidade linguística, legibilidade
geral, memória/RSS nativa ou desempenho em páginas no limite.
Performance mobile não aplicável: seu runtime não foi alterado.

## Limitações e próximo incremento

- Ainda sem integração do adapter supervisionado como bean do worker.
- Heap não limita memória nativa, RSS/libwebp ou disco. Exige orçamento e
  contenção do ambiente antes de admissão operacional.
- descendants é snapshot: janela fork/exit não é coberta atomicamente. Process
  group/cgroup Linux precisa implementação/teste, não apenas benchmark externo.
- Deadline supervisiona a filha inteira, inclusive preparação/decode/pintura/
  encode; I/O do pai não é preemptível por isso. Não é deadline integral do
  chamador sob filesystem travado. Capacidade permanece indisponível caso a
  terminação conhecida não possa ser confirmada; não há promessa de recuperação.
- Faltam admissão Boot/Linux, empacotamento codec/bibliotecas/licenças, revisão
  visual, profiling e auditoria integral de retenção/operação.

Essas lacunas são mantidas nas tasks. Não promover 020 ou desbloquear 021 apenas
por estes testes. Defaults disabled e autorizações de custo/cloud preservados.

## Integridade e gates

Checksum técnico reproduzível do gateway: 279 arquivos de src/scripts/openapi,
pom e Terraform (.tf/tfvars.example), caminhos relativos ordenados; SHA-256
de caminho + NUL + bytes + NUL:
`663d9cc162d4944e53c5a38a002ffa9bccd8f04032b9e337fab7fa805994fa59`.
Separado do checksum de governança mobile; fotografia histórica de
[dispatch](dispatch-ownership-2026-10-04.md) preservada.

Maven global offline/Docker, com codec nativo opt-in já instalado: exit 0;
comando e pins são os da
[parcela pós-commit](lifecycle-controls-cleanup-2026-10-04.md#integridade-e-validação).
Iniciado em `2026-10-04T17:07:44.252Z`: XMLs frescos, 894 testes/73 classes no
gateway, zero failures/errors/skipped; quatro harnesses históricos excluídos.
Contagem realizada antes da suíte leve, sem Maven sobreposto. Os 21 testes
novos estão incluídos; não inferidos de relatórios antigos.

Suíte leve `./mvnw -o -q -pl apps/translation-gateway -am test
-Dtest.excludedGroups=testcontainers`: exit 0; testes de processo requerem
permissão local de enumeração no macOS. Node `node --test scripts/*.test.mjs`:
exit 0, 85 pass e um opt-in de fonte não selecionado. Web `pnpm exec tsc -b`:
exit 0. Mobile `pnpm check` integral: exit 0, 116 suítes/892 testes, além de
30 testes performance, 24 SDD e seis FSD; typecheck/lint/FSD/formato/links verdes.
Warnings existentes de act/ícones Expo preservados, sem enfraquecer gates.
Prettier somente nos documentos/mapeamento alterados e git diff --check: exit 0.
Headers de checksum são rebaseados mecanicamente após estabilizar esta evidência;
SDD/links/formato finais revalidados, sem renovar conclusões históricas de outras
features. O checksum mobile não representa cobertura dos fontes Java acima.

Nenhuma instalação, chamada paga, uso de credenciais, imagem nova, tradução real,
alteração legal, deploy ou recurso cloud.
