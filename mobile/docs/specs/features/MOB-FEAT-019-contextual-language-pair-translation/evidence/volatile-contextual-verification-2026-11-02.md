# Tradução contextual volátil — verificação técnica em 2026-11-02

A revisão independente de `/root/volatile_specs` conferiu os seis ACs e encontrou
uma janela entre preparação e início da próxima etapa cobrada. Cinco testes
reproduziram o problema; a correção verifica sessão/interrupção imediatamente
antes de OCR, Translation e render. A conferência independente confirmou a
correção. Três testes adicionais compõem supervisão/use case reais e bloqueiam
reserva ou preparação: deadline encerra a espera, capacidade não é reutilizada
antes da limpeza e a próxima etapa nunca inicia após o abandono.

| Critério | Implementação e prova técnica atual                                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001   | ConfiguredTranslationPairs/GetCapabilities e factory: 42 pares representáveis, whitelist ativa, endpoint/modelo explícitos, sem fallback                                                              |
| AC-002   | TranslationEnvelopeCodec/CloudTranslationAdapter/TranslationValidator: um HTML contextual, IDs opacos e ordem preservada; gRPC privado                                                                |
| AC-003   | Hans/Hant explícitos no request/modelo, manifesto e contratos locais; nove amostras incluem ambos os destinos                                                                                         |
| AC-004   | IDs ausentes/extras/duplicados, markup hostil e limites falham integralmente antes de render; testes codec/validator/use case                                                                         |
| AC-005   | Vazio evita Translation (HTTP8/7, visual9/8); falhas e cinco regressões de fence + três deadlines reais impedem avanço                                                                                |
| AC-006   | 30000 codepoints incluindo marcadores aceitos, 30001/expansão HTML recusados antes do RPC, Unicode suplementar completo; retry SDK desabilitado, replay409 sem provider, logs/DB/scratch sem conteúdo |

A candidata 5 usa JAR
`c0246b95a4df89ac110e81e17c355940f1afe2dcb477e1df6a681e0db02403fa` e imagem
`sha256:25a772f3637774b37311aeca4a7ec000644fdb463b3aeeb5369d214686421069`.
[Prova detalhada do gateway](../../../../../../api/apps/translation-gateway/docs/volatile-runtime-candidate-5-verification-2026-11-02.md).
Recibos locais em `.local/mob020-volatile-20261101/candidate-5-local-verification-20261102/`.

São fixtures sintéticos, SDK real contra gRPC privado, sem provider pago ou
mídia de usuário. Esta prova não avalia naturalidade/nomes próprios nem libera
operação pública. TASK-006 (benchmark humano) e TASK-007 (políticas/configuração
admitida) permanecem abertas. Não herda aceite do transporte anterior e não
implementa a aquisição 021.

O limite foi reconferido na documentação primária de
[quotas Cloud Translation](https://docs.cloud.google.com/translate/quotas) e o
modelo em [Translation LLM](https://docs.cloud.google.com/translate/docs/translation-llm).
A medição inclui o documento completo enviado; não somente o texto visível.
