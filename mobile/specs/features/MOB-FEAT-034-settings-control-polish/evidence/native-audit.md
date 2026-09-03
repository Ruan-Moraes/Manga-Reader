# Auditoria nativa — MOB-FEAT-034

Data: 2026-08-24

## Ambiente

- Expo em bundle limpo via localhost.
- iOS Simulator, iPhone 17, iOS 26.5.
- Tema escuro e árvore de acessibilidade inspecionados em conjunto.
- Preferências alteradas para teste foram restauradas ao final.

## Resultado observado

| Superfície          | Resultado                                                                           |
| ------------------- | ----------------------------------------------------------------------------------- |
| Aparência           | preview, título e descrição no mesmo eixo; seleção separada à direita               |
| Booleanos           | switch à direita do bloco textual, centralizado e com linha integral acionável      |
| Fundo do leitor     | cinco quadrados contíguos, separadores e cantos somente nas extremidades            |
| Saturação           | valor, trilha e semântica ajustável preservados; preferência restaurada em 100%     |
| Índice e subtelas   | texto passivo local removido; login, pending, syncing e erro permanecem contextuais |
| Rolagem e safe area | “Direção” e opções param abaixo do relógio/Dynamic Island após rolagem              |

## Achados e correções

- O hit inicial do slider podia ser relativo ao thumb. A trilha passou a
  capturar o responder e seus elementos decorativos saíram do hit-testing.
- Amostras vazias podiam colapsar no iOS. O grupo mede a própria largura no
  layout e aplica a cada `Pressable` uma largura numérica equivalente; assim a
  superfície de cada cor permanece renderizada sem depender de percentual ou
  flex, e os cinco rótulos continuam alinhados às respectivas opções.
- O Switch nativo não mantinha o extremo direito em composições estreitas. O
  controle ganhou uma coluna absoluta reservada, sem sobrepor a copy.
- O padding superior estava dentro do conteúdo rolável e desaparecia durante a
  rolagem. A safe area passou para um frame externo fixo, mantendo toda a
  viewport do `ScrollView` abaixo da barra de status.

## Resultado

Sem bloqueios visuais ou semânticos. Atende AC-001, AC-002, AC-003, AC-004,
AC-005 e AC-006.
