---
id: MOB-FEAT-006
type: feature
title: Privacidade e conteúdo sensível
status: implemented
created: 2026-08-08
updated: 2026-08-08
implementation_gate: open
blocked_by: [MOB-FEAT-001]
supersedes: []
superseded_by: []
---

# MOB-FEAT-006 — Privacidade e conteúdo sensível

## Objetivo

Dar à pessoa autenticada controle verificável sobre visibilidade, rastreamento comportamental e conteúdo adulto, refletindo imediatamente as regras mantidas pela Core sem confundir privacidade pública com coleta de histórico.

## Contexto e contratos relacionados

- Depende da hidratação e sincronização de preferências definida em `MOB-FEAT-001`.
- O contrato autenticado é `PATCH /users/me/privacy`, com atualização parcial de `commentVisibility`, `viewHistoryVisibility`, `libraryVisibility`, `adultContentPreference` e `behaviorAnalyticsEnabled`.
- Comentários, histórico e biblioteca usam `PUBLIC | PRIVATE`; somente histórico também aceita `DO_NOT_TRACK`.
- Conteúdo adulto usa `BLUR | HIDE | SHOW`, com `BLUR` como default seguro da Core.
- `DO_NOT_TRACK` e analytics comportamental ativo são estados incompatíveis na Core. Entrar ou sair de DNT limpa o histórico rastreado; desativar analytics limpa o histórico comportamental.

## Requisitos e regras

- A tela deve ser autenticada e iniciar com os valores confirmados pela Core; ausência temporária de dados não pode ser representada como defaults graváveis.
- Visibilidade de comentários e biblioteca deve oferecer somente `PUBLIC` e `PRIVATE`. Visibilidade de histórico deve oferecer `PUBLIC`, `PRIVATE` e `DO_NOT_TRACK`.
- `PRIVATE` controla exposição a outras pessoas, mas continua permitindo registro para o próprio usuário. `DO_NOT_TRACK` impede novos registros de histórico, leituras e atividades rastreadas abrangidos pela Core.
- A transição para `DO_NOT_TRACK` deve exigir confirmação explícita que informe a limpeza de dados rastreados; a posição funcional de leitura não deve ser apresentada como parte dessa limpeza.
- Analytics comportamental deve ficar desligado e indisponível enquanto o histórico estiver em `DO_NOT_TRACK`. A UI nunca deve enviar a combinação DNT mais `behaviorAnalyticsEnabled: true`.
- Desativar analytics deve informar que eventos comportamentais existentes serão limpos pela Core. Reativar analytics após sair de DNT deve exigir uma ação separada, sem ativação implícita.
- `BLUR` deve manter o item no resultado, ocultar sua mídia e detalhes sensíveis inicialmente e permitir revelação explícita para aquela interação. `HIDE` deve remover itens adultos de resultados e superfícies derivadas. `SHOW` deve apresentá-los normalmente.
- A mutação pode ser otimista apenas quando houver cópia do último estado confirmado. Falha deve restaurar todos os campos afetados, manter a edição recuperável e comunicar o erro; sucesso deve substituir o estado local pela resposta normalizada da Core.
- Após sucesso, devem ser invalidados somente caches cujo conteúdo dependa dos campos alterados: perfil/comentários, histórico/atividade, biblioteca, analytics ou listas filtradas por conteúdo adulto.
- Logout ou troca de conta deve remover o estado privado em memória antes de hidratar outra identidade.
- Em FSD, o modelo de privacidade pertence a `entities/user`; cada mutação de preferências pertence a uma feature de ação; composição da tela pertence a `pages`; confirmações e controles genéricos ficam em `shared/ui`. Features de privacidade não importam horizontalmente umas das outras.

## Casos de erro

- Resposta `401` deve seguir o fluxo de sessão e não deixar valores otimistas como confirmados.
- Valor desconhecido retornado pela Core deve impedir edição destrutiva daquele grupo e produzir erro observável, em vez de selecionar silenciosamente um default.
- Rejeição da combinação DNT/analytics deve restaurar o último estado confirmado e explicar a incompatibilidade.
- Falha na invalidação posterior ao PATCH não deve desfazer uma mutação já confirmada; deve solicitar atualização dos dados afetados.

## Critérios de aceite

### AC-001 — Opções válidas por domínio

Dada a tela hidratada, quando as opções forem exibidas, então comentários e biblioteca devem aceitar apenas PUBLIC/PRIVATE, histórico deve aceitar PUBLIC/PRIVATE/DO_NOT_TRACK e conteúdo adulto deve aceitar BLUR/HIDE/SHOW.

### AC-002 — Atualização parcial normalizada

Quando um campo for alterado e a Core responder com sucesso, então o PATCH deve conter somente os campos intencionalmente alterados e o estado final deve refletir a resposta normalizada do servidor.

### AC-003 — Entrada em DO_NOT_TRACK

Dado histórico diferente de DNT, quando a pessoa escolher DO_NOT_TRACK, então uma confirmação deve explicar a limpeza; cancelar não envia mutação e confirmar envia DNT sem analytics ativo.

### AC-004 — Analytics incompatível com DNT

Dado histórico em DO_NOT_TRACK, quando a tela for usada, então analytics deve aparecer desligado e indisponível, e nenhuma sequência de interações deve produzir payload com DNT e analytics ativo.

### AC-005 — Saída de DNT sem opt-in implícito

Dado histórico em DO_NOT_TRACK, quando a pessoa mudar para PUBLIC ou PRIVATE, então analytics deve permanecer desligado até uma ação explícita posterior.

### AC-006 — Semântica de conteúdo adulto

Dado o mesmo conjunto com conteúdo adulto, quando a preferência for BLUR, HIDE ou SHOW, então respectivamente o conteúdo deve iniciar ocultado com revelação explícita, ser removido das superfícies derivadas ou ser mostrado normalmente.

### AC-007 — Rollback em falha

Dado um estado confirmado, quando uma atualização otimista falhar, então todos os campos afetados devem voltar exatamente ao estado anterior, nenhum cache deve tratar o valor rejeitado como definitivo e a pessoa deve poder tentar novamente.

### AC-008 — Invalidação direcionada

Quando uma atualização for confirmada, então somente queries dependentes dos campos alterados devem ser invalidadas, e uma alteração de conteúdo adulto deve atualizar todas as listas locais onde itens sensíveis possam aparecer.

### AC-009 — Isolamento por sessão

Quando houver logout ou troca de conta, então preferências privadas da identidade anterior não devem aparecer durante a hidratação da próxima sessão.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                            |
| -------- | ----------------------------------------------------------------------------------- |
| AC-001   | Teste de contrato dos enums e teste de interação dos controles                      |
| AC-002   | Teste de integração HTTP para payload parcial e resposta normalizada                |
| AC-003   | Teste de interação para cancelar/confirmar e inspeção do payload                    |
| AC-004   | Teste de modelo por estados e teste de rejeição da combinação inválida              |
| AC-005   | Teste de transição DNT para PUBLIC/PRIVATE sem ativação de analytics                |
| AC-006   | Testes de integração nas listas/cartões e evidência visual funcional dos três modos |
| AC-007   | Teste de mutação otimista com erro e restauração integral                           |
| AC-008   | Teste do conjunto exato de query keys invalidado por campo                          |
| AC-009   | Teste de integração de logout e troca de conta com cache inspecionado               |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-001`
- Motivo: privacidade precisa do isolamento entre identidades e dos estados de persistência definidos pela fundação.

O gate só pode ser aberto quando `MOB-FEAT-001` estiver `implemented`.

## Fora de escopo

- Consentimento legal, política de retenção ou gestão de cookies.
- Bloqueio parental, verificação de idade ou alteração da classificação editorial.
- Aplicar `DO_NOT_TRACK` a comentários ou biblioteca sem suporte equivalente na Core.
- Exclusão da conta ou exportação de dados, coberta por `MOB-FEAT-007`.
- Criação de novos endpoints ou valores de enum.

## Aprovação humana

- Aprovador: usuário responsável pelo produto
- Data: 2026-08-08

Não criar `tasks.md` antes de status `approved`, aprovação preenchida e `implementation_gate: open`.
