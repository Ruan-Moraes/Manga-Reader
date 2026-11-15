# OCR inline volátil — evidência 2026-11-02

A entrada produtiva recebe somente bytes. Adapter/configuração por URI e porta
antiga foram retirados do JAR e preservados em teste histórico. O contexto do
mapper contém só operação e dimensões, mantendo algoritmo, ordem estrutural,
IDs por posição e limites. Não há alteração da intenção aprovada.

Guardas de ausência do caminho antigo falharam antes e passaram depois.
VisionOcrAdapterTest cobre sete hints no RPC inline, mídia/limites/operação
antes de provider, UNAVAILABLE, timeout ambíguo, erro embutido e resposta gRPC
excedente. A revisão independente identificou que três falhas ainda usavam o
adapter antigo; esses testes foram migrados à entrada produtiva e reexecutados.
VisionResponseMapperTest mantém geometrias, duplicatas, limites e vazio; o
use case/supervisor verifica zero tradução no vazio, validação integral e cerca
contra avanço tardio após interrupção. Nenhum provider pago foi chamado.

A revisão independente de /root/volatile_specs não identificou runtime faltante
nos seis ACs. Benchmark/referências humanas, especialmente japonês vertical,
imagem real sem texto e comportamento real acima de 75 MP, permanecem abertos;
não são cobertos pela resposta gRPC sintética. Política/admissão do alvo também
não estão aprovadas por teste local.

[Provas da candidata 4](../../../../../../api/apps/translation-gateway/docs/volatile-runtime-candidate-4-verification-2026-11-02.md) vinculam JAR/imagem a HTTP privado, 8 cenários/22 renders e 9 amostras recebidas
pelo cliente. A raiz backend final passou: 2848 testes, zero falhas/erros,
115 skips; os opt-ins descritos foram executados separadamente sem skip.
Recibo da raiz: `.local/mob020-volatile-20261101/root-tests-20261102-4/`.
Não reutilizar candidata 3 ou fluxo GCS como prova desta entrada inline.

A referência global e gates documentais da árvore final ficam no review. Esta
evidência não aprova produção nem implementa aquisição/reader 021.
