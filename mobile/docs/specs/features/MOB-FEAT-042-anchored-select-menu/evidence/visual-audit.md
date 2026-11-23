# Auditoria visual — MOB-FEAT-042

Data: 2026-08-29

## Inspeção no Simulator

- Dispositivo: iPhone 17, iOS 26.5, tema escuro.
- Campo fechado: ícone, valor e affordance de expansão ficaram reconhecíveis e
  alinhados horizontalmente após correção específica observada no iOS.
- Fuso horário: cinco opções em folha inferior, seleção legível, proporção
  equilibrada e fechamento por scrim ou ação explícita.
- Qualidade: duas opções com descrições localizadas, evitando nomes soltos e
  preenchimento puramente decorativo.
- Refinamento final das opções: alternativas reunidas em uma única superfície,
  com margem externa de 4 dp, padding interno `xl` (24–32 dp conforme a
  densidade), altura estável e divisores de 1 dp alinhados ao mesmo recuo. A
  seleção preserva essa geometria.
- Rotação com a folha aberta: altura recalculada e conteúdo mantido rolável na
  viewport curta.
- Árvore assistiva: título como heading, fechamento acessível, trigger expandido
  e opções exclusivas com seleção atual.

## Ajuste orientado pela inspeção

A primeira montagem empilhou ícone, valor e seta no iOS. A linha interna foi
isolada da superfície pressionável e recebeu `flexDirection: row`, largura total
e filhos não retráteis. Um teste estrutural passou a proteger essa regressão.

Na revisão final, as alternativas permaneceram dentro de um único grupo. Após o
padding passar a ser materializado corretamente no iOS, as linhas divisórias
foram removidas: o próprio espaço interno separa as opções sem aproximar um
traço da copy ou criar ornamentação desnecessária. Um gap vertical `sm` mantém
os fundos selecionado e pressionado visualmente separados dos itens vizinhos.

Uma nova inspeção com bundle recompilado mostrou que o iOS compactava a
geometria quando padding e altura estavam diretamente no callback de estilo do
`Pressable`. Esses valores foram movidos para uma superfície interna estável.
No iPhone 17, as cinco opções de fuso passaram a ocupar a altura prevista e as
duas opções de qualidade preservaram título, descrição e indicador com respiro
vertical, sem corte ou mudança geométrica na opção selecionada.

## Resultado

A superfície visível é uma folha que sobe do rodapé, e não um menu ancorado ou
diálogo central. A inspeção cobre AC-001..AC-005.
