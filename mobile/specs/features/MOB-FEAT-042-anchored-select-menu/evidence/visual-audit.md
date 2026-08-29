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

Na revisão final, o espaçamento solto entre alternativas foi substituído por
divisores recuados dentro de um único grupo. Isso reforça a leitura de lista e
remove a aparência de cards independentes sem adicionar ornamentação.

## Resultado

A superfície visível é uma folha que sobe do rodapé, e não um menu ancorado ou
diálogo central. A inspeção cobre AC-001..AC-005.
