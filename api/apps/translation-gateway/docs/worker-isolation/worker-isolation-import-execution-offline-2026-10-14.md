# Importação: transporte e reserva durável offline — 2026-10-14

**Código executado com HTTP falso; nenhuma chamada Google ou credencial real.**
Continua a [preparação de importação](worker-isolation-image-import-preparation-2026-10-14.md).
O turno anterior foi progresso: planner/observer, fixtures e investigação da
geração. A confirmação financeira solicitada para nova origem/custom image
**ainda não foi recebida**. A continuação automática da meta não a substitui.
020 `in-progress/open`, 021 bloqueada; objetivo completo permanece ativo.

## 1. Implementação entregue

Pacote ignorado `import-execution.xWGvY6`, JavaScript com módulos nativos Node:

| Componente      | Comportamento testado localmente                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Transporte      | Hosts/projeto/paths/métodos fixos, body canônico, query de geração preservada, redirects proibidos e metadata até 128 KiB. |
| Inicialização   | Sem SDK/ADC; exige callbacks explícitos. Factory/ack ausente não consulta credencial ou rede.                              |
| Create          | Exige ausência recente do nome; uma tentativa por instância, sem retry implícito, nem após ACK inválido/perdido.           |
| Journal durável | Claim por create/delete, `O_EXCL`, arquivos privados, sync de arquivo/diretório antes da transmissão.                      |
| Handles         | ID/UUID/target ID e path vinculados são persistidos sem user, mensagem/erro bruto ou token.                                |
| Recuperação     | Lê contexto/claims/handles sem alterá-los; nova instância consulta o handle salvo, não recria uma operação já tentada.     |
| Retirada        | Revalida identidade fresca e terminalidade, UUID de delete distinto; ACK não prova desaparecimento.                        |
| Falhas          | Cancelamento, erro, ACK perdido ou observação incompleta preservam a origem. Sem fila ilimitada de HTTP.                   |

`createTransport` recebe `fetch`, provedor de token, clock e journal explícitos;
nenhum deles é acessado ao importar o módulo. A string de acknowledgment local
protege de acidente, **não comprova autorização humana**. O futuro chamador
real deve verificar a autorização e o preflight de identidade/TLS/SDK, além de
usar `createJournal`; passar um logger fake não oferece reserva durável.
Não há CLI que escolha global fetch/ADC automaticamente ou habilite cloud.

O token, se fornecido numa execução autorizada futura, é mantido em closure,
nunca no journal/retorno público. Nesta entrega o callback retorna uma string
falsa apenas nos testes. `dispose` não promete zeroização forense de memória.
Callbacks são infraestrutura confiável, não uma sandbox contra código malicioso
do chamador; factory não aprova identidade, IAM ou a configuração TLS externa.

## 2. Persistência da intenção e recuperação

O journal trabalha somente em diretório `import-run.*` próprio, privado,
canonicalizado e do usuário atual. Contexto vinculado ao SHA-256 do plano,
nonce/projeto/nome/UUID. Sem criação automática sobre workspace/home ou uso
de diretório desconhecido. Symlinks e hardlinks em arquivos de journal são
recusados antes de leitura/escrita; nenhuma permissão da fonte emprestada é alterada.

Dois writers independentes só admitem um claim de create. O claim permanece
mesmo se a resposta não chegar ou a gravação posterior do ledger falhar.
Não apagar claim, truncar journal ou abrir rodada nova como recuperação da
mesma tentativa. O vínculo inicial de operação é preservado; observações
posteriores são acrescentadas, não sobrescrevem a fotografia anterior.

`readRecovery` e `resumeFromProof` restauram identidades/claims, **não status
terminal presumido**. Terminalidade precisa de consulta ao mesmo handle.
ACK perdido sem handle conhecido mantém criação reivindicada/origem retida;
não faz listagem ampla, novo POST, grant, fallback ou restauração de bucket.
Se uma operação real continuar após timeout, registrar IDs/custos pendentes e
consultá-la novamente com a autoridade adequada, nunca tratá-la como parada.

## 3. Composição da prova e limites

`runProof` conecta transporte ao observer anterior, sem inicializar clientes.
Create acontece uma vez; readiness/geração metadata precisam ser conferidas.
Retirada de imagem própria segue operação terminal e identidade, com um delete
e confirmação posterior de ausência. Delete pendente é observado no **mesmo**
handle. Somente confirmação libera a origem ao futuro adapter de staging.

Imagem própria acima do cap é finding, não aprovação; ainda é retirada com
identidade própria confirmada. Assim, erro de admissão não é motivo para deixar
um recurso caro ou para remover recurso estranho. Perda de observação/identidade
impede retirada automática e mantém pendência explícita, não sucesso fictício.

Os limites anteriores permanecem: seleção da geração pelo importador é
**não comprovada**, eco de URI/READY não prova os bytes, identidade read→delete
da imagem não é precondição atômica de ID, e aceitação do ext4 RAW precisa de
prova real. `operationalApproved`, `filesystemVerified` e
`sourceGenerationSelectionVerified` permanecem false em todos os resultados.

Aguardam composição real: preflight do processo/credencial, criação/upload/
readback da nova origem, concessões existentes conferidas por recurso, runner
local exclusivo e retirada de objeto/bucket própria. Não reutilizar runner
histórico com bug de corpo 204 nem restaurar o bucket anterior. Adapter real
será ligado somente após a aprovação do escopo financeiro pendente.
Nenhuma VM, disco, DNS, provider ou deploy faz parte dessa aprovação.

## 4. Evidência e regressões

32 testes novos: 16 do transporte, 11 do journal e cinco de composição.
Claims/locks/sync foram exercitados no filesystem local real; HTTP, token,
imagens/operações e metadados de Storage são **sintéticos**. Não afirmar que
esses testes criaram/importaram/removeram recursos Google.

Regressões red→green incluíram: handle não registrado duravelmente, query
arbitrária no log, hardlink no ledger, exceção estrangeira disfarçada de código
interno e clock regredindo na retirada. Campos/códigos agora usam allowlist;
mensagens brutas não são convertidas em código público por regex permissiva.
Dois patches locais não encontraram âncora após formatação; sem efeito fora
dos arquivos locais. Testes finais foram reexecutados após as correções.

**131 testes Node locais aprovados**, zero failures/skips, incluindo todas as
regressões anteriores. A composição testa nova instância após confirmação
perdida e um ciclo importação→retirada, ambos simulados, sem second create.
Fixtures temporárias pequenas desses testes foram removidas; só os diretórios
gerados pelos próprios testes, sem limpeza de cache/performance/recursos reais.

```bash
node --test .local/worker-isolation/import-execution.xWGvY6/transport.test.mjs .local/worker-isolation/import-execution.xWGvY6/journal.test.mjs .local/worker-isolation/import-execution.xWGvY6/proof.test.mjs
```

`verification.json` registra fonte e escopo, com hashes dos sete arquivos.
Fotografia auditada do gateway: mesmos 419 arquivos/
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Ela não cobre este tooling ignorado, Dockerfile, mobile ou segurança CVE.

| Artefato local  | SHA-256                                                            |
| --------------- | ------------------------------------------------------------------ |
| `transport.mjs` | `1a15e5837e6fa3ee86c2b0e8e8e2408be6fa68eb665d9bc0e48905287e72589c` |
| `journal.mjs`   | `3c4bcb2da760c27103bac50a553dc4eda01bb7b46fb6ad3be16b7544c8959cf6` |
| `proof.mjs`     | `38684fed51c2d24bca763da42bee9e3b1e53c5dc9ba627a7850d11c530e8d1dc` |
| `errors.mjs`    | `9ffa17f50cf6c42911b907ee223802b52cc23a26337900ceaf298c3285093fe0` |

Maven/web/mobile/SDD não reexecutados/redatados por tooling local sem runtime,
schema, configuração ou status alterados. Nenhuma instalação, credencial real,
consulta ao projeto, envio de arquivo, recurso cloud ou chamada paga. Não
confundir o progresso desta continuação com conclusão da 020 ou liberação da 021.
Custos/escopo da solicitação anterior continuam pendentes de resposta humana.

Fechamento local: 30 links relativos nos dois documentos, Prettier dos sete
fontes/testes e dois documentos, whitespace/EOF e diff-check direcionado do
gateway aprovados. Global conserva o EOF alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`; não corrigido.

## Continuação autorizada

Após esta fotografia offline e suas tentativas bloqueadas, Ruan respondeu
«Autorizo» à nova origem privada e tentativa única de custom image com retirada.
A [evidência da execução real](worker-isolation-image-import-real-2026-10-14.md)
registra a resolução; este documento preserva o estado histórico e os hashes
auditados, sem transformar fixtures em evidência Google.
Mac reportava 23 GiB disponíveis. Somente tooling/docs/recibo pequenos novos;
nenhum cache pesado removido/downloadado, nem atribuição da variação global
de disco a este trabalho. Arquivos de performance intocados.
