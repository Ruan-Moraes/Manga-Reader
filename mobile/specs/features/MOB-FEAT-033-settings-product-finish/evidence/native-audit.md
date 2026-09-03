# Auditoria nativa — MOB-FEAT-033

Data: 2026-08-24

## Ambiente

- Expo executado em bundle de desenvolvimento dedicado.
- iOS Simulator, iPhone 17, iOS 26.5.
- Orientações vertical e horizontal.
- Temas claro e escuro; alto contraste ligado e desligado.
- Árvore de acessibilidade inspecionada junto das superfícies visuais.

## Superfícies verificadas

| Superfície      | Resultado observado                                                                       |
| --------------- | ----------------------------------------------------------------------------------------- |
| Índice          | grupos editoriais, linhas contínuas, ícones e estados de conta legíveis                   |
| Aparência       | temas empilhados sem grid 2+1, previews próprios e seleção inequívoca                     |
| Idioma e região | radio cards, controle segmentado e select com hierarquia preservada                       |
| Leitor          | modo empilhado, direção/ajuste segmentados e controles específicos por dado               |
| Dados           | uso informativo e ações com descrição, tom, disponibilidade e área integral               |
| Paisagem        | conteúdo limitado em largura e rolável; nenhuma ação essencial fica fixa fora da viewport |
| Alto contraste  | bordas e controles ganham definição sem remover texto, estado ou seleção                  |

## Achados e correções

- O excesso de superfícies aninhadas foi removido: títulos e descrições passaram
  para fora dos cards de controles.
- Escolhas descritivas de três opções passaram de grid assimétrico para pilha.
- O fundo do leitor ganhou swatches próprios, com badge de seleção contrastante.
- Linhas apenas informativas deixaram de expor estado desabilitado para leitores
  de tela.
- Ações de dados deixaram de depender do hint para explicar consequência.
- Os grupos Aplicativo, Leitura, Dispositivo e Conta e as seções das telas
  internas passaram a compartilhar `SectionStack` com gap `xl`, reforçando a
  separação entre listas sem fragmentar suas linhas internas.

## Resultado

Sem bloqueios visuais, de interação ou semânticos nas superfícies auditadas.
Atende AC-001, AC-002, AC-003, AC-004, AC-005 e AC-006.
