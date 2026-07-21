# Referência visual de autenticação

Este diretório preserva os protótipos estáticos usados como referência visual
para as telas de autenticação do aplicativo mobile.

## Conteúdo

- HTML e CSS do protótipo original;
- componentes JSX de login, cadastro e recuperação de senha;
- ilustrações, logo e ícones utilizados na referência.

## Como usar

Os arquivos servem apenas para comparação visual e consulta de layout. Eles não
representam a arquitetura, navegação, acessibilidade ou implementação atual do
aplicativo.

O diretório permanece fora de `app/` e `src/` para impedir imports acidentais no
bundle. Não copie lógica, estado ou estilos diretamente para runtime sem
adaptá-los aos componentes de `src/shared/ui`, aos tokens de tema e ao i18n.

Fonte de verdade do app: [`../../README.md`](../../README.md).
