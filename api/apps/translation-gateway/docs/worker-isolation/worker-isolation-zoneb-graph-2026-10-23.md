# Grafo candidato na zona B — 2026-10-23 UTC

Continuação da [rodada com trace e recusa de capacidade](worker-isolation-vm-trace-operator-2026-10-23.md).
**A candidata `southamerica-east1-b` passou pelo coordenador completo com
transporte simulado. Não foi selecionada em operador cloud nem executada no
Google.** A 020 permanece `in-progress/open`; a 021, `approved/blocked`.

## Implementação

Pacote separado: `.local/worker-isolation/mount-zoneb-graph.s4euL9/`.
O runtime candidato mantém 53 módulos. Foram transplantados o journal de
staging e seus 13 ancestrais; os outros 39 módulos preservam os hashes
anteriores. A conferência do grafo valida todos os imports e a equivalência
dos corpos normalizados: somente o predicado de zona do journal muda de A para
**B exata**. Não se abriu uma allowlist de zonas ou regiões.

O journal anterior continua recusando B. O novo recusa A/C, outras regiões,
janela inválida e plano adulterado. Recibos A não podem ser reabertos como B,
nem o inverso, mesmo com o mesmo run e demais campos; o hash/contexto é diferente.
Recusas não gravam no store. A skill `database-design` orientou o plano prévio:
nenhuma tabela, índice, migration, contador ou cache; protocolo CAS e vínculos
de contexto/plano/recurso preservados. PostgreSQL/Mongo da aplicação não mudam.

O coordenador de testes foi adaptado para plano B e formato próprio da observação
de metadados B. Requests, discos, prefixos de operações e cleanup derivam essa
mesma zona. Comparação com os corpos A permite somente a substituição dos caminhos
zonais; preserva COS7608 exato, archive, perfil N1, memória/CPU, disco readonly,
ausência de identidade runtime/IP externo, deny-all, Secure Boot e prazo de 600 s.
Nada foi substituído apenas no comando de criação.

Os helpers históricos de SDK preservam `cliIdentity`. O `readPlan` legado daquele
módulo compartilhado não é chamado pelo candidato; ele não é o pré-flight B.
O [leitor B separado e sua consulta real](worker-isolation-vm-trace-operator-2026-10-23.md#diagnóstico-confirmado-e-alternativa-preparada)
continuam evidências próprias. Metadados compatíveis não garantem alocação.

## Verificação offline

Gate consolidado de **19:13:29.050 a 19:16:46.012 UTC**, exit 0: **34/34**, zero
falhas, skips ou cancelamentos. Rede e comandos de credencial reais bloqueados
pelo guard do processo. CAS Java, admissão e leitura serial da reserva sobre
cópia privada são reais locais; HTTP, identidade, preços e metadados são sintéticos.

| Camada                                          | Casos |
| ----------------------------------------------- | ----: |
| Grafo exato e import inerte                     |     2 |
| Zona/plano/janela estritos                      |     7 |
| Isolamento dos journals A/B                     |     3 |
| Requests e invariantes de segurança             |     5 |
| Metadados B e recusa de observação incompatível |     2 |
| Coordenador integral                            |    10 |
| Trace passivo compartilhado                     |     5 |

O coordenador exercita sucesso, **terminal com falta de capacidade**, HTTP 400,
upload com resposta perdida, criação VM com resposta perdida, cancelamento após
grant, negação nativa, falha do transporte, escopo final inválido e verificador
financeiro não serializado. Cada falha pretendida deve ser efetivamente atingida;
uma exceção anterior não satisfaz a expectativa.

Na falta de capacidade sintética, existe exatamente um POST VM; o terminal
`DONE` contém erro, não há boot/montagem, nenhuma segunda criação e os recursos
são retirados. Não se inventa uma exclusão de VM que não foi criada. Na resposta
de criação perdida, a mesma operação é reconciliada, sem repetir o POST. Casos
ambíguos após grant preservam estado selado e exigem recuperação; diagnóstico
nunca produz autoridade de posse, `NOT_SENT` ou terminal inexistente.

Todos os casos conferem a zona B do plano e a ausência de caminhos zonais A nas
chamadas do ciclo. O trace permanece sanitizado e passivo. Nenhum arquivo de
imagem de mangá foi processado; o archive técnico já existente foi apenas lido.
Um erro inicial de caminho na fixture copiada interrompeu o readback; corrigiu-se
a referência ao mesmo archive antes do gate consolidado, sem mudar os validadores.
O RED de zona também reproduziu a incompatibilidade com o journal A original.

## Rastreabilidade e limites

| Artefato                         | SHA-256                                                            |
| -------------------------------- | ------------------------------------------------------------------ |
| Gate consolidado                 | `0bf8e315e9de65d163dcc340c777eef7f94cf10872a5375c3904e453b3ddea71` |
| Grafo selecionado para os testes | `21d6587cc90ac99e3b30da063a388bfd1d20fb8e2df089b5aecc29a77237c476` |
| Gate anterior preservado         | `502d7db337b2c070575607e8c468a0109e2ad8496b0f489bcb474242700cb8ab` |
| Retirada da nona rodada          | `a0a53fc75091bbdbf8a5b3452d526a3b3344aeb4c0c4dfbfb04befc3544be2b1` |

O recibo registra hash do TAP e 272 fontes/artefatos; reconfere os 220 fontes do
gate anterior e os 419 fontes técnicos do gateway. Ledger original conferido
antes/depois: nove reservas / USD 45 reservados, não faturados comprovados.
Nenhuma reserva, credencial, consulta ou mutação cloud foi feita neste gate.

As datas das fixtures são explicitamente sintéticas e posteriores à nona
retirada. Não foram redatadas observações reais, preços ou capturas. Testes
copiam o ledger e substituem a reserva somente nessa cópia; o original não muda.
Recibos e fontes selados, archive e arquivos de performance foram preservados.

Maven/web/mobile não foram reexecutados neste incremento restrito. Os
[gates globais anteriores](worker-isolation-vm-trace-operator-2026-10-23.md#gates-globais-e-rastreabilidade)
continuam fotografias daquela execução; o checksum técnico do gateway permanece
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não há mudança Java, mobile, schema, contrato HTTP, provider ou defaults.
Os testes não demonstram boot, montagem real, orçamento total de memória ou
isolamento do worker na cloud.

## Próximo trabalho

Integrar este grafo a **outro operador**, com gates e seleção próprios. A guarda
histórica dos oito escopos foi mantida como regressão no coordenador de teste;
ela **não admite uma nova criação**: o operador futuro precisa acrescentar os
11 alvos da nona retirada aos 75 anteriores, manter a guarda da primeira retirada
e conferir as 86 referências frescas. Preservar pins/validadores A dos históricos;
o runtime B não pode reinterpretar seus planos ou journals.

Revalidar metadados B, preços, quota, ausência e janela financeira antes de
reservar/executar. Não reaproveitar o contexto encerrado, reativar uma cotação
vencida ou fazer fallback automático. Montagem, boot/segurança, memória integral,
falhas, qualidade e retenção operacional seguem pendentes. Nenhum upload,
provider pago, instalação, deploy ou avanço da 021 é autorizado por este gate.

## Continuação posterior

A [integração do operador B](worker-isolation-zoneb-operator-2026-10-23.md) foi
executada com a nona retirada, metadados e cotação frescos. A rodada parou em
GET 429 antes da VM e retirou seus recursos. Os testes deste grafo continuam
evidência offline, não prova de boot ou de capacidade disponível na zona B.
