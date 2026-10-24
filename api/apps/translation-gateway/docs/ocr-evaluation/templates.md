# Modelos privados — avaliação OCR

Modelos vazios do [protocolo 1.2](protocol.md). Copiar e preencher **fora do
repositório**, em diretório privado. Campos vazios significam pendência, não
aprovação; linhas de tabela são placeholders, não regiões ou resultados.

Estas fichas servem ao benchmark com referência humana. Para repetir testes
com arquivos já licenciados e baixados, usar o [pacote local](local-samples.md),
que tem manifesto público próprio e retenção reutilizável, sem exigir preencher
essas fichas vazias a cada rodada. Ele não conta como revisão independente.

## Equipe e custódia — preencher antes da aquisição

- Custodiante: Ruan (confirmado no plano; nenhum diretório confirmado neste modelo).
- Diretório privado aprovado / confirmação e data:
- Pessoas com acesso / canal privado autorizado / confirmação de recebimento:
- Retenção: até 30 dias desde a aquisição, limitada pelas condições do item.
- Responsável pelo controle do vencimento e remoção das cópias:

| Idioma/caso                    | Anotador privado / competência | Revisor independente / competência | Confirmação / data |
| ------------------------------ | ------------------------------ | ---------------------------------- | ------------------ |
| ja, horizontal e vertical      |                                |                                    |                    |
| en                             |                                |                                    |                    |
| es                             |                                |                                    |                    |
| ko                             |                                |                                    |                    |
| zh-Hans, horizontal e vertical |                                |                                    |                    |
| zh-Hant, horizontal e vertical |                                |                                    |                    |
| pt-BR                          |                                |                                    |                    |
| página sem texto               |                                |                                    |                    |

Campos vazios são pendências. Competência deve cobrir a variante e a direção
de escrita atribuídas; não preencher nomes fictícios. Não compartilhar esta ficha
no catálogo público nem enviar material só por ter indicado uma pessoa aqui.

## A. Ficha da amostra e autorização

- ID do catálogo:
- Revisão da amostra / estado:
- Idioma de origem / hint / orientação / dificuldade:
- Categoria: quadrinhos / livro ilustrado / revista ilustrada:
- Motivo do uso de outro impresso / limitações para representar quadrinhos:
- Confirmador humano do idioma, variante, orientação e dificuldade / data:
- Origem/proveniência (registro privado):
- URL da página do item / edição e página / data de consulta:
- Autor/titular e responsável pela autorização (registro privado):
- Evidência de licença/autorização e condições:
- Licença / versão / atribuição exigida / localização privada da prova:
- Responsável pela triagem de direitos / decisão e pendências / data:
- Permissão explícita/compatível para processamento remoto Google Cloud nos EUA:
- Restrições de redistribuição / armazenamento / retenção:
- SHA-256 dos bytes originais:
- Largura × altura em pixels / MIME real / quantidade de bytes:
- Custodiante / pessoas com acesso / local privado:
- Data/hora de aquisição / vencimento calculado (até 30 dias ou prazo menor):
- Data limite de retenção local / procedimento de exclusão:
- Cópias entregues / destinatários autorizados / confirmação de remoção:
- Anotador / competência no idioma:
- Revisor / competência no idioma:
- Data / versão da referência humana:
- Ambiguidades e pendências:

Checklist (não marcar sem evidência):

- [ ] Direitos e condições de processamento remoto verificados.
- [ ] Sem dados pessoais/confidenciais; destino privado e retenção definidos.
- [ ] Idioma/variante, orientação, dificuldade e categoria confirmados por humano.
- [ ] Origem/página e hash não duplicam outra posição; nenhum byte transformado.
- [ ] Bytes, hash, dimensões e assinatura/MIME verificados.
- [ ] Anotador e revisor são pessoas distintas, com competência registrada.
- [ ] Referência revisada integralmente antes de consultar qualquer saída OCR.
- [ ] Aprovação operacional separada obtida antes de executar chamada paga.

O último item pertence à execução futura e fica desmarcado nesta coleta; não é
necessário executar OCR para obter uma referência revisada.

## B. Referência humana

- ID / revisão / SHA-256 da amostra:
- Versão da referência / data / anotador / revisor:
- Página sem texto confirmada: (sim/não/pendente)
- Orientação / convenção de leitura / ambiguidades:
- Registro de divergências / devolução ao anotador / correções e reconferência:
- Aprovação independente / data / versão e hash dos arquivos da referência:

| ID humano | Ordem (base zero) | Texto exato em arquivo UTF-8 privado | Quatro vértices em pixels [(x,y), …] | Legibilidade/ambiguidade |
| --------- | ----------------- | ------------------------------------ | ------------------------------------ | ------------------------ |
|           |                   |                                      |                                      |                          |

Guardar texto em arquivo UTF-8 para não perder LF/espaços em células Markdown.
Cada região aponta para seu texto privado; não usar separadores adicionados pela
planilha. Vértices seguem o contorno sem cruzamento. Para página vazia, remover
a linha placeholder e registrar zero regiões. Ausência de anotações por falta de
revisor **não** significa página vazia.

Checklist de conferência integral (somente após inspeção humana):

- [ ] SHA-256 da imagem coincide com a ficha; referência aponta para a mesma revisão.
- [ ] IDs humanos únicos e ordens inteiras contíguas iniciando em zero.
- [ ] Texto corresponde ao visível, com espaços, pontuação e LF preservados.
- [ ] Cada região tem quatro vértices distintos, finitos, dentro da imagem,
      em sequência no contorno, sem cruzamentos nem área nula.
- [ ] Geometria cobre o texto associado e ordem corresponde à leitura humana.
- [ ] Ilegibilidade e ambiguidades explicitadas, sem inventar texto.
- [ ] Divergências resolvidas ou trechos incertos explicitamente não aprovados
      como transcrição exata; nova conferência registrada após correções.
- [ ] Revisor distinto do anotador confirmou esta versão sem consultar OCR.
- [ ] Página sem texto, quando aplicável, confirmada independentemente com zero regiões.
- [ ] Autorização e retenção permanecem vigentes na data de aprovação.

Não marcar itens de regiões como executados em página sem texto: registrar
`não aplicável — zero regiões confirmadas`. A revisão é uma atividade humana,
não um resultado fornecido por este modelo vazio.

### Triagem assistida em português — opcional e não independente

- Responsável / data / amostra e revisão:
- Origem da tradução auxiliar / autorização separada para obtê-la:
- Clareza e compreensão do português / dúvidas:
- Competência disponível no idioma fonte / limitações de fidelidade:
- Revisão independente do original: pendente.

Não preencher como resultado OCR nem como referência humana. Tradução plausível
pode ocultar erro de reconhecimento; esta ficha não promove o estado da amostra.
Nenhuma tradução auxiliar foi executada pela criação deste modelo.

## C. Relatório de execução e avaliação

- ID da medição privada / amostra e revisão / hash:
- Data / aprovação de execução e custos / responsável:
- Revisão do código / protocolo / SDK / configuração regional e hint:
- Versão e hash da referência / versão e hash do manifesto:
- Resultado de execução: (não executado/sucesso/falha/cancelamento)
- Código sanitizado em caso de falha / resultado ambíguo:
- Quantidade de chamadas observadas / duração:
- Cleanup remoto verificado / prazo de remoção das cópias locais:

| Grupo humano ↔ regiões OCR | Associação (1:1/1:n/n:1/ausente/extra) | N   | S   | D   | I   | CER ou motivo de não cálculo |
| -------------------------- | -------------------------------------- | --- | --- | --- | --- | ---------------------------- |
|                            |                                        |     |     |     |     |                              |

- Normalização: NFC; CRLF/CR → LF; pontos de código; sem trim/remoção de acentos.
- Erros de pontuação / quebras:
- Regiões ausentes / extras / duplicadas / divididas / agrupadas:
- Geometria: cobertura, cortes e associação com vizinhos:
- Ordem: inversões e ambiguidades, sem reorganizar a saída:
- Página sem texto: quantidade de regiões inventadas / falha distinta de vazio:
- Texto ilegível ou associação insegura excluída do CER, com justificativa:
- Revisor / data / limitações / decisão humana / próximos passos:

### Resumo agregado publicável após revisão

Sem texto, imagem, referências de jobs, chaves GCS, URIs ou identidade pessoal.

| Categoria/idioma/orientação/caso | Planejadas | Autorizadas | Revisadas | Executadas | Sucessos/falhas/cancelamentos | Cobertura CER (amostras e N) | CER agregado | Limitações |
| -------------------------------- | ---------- | ----------- | --------- | ---------- | ----------------------------- | ---------------------------- | ------------ | ---------- |
|                                  |            |             |           |            |                               |                              |              |            |

Separar arte-only, transporte e amostras não avaliáveis. Registrar denominadores
e pendências; não preencher zero onde não houve medição. O resumo é evidência
exploratória, sem limiar de aprovação antecipado ou conclusão automática da 018.
