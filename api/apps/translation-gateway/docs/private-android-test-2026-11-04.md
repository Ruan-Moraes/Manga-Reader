# Teste Android com gateway temporário — 2026-11-04

Este ambiente serve ao teste manual de tradução do aplicativo **Toonlira**.
O projeto de infraestrutura é o GCP `toonlira-rm`; os sites Firebase
`toonlira-rm.web.app` e `toonlira-rm-landing.web.app` são independentes e não
são proxy do gateway. A origem de teste é
`https://toonlira-35-247-244-179.sslip.io`. O nome depende do DNS externo
sslip.io e não é o domínio definitivo do produto. A origem, privacidade e
termos devem ser substituídos ou revalidados antes de uso de produção.

O gateway usa Vision e Cloud Translation, identidade de serviço sem chave no
APK, PostgreSQL para dados operacionais e processamento do conteúdo em
memória. A VM `tl-translate-test-1103` roda em `southamerica-east1-a`, tipo
`e2-highmem-2`, com IP reservado próprio. As regras dedicadas permitem TCP 80 e
443 e bloqueiam os demais ingressos para a VM. O rate limiter em processo
limita a 30 solicitações por cliente e 180 globais por minuto; ele não é
proteção contra ataques volumétricos. Há limite durável de 20 tentativas de
provider para a janela, além das quotas de instalação e globais. Não há retry
pago automático no teste controlado. Respostas e credenciais não devem ser
registradas no proxy; não há credenciais no APK.

O orçamento autorizado é de **US$ 270 no total**, não mensal. O orçamento de
alerta no GCP é de R$ 1.000 para o projeto e o controlador visa parar a VM ao
receber o sinal de R$ 750; alerta não é teto rígido e faturamento pode atrasar.
Há outros custos possíveis, inclusive IP, disco, rede, registry e providers.
Valores e limitações da estimativa constam em
[private-test-pricing-2026-11-04.md](private-test-pricing-2026-11-04.md).
Verificar o custo acumulado no console de faturamento durante a operação e
retirar antes do limite. O saldo informado anteriormente não comprova o custo
atual.

A VM tem remoção programada para **6 de dezembro de 2026 às 12h em São Paulo**,
com disco de boot configurado para remoção. O scheduler aciona o workflow de
retirada para os IDs próprios da VM, IP, regras e registry; a execução em
`dryRun` confirmou os alvos. Confirmar posteriormente a ausência efetiva e
retirar também os controles de apoio que permanecerem. Não remover recursos
Firebase nem recursos fora deste teste. A revisão automática rejeitou uma
atualização da instrução da automação de monitoramento; a automação existente
permanece ativa com seu texto anterior, sem comprovar autorização adicional.

## APK e evidências

`artifacts/toonlira-android-test.apk` incorpora a origem acima. Pacote
`com.toonlira.app`, versão 1.0.0/código 1, Android mínimo 24, alvo 36; assinatura
de debug para teste manual, não para distribuição. SHA-256:
`972fc9375d6b5da2336d67817ea310e259b7f6dc31b77e75c7efa174cd8c44f6`.
Certificado SHA-256:
`fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
A instalação sobre uma cópia já existente depende da compatibilidade da
assinatura; preservar os dados existentes se o Android recusar a atualização.

Em 2026-11-04, HTTPS com certificado válido, páginas legais, capabilities,
identidade e controle de taxa responderam na implantação. Uma única tradução
real de imagem sintética retornou HTTP 200, dois blocos, manifesto e resultado
com hashes verificados e recibo `FINISHED`, sem conteúdo recuperável. A inspeção
visual encontrou pequenos vestígios das letras originais: registrar essa
limitação de qualidade e investigar com regressão. Busca limitada por texto e
hash em volumes operacionais e logs após reinício passou; isso não comprova a
ausência de toda representação possível do conteúdo durante a execução.
O acionamento sintético do controlador parou a VM e ela foi reiniciada.
`pnpm check` no mobile passou: 128 suítes e 1.016 testes. Esses ensaios não
substituem instalação, consentimento, commit privado antes de READY, interrupção,
leitura offline e demais verificações nativas no aparelho. A matriz física de
acessibilidade e os gates formais MOB-FEAT-020/021 seguem abertos.

Em ensaio adicional de 2026-11-04, um envio sintético foi interrompido antes de
completar o corpo: a consulta pelo idempotency key retornou 404 e uma solicitação
posterior com imagem inválida recebeu 415, evidenciando recuperação de admissão
nesse cenário. Os dados foram rejeitados antes da chamada aos providers. Isso não
prova cancelamento explícito durante OCR/tradução nem o ciclo Android.

O APK entregue foi instalado em 2026-11-04 no emulador Android API 37 em modo
somente leitura. O processo e a `MainActivity` iniciaram e o launcher exibiu
“Traduzir capítulo”. O emulador foi encerrado ao fim; não havia dispositivo
físico conectado. Esse smoke test não exercitou tradução, commit ou leitura
no aparelho e não substitui a matriz física.

Em nova prova no emulador, o relógio do gateway estava 200 ms adiantado e
o APK anterior rejeitou a capability. O cliente agora tolera até cinco segundos
de avanço na geração, sem estender a expiração, e oculta a ação se a capability
for indisponível. O APK corrigido reconheceu o gateway e abriu o consentimento
no Android; nenhuma mídia foi enviada nessa prova. `pnpm check` passou com 128
suítes e 1.018 testes. A prova em aparelho físico segue pendente. O APK anterior foi preservado como evidência local.

Na rodada posterior, uma única página sintética em inglês foi enviada pelo APK
corrigido ao gateway real, sem retry automático. O app mostrou a página traduzida,
foi encerrado, reiniciado com Wi-Fi e dados móveis desligados e reabriu o leitor
com “Olá, mundo!” e “Este é um teste.”, evidenciando leitura local offline no
emulador. Pequenos vestígios do original continuam visíveis. Essa prova não
substitui o aparelho físico nem a matriz de acessibilidade.

A revisão do contrato de interrupção confirmou que o protocolo volátil não
expõe endpoint de cancelamento remoto: a ação no aplicativo interrompe a entrega
local e não garante a interrupção de uma chamada externa já iniciada. A prova
de desconexão durante upload não demonstra interrupção durante o provider.
Uma nova chamada paga não foi executada para inferir esse comportamento; o
cenário explícito no alvo e a matriz física permanecem abertos.

Diagnóstico da fixture sintética: os dois polígonos de OCR terminam dentro de
traços escuros do original. Na faixa de cinco pixels imediatamente fora dos
limites superior/inferior das caixas, a primeira contém 225/278 pixels escuros;
a segunda contém 33/0. O pintor limita deliberadamente suas alterações aos
pixels cujo centro está dentro do polígono, conforme AC-001 da 020. Portanto,
aumentar a área apagada poderia remover os vestígios, mas também modificar arte
fora da região aprovada e exige mudança de intenção e aprovação humana. A análise
não prova que todos os artefatos de outras imagens tenham a mesma causa.
