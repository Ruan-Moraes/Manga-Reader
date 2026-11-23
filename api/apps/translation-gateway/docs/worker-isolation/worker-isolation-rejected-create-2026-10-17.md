# Criação recusada: reprodução e fundação do journal

Data: 2026-10-17. Continuação da
[revisão de admissão](worker-isolation-admission-review-2026-10-17.md).
020 segue `in-progress/open`; 021 bloqueada. Este incremento não executa
requisições autenticadas, cria recursos, instala dependências ou usa providers.

## Finding confirmado, não incidente cloud

Dois testes locais oferecem HTTP 403 ao POST de criação, sem criar recurso nem
operação no servidor falso. O ciclo v2 já recusa nova tentativa, mas exige uma
operação terminal para resolver toda intenção antes de qualquer retirada.

| Cenário sintético      | Resultado do ciclo atual                               | Recursos sintéticos que ficam pendentes                               |
| ---------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| Primeiro POST, network | `creation-unsettled`, cleanup `route-context-required` | Objeto e bucket do staging                                            |
| POST do boot disk      | `creation-unsettled`, cleanup `creation-unsettled`     | Network, subnetwork, ingress, egress, data image, data disk e staging |

Os dois testes de aceite de retirada **continuam vermelhos**. Não foram
reescritos para aprovar o comportamento existente. Um controle positivo usa a
mesma fixture para chegar à prova e retirar seu escopo; outros controles
conferem admissão ausente e ausência de reenvio. Isso não simula um novo boot
real e não descreve recursos abandonados efetivamente observados no projeto.

O GET `images.getIamPolicy` que retornou 403 na etapa anterior é uma consulta
distinta. Não é evidência de um POST de boot recusado. Não repetir esse GET ou
ampliar IAM como solução deste finding.

## Fundação entregue, ainda sem integração ao ciclo

Tooling privado em `.local/worker-isolation/mount-rejected-create.gTpvsO/`.
`design.md` foi escrito antes do código, seguindo `database-design`. A exceção
é um journal de arquivos de um ensaio local, não PostgreSQL do produto. Não há
Flyway, alteração de schema, estado público ou texto de usuário persistido.

`journal-v3.mjs` reutiliza o store/helper Java imutáveis, com lock do SO,
compare-and-set e fsync. Seu contexto novo fixa bundle/plano e rejeita abertura
cruzada com v2, sem converter arquivos históricos.

- `insertRejection` guarda uma observação HTTP 403 vinculada à intenção, corpo
  canônico e janela UTC. Não tem ID de operação nem targetId inventado.
- `insertHandle` e `insertTerminal` ficam nulos nessa situação. Operação Google
  e recusa são mutuamente exclusivas, inclusive sob disputa de gravação.
- Timeout, 429, 5xx, referência divergente, campo extra ou timestamp inválido
  não viram recusa. Falhas seguem sanitizadas; não guardar body remoto.
- Dependência recusada não libera a criação seguinte. Delete continua exigindo
  selo, resolução de todos os inserts e ID real de insert terminal sucedido.
- A reabertura lê o registro durável, sem permitir substituir uma recusa ou
  repetir a criação. Leitura após confirmação perdida foi testada; isso não
  equivale a ensaio de crash nativo de toda a integração v3.

O journal aceita uma observação por porta explícita: **não é prova independente
de rede nem autorização de exclusão**. O futuro adapter deve produzi-la apenas
ao receber a resposta do POST canônico, antes de encerrar a execução. Cleanup
terá de conferir ausência do recurso recusado; recurso inesperado não poderá
ser adotado/excluído por nome. Nenhuma dessas ligações foi habilitada aqui.

O [contrato HTTP 403](https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden)
descreve recusa de atendimento, não uma operação `DONE`. As
[práticas do Compute](https://docs.cloud.google.com/compute/docs/api/best-practices)
diferenciam submissão e verificação de operação, e incluem 403 por quota.
Por isso o código não chama toda recusa de falta de permissão e não transforma
um status isolado em comprovação da ausência de recursos.

## Verificação reproduzível e limite da evidência

```bash
node .local/worker-isolation/mount-rejected-create.gTpvsO/verify.mjs
```

O verificador local salva TAPs e recibo exclusivos. A reprodução deve terminar
com os dois findings; os testes da fundação e regressões devem passar. O próprio
verificador termina com **exit 1** enquanto `cleanupGapFixed=false`: registrar
defeito conhecido não deixa o gate operacional verde. Não usar esse comando
como executor cloud ou interpretação de aprovação da 020.

O recibo confere separadamente os fontes pinados anteriores, a fotografia dos
419 paths técnicos do gateway, ledger existente, sintaxe, links, formatação
dirigida e diff do escopo. A fotografia não cobre Dockerfile, mobile, documentos
ou tooling privado. Os fontes novos têm hashes próprios no recibo. A suíte
integral histórica de 741 casos não é redatada por esta execução dirigida.

Maven, web, mobile e SDD não são reexecutados como se esta fundação privada
alterasse o runtime. O diff global alheio permanece reportado separadamente.
Nenhum arquivo de performance ou pedido de tema/modal foi alterado.

## Próximo trabalho obrigatório

Integrar versões novas do adapter HTTP, ciclo e retirada ao journal v3, mantendo
fontes/recibos históricos. Passar os dois testes de aceite **sem** fabricar
operação, reenvio cobrado, adoção por nome ou exclusão ampla. Cobrir também
resposta perdida, recusa tardia, falha de persistência, cancelamento, 403 em GET,
timeout, 429/5xx e recurso inesperadamente existente.

Enquanto isso, não liberar a criação real com o ciclo v2. O teto de US$ 5 é
total; nenhuma nova reserva ou cobrança foi autorizada por este diagnóstico.
