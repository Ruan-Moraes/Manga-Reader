---
id: MOB-FEAT-008
type: feature
title: Navegação das configurações
status: draft
created: 2026-08-08
updated: 2026-08-08
implementation_gate: blocked
blocked_by: [MOB-FEAT-002, MOB-FEAT-003, MOB-FEAT-004, MOB-FEAT-005, MOB-FEAT-006, MOB-FEAT-007]
supersedes: []
superseded_by: []
---

# MOB-FEAT-008 — Navegação das configurações

## Objetivo

Reunir capacidades de configuração implementadas em uma navegação nativa, acessível e endereçável, expondo o estado de sincronização sem antecipar controles ou superfícies que ainda não tenham comportamento real.

## Contexto e contratos relacionados

- Depende das capacidades implementadas em `MOB-FEAT-002`, `MOB-FEAT-003`, `MOB-FEAT-004`, `MOB-FEAT-005`, `MOB-FEAT-006` e `MOB-FEAT-007`.
- Usa os estados de hidratação, sincronização e retry de `MOB-FEAT-001`, sem criar um segundo store ou protocolo de persistência.
- Substitui parcialmente o placeholder de perfil descrito em `MOB-BASE-008/OBS-002` e adiciona rotas futuras sem transformar as tabs atuais em requisito permanente.
- A organização Web por tabs é referência de conteúdo, não de navegação: mobile usa índice e subrotas compatíveis com Expo Router e links nativos.

## Requisitos e regras

- Deve existir um índice de configurações com entradas para aparência e acessibilidade, idioma e região, idiomas de conteúdo, leitor, privacidade, dados e sobre.
- Cada entrada deve abrir uma subrota própria, ter título localizado e continuar endereçável por deep link. Voltar deve retornar à origem lógica e preservar edições já confirmadas.
- Uma entrada ou controle só pode aparecer como interativo quando sua capacidade estiver implementada. Capacidades indisponíveis não podem ser simuladas com toggles, toasts ou valores sem efeito.
- O índice deve permanecer utilizável por guest para capacidades locais. Entradas autenticadas devem indicar a necessidade de login antes de iniciar a ação, sem emitir requests privados.
- Hidratação deve possuir estado explícito que impeça flash de defaults. Sincronização deve distinguir ao menos estado local, sincronizando, sincronizado e erro pendente; o retry chama o contrato de `MOB-FEAT-001`.
- Um erro de sync não deve bloquear navegação nem descartar edição local. A UI deve informar qual grupo está pendente e evitar declarar “sincronizado” antes da confirmação da Core.
- Deep links para subrotas válidas devem abrir diretamente a capacidade após os gates necessários. Link desconhecido deve cair em not-found seguro; link para capacidade privada em sessão guest deve oferecer autenticação e retorno ao destino.
- “Sobre” deve obter versão e build dos metadados Expo em runtime e mostrar somente links HTTPS mobile válidos configurados para suporte, termos, privacidade e projeto. Link ausente não deve gerar item vazio.
- Não devem ser portados atalhos de teclado desktop, footer Web, newsletter, quota do navegador, reload de página ou importação indisponível.
- Notificações não devem aparecer como seção configurável até existir Target Spec própria com contrato de preferências e integração de push aprovados.
- Em FSD, arquivos de rota Expo permanecem cascas finas; cada `page` compõe APIs públicas de entities/features/widgets; o widget de índice pode compor as capacidades sem conter regras de sync; providers e gates globais ficam em `app`; navegação e links agnósticos ficam em `shared`.

## Casos de erro

- Falha na leitura de versão/build deve ocultar somente o valor indisponível, sem impedir o acesso aos links válidos.
- Falha ao abrir link externo deve ser comunicada e não deve fechar ou reiniciar a navegação de settings.
- Um deep link recebido durante hidratação deve aguardar a resolução do gate e ser processado uma única vez.
- Mudança de sessão dentro de subrota privada deve remover dados da conta anterior e redirecionar de forma recuperável, preservando o destino para login quando apropriado.

## Critérios de aceite

### AC-001 — Índice composto somente por capacidades reais

Dado o conjunto de features implementadas, quando o índice abrir, então ele deve listar exatamente aparência/acessibilidade, idioma/região, idiomas de conteúdo, leitor, privacidade, dados e sobre, sem notificações ou controles placeholder.

### AC-002 — Subrotas e retorno previsível

Quando uma entrada for acionada, então uma subrota localizada própria deve abrir; ao voltar, a pessoa deve retornar à origem lógica sem perder edições confirmadas nem reaplicar defaults.

### AC-003 — Deep link determinístico

Dado um deep link válido para uma subrota, quando o app iniciar frio ou já aberto, então a mesma capacidade deve abrir uma única vez após hidratação; caminho desconhecido deve produzir not-found seguro.

### AC-004 — Separação entre guest e conta

Dada uma sessão guest, quando o índice for usado, então capacidades locais devem funcionar e ações privadas devem oferecer login sem request autenticado; após login, o app deve poder retornar ao destino privado original.

### AC-005 — Estado de sincronização verdadeiro

Quando uma preferência mudar, então a UI deve mostrar a progressão local/pendente, sincronizando, sincronizado ou erro conforme o estado real, e retry deve reenviar a versão mais nova sem descartar a edição local.

### AC-006 — Sem flash de defaults

Dada uma inicialização com preferências persistidas ou autenticadas, quando uma subrota abrir durante hidratação, então nenhum default diferente deve ser exibido como valor selecionado antes da resolução do settings gate.

### AC-007 — Sobre nativo e configurado

Quando “Sobre” abrir, então versão/build devem vir dos metadados Expo e somente links HTTPS configurados devem ser mostrados e abertos pelo adaptador nativo; atalhos, footer, newsletter, reload e quota Web não devem aparecer.

### AC-008 — Acessibilidade da navegação

Quando escala de fonte, leitor de tela, alto contraste ou modo compacto estiverem ativos, então índice, headers, estados de sync e ações devem manter ordem de foco, nomes acessíveis, reflow e alvos mínimos de toque.

### AC-009 — Isolamento e falhas recuperáveis

Quando sessão, link externo ou sincronização falhar ou mudar, então a navegação deve continuar utilizável, dados da conta anterior devem ser removidos e deve existir recuperação localizada sem loop de rota.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                |
| -------- | --------------------------------------------------------------------------------------- |
| AC-001   | Teste do manifesto de seções e ausência explícita de placeholders                       |
| AC-002   | Testes de integração Expo Router para entrada, subrota, back e estado preservado        |
| AC-003   | Testes de deep link em cold start/warm start e rota desconhecida                        |
| AC-004   | Testes guest/login/return-to com requests privados inspecionados                        |
| AC-005   | Teste de estados do sync, resposta obsoleta, erro e retry da versão mais nova           |
| AC-006   | Teste de hidratação retardada sem renderização transitória de defaults                  |
| AC-007   | Teste de metadados e links via adaptador nativo, incluindo configuração ausente         |
| AC-008   | Testes automatizados de acessibilidade e matriz manual iOS/Android com fontes ampliadas |
| AC-009   | Testes de troca/expiração de sessão, falha de link e ausência de loop de redirects      |

## Gate de implementação

- Estado: `blocked`
- Dependências: `MOB-FEAT-002`, `MOB-FEAT-003`, `MOB-FEAT-004`, `MOB-FEAT-005`, `MOB-FEAT-006`, `MOB-FEAT-007`
- Motivo: a navegação não pode expor controles ou seções antes de todas as capacidades configuráveis possuírem comportamento real.

O gate só pode ser aberto quando todas as dependências estiverem `implemented`.

## Fora de escopo

- Implementar as capacidades dependentes desta navegação.
- Central de notificações, preferências de push ou permissões do sistema.
- Atalhos de teclado, footer, newsletter, reload manual de página ou quota Web.
- Importação de dados.
- Definir URLs externas que não estejam na configuração mobile aprovada.

## Aprovação humana

- Aprovador: pendente
- Data: pendente

Não criar `tasks.md` antes de status `approved`, aprovação preenchida e `implementation_gate: open`.
