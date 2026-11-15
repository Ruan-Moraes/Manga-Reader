> Trecho histórico substituído em 2026-11-01.

### Gateway de tradução em implementação

O pipeline privado de OCR/tradução não será incorporado à Core. O serviço Spring
Boot independente em `api/apps/translation-gateway` possui contrato OpenAPI v1,
identidade e sessão anônimas, capabilities fail-closed, submissão idempotente,
quota concorrente, consulta/cancelamento, outbox e adapters para storage/Cloud
Tasks. O perfil worker e o adapter Vision regional `us` estão codificados e
testados offline; OCR, worker cloud e uploads permanecem desabilitados. A
infraestrutura está declarada em Terraform, sem `apply`. Contratos, adapter
global e orquestração offline de tradução foram codificados, com default
desabilitado; migration V4 e concorrência foram validadas offline com
PostgreSQL/Docker. Capabilities publica somente os pares operacionais configurados,
também conferidos na submissão e no worker. O mobile valida o manifesto traduzido
em contrato local estrito e possui escrita transacional de regiões. O ACK
server-side é durável e idempotente; download, commit integral e envio de ACK
pelo aplicativo continuam na 021. A 019 está em verificação e a 020 tem gate
aberto após auditoria, com contratos/serialização Java, fontes verificadas e
composição raster e adapter de arquivos locais implementados/testados.
O renderer tem fronteira transacional de reserva/commit dos metadados de imagem
e manifesto e cleanup/ACK. O worker integra arquivos/uploads privados em modo
local opt-in, com revalidação, reserva única e proteção de confirmação perdida;
seus testes usam OCR/tradução sintéticos e codec real. Original é retido depois
do OCR até render/terminal ou failsafe. Consulta de READY aplica TTL e cleanup
durável de resultado. Entrega privada usa projeção owner-scoped curta, assinatura
fora de transação e revalidação de estado/TTL antes do HTTP; parser mobile
valida os metadados, sem aquisição. A fila de ciclo de vida reconcilia falhas e
cancelamentos e remove somente o original após READY; intenção individual é
atômica com estado e leases recuperam limpeza interrompida, separadamente do
ACK. Cada worker habilitado tenta a limpeza elegível do próprio job ao finalizar,
fora de transação; falhas mantêm retry sem substituir o resultado. O cleanup
executa a varredura privada por idade mesmo após falha SQL de outra fase.
Cancelamento terminal e dispatch esgotado registram tentativa somente após
commit; rollback não remove arquivos. A limpeza de ACK suspende TX externa,
com claim/confirmação próprios e storage fora de transação.
Dispatch aplica CAS pela tentativa existente antes de alterar job/cleanup;
conclusão atrasada não encerra job confirmado ou outra lease. Cancelamento e
dispatch terminal usam locks job → outbox, sem I/O externo durante transação.
Bootstrap/scheduler/storage indisponíveis, distribuição do codec e profiling
continuam pendências operacionais/técnicas, sem promessa de SLA não medida.
Em 2026-10-05, a decisão humana mantém libwebp lossless/exact, sem cópias
redundantes na aplicação, admitindo buffers internos em orçamento total medido.
O [plano de memória](../api/apps/translation-gateway/docs/rendering-memory-policy.md)
separa prova local do codec de admissão do worker completo. O adapter FFM
supervisionado é selecionável somente pelo opt-in local `supervised-native`,
após admissão de pacote readonly fixado e relocável; o pai não carrega FFM.
Prova mínima do bean não é admissão do worker completo: contenção e recursos
totais continuam pendentes, sem alterar a RAM cloud ou defaults desabilitados.
Na parcela posterior, a filha aplica limites self-only Linux de endereço,
CPU, arquivo e descritores antes de fontes/decode. São proteção parcial, não
RAM agregada ou quota de staging; o [registro](../api/apps/translation-gateway/docs/rendering-native-limits.md)
mantém abertas a admissão do worker completo e contenção de OOM compartilhado.
O harness Spring/SQL/storage/renderer foi executado com providers falsos;
[evidência](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-worker-linux-2026-10-07.md)
registra OOM no máximo com texto a 2 GiB e sucesso funcional no diagnóstico
a 4 GiB. Não altera a configuração cloud nem aprova operação/qualidade.
Parcela x86_64 posterior acrescenta admissão vinculada a manifesto/ELF/runtime,
sem fallback ou download em task; codec e worker completos com providers falsos
foram executados sob emulação local. A
[evidência](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-amd64-2026-10-07.md)
separa compatibilidade funcional de hardware nativo, orçamento e operação cloud;
OOM compartilhado e distribuição operacional continuam pendentes.
Tradução real e validação operacional continuam pendentes; nenhum upload real deve ser
anunciado. A arquitetura, modelo relacional,
fronteiras FSD, retenção e gates estão em
[`translation-gateway-plan.md`](translation-gateway-plan.md).

Em 2026-10-18, Ruan manteve a implementação server-side e priorizou como
[DT-76 urgente/P1](tech-debt.md#dt-76-renderização-híbrida-de-tradução--urgentep1)
a [investigação de renderização híbrida](../api/apps/translation-gateway/docs/hybrid-rendering-options-2026-10-18.md).
OCR/tradução remotos com overlay ou patches no aparelho são alternativas futuras,
não arquitetura ativa, garantia de economia ou alteração dos contratos 020/021.

