# Política de documentação

Este guia define qual documento deve ser atualizado em cada tipo de mudança.
O objetivo é manter uma fonte de verdade por responsabilidade e evitar dados
voláteis duplicados.

## Hierarquia

1. O `README.md` da raiz apresenta produto, arquitetura resumida, primeiros
   passos e navegação.
2. O README de cada módulo contém requisitos, configuração, execução, testes e
   limitações específicas.
3. `docs/` registra decisões, invariantes e processos normativos.
4. Swagger/OpenAPI é a referência viva dos endpoints da API.
5. `docs/tech-debt.md` é a fonte única para o resumo ativo e o histórico das
   pendências `DT-NN`.

## Matriz de atualização

| Tipo de mudança | Documentação exigida |
|---|---|
| Nova feature ou endpoint | README do módulo, quando alterar uso/configuração; Swagger via anotações; guia arquitetural se introduzir padrão |
| Novo use case ou domínio | `docs/architecture.md` quando mudar limites ou responsabilidades; não manter contagem fixa no README raiz |
| Nova tela ou página | README da aplicação somente se alterar navegação pública ou setup; i18n em todos os idiomas |
| Mudança de persistência | `docs/database-modeling.md`/`docs/orm-persistence.md` quando criar regra reutilizável; migration e testes correspondentes |
| Mudança de arquitetura | `docs/architecture.md`, README do módulo afetado e resumo no README raiz apenas quando a visão geral mudar |
| Mudança de configuração ou variável | README do módulo e `.env.example` proprietário, quando aplicável |
| Mudança de dependência ou runtime | README do módulo que declara o requisito; raiz apenas se for pré-requisito do monorepo |
| Bug fix com lição reutilizável | `docs/testing.md` ou guia técnico correspondente |
| Nova dívida ou backlog | `docs/tech-debt.md`: atualizar o índice ativo e criar ou complementar o item `DT-NN` |
| Dívida resolvida | Atualizar o estado do item e removê-lo do índice ativo; remover alertas dos READMEs afetados |
| Mudança de strings | Atualizar todos os locales suportados e o guia de locales se mudar a convenção |

## Conteúdo volátil

Não manter nos READMEs contagens de testes, controllers, use cases, repositories
ou migrations. Quando uma medição for relevante para uma auditoria, registrar:

- data da medição;
- comando reproduzível;
- contexto do ambiente;
- documento histórico que contém o resultado.

Estados como “gate verde” devem vir da execução atual ou de CI, não de uma frase
permanente em README.

## Links e linguagem

- Preferir links relativos entre documentos do repositório.
- Usar português nos documentos operacionais do projeto; nomes técnicos,
  propriedades, classes e comandos permanecem como definidos no código.
- Marcar explicitamente planos, mocks, protótipos e fotografias históricas para
  que não sejam confundidos com comportamento implementado.
