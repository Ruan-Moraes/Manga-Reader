# Evidência — Expo SDK 57

- Data: 2026-09-06
- Ambiente: Node 22.23.1, Xcode 26.6, Simulator iPhone 17/iOS 26.5,
  Expo Go 57.0.9; JDK 17.0.20.1 disponível via Homebrew e JDK 23.0.2 como
  padrão do shell.
- Android emulado: Pixel 10a (`sdk_gphone16k_arm64`), Android 17/API 37,
  Expo Go 57.0.9 e ADB 37.0.1.

## Resultado automatizado

- `expo install --check`: dependências compatíveis pelo mapa local do SDK 57.
- `pnpm dlx expo-doctor`: 21/21 checks aprovados com acesso aos metadados atuais.
- `expo export --platform ios`: bundle Hermes concluído, 2.217 módulos.
- `expo export --platform android`: bundle Hermes concluído, 2.300 módulos.
- TypeScript, ESLint, Steiger, validador FSD e Jest: pass; Jest 95 suítes/553 testes.
- Peer restante: `tsconfck@3.1.6` ainda declara TypeScript `^5`, embora o SDK 57
  recomende e compile com TypeScript 6.0.3.

## Resultado no simulador

- O Expo Go foi atualizado de 54.0.7 para 57.0.9.
- Launcher, configurações do leitor, sliders, draft de tradução local e login da
  plataforma abriram sem erro fatal.
- A navegação de retorno preservou a topologia e o draft local persistido.
- Após mover as rotas, Metro e export confirmaram `src/app` como raiz; home,
  tradução e configurações foram percorridas novamente.

## Resultado no emulador Android

- O Expo Go foi atualizado de 54.0.8 para 57.0.9 e o bundle de desenvolvimento
  abriu com 2.464 módulos.
- Launcher, importação da tradução local, índice de configurações, controles do
  leitor e login foram percorridos por ADB e permaneceram acessíveis.
- A rota de configurações também abriu por deep link, confirmando a topologia do
  Expo Router em `src/app`.
- A inspeção de `logcat` do processo não encontrou exceção fatal, falha de carga
  do bundle ou erro fatal de React Native.

## Resultado no Android físico

- O smoke em aparelho físico foi executado e atestado por Ruan Moraes em
  2026-09-06, sem bloqueio reportado.
- O modelo do aparelho e a versão do Android não foram informados; nenhum dado
  de ambiente foi inferido para completar o registro.
