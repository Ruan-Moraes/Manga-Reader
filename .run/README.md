# Configurações compartilhadas do IntelliJ IDEA

As configurações desta pasta aparecem em **Run | Edit Configurations** e são
versionadas para todo o time. Elas usam os comandos e diretórios de trabalho
documentados nos READMEs de cada módulo.

## Grupos

- `Backend`: API Core e Translation Gateway.
- `Backend / Jobs`: os três jobs auxiliares.
- `Backend / Tests`: reactor completo, Core (com e sem Testcontainers), jobs e
  Translation Gateway.
- `Frontend`: servidores Vite das aplicações (Toonlira, Landing, Gateway Tester).
- `Frontend / Tests`: todas as suítes web, execuções focadas, watch e coverage.
- `Mobile`: Expo Dev, Android, iOS e Web.
- `Mobile / Tests`: Jest em CI/watch, integridade das specs e o gate completo.
- `Gateway`: Configurações dedicadas para testar o Translation Gateway:
  - `Translation Gateway (8084)`: só o backend do gateway
  - `Translation Gateway + Swagger (8084)`: gateway + abre Swagger UI
  - `Gateway Tester Dev (5175)`: interface web para testar o gateway
  - `🚀 Full Gateway Stack`: todos os três acima juntos

Os nomes com `/` representam a hierarquia lógica pedida. O IntelliJ persiste
somente um nome de pasta por configuração compartilhada, portanto esses grupos
aparecem como pastas irmãs na lista de configurações.

## Pré-requisitos

- Backend: Java 23 e Docker para as suítes que usam Testcontainers.
- Web/mobile: Node.js e pnpm; dependências previamente instaladas.
- Mobile Android/iOS: toolchains nativas e emulador/simulador disponíveis.

`Backend Tests - Core without Testcontainers` é a alternativa rápida quando o
Docker não estiver disponível. `Mobile Tests - Full Check` é o gate normativo do
aplicativo e inclui specs, TypeScript, lint, FSD, formato e Jest.
