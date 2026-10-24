# Refinamento do leitor — 2026-09-09

## Escopo e aprovação

Implementação solicitada explicitamente por Ruan a partir do plano
“Refinamento do leitor mobile da Toonlira”. Alterações anteriores do index
preservadas; nenhum commit, backend, API, banco ou preferência persistida alterado.

## Correções e evidência

- AC-001: viewport medida, dimensões constantes durante loading/erro/retry,
  falhas de decode locais por variante; testes de largura 320 e 640.
- AC-002: hidratação externa, âncora relativa de imagens no redimensionamento,
  pares ímpares e fit sem corte cobertos por regressões.
- AC-003: máscara clara em qualquer tema, retângulo contido da imagem,
  comparação somente com todos os originais; retry original/publicado testados.
- AC-004: fluxo textual mantém blocos/escala, restauração por ID com tentativas
  limitadas para alturas variáveis e reflow; validação nativa de novel longa pendente.
- AC-005: painel modal, close nativo, saída, controles explícitos e cancelamento
  do gesto de arraste cobertos por RNTL; integrações existentes preservadas.
- AC-006: contraste dos foregrounds text/accentText contra surface >= 4,5 nos
  quatro conjuntos de tokens; configuração limitada da lista testada com
  10/67/200 itens. Esses testes não medem mounts reais, frames ou memória.

## Inspeção nativa

iOS Simulator, iPhone 17, iOS 26.5, app já aberto pelo usuário via Expo Go.
Capturas inspecionadas durante a execução, não versionadas por conterem mídia local.

- Claro e escuro: barras legíveis, páginas em largura integral e máscara demo clara.
- Alto contraste + tamanho accessibility-large: título/badge legíveis; ações
  inferiores reorganizadas em mais de uma linha, sem ocultar configurações.
- A barra de status recebeu estilo explícito após detectar horário escuro em
  superfície escura.
- Configurações do simulador restauradas para appearance light,
  increase_contrast disabled e content_size large.

Não foi executada nesta rodada a matriz visual completa de orientação, outros
tamanhos de dispositivo, navegação real de saída/retomada ou preview textual.
Não há contrato de capítulos adjacentes: não foram criadas ações fictícias.

## Performance e limites

Nenhum ganho de performance é alegado. Não há medição nativa antes/depois de
frames, memória ou mounts para 10/67/200; Android físico também não foi executado.
TASK-007 e TASK-009 permanecem abertas, com status verification-pending.

## Formatação anterior

O format:check encontrou 39 arquivos fora do padrão antes da revisão documental
final. Cada um foi conferido com prettier.check sobre git show :mobile/<arquivo>;
todos já estavam fora do padrão no index anterior a esta tarefa. Não foi aplicado
formatador global aos arquivos do usuário. Os arquivos deste refinamento são
verificados separadamente; o gate pnpm check permanece limitado pelo baseline.
