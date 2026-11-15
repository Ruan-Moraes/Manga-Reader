---
id: MOB-FEAT-068
type: feature
title: Validação de e-mail e confirmação de senha no cadastro
status: in-progress
implementation_gate: open
blocked_by: [MOB-FEAT-061]
created: 2026-11-13
updated: 2026-11-13
supersedes: []
superseded_by: []
---

# MOB-FEAT-068 — Validação de e-mail e confirmação de senha no cadastro

## Objetivo

Avisar antes do envio quando o e-mail do cadastro não tem formato válido e mostrar o erro da confirmação de
senha só quando ele ajuda a pessoa, sem acusar "As senhas não coincidem" com os dois campos vazios.

## Contexto e contratos relacionados

- Hoje o Cadastro (`pages/register`) só confere se o e-mail está preenchido. Um e-mail como `ana@` chega ao
  servidor, que o recusa com `@Email`, e a pessoa vê só "Não foi possível criar a conta. Tente novamente."
- A confirmação mostra "As senhas não coincidem" sempre que está vazia, inclusive quando a senha também está.
- Altera a parte de validação de MOB-BASE-004/OBS-002 e de MOB-FEAT-061/AC-004 ("nenhuma validação muda") só
  para estas duas regras do Cadastro. Requests, destinos, mínimo de 8 caracteres e termos obrigatórios ficam
  como estão.
- As chaves `validation.emailInvalid` e `validation.confirmPasswordRequired` já existem nos três idiomas e
  passam a ser usadas.

## Requisitos e regras

- **E-mail.** Ao tocar em "Criar conta", um e-mail preenchido sem o formato `algo@dominio.tld` (sem espaços,
  um `@`, ponto no domínio), depois de remover espaços das pontas, mostra "Formato de e-mail inválido." no
  campo e não envia. Vazio continua "E-mail é obrigatório.".
- **Confirmação de senha**, avaliada no envio:
    - senha vazia ou curta: a confirmação não mostra erro; o erro fica só na senha;
    - senha válida e confirmação vazia: "Confirmação de senha é obrigatória.";
    - senha válida e confirmação diferente: "As senhas não coincidem.".
- Os erros continuam aparecendo só depois do envio e somem ao editar o campo, como hoje.
- O texto pt-BR de `validation.emailInvalid` passa a "Formato de e-mail inválido.", igual ao rótulo do campo.

## Casos de erro

- E-mail que passa na checagem local mas é recusado pelo servidor: continua a mensagem genérica de falha.

## Critérios de aceite

### AC-001 — Formato do e-mail

Dado um e-mail sem formato válido (`ana`, `ana@`, `ana@site`, `ana @site.com`), quando a pessoa toca em
"Criar conta", então o campo mostra "Formato de e-mail inválido." e nada é enviado. Com `ana@site.com`
(espaços nas pontas) não há erro de e-mail.

### AC-002 — Confirmação com senha vazia ou curta

Dados senha e confirmação vazias, quando a pessoa toca em "Criar conta", então só a senha mostra erro; a
confirmação não mostra "As senhas não coincidem".

### AC-003 — Confirmação ausente ou diferente

Dada uma senha válida, quando a confirmação está vazia, então aparece "Confirmação de senha é obrigatória.";
quando está diferente, "As senhas não coincidem.". Com as duas iguais e o resto válido, o cadastro é enviado.

### AC-004 — Idiomas e fluxos preservados

As mensagens existem em pt-BR, en-US e es-ES, e os testes atuais de login, cadastro e recuperação continuam
verdes.

## Estratégia de evidência

| Critério | Teste e evidência                                                                    |
| -------- | ------------------------------------------------------------------------------------ |
| AC-001   | RNTL do Cadastro com os quatro e-mails inválidos e o e-mail com espaços nas pontas.  |
| AC-002   | RNTL do envio com o formulário vazio.                                                |
| AC-003   | RNTL com confirmação vazia, diferente e igual (envio chamado uma vez).               |
| AC-004   | Paridade de chaves nos três idiomas; suíte de `pages/{login,register,forgot}` verde. |

## Gate de implementação

Estado `open`, com dependência MOB-FEAT-061.

## Fora de escopo

- Validar enquanto a pessoa digita ou ao sair do campo.
- Mudar o mínimo de senha (o servidor aceita 6, o app exige 8) ou o tamanho do nome.
- Links de Termos de Uso e Política de Privacidade (MOB-FEAT-064).
- Mensagens específicas para recusas do servidor.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-13
- Evidência: resposta "Aprovo" à apresentação do rascunho na revisão tela a tela (tela 11).
