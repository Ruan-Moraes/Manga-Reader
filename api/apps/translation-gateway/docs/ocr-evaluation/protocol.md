# Protocolo de avaliação OCR — preparação, não execução

Versão do protocolo: `1.4` — 2026-09-26. Vinculado à MOB-FEAT-018.

Execução posterior do piloto, separada da preparação e do benchmark independente:
[consolidação de resultados reais de 2026-09-27](pilot-review-2026-09-27.md).
Os registros de ausência de chamadas abaixo descrevem os incrementos preparatórios
datados, não o estado atual do piloto. As regras do benchmark não foram relaxadas.

A revisão 1.1 operacionaliza a coleta aprovada: acervos abertos, outros impressos
ilustrados como alternativa, revisão independente e retenção local de até 30 dias.
Não modifica métricas nem o manifesto do produto, que permanece `1.0`.

A revisão 1.2 registra a orientação posterior de Ruan: imagens licenciadas de
desenvolvimento podem ficar em pasta local do projeto ignorada pelo Git e ser
reutilizadas sem expiração automática. O [pacote local](local-samples.md) é um
piloto para depuração e comparação editorial pt-BR, separado das 18 amostras
independentes. As regras de custódia/retenção abaixo continuam valendo para
material restrito e referências privadas, não para esse pacote CC BY 4.0.

Na revisão 1.3, o [executor manual](manual-test.md) prepara rodadas isoladas com
relatório local e comparação sem nova chamada. Sua validação inicial usa somente
gRPC falso; execução real exige opt-in separado. Não acrescenta calculador de métricas.

A revisão 1.4 prepara credencial impersonada isolada, quota explícita e captura
privada da resposta protobuf anterior ao mapper no executor. Somente validação
offline neste incremento; não demonstra autenticação Java ou qualidade real.

Os documentos versionados preparam a avaliação exploratória do adapter Vision.
Imagens e rodadas do piloto ficam no diretório local ignorado, sem resultados reais
neste incremento. Sua disponibilidade não demonstra
precisão nem autoriza processamento remoto. A feature permanece `in-progress`.

## Artefatos e estados

- [Catálogo planejado](catalog.md): 18 posições, todas pendentes de amostra.
- [Modelos privados](templates.md): ficha de autorização, referência humana e relatório.

Cada posição progride somente com evidência: `planejada` → `autorizada` →
`referência-revisada` → `resultado-observado`. Uma execução observada pode falhar;
o estado não equivale a qualidade aprovada. Amostra sem revisor competente no
idioma não passa de `autorizada`. Alteração dos bytes invalida hash, referência e
comparações anteriores; registrar nova revisão e conservar o histórico privado.
O histórico também respeita o prazo de retenção. Referências expiradas não estão
aptas a execução; preservar o estado histórico e registrar a pendência, sem
contabilizá-las entre as amostras atualmente disponíveis.

## Responsáveis e custódia antes da aquisição

Ruan é o custodiante e indicará anotadores e revisores. Confirmar com ele o
diretório privado fora do repositório, a lista de acessos e o canal de entrega
antes de baixar ou receber arquivos. Não presumir que Documents, Downloads,
uma pasta temporária ou um serviço de sincronização são destinos aprovados.
Pesquisar páginas públicas de descrição não equivale a adquirir uma amostra.

Usar a ficha de equipe dos [modelos privados](templates.md). Para cada idioma,
registrar competência do anotador e de outra pessoa como revisor, incluindo
variante chinesa e leitura vertical quando aplicável. Uma pessoa pode atender
mais de um idioma, mas não aprovar a própria anotação. A indicação não autoriza
envio automático de arquivos, contratação ou publicação de dados pessoais.

Organizar os arquivos por `OCR-NNN/revisao-N/` dentro do destino aprovado:
imagem original, ficha de direitos, referência com textos UTF-8 e registro de
revisão. Essa é uma convenção relativa, não um caminho já criado ou autorizado.
Somente metadados públicos revisados serão transferidos ao catálogo do Git.

### Triagem assistida com um único avaliador

Ruan informou ser o único participante disponível e avaliar textos em português.
Uma futura tradução auxiliar para pt-BR pode apoiar sua avaliação de clareza e
compreensão, mas não prova fidelidade ao original nem precisão do OCR. Registrar
essa atividade separadamente como triagem assistida, com origem da tradução e
limitações; não usá-la como transcrição de referência ou revisão independente.
Nenhuma tradução, envio de imagem ou chamada de modelo está autorizada por este
registro documental. A execução dessa avaliação requer escopo e autorização próprios.

Sem outra pessoa competente no idioma fonte, a posição permanece no máximo
`autorizada`, mesmo após triagem em português. O critério de referência revisada
fica pendente para colaboradores futuros; não impede pesquisar e selecionar
material quando direitos, destino e acessos estiverem confirmados.

## Seleção e autorização

1. Pesquisar primeiro Wikimedia Commons e depois acervos institucionais com
   declaração de direitos por item. Conferir a página do arquivo e a licença,
   não apenas a categoria ou o rodapé do site; seguir a
   [orientação de reutilização do Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia).
   Acesso público, compra ou posse não autorizam automaticamente processamento.
2. Preencher privadamente procedência, autor/titular, URL pública do item,
   licença e versão, atribuição, data da consulta, prova e condições de
   armazenamento, revisão, redistribuição e futuro envio ao Google Cloud nos EUA.
   Dúvida, direitos não avaliados ou restrição incompatível bloqueiam a admissão.
   A autorização do titular para publicar no acervo não é automaticamente uma
   autorização para o nosso processamento. Não emitir aprovação jurídica por
   inferência; pendências exigem esclarecimento antes da aquisição.
3. Não selecionar dados pessoais ou conteúdo confidencial para este conjunto.
   Registrar somente um identificador não sensível no catálogo versionado.
4. Priorizar quadrinhos; aceitar livro ou revista ilustrada quando não houver
   candidato adequado, registrando categoria e limitação. Confirmar por pessoa
   competente idioma, variante, orientação da escrita e dificuldade. Não deduzir
   idioma da interface do acervo nem orientação textual da proporção da imagem.
   Não traduzir, converter variantes, girar ou gerar páginas para preencher vagas.
5. Após triagem de direitos e confirmação de custódia, adquirir o arquivo original
   e verificar localmente SHA-256, assinatura/MIME, bytes, decodificação e dimensões.
   Os limites atuais do gateway são JPEG/PNG/WebP, até 12 MiB (12.582.912 bytes),
   12.000 pixels por dimensão e 80.000.000 pixels por imagem; revalidar a configuração
   antes da coleta. Metadados informados pelo acervo não substituem essa inspeção.
   Não converter PDF/DJVU, recomprimir nem alterar orientação neste incremento.
6. Rejeitar arquivos incompatíveis ou repetidos e buscar substitutos sem alterar
   os 18 IDs. Evitar a mesma página mesmo em traduções/encodings diferentes;
   comparar origem e página além do hash. Sem candidato adequado, manter pendente.

Guardar imagens, licenças/autorização, transcrições, anotações e resultados em
diretório privado **fora do checkout**, com acesso restrito, sem sincronização
pública. Não usar Git/Git LFS, CI público ou logs como armazenamento. Não copiar
chaves GCS, referências de job, credenciais, URIs assinadas, texto ou respostas
brutas para terminal, relatório público ou issue. O catálogo pode conter somente
metadados explicitamente revisados como não sensíveis; provas e caminhos reais
continuam privados.

Registrar aquisição e vencimento: no máximo 30 dias corridos desde a aquisição,
ou prazo menor exigido pela autorização. O prazo vale para imagem, provas,
transcrições, revisões e cópias compartilhadas; não reinicia ao copiar ou revisar.
Sem renovação silenciosa. O custodiante controla a remoção e registra somente
ID, data e ocorrência não sensível; não criar automação destrutiva neste marco. A
retenção remota continua sendo a do gateway; este protocolo não a estende para
conservar evidência. Planejar a captura privada do manifesto antes do cleanup,
sem desabilitar as exclusões existentes. Ao vencer a autorização/retenção,
remover as cópias restritas de forma controlada e registrar somente a ocorrência.

## Referência humana antes do reconhecimento

- Um anotador transcreve os caracteres visíveis, incluindo pontuação, espaços e
  quebras de linha; não traduz, corrige a obra ou adiciona espaços entre CJK.
- Usar regiões de referência comparáveis a parágrafos, não personagens ou balões
  presumidos. Registrar as divisões ambíguas, texto ilegível e direção de escrita.
- Numerar a ordem humana de leitura a partir de zero. Para cada região, registrar
  quatro vértices em sequência ao redor do contorno, em pixels da imagem
  verificada, sem cruzamentos; a origem é o canto superior esquerdo.
- Um revisor distinto do anotador e competente no idioma confere toda a transcrição, geometria e ordem contra a
  imagem **antes de consultar o resultado OCR**. Registrar identificador privado,
  competência, data e ambiguidades não resolvidas. Não inventar transcrição para
  conteúdo ilegível; esse trecho recebe avaliação qualitativa e CER não calculado.
- Divergências retornam ao anotador, com histórico e nova conferência independente.
  Ambiguidades genuínas podem permanecer documentadas; uma divergência não resolvida
  sobre a transcrição impede aprová-la como texto exato. Revisão automatizada ou
  gerada por IA não substitui a assinatura humana exigida neste conjunto.
- A página sem texto recebe zero regiões, confirmação humana independente explícita e origem
  selecionada `ja` apenas para exercitar o contrato, sem afirmar idioma da arte.

## Execução futura, mediante autorização separada

Pré-requisitos: amostra em `referência-revisada`, aprovação explícita para custos
e processamento, ambiente privado validado, ADC/IAM, endpoint regional `us`,
políticas aplicáveis e plano de retenção. Este documento não fornece um bypass
dos gates legais/operacionais nem instruções para habilitar uploads públicos.

Registrar revisão do código, protocolo, SDK/configuração, versão do manifesto,
data, idioma/hint, hash e versão da referência. Processar uma página por job pelo
worker com revalidação local e reserva única. Preservar uma chamada por tentativa,
deadline e retries desabilitados. Timeout/resultado ambíguo é resultado de falha:
não repetir automaticamente nem criar outro job para ocultá-lo. Qualquer nova
medição exige autorização própria e vínculo privado com a anterior.

Não alterar o mapper para melhorar o benchmark, não ativar fallback global,
tradução ou heurística de ordem. No executor manual, conservar em área privada o
manifesto e a resposta protobuf bruta (até 4 MiB), com hash, origem real/simulada e
datas; não capturar headers ou credenciais. Verificar cleanup sem registrar conteúdo
em logs. Ausência de resposta em timeout permanece falha, sem repetir a chamada.
Testes sintéticos continuam sendo evidência de
contrato, separada da medição real.

## Comparação e métricas

### Texto

Padronizar `CRLF` e `CR` para `LF` e normalizar referência e hipótese em NFC.
Comparar **pontos de código Unicode**, não bytes, unidades UTF-16 ou grafemas.
Não aplicar trim, lowercase, NFKC, remoção de acentos/pontuação ou colapso de
espaços; não inserir espaços em CJK. Espaços e `LF` contam como caracteres.

Definir `CER = (S + D + I) / N`, pela distância de edição Levenshtein com custo
unitário, sendo N o número de pontos de código da referência. Registrar N,
substituições, deleções/omissões e inserções; CER pode superar 1. Em alinhamentos
ótimos empatados, preferir diagonal (igualdade/substituição), depois deleção,
depois inserção para tornar S/D/I reproduzíveis. Para N=0, CER é `não aplicável`,
nunca zero automático; contar inserções e regiões inventadas separadamente.

Comparar por grupos de regiões associados manualmente pela posição/texto:
1:1, divisão 1:n ou junção n:1. Concatenar textos do grupo na ordem de cada lado,
sem separador artificial, preservando quebras existentes. Região ausente usa
hipótese vazia; região inventada usa referência vazia. Sem associação segura ou
com texto ilegível, registrar CER não calculado e o motivo, sem exclusão silenciosa.
Registrar separadamente erros de pontuação e quebras; não alterar o CER principal.

### Regiões, geometria e ordem

- Contar regiões ausentes, extras, duplicadas, divididas e agrupadas indevidamente.
- Comparar quadriláteros normalizando a referência por largura/altura verificadas;
  observar cobertura, corte do texto e associação com conteúdo vizinho. Não ajustar
  vértices do manifesto para fazê-los coincidir com a referência.
- Comparar sequência do provider com ordem humana, registrando inversões e
  ambiguidades; a ordem do provider permanece intacta no produto.
- Para página vazia, o esperado é manifesto com lista vazia, sem falha da etapa;
  não tratar falha de transporte como reconhecimento correto de página vazia.

Apresentar resultados por idioma e orientação, com denominadores, cobertura e
falhas. CER agregado usa soma de edições / soma de N das comparações válidas;
inserções em grupos sem referência de páginas textuais entram no numerador.
Página de arte-only é relatada separadamente. Não misturar falha de execução com
CER zero, nem apresentar só a média geral escondendo japonês vertical. Sem metas
numéricas pré-benchmark, sem aprovação estatística ou promessa de qualidade.

## Encerramento

### Diagnóstico de captura existente

O [diagnóstico estrutural offline](offline-diagnostic.md) permite inspecionar
palavras, símbolos, geometria e sequência original sem nova chamada. É suporte
de TASK-004, não referência humana ou correção do OCR. Reorganização e novo
reconhecimento continuam sujeitos a aprovação separada.

### Layout experimental separado

Para isolar geometria e ordem com referência conhecida, os
[controles tipográficos sintéticos](synthetic-calibration.md) geram duas imagens
locais. São suporte de TASK-004, fora das 18 posições reais; testes com saídas
fabricadas não são reconhecimento observado. A revisão linguística permanece
pendente e não é transferida ao custodiante sem competência no idioma.
O [executor separado de calibração](calibration-worker.md) liga referência e
captura por hashes; o modo offline continua sendo simulação, não qualidade real.

O [replay de layout](../layout-experimental.md) analisa uma captura existente sem
chamar o provider. Não modifica texto, geometria ou ordem do manifesto OCR.
Artefato separado não substitui a referência humana nem encerra a avaliação OCR.

### Aceite da coleta e revisão, sem OCR

Conferir os 18 IDs únicos e a cobertura do catálogo. Para cada amostra, usar o
checklist de revisão dos modelos: autorização vigente, bytes e hash conferidos,
idioma/categoria confirmados, referências ligadas à imagem, geometria válida,
ordem contígua, anotador e revisor distintos, competência e datas registradas.
Congelar a versão revisada; alteração de imagem ou referência exige nova conferência.

O aceite integral desta coleta exige **18 amostras autorizadas e 18 referências
revisadas**, disponíveis dentro da retenção. Fonte, autorização, local ou revisor
ausente gera entrega parcial e pendência explícita. Nenhuma posição passa a
`resultado-observado` aqui. TASK-004 continua aberta para avaliação real e TASK-005
para operação; TASK-007 documenta a preparação anterior já concluída.
Relatar cobertura por categoria, idioma e orientação: outros impressos não
comprovam qualidade em quadrinhos. Ver o [registro desta coleta](collection-review.md).

### Após execução futura

Preencher o relatório privado, distinguir fatos observados de pendências e
publicar somente resumo agregado revisado como não sensível. A decisão humana
pode solicitar outras amostras ou correção posterior, não aprova automaticamente
a feature. Catálogo/modelos completos não equivalem à coleta e revisão concluídas;
avaliação real e validação operacional continuam sendo gates separados.

Nesta entrega permanecem `gateway.ocr.mode=disabled`, `worker_enabled=false` e
`gateway_enabled=false`. Sem migration, mudança de manifesto `1.0`, task `{jobRef}`,
rotas `/v1`, Termos, runtime mobile ou recursos cloud.
