# Auditoria nativa — MOB-FEAT-045

Data: 2026-08-31. Simulator iPhone 17, iOS 26.5, pt-BR.

## Cenário executado

- Draft persistido com cinco páginas válidas aberto na etapa 5 e retorno real
  para a etapa 4 pelo controle de navegação.
- A etapa exibiu stepper `Validar 4/5`, título “Suas imagens estão prontas.”,
  resumo “5 de 5 prontas”, cinco miniaturas reais em três colunas, número da
  página, badge “Pronta” e CTA fixo “Continuar para revisão”.
- A árvore acessível expôs cada miniatura como “Página N de 5. Pronta.” com hint
  de preview; o CTA e o cabeçalho permaneceram alcançáveis.
- Não houve lista textual por página nem avanço automático ao voltar para o
  resultado validado.

## Limite da evidência

O estado de erro e a substituição estão cobertos por RNTL/controller/repository,
mas não foram executados no picker real nesta auditoria. Tema escuro, fonte
ampliada e VoiceOver/TalkBack também permanecem pendentes em TASK-005. Esta
captura observacional não substitui essa matriz.

## Preview compartilhado — 2026-09-01

- A página 2 válida foi aberta na galeria e exibiu a mesma `pageSheet` observada
  na Grade e na Lista da Ordenação.
- Cabeçalho, imagem em `contain`, superfície clara e ações de fechar ficaram
  alinhados; a árvore acessível expôs “Página 2”, “Visualizar imagem” e dois
  botões “Fechar”.
- A auditoria não fabricou uma falha para testar o picker. Origem, detalhe e
  substituição permanecem cobertos automaticamente e pendentes na TASK-005 real.
