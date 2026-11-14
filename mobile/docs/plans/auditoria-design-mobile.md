# Auditoria e correções de design do Toonlira mobile

Este roteiro orienta a revisão do app Expo em Android e iOS. A auditoria começa pelas rotas de `mobile/src/app` e inclui as superfícies abertas por elas. O objetivo é corrigir inconsistências que afetam leitura e interação, simplificar a interface e permitir que gestos e animações aproveitem a maior taxa de atualização disponível. O inventário abaixo é a fila inicial da auditoria. Uma linha só vira achado quando houver evidência reproduzível.

## 1. Inventário e ordem da auditoria

| Ordem | Superfície | O que percorrer |
| --- | --- | --- |
| 1 | Componentes compartilhados | Botões, ações em coluna, ícones acionáveis, campos, seleção, cartões, linhas, cabeçalhos, painéis, diálogos, rodapés e estados de feedback. |
| 2 | Início, conta e configurações | Seletor de módulos, status da plataforma, entrada, cadastro, recuperação, perfil e todas as categorias de ajustes. Incluir prévias de tema e controles de acessibilidade. |
| 3 | Biblioteca e obra | Grade, capítulos sem obra, lista de capítulos, menus, gerenciamento, vínculo individual e múltiplo, carregamento e estado vazio. |
| 4 | Tradução | Importação, grade/lista, reordenação, opções e prévia de página, idiomas, validação, destino, lista de tradução, aceite, progresso, erro, cancelamento e tentativa novamente. |
| 5 | Leitura e rotas auxiliares | Leitor local e da plataforma, prévia de texto em desenvolvimento, modos paginado e contínuo, zoom, capítulo anterior/próximo, busca e ordenação, ajustes, texto completo, abas da plataforma e rota inexistente. |

Para cada fluxo, capture o estado inicial e os estados relevantes antes da correção. Use dados de teste, com ao menos uma obra com vários capítulos, páginas prontas e com falha, títulos longos e um resultado com texto excedente. Faça a primeira passagem em tema claro e escuro, em viewport de telefone. Para cada correção, repita os casos afetados com densidade compacta, fonte ampliada, tela estreita, teclado aberto e movimento reduzido quando aplicável. Confira pt-BR, en-US e es-ES nos controles com rótulos e em telas que refluem.

## 2. Critérios de correção

| Área | Critério |
| --- | --- |
| Espaçamento | Usar `layout.screenGutter` para margens e os tokens de seção, cartão e item para relações distintas. Botões empilhados do mesmo grupo têm `spacing.xs` (4 dp), largura alinhada e área de toque preservada. Separar grupos com o token de seção. Conferir que padding, margin e gap não somem espaço duas vezes, especialmente junto a divisores, teclado, safe area e rodapé fixo. |
| Fundos e estados | A superfície que define os limites visuais do item também recebe seu fundo. Hover, pressionado, foco e seleção cobrem o item inteiro, inclusive a área das ações laterais. Preservar o contraste do foco, ícones, texto e estados desabilitados. Testar entrada e saída do ponteiro, cancelamento do toque e restauração do estado selecionado. Respeitar raios e evitar emendas entre filhos, vazamento nos cantos e fundos diferentes entre corpo, cabeçalho e safe area sem motivo funcional. |
| Cabeçalhos e ações | Painéis e modais têm título e metadados em área própria, separados do corpo. Alinhar fechar, expandir e ações equivalentes ao kit. Usar o cabeçalho de navegação das rotas quando aplicável. Conferir que fechar, voltar, rolar e confirmar continuam acessíveis com teclado e texto ampliado. |
| Texto e controles | Centralizar rótulos de ação em toda a largura útil. Conferir “Ver texto completo”, “Vincular capítulo” e o plural com valores longos. Manter uma linha nos casos previstos pelo componente e preservar o nome acessível completo em qualquer escala. Testar conteúdo mais longo antes de reduzir fonte ou cortar texto. |
| Animações | Comparar entrada, saída e feedback entre superfícies equivalentes. Partir dos tokens `motion.fast`, `motion.base` e `motion.sheet` do tema. Usar tempo decorrido para sincronizar animações com o display. Preferir opacity e transform no driver nativo ou na UI thread quando suportado. Revisar transições interrompidas, toques repetidos, mudança de rota e retorno do segundo plano. Usar `effectiveReduceMotion` e `decorativeMotionEnabled` de acordo com o papel da animação. |
| Componentes | Começar por `shared/ui` e `shared/theme`. Comparar variantes existentes antes de criar uma nova. Corrigir a origem compartilhada quando a regra vale em vários fluxos, conferir os consumidores afetados e migrar as composições aos poucos, na ordem FSD. Estados de domínio, como tradução e leitura, continuam na composição que os interpreta. |
| Elementos exclusivos | Para cada selo, ícone, linha, divisor, texto ou componente usado em um único lugar, anotar a função para o usuário. Remover duplicações de estado, decoração sem função e contêineres sem efeito. Trocar controles exclusivos por equivalentes do kit quando comportamento e acessibilidade coincidirem. Manter exceções com motivo concreto, como zoom do leitor ou arraste na organização. |

**Casos de regressão prioritários:** fundo da linha de capítulo cobrindo miniatura, texto e ações. Tema escolhido reconhecível pela borda, fundo e rótulo sem check redundante. Painel de capítulos com busca, ordenação, estado vazio e navegação anterior/próximo preservada. Resumo da tradução visualmente separado da lista. Fechar dos ajustes do leitor com o mesmo tratamento dos outros painéis.

## 3. Modo FPS máximo da tela

O objetivo é liberar e aproveitar a maior taxa de atualização que o sistema oferece durante interação e movimento. A taxa de atualização da tela, em Hz, e os quadros entregues pelo app, em FPS, devem ser medidos separadamente. O sistema pode variar a taxa por energia, temperatura, configuração e conteúdo estático. Não usar um loop para manter o display acelerado em repouso.

1. **iOS.** O `Info.plist` gerado nesta máquina já contém `CADisableMinimumFrameDurationOnPhone=true`. Confirmar a chave no artefato release e após uma geração limpa por Expo CNG. Se a geração deixar de incluí-la, declarar a chave em `expo.ios.infoPlist` na configuração do app. Conferir o comportamento em iPhone ProMotion e em aparelho de 60 Hz. Usar o agendamento do Core Animation para animações nativas e manter durações independentes da taxa real. [Apple — ProMotion](https://developer.apple.com/documentation/quartzcore/optimizing-iphone-and-ipad-apps-to-support-promotion-displays)
2. **Android.** Medir primeiro o comportamento adaptativo da build atual em hardware de 90/120 Hz. Se rolagem e gestos já atingirem o teto permitido, manter a política do sistema. Se houver um limite reproduzível causado pelo app, localizar a superfície responsável e experimentar o pedido de alta taxa durante a interação com as APIs de `View` suportadas pelo dispositivo. Encerrar o pedido quando a interação acabar e conservar o comportamento padrão nas versões sem suporte. Qualquer ajuste nativo precisa ser reproduzível pela configuração Expo ou por plugin CNG. [Android Developers — Adaptive refresh rate](https://developer.android.com/develop/ui/views/animations/adaptive-refresh-rate)
3. **Medição.** Usar builds release, o mesmo aparelho e os mesmos dados de teste. Registrar modelo, versão do SO, modo de tela, energia, taxa ativa, tempo de quadro e quadros perdidos. Fazer três passagens por rolagem da biblioteca, abertura e fechamento de painel, troca de página, zoom e arraste, antes e depois. Usar Perfetto ou ferramentas de frame timing no Android e Instruments no iOS. A referência de orçamento é de 16,7 ms a 60 Hz, 11,1 ms a 90 Hz e 8,3 ms a 120 Hz. Aceitar quando a interação aproveitar a taxa disponível nas condições de teste, sem piorar a regularidade dos quadros no aparelho de 60 Hz. Simulador e emulador servem para revisão de layout. A confirmação de alta taxa fica com hardware físico.

## 4. Registro e aceite

Cada achado deve indicar a rota, o estado, a evidência e a regra do kit esperada. Priorize como **P0** quando uma ação ficar ilegível ou inacessível, **P1** quando houver regressão recorrente ou travamento perceptível, e **P2** para inconsistência visual localizada. Use esta tabela durante a execução:

| ID | Rota e estado | Antes / reprodução | Correção e componente | Validação / depois | Prioridade e estado |
| --- | --- | --- | --- | --- | --- |
| DESIGN-___ | | | | | A verificar |

- Entregar em lotes pequenos. Validar a fundação compartilhada antes de ajustar os fluxos e registrar quais consumidores foram conferidos. Usar as specs [057](../specs/features/MOB-FEAT-057-design-kit-visual-foundation/spec.md), [060](../specs/features/MOB-FEAT-060-library-and-work-screens/spec.md), [062](../specs/features/MOB-FEAT-062-settings-design-kit/spec.md) e [063](../specs/features/MOB-FEAT-063-reader-design-kit/spec.md) como pontos de partida.
- Para cada lote, anexar captura equivalente antes/depois e verificar toque, teclado, leitor de tela, rolagem e estados afetados. Para fluidez, anexar as medições e as condições em que foram obtidas.
- Rodar `pnpm specs:check`, `pnpm typecheck`, `pnpm lint:fsd` e `pnpm test:ci` em `mobile/`, além das verificações do monorepo previstas no [AGENTS.md da raiz](../../../AGENTS.md). Registrar separadamente falhas observadas no baseline. Manter `verification-pending` quando ainda faltar confirmação real.
