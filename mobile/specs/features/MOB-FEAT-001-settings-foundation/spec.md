---
id: MOB-FEAT-001
type: feature
title: Fundação local-first de configurações
status: implemented
implementation_gate: open
blocked_by: []
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-001 — Fundação local-first de configurações

## Objetivo

Disponibilizar um contrato único, versionado e resiliente para preferências do aplicativo, com uso completo por guest, aplicação local imediata e sincronização de conta quando houver sessão autenticada.

## Contexto e contratos relacionados

- `MOB-BASE-001/OBS-002`: o gate atual aguarda a hidratação das configurações antes de liberar o app.
- `MOB-BASE-002/OBS-003` e `OBS-004`: tema já possui persistência local e propagação ao provider.
- `MOB-BASE-003/OBS-003` e `OBS-004`: idioma já possui validação, persistência e aplicação após hidratação.
- `MOB-BASE-005`: sessão, troca de identidade, expiração e logout são contratos existentes que delimitam quando a sincronização autenticada pode ocorrer.
- `MOB-DEC-001`: este documento descreve intenção futura e não altera o baseline enquanto estiver `draft`.
- Contrato Core de referência: `GET/PATCH /api/users/me/settings`. Idioma da interface e idiomas de conteúdo permanecem contratos separados.

Arquitetura futura: adaptadores genéricos de armazenamento permanecem em `shared`; tipos, defaults, normalização e queries de preferências pertencem a uma entity de configurações; mutações/sincronização pertencem a features; providers e gates apenas orquestram APIs públicas dos slices.

## Requisitos e regras

- O envelope local terá versão explícita e armazenará os grupos `reader`, `appearance`, `locale` e `accessibility` do contrato Core, além das preferências estritamente locais identificadas como tais.
- Leitura de payload parcial preenche campos ausentes com defaults conhecidos. Valor desconhecido ou fora do domínio é normalizado por campo, sem invalidar grupos válidos.
- Migrações são sequenciais, idempotentes e preservam a última versão legível até a nova gravação concluir.
- A hidratação local termina antes de liberar a interface. Falha ou ausência de storage usa defaults seguros e não mantém o splash indefinidamente.
- Guest lê e altera configurações sem rede. Toda mudança válida atualiza a experiência e a persistência local antes de qualquer tentativa remota.
- Com sessão autenticada, a Core é a autoridade inicial da conta. Preferências guest não são enviadas automaticamente; o payload remoto válido substitui a projeção local da conta.
- A sincronização envia o objeto integral aceito por `/users/me/settings`, com debounce de 400 ms para alterações sucessivas. Contratos separados, como `contentLocales` e privacidade, não entram nesse payload.
- Cada edição recebe versão monotônica. Resposta de request antigo nunca substitui estado ou pending mais recente.
- Erro de gravação remota preserva o estado local e o pending, expõe estado recuperável e permite retry. Retry envia a versão pendente mais nova; sem pending, refaz a hidratação remota.
- Ao encerrar a superfície que mantém o sincronizador, uma gravação pendente é enviada uma vez. A aplicação não promete conclusão após encerramento forçado pelo sistema operacional.
- Login, logout, expiração e troca de conta cancelam requests pertencentes à identidade anterior e removem sua projeção privada da memória/query cache.
- Logout volta ao perfil guest persistido no dispositivo; não expõe preferências privadas da conta encerrada.
- O estado observável de sync é `local`, `syncing`, `synced` ou `error`. UI pode apresentar esses estados sem inferir sucesso a partir da edição local.

## Casos de erro

- Storage ausente, corrompido ou indisponível: aplicar defaults, concluir hidratação e expor diagnóstico não bloqueante; gravações posteriores podem ser tentadas novamente.
- Payload remoto parcial ou com valores desconhecidos: normalizar apenas os campos inválidos e manter os válidos.
- `401`/expiração durante sync: delegar a expiração ao contrato de sessão, cancelar pending da conta e restaurar o perfil guest.
- Falha transitória: manter pending e oferecer retry sem reverter a preferência aplicada localmente.
- Troca de usuário com request em voo: ignorar a resposta antiga e hidratar somente a nova identidade.
- Conflito entre edição local pendente e nova hidratação: não sobrescrever o pending da mesma identidade; resolver a gravação ou erro antes de aceitar nova projeção remota.

## Critérios de aceite

### AC-001 — Envelope versionado e normalização

Dado um payload ausente, parcial, antigo ou com valores desconhecidos, quando as configurações forem carregadas, então o sistema produz um modelo completo na versão atual, preserva campos válidos e aplica defaults somente aos campos inválidos ou ausentes.

### AC-002 — Hidratação sem bloqueio permanente

Dado storage válido, vazio, corrompido ou indisponível, quando o aplicativo iniciar, então a hidratação termina antes da primeira superfície interativa, usa o melhor estado seguro disponível e nunca mantém o splash indefinidamente.

### AC-003 — Experiência guest local-first

Dada uma sessão guest, quando uma preferência válida mudar, então o efeito e a persistência local ocorrem imediatamente e nenhum endpoint autenticado é chamado.

### AC-004 — Autoridade da conta no login

Dado um perfil guest e uma autenticação bem-sucedida, quando a Core responder com as configurações da conta, então elas se tornam a projeção ativa sem promover automaticamente as preferências guest.

### AC-005 — Sync integral com debounce

Dada uma conta autenticada, quando houver várias alterações dentro de 400 ms, então todas aparecem localmente de imediato e somente o estado integral mais recente é enviado a `/users/me/settings` ao final da janela.

### AC-006 — Proteção contra resposta obsoleta

Dadas duas versões enviadas e respostas fora de ordem, quando a resposta mais antiga chegar por último, então ela não altera o estado atual, o pending nem o status da versão mais nova.

### AC-007 — Erro recuperável e retry

Dada uma falha de sincronização, quando o erro ocorrer, então o estado local permanece aplicado, o pending mais novo é preservado, o status muda para `error` e retry reenvia esse pending uma única vez.

### AC-008 — Flush controlado

Dada uma edição autenticada ainda no debounce, quando o sincronizador for desmontado de forma controlada, então ele tenta enviar exatamente a versão pendente mais recente.

### AC-009 — Isolamento entre identidades

Dado logout, expiração ou troca de conta durante requests em voo, quando qualquer resposta antiga chegar, então nenhum dado da identidade anterior é aplicado ou mantido em caches acessíveis pela identidade atual.

### AC-010 — Retorno seguro ao guest

Dado logout ou expiração, quando a sessão terminar, então o aplicativo retorna ao perfil guest local do dispositivo sem expor configurações privadas da conta encerrada.

### AC-011 — Estados de sincronização verdadeiros

Dada qualquer transição local/remota, quando o status for apresentado, então `local`, `syncing`, `synced` e `error` correspondem ao estado real da persistência e nunca tratam edição local como confirmação remota.

### AC-012 — Fronteiras dos contratos

Quando configurações gerais forem lidas ou gravadas, então idioma da interface, `contentLocales` e privacidade permanecem nos contratos definidos por suas próprias specs e não são inseridos silenciosamente no payload `/users/me/settings`.

## Estratégia de evidência

| Critério       | Teste/evidência esperada                                                                  |
| -------------- | ----------------------------------------------------------------------------------------- |
| AC-001, AC-002 | Testes unitários de versão, migração, normalização, storage inválido e gate de hidratação |
| AC-003, AC-004 | Testes de integração guest/login com cliente HTTP inspecionável                           |
| AC-005, AC-006 | Fake timers e respostas fora de ordem no sincronizador                                    |
| AC-007, AC-008 | Testes de falha, retry, pending e desmontagem                                             |
| AC-009, AC-010 | Testes de troca de identidade, logout, expiração e requests tardios                       |
| AC-011, AC-012 | Testes do state machine e do mapeamento de payload                                        |

Não usar snapshots como prova principal nem impor percentual arbitrário de cobertura.

## Gate de implementação

- Estado: `open`
- Dependências: nenhuma
- Motivo: esta é a fundação das demais Target Specs do pacote.

O gate aberto não substitui aprovação humana; a execução só começou depois do registro de aprovação desta spec.

## Fora de escopo

- Implementar controles visuais específicos de aparência, idioma, leitor, privacidade ou dados.
- Alterar o contrato da Core ou migrar dados da Web/localStorage.
- Sincronizar idioma da interface com `/users/me/settings`.
- Resolver preferências entre dispositivos por timestamp de campo; o contrato é sincronizado como objeto integral.
- Garantir entrega de request após encerramento forçado pelo sistema operacional.

## Aprovação humana

- Aprovador: usuário responsável pelo produto
- Data: 2026-08-08

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
