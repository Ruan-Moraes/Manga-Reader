# Toonlira — APK para teste Android em 10/11/2026

O arquivo `artifacts/toonlira-android-055-test.apk` é uma versão de teste
assinada com certificado de debug, não uma distribuição de produção. Seu
SHA-256 é `84329c87c376c9e739a3f20c2dbcf4c5362087f07cbfb8b23753dbecdd558a3c`.
O pacote é `com.toonlira.app`, versão `1.0.0`, com Android mínimo 7.0
(API 24). O certificado corresponde ao APK de teste de 04/11; a atualização de
outra instalação depende de ela ter a mesma assinatura.

O APK aponta para o gateway temporário do projeto GCP `toonlira-rm` em
`https://toonlira-35-247-244-179.sslip.io`. O endpoint de capabilities respondeu
HTTP 200 com certificado validado em 10/11. A origem depende do DNS externo
sslip.io e não é o domínio definitivo. Os sites Firebase permanecem separados.
O ambiente e seus limites estão descritos em `private-android-test-2026-11-04.md`.

## Instalação e roteiro

Transfira o APK para o aparelho e abra o arquivo para instalá-lo. Caso o Android
informe incompatibilidade de assinatura ou bloqueie a instalação, registre a
mensagem; não é necessário apagar o aplicativo ou seus dados para este diagnóstico.

Abra **Traduzir capítulo** ou a biblioteca local. Crie uma obra e um capítulo,
importe imagens de teste que você tenha autorização para usar, ordene as páginas
e confira os idiomas. Revise o consentimento antes de confirmar a tradução: este
APK usa providers reais e chamadas podem gerar custo. Verifique o progresso de
cada página, a abertura do resultado, a visualização do original e a leitura
após desligar a rede. Para erros, registre a página e a mensagem antes de tentar
novamente. O roteiro detalhado por critério está em
`mobile/docs/specs/features/MOB-FEAT-055-works-chapters-batch-reader/evidence/device-test-plan-2026-11-07.md`;
suas instruções de build sem gateway e de instalação por USB referem-se à versão
anterior, não a este APK.

## Evidência e limites

O APK foi instalado por atualização e sua tela inicial abriu no emulador Android
API 37 em modo somente leitura. A biblioteca abriu e uma obra sintética foi criada
e exibida com capa padrão na sessão temporária, sem chamada de tradução. A
checagem de tipos, o ESLint, os limites FSD e
1.249 testes automatizados passaram. O `pnpm check` completo identificou falta
de classificação de `.java-version` e checksums de reviews divergentes. A
classificação foi adicionada e a validação repetida deixou de apontar esse
arquivo; as revisões continuam divergentes e não foram renovadas sem análise. A
execução separada de `format:check`
também identificou 11 arquivos com formatação divergente. A comparação sem
gravação mostrou que formatar o lockfile isoladamente produziria um diff de
aproximadamente 18.800 linhas; não foi aplicada reformatação ampla. A execução do roteiro
neste APK em aparelho físico e a matriz física
de acessibilidade permanecem pendentes. Não se verificou o fluxo completo de
tradução real desta versão durante a presente conferência.

O saldo e os gastos atuais não puderam ser confirmados nesta conferência. Alertas
de orçamento não impõem teto de gastos, e a cobrança pode atrasar. A retirada
do ambiente continua sujeita ao procedimento e aos limites autorizados.

## Republicação para desativar a quota por instalação

O endpoint público confirmou `enabled=true`, `dailyInstallationQuota=0` e
`dailyGlobalQuota=100` após o reinício da VM. O bootstrap passou na admissão
nativa sem chamar providers. A imagem em execução usa o digest
`sha256:5ccaaa92d81a5521b0bb4484b81b4aecf8794554e6ebcc9d89da7030e1b6d891`.
O PostgreSQL preservou o contador durável da janela, que indicou **20 de 20**
reservas consumidas. A janela precisa de saldo adicional autorizado para
enviar novas páginas a providers.

Instalar `artifacts/toonlira-android-quota-test.apk` sobre a versão de teste
anterior para preservar os dados do aparelho. A assinatura confere. O APK novo
aceita as duas configurações de quota no contrato v2. SHA-256 do APK
`f2a480082f92f8dfdd4d9f4b34fbd8266ad7f5fbaee7db4247273a0dbb67ba13`.
O teste em PostgreSQL 17 real aceitou 34 reservas com quota por instalação
desligada e janela sintética de 34, recusando replay e a 35ª tentativa. O
rollout não executou tradução paga nem validou o lote no aparelho.

## Republicação sem cotas de tradução

A imagem `sha256:c1d15a5c1126ed553c21de5111ce077ec94d684f8d95c8f3de778f3a7b3043c8`
foi implantada na mesma VM. A visão efetiva do endpoint público confirmou o
gateway habilitado com as duas cotas diárias em zero. A visão padrão voltou a
enviar os campos históricos `20` e `100` para compatibilidade com os APKs
instalados. Esses valores não são aplicados nesse modo.

O antigo teto de 20 tentativas da janela deixou de bloquear envios.
O contador preservou o histórico, e a data de encerramento e a proteção de
tráfego continuam operacionais. A prova em PostgreSQL real aceitou 101 reservas
sintéticas, bloqueou uma chave repetida e recusou nova reserva após o prazo.
No ambiente publicado, admissão nativa, identidade e capabilities passaram.
A tradução real no aparelho permanece pendente.
