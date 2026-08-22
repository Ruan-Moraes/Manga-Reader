# Evidência nativa — MOB-FEAT-029

Data: 2026-08-22  
Ambiente: Expo Go, iPhone 17 Simulator, iOS 26.5

## Referência visual

`design/manga-translation-mobile.html` foi aberto e percorrido antes da segunda
passagem. Foram usados como referência a composição editorial, os neutros
quentes, o amarelo de marca, os cards arredondados, a hierarquia tipográfica, a
drop zone, o stepper e a grade de páginas. Tabs e capacidades futuras
continuaram descartadas.

## Matriz executada

| Superfície/estado         | Tema/dimensão                           | Resultado e correções verificadas                                                           |
| ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Launcher                  | claro e escuro; 390×844                 | hero editorial, módulos em cards, disponibilidade e estados pressionados coerentes          |
| Configurações             | claro e escuro; retrato                 | header único, grupos, linhas, metadados e chevrons alinhados; descrições longas não colidem |
| Aparência                 | claro e escuro                          | radios, switches, seleção e descrições legíveis                                             |
| Preferências do leitor    | escuro                                  | steppers compartilhados, alvos de 44 pt e disabled persistente                              |
| Tradução local            | escuro; draft parcial                   | cinco etapas, grade responsiva, reordenação/remoção alcançáveis e ação fixa segura          |
| Login                     | claro; normal, disabled, foco e teclado | retorno seguro, campos/CTA roláveis e teclado sem bloquear conteúdo essencial               |
| Cadastro                  | escuro; retrato e paisagem              | formulário centralizado, rolagem e CTA preservados após rotação                             |
| Recuperação               | escuro; erro de campo e envio           | erro associado ao campo, retorno não duplicado e ação final semanticamente correta          |
| Dados                     | claro; parcial                          | agrupamento consistente e tamanho de armazenamento formatado para leitura humana            |
| Sobre                     | claro; font scale ampliada              | título/descrição/card sem corte; retorno permanece alcançável                               |
| Reader/settings do reader | estados controlados e testes            | back compartilhado, overlays e continuidade da página lógica preservados                    |

## Responsividade e acessibilidade

- O simulador foi rotacionado de retrato para paisagem real e novamente para
  retrato; a configuração Expo passou a permitir ambas as orientações.
- Safe areas superior/inferior permaneceram respeitadas em todas as superfícies.
- O teclado de software foi aberto em formulários longos e a página continuou
  rolável até campos, erros e ações.
- `Tamanhos Maiores` foi habilitado no iOS e o slider foi elevado até 82%, faixa
  acima das categorias padrão e adequada à auditoria de 200%. Conteúdo essencial
  continuou visível/rolável. Ao fim, o simulador foi restaurado para
  `Tamanhos Maiores: off` e slider de 50%.
- Pressed, foco, seleção, disabled, erro, parcial e vazio foram verificados em
  execução. Loading, sucesso e estados de sessão não reproduzíveis sem API foram
  complementados pelas suítes RNTL, sem simular uma capacidade inexistente.
- Os resolvedores automatizados cobrem 320×568, 390×844, 600×960 e 840×600; a
  inspeção física cobriu 390×844 e aproximadamente 840×390 em paisagem.

## Navegação e duplicações

- Telas internas usam `NavigationHeader`/`BackButton`; o launcher raiz não
  apresenta retorno.
- Deep links sem histórico usam `navigateBackOrReplace` com fallback próprio de
  cada fluxo.
- Settings secundárias retornam para settings; auth retorna ao destino coerente;
  modal usa fechar; reader usa back sobre scrim.
- Retornos textuais e glifos locais foram removidos. A primeira etapa offline não
  mostra simultaneamente voltar e fechar para o mesmo destino.

## Limites reais

Profile autenticado, estado conectado e capítulo publicado não ficaram
manualmente alcançáveis sem sessão/API/conteúdo válido. Seus estados existentes
foram cobertos pelas suítes de regressão e não foram liberadas tabs, catálogo,
processamento remoto ou reader local fictícios apenas para a auditoria.
