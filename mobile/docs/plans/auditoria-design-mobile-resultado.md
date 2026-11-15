# Auditoria de design do Toonlira mobile

Execução parcial em 12 de novembro de 2026. A cobertura visual confirmada se concentra nas superfícies públicas e locais do Android. O aceite de acessibilidade por leitor de tela e as medições físicas permanecem em `verification-pending`.

## Baseline

- Checkout em `1c949ce0`, com 203 entradas no status inicial. Entre as alterações anteriores estavam componentes do kit, biblioteca, tradução, leitor, processamento em segundo plano, gateway e alterações no web e na API. Os casos sobrepostos ao [plano de correções do leitor](2026-11-11-correcao-leitor-paginas-e-controles.md) permaneceram na fila de validação.
- Android `emulator-5554`, 1080 × 2400, Toonlira 1.0.0 (1). SHA-256 do APK release local anterior `44b474f4393ac10016f34081e4465a7000334fe8f9be8122ade666a1b97e9999`. SHA-256 do APK gerado com a correção `d0bd45f4f637e69c89b32b4f100de56b3a8adb6312743f3f0a23831b384a2495`. O APK corrigido foi instalado preservando os dados do emulador. A passagem escura confirmada usou a preferência **Escuro** do app, pois o emulador estava com **Claro** selecionado no Toonlira. A preferência inicial foi restaurada.
- iPhone 18 Pro simulado, iOS 27.2. A build Release foi compilada e instalada. A automação de links encontrou o diálogo do sistema “Abrir com Toonlira?”, que também permaneceu sobre o simulador após a tentativa de relançar o app. O controle visual do Simulator ficou indisponível nesta sessão. [Captura do bloqueio](../../../artifacts/auditoria-design-mobile/ios-bloqueio-abertura.png).
- A biblioteca Android tinha dois capítulos locais sem obra, ambos com zero de oito páginas prontas. A fixture completa com conta de teste, obra e páginas prontas/com falha ficou pendente. A API local em `localhost:8080` recusou a conexão durante a execução.

## Matriz de rotas

| Lote e rotas | Cobertura Android | Em aberto |
| --- | --- | --- |
| Fundação e `/` | Início revisado antes/depois. Conferidos a ação de ajustes, cards de módulos e o rótulo nativo do botão. | TalkBack/VoiceOver, foco por teclado, estados pressionados e validação completa dos consumidores. |
| `/platform/status`, `/login`, `/register`, `/forgot` | Entrada, formulário de cadastro e recuperação alcançados em pt-BR. | Autenticação real, teclado e estados de erro e sucesso. |
| `/settings`, `/settings/appearance`, `/settings/locale`, `/settings/content-languages`, `/settings/reader`, `/settings/privacy`, `/settings/data`, `/settings/about` | Rotas de entrada alcançadas. Em Aparência, tocar em Escuro mudou a seleção e a paleta. Idiomas de conteúdo e Privacidade exibiram o pedido de login. | Subpainéis, fluxo autenticado e combinações de densidade compacta, fonte ampliada, tela estreita, contraste, movimento reduzido e os três idiomas. [Aparência clara](../../../artifacts/auditoria-design-mobile/android-light-appearance.png) · [Aparência escura](../../../artifacts/auditoria-design-mobile/android-confirmed-dark-appearance.png). |
| `/translation-library`, `/work/[workId]`, `/work/[workId]/manage` | Biblioteca com grade vazia e duas linhas sem obra. Em repouso, fundo e borda envolviam miniatura, texto e menu lateral. | Obra com capítulos, ações laterais pressionadas, gerenciamento, vínculo individual e múltiplo. [Claro](../../../artifacts/auditoria-design-mobile/android-light-library.png) · [Escuro](../../../artifacts/auditoria-design-mobile/android-confirmed-dark-library.png). |
| `/offline-translation` | Entrada da importação e ação fixa observadas em claro e escuro. | Seleção e prévia de imagens, reordenação, idiomas, validação, resumo, destino, consentimento, progresso, falha, cancelamento e nova tentativa. [Claro](../../../artifacts/auditoria-design-mobile/android-light-translation.png) · [Escuro](../../../artifacts/auditoria-design-mobile/android-confirmed-dark-translation.png). |
| `/translation-reader/[projectId]`, `/reader/[titleId]/[number]`, `/reader-preview/novel` | Entrada dos ajustes do leitor em ambos os temas. A prévia textual requer build de desenvolvimento. | Exercitar leitor local e da plataforma com dados, incluindo paginado e contínuo, zoom, texto completo, busca, ordenação, vazio, navegação e fechar ajustes. [Claro](../../../artifacts/auditoria-design-mobile/android-light-reader-settings.png) · [Escuro](../../../artifacts/auditoria-design-mobile/android-confirmed-dark-reader-settings.png). |
| `/platform`, `/platform/library`, `/platform/forum`, `/platform/profile`, `/modal`, rota desconhecida | Tentativas de abrir as abas retornaram à entrada da plataforma sem sessão. Uma rota desconhecida exibiu o 404. | Conteúdo das abas com sessão e abertura do modal. `+html.tsx` é a casca web e os `_layout.tsx` são cascas de navegação. [404 claro](../../../artifacts/auditoria-design-mobile/android-light-not-found.png) · [404 escuro](../../../artifacts/auditoria-design-mobile/android-confirmed-dark-not-found.png). |

A matriz iOS de fluxos está em aberto por causa do bloqueio de abertura descrito acima.

## Achado e correção

| ID | Rota e estado | Reprodução e correção | Validação | Prioridade e estado |
| --- | --- | --- | --- | --- |
| DESIGN-001 | `/`, ícones decorativos na tela inicial | O dump Android completo continha seis nós de glifos privados, incluindo um abaixo do botão rotulado “Configurações do aparelho”. `Icon` já declarava a exclusão no iOS e passou a declará-la também no Android. O critério é MOB-FEAT-057/AC-014. | No APK corrigido, a árvore filtrada do UI Automator manteve “Configurações do aparelho” e retornou zero nós com glifos privados. O dump completo mantém os seis nós e faltou um dump filtrado do APK anterior para comparação equivalente. O teste de regressão confirma as propriedades nativas nos dois sistemas e preserva o rótulo de ícones informativos. | P2 · correção aplicada, `verification-pending` para confirmar a ordem e a fala no TalkBack e no VoiceOver. |

[Antes, tela](../../../artifacts/auditoria-design-mobile/android-before-home.png) · [Depois, tela](../../../artifacts/auditoria-design-mobile/android-after-home.png) · [Árvore completa anterior](../../../artifacts/auditoria-design-mobile/android-before-home.xml) · [Árvore filtrada posterior](../../../artifacts/auditoria-design-mobile/android-after-home-compressed.xml).

## Fluidez

`CADisableMinimumFrameDurationOnPhone=true` foi confirmado no plist local, no projeto gerado do zero pelo Expo CNG em diretório isolado e no produto Release para o simulador. A validação da distribuição física está pendente. O ajuste de alta taxa no Android depende de uma limitação reproduzida em hardware.

- [ ] Medir baseline e versão corrigida em iPhone ProMotion, Android de 90/120 Hz e hardware de 60 Hz. Usar Perfetto e Instruments em três passagens por cenário. Registrar Hz ativos, tempos de quadro, quadros perdidos, configuração, energia e temperatura. Os cinco cenários são rolagem da biblioteca, abertura e fechamento de painel, troca de página, zoom e arraste.
- [ ] Executar a verificação física aberta em MOB-FEAT-057/AC-014 e fechar a matriz de estados, idiomas e rotas autenticadas com a fixture completa.

## Gates

| Gate | Resultado |
| --- | --- |
| Mobile `pnpm check` e `pnpm specs:check` | As mesmas 17 revisões já tinham checksum divergente no baseline e após a correção. O encadeamento parou nesse gate. |
| Mobile `pnpm typecheck` e `pnpm lint:fsd` | Passaram em execução separada. |
| Mobile `pnpm test:ci` | Baseline com 1 falha em `OfflineTranslationPage.test.tsx`, na expectativa pelo alerta de vínculo. A execução após a correção passou com 1.284 testes em 169 suítes. O teste focado do kit passou com 42 testes. |
| Web `npx tsc -b` | Passou. |
| API `./mvnw test` | Baseline com 1 falha em 1.436 testes do Core. `AuthSecurityIntegrationTest.authenticatedReleaseSeenShouldReachApplicationBoundary` recebeu 500 em vez de 404. O log do teste aponta a tentativa de usar transação em MongoDB sem replica set. Os módulos seguintes foram ignorados pelo reactor. |
