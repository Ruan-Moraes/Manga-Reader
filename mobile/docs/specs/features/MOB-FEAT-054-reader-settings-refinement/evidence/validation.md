# Validação — MOB-FEAT-054

Data: 2026-09-10. Escopo: painel e controles do leitor mobile; alterações locais anteriores preservadas.

## Evidência visual

Referências enviadas pelo usuário: [aparência anterior](before-appearance.png) e [gestos anteriores](before-gestures.png).

Capturas nativas do iPhone 17, iOS 26.5, com resultado local de demonstração e tema claro:

- [Leitura](ios-reading.png): folha parcial, título/abas fixos, seletores compactos e conteúdo rolável.
- [Aparência](ios-appearance.png): comparação, qualidade, amostras separadas e saturação com valor/ajuda.
- [Gestos](ios-gestures.png): quatro opções compactas, apenas a descrição selecionada e indisponibilidade do toque lateral em vertical.

Comparação visual: o espaço vazio superior das referências foi removido; as configurações de aparência e gestos cabem na folha parcial. A obra permanece visível ao fundo. Expansão e recolhimento foram exercitados no simulador. A engrenagem azul é uma sobreposição do ambiente de desenvolvimento, também presente nas referências; não é adicionada pelo painel.

## Testes

Suíte final: `pnpm test:ci --silent` — 108 suítes e 665 testes passaram. `git diff --check` e verificação de links documentais passaram.

- ReaderPanel: categoria inicial, memória após fechar/reabrir, exclusão do conteúdo de outras abas, expansão, fechamento pelo backdrop/Android e expansão automática com fonte 1.8 ou altura 500.
- ReaderSettingsControls: categorias compactas, ajuda expansível, seleção de fundo e patches, além dos testes existentes de limites/sliders.
- ReaderGestureControls: descrição contextual, opção lateral indisponível e retry.
- ContentReader: comparação restrita a Aparência, viewport preservada e aba mantida ao reabrir; regressões existentes vertical/paginado/duplo/RTL, texto e integrações de pages preservadas.
- TypeScript, ESLint e FSD passaram. pnpm check interrompe em oito reviews com checksum divergente já presentes na entrada (025/026/027/049/050/051/052/053). Nenhuma dessas reviews foi revalidada artificialmente.
- format:check falha em arquivos do workspace, incluindo JSX expandido tocado nesta mudança. Não foi aplicada formatação global.

## Limites e próximos cenários

ADB consultado fora do sandbox: nenhum dispositivo conectado. A tentativa inicial dentro do sandbox não pôde abrir o listener, sem representar defeito do app. Android físico, temas escuros, alto contraste, fontes ampliadas em dispositivo, VoiceOver/TalkBack e medições repetidas de frames/memória/abertura/rolagem nas mesmas fixtures 10/67/200 continuam pendentes. Jest valida comportamento e identidade da viewport; não mede desempenho nativo.

Status: verification-pending, com TASK-004 aberta. Não houve alteração de dependências, API, schema, defaults ou persistência.
