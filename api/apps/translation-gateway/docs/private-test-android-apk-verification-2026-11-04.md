# Preparação da verificação do APK Android — 2026-11-04

O APK existente em `mobile/android/app/build/outputs/apk/release/` não é
entregável: seu bundle contém `https://translation-api.toonlira.app`, origem
antiga que não resolve. Ele foi inspecionado localmente: pacote
`com.toonlira.app`, versão 1.0.0 (código 1), minSdk 24, targetSdk 36, assinado
com certificado de debug. A compatibilidade com eventual instalação existente
depende de o certificado instalado ser o mesmo; não se deve pedir exclusão de
dados para contornar uma incompatibilidade.

`infra/private-test/verify-android-apk.py` verifica a origem HTTPS efetiva no
bundle, rejeita a origem antiga, confere pacote, versões Android, assinatura,
certificado e SHA-256. Três testes de regressão passaram; uma execução contra
o APK antigo e um hostname sintético falhou como esperado porque o endereço
novo não estava incorporado. Uma presença de texto no bundle, por si só, não
comprova que o app conecte ou traduza; DNS, TLS, fluxo remoto e aparelho
continuam precisando de verificação.

Depois da publicação e verificação do gateway real, gerar o APK com
`EXPO_PUBLIC_TRANSLATION_GATEWAY_URL` igual à origem efetiva e reconstruir o
bundle JavaScript. Executar o verificador com `--apk`, `--origin`, `--aapt` e
`--apksigner` apontando para os binários do Android SDK; guardar o relatório
sem credenciais e somente entregar o APK após a verificação. A assinatura de
debug é apropriada apenas para teste manual, não para distribuição de produção.

## Ensaio de build sintético

Em 2026-11-04, o comando Gradle offline
`:app:createBundleReleaseJsAndAssets --rerun :app:assembleRelease` terminou com
sucesso usando `https://toonlira-192-0-2-1.sslip.io`, reservado para a fixture.
O verificador confirmou essa origem no bundle, pacote `com.toonlira.app`,
versão 1.0.0/código 1, minSdk 24, targetSdk 36 e assinatura de debug. O APK
de fixture tem SHA-256
`2ab122196ab2e86ef4b4337d4d0711d00c251ade4195971d07184d1359534c72`;
o certificado tem SHA-256
`fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
Não entregar o APK sintético: seu endereço não é um serviço disponível. O APK
anterior foi preservado e restaurado com SHA-256
`102248ad68c0e77f0b7c9de737aa0f0ba14bf8e7c3046fed45fbc3c162c52c39`.

Este ensaio comprova somente a geração e inspeção do artefato. A próxima
compilação precisa forçar novamente a tarefa do bundle com a URL efetiva,
verificar sua assinatura e conexão, e não presumir que um bundle intermediário
em cache tenha a configuração correta. Nenhuma instalação ou teste nativo foi
feito nesta rodada.
