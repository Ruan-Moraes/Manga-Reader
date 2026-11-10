# Conferência das páginas e do disclosure — 2026-11-04

Esta é uma conferência local, não publicação nem aprovação da operação com
mídia real. As duas páginas devem ser verificadas por HTTPS na origem efetiva
antes do uso; também falta confirmar que a imagem publicada contém exatamente
os arquivos gerados abaixo.

Os textos `legal.json` de português, inglês e espanhol identificam Ruan Moraes
como operador, incluem o contato de privacidade registrado no projeto e
explicam o processamento volátil, o armazenamento privado no aparelho,
recibos e logs operacionais, Cloud Vision e Cloud Translation. O código usa
`us-vision.googleapis.com:443` com `projects/.../locations/us` para OCR e
`projects/.../locations/global` para tradução. O consentimento mobile informa
operador, contato, localidades, retenção e a política de treinamento fornecida
pelo gateway. Esses itens foram conferidos por leitura dos arquivos; a
apresentação no aparelho ainda depende de verificação nativa.

Em 2026-11-04, as perguntas frequentes oficiais do [Cloud Vision](https://docs.cloud.google.com/vision/docs/data-usage)
e [Cloud Translation](https://docs.cloud.google.com/translate/data-usage)
informavam que o conteúdo enviado não é usado para treinar ou melhorar os
respectivos recursos. A primeira também distingue processamento síncrono em
memória de operações assíncronas; a segunda informa que o endpoint global não
garante permanência em região específica. A configuração efetiva de providers,
uso de suas APIs e texto devolvido em `providerTrainingPolicy` devem ser
comparados novamente antes de liberar mídia real.

`node --test infra/private-test/legal-pages.test.mjs` passou os dois testes de
geração, presença dos idiomas e escape. As páginas geradas localmente estão em
`.local/toonlira-public-test-20261103/legal-audit-20261104/legal/`:

- termos, SHA-256 `aa3b0f056e3b9ad8e581a91526cf2ba07d8033fe9210882e482b264f9c17762d`;
- privacidade, SHA-256 `9a4ecc91ae629abc5c90c5b4141da269372937113e06adb9c154fe3a94184b72`.

Fontes `legal.json` SHA-256: pt-BR
`2e578145bd51b9dc420a8623f8c50b7fb08588f417e11558e94ad505864c8b6f`;
en-US `078031d9d4d303c3b5fe5c5599d07c701c136a41a40a3066441af164b459dbf4`;
es-ES `107e18e253603a171fcc161555f67ee294cf94bfb0aa723404e68df13d88f8b6`.

O gerador local `infra/private-test/prepare-settings.mjs` prepara a configuração
somente quando recebe o IP efetivo, recibo das imagens e limite de tentativas.
Ele gera identificadores distintos, arquivo novo com modo 0600, prazo máximo
aprovado, pares suportados e texto de treinamento nos três idiomas, validando
os mesmos formatos exigidos pelo preflight. Não cria recursos, não ativa
providers e não foi usado para gerar configuração real. O número de tentativas
continua sendo limite operacional, não teto financeiro; deve ser escolhido
após a conferência de preços, cobrança e margem. A documentação dos providers
e o texto final devem ser revistos antes de habilitar tráfego real.
