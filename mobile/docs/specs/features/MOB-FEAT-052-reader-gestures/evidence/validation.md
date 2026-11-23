# Evidência — MOB-FEAT-052

Data: 2026-09-09. Alterações aplicadas sobre a working tree existente, sem reset,
commit ou alteração de API/web. Aprovação: mensagem humana de implementação do plano.

## Automatizado

- Red inicial: novo teste do controlador falhou por módulo ainda inexistente.
- Green: 103 suítes Jest, 638 testes, zero falhas.
- TypeScript, ESLint e boundaries FSD: pass.
- Testes cobrem estados, handoff drag/momentum, cancelamento, multitouch, long press,
  toque que interrompe momentum, direção lateral, limites de swipe, gesto cancelado,
  migração v2→v3, reinício, erro/retry de gravação e não envio à API.
- Regressões de imagens: configuração limitada para 10/67/200 itens, proporção,
  retry isolado, comparação completa, pares ímpares e restauração por ID/offset.
- Toggle preserva instância da lista, função de geometria e estilo da página e não
  chama scrollToOffset. Memoização limitada às viewports evita trabalho de imagem
  causado exclusivamente pela mudança de chrome.
- Temas claro/escuro de alto contraste e insets de tela pequena cobertos em RNTL;
  nenhum teste Jest equivale a inspeção visual completa ou benchmark nativo.

## Inspeção nativa parcial

iPhone 17, simulador iOS 26.5, build de desenvolvimento existente, fixture local
DEMO com seis imagens. CUA confirmou conteúdo imersivo, ambas as barras compactas,
saída e configurações acessíveis, quatro opções com seleção explícita, indisponibilidade
lateral no modo vertical e troca imediata de preferência. Abrir/fechar painel manteve
página 3/6 e as mesmas imagens no mesmo alinhamento. A preferência foi restaurada
para Toque ou deslize após o teste.

Captura: [barras do leitor](ios-controls.png). Conteúdo DEMO permanece identificado.

As ações AX de botões funcionaram. Injeção de toque por coordenadas e scroll pelo
CUA retornou `noWindowsAvailable`, inclusive com janela visível; por isso a execução
física de toque/swipe/momentum não foi confirmada. O teste Gesture Handler cobre o
reconhecedor em ambiente simulado. Não houve rejeição de aprovação automática.

## Pendências reais

- `adb devices -l`: nenhum dispositivo Android conectado.
- Matriz nativa de orientação, fontes ampliadas, temas e VoiceOver/TalkBack completa.
- Comparação antes/depois de frames e memória em build equivalente com 10/67/200 imagens.
- Status verification-pending e TASK-006 aberta. Não se declara fluidez nativa medida.

## Gates finais

O resultado consolidado de pnpm check e o baseline de formatação estão em review.md.
A política do projeto impede formatação global para corrigir baseline; o JSX existente
foi preservado, com ajustes de estilo revisados somente nos trechos desta tarefa.

## Arquivos e responsabilidades

- `entities/user-setting`: tipo/normalização local e versão do envelope.
- `features/manage-settings/model/settingsStore.ts`: migração e persistência de gestos.
- `features/configure-chapter-reader/ui/ReaderGestureControls.tsx`: opções e retry local.
- `widgets/content-reader/model`: reducer e lifecycle central de interação.
- `widgets/content-reader/ui`: gesto inferior, barras, painel e eventos das viewports.
- Pages de leitor publicado/local/textual e settings-reader: composição das preferências.
- Reader locales pt-BR/en-US/es-ES, testes, README, registry e coverage atualizados.
- Reviews/checksums globais relacionados atualizados por exigência do validador SDD;
  evidências e pendências históricas permanecem explicitamente preservadas.

## Resultado final do gate integrado

Specs, TypeScript, ESLint e FSD passaram. format:check apontou 36 arquivos: todos
os 36 também falharam ao verificar seu conteúdo do index anterior via stdin, sem
alterar a working tree. Nenhuma nova falha de formatação. Jest completo foi rodado
separadamente: 103 suítes e 638 testes passaram. git diff --check passou.
