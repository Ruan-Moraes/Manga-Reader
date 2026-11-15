---
id: MOB-FEAT-065
type: feature
title: Diagnóstico de tradução e modo desenvolvedor
status: in-progress
implementation_gate: open
blocked_by: [MOB-FEAT-008, MOB-FEAT-017, MOB-FEAT-055]
created: 2026-11-10
updated: 2026-11-10
supersedes: []
superseded_by: []
---

# MOB-FEAT-065 — Diagnóstico de tradução e modo desenvolvedor

## Objetivo

Tornar falhas de tradução compreensíveis e permitir diagnóstico técnico sob controle local do usuário.

## Contexto e contratos relacionados

O diagnóstico complementa MOB-FEAT-017 e MOB-FEAT-055 sem alterar a regra de não repetir operações incertas.

## Requisitos e regras

Quando um lote de tradução falhar ou tiver resultado incerto, apresentar modal
localizado com as páginas afetadas e permitir copiar a mensagem. Não reenviar
automaticamente tentativas incertas. Os detalhes técnicos são visíveis e
copiáveis somente com o modo desenvolvedor habilitado; erros comuns continuam
compreensíveis sem ele. Códigos e referências operacionais não incluem conteúdo,
credenciais, nomes de arquivos ou dados pessoais.

O modo é local ao aparelho e desativado por padrão. A versão em Configurações → Sobre
desbloqueia o controle pela sequência de AC-005. Desbloqueio e ativação persistem
entre reinícios. Recursos de build restritos a `__DEV__`
continuam sujeitos à sua proteção existente.

## Casos de erro

Falhas de clipboard são informadas; mensagens de rede ou provedor não incluem conteúdo privado.

## Critérios de aceite

### AC-001 — Ativação e configuração

O controle de ativação fica disponível após o desbloqueio de AC-005.
É possível ativar e desativar o modo, e a preferência sobrevive ao reinício.

### AC-002 — Modal e cópia

Ao finalizar lote com falha ou resultado incerto, apresentar modal acessível
com páginas afetadas, mensagem localizada e ações de fechar e copiar; informar
sucesso ou falha da cópia.

### AC-003 — Diagnóstico restrito

Mostrar e copiar código e referência sanitizados somente com modo desenvolvedor
ativo. Não exibir nem copiar dados técnicos em modo comum.

### AC-004 — Gateway e segurança

Gateway registra e devolve código e referência operacionais sem conteúdo ou
segredos. Um erro HTTP ou falha de rede não autoriza retry pago automático.

## Estratégia de evidência

Testes de unidade e integração, verificação do gateway implantado e teste no Android físico.

## Gate de implementação

Aberto; as dependências estão em execução ou verificação pendente.

## Fora de escopo

Expor conteúdo de tradução, segredos, ferramentas de build ou habilitar retry pago automático.

## Aprovação humana

- Aprovador: usuário Ruan, nesta conversa.
- Data: 2026-11-10.

## Revisão aprovada — 2026-11-11

Aprovação registrada pelo pedido de implementação do plano do leitor, capítulos e modo desenvolvedor.

### AC-005 — Desbloqueio e ativação independentes

A versão aceita sete toques, espera mínima de cinco segundos, sete toques, espera mínima de cinco segundos e um toque final. Toques prematuros, perda de foco e inatividade zeram a sequência. Após desbloqueio, um switch persistente governa todos os recursos do modo. O valor legado ativo preserva acesso e ativação.

## Visibilidade das ferramentas em 2026-11-12

A prévia de novel, o painel de credenciais de demonstração e o simulador de tradução exigem modo desenvolvedor ativo, além da restrição existente à build de desenvolvimento. Ao abrir diretamente a rota da prévia, aguardar a leitura da preferência antes de decidir o acesso. Com o modo desligado, a biblioteca oculta o selo de demonstração e o leitor usa as páginas originais no lugar de resultados simulados já salvos. Os arquivos permanecem no aparelho e voltam a ser exibidos ao reativar o modo.
