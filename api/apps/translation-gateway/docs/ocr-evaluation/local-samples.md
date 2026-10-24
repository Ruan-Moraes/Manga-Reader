# Imagens prontas para testes locais repetidos

## Uso rápido

Resultados observados e lacunas do piloto estão na
[auditoria corrente](../../../../../mobile/docs/specs/features/MOB-FEAT-018-multilingual-ocr-regions/evidence/ocr-consolidation.md);
a [consolidação inicial](pilot-review-2026-09-27.md) é histórica. Aprovação exploratória
não substitui referências humanas independentes nem autoriza novas chamadas.

Na raiz do repositório, com Node.js 22 (sem instalar dependências):

```bash
node api/apps/translation-gateway/scripts/ocr-samples.mjs verify
node api/apps/translation-gateway/scripts/ocr-samples.mjs gallery
```

Abra `.local/ocr-samples/index.html` no navegador. A galeria funciona offline,
mostra as cenas de Pepper&Carrot ao lado da versão editorial pt-BR. Livros sem
essa comparação são apresentados sozinhos, sem tradução inventada. Permite abrir
o JPEG original ou PNG derivado. Links de créditos só acessam a internet ao clicar.
As imagens ficam em `.local/ocr-samples/images/`, ignoradas pelo Git. Use esses
mesmos arquivos no seletor do aplicativo para repetir testes de importação/leitura;
não é necessário capturar nem baixar novas páginas a cada rodada.

Em outro checkout/computador, restaure explicitamente as imagens:

```bash
node api/apps/translation-gateway/scripts/ocr-samples.mjs download
node api/apps/translation-gateway/scripts/ocr-samples.mjs gallery
```

`verify` e `gallery` não fazem chamadas de rede. `download` busca somente arquivos
JPEGs legados de Pepper&Carrot ausentes, sem retries, redirecionamentos, login,
chaves ou provider OCR. Itens `local-original`, como Tokyo Puck, exigem restauração
local explícita e nunca são baixados por esse comando.
Os PNGs derivados exigem restauração local explícita: `download` não baixa PDFs,
não converte páginas e falha antes de buscar a URL de uma derivação ausente. Um arquivo
existente com tamanho/hash divergente é preservado e causa erro, sem substituição
automática. Se o autor mudar os bytes, a restauração falha: é preciso revisar e
versionar explicitamente a nova amostra. A galeria gerada pode ser reconstruída;
um `index.html` que não seja do gerador é preservado.

O [manifesto fixado](samples.json) contém nomes, idioma declarado pela fonte,
página, URL original, atribuição, bytes, dimensões e SHA-256. `verify` confere
hash/tamanho/assinatura e dimensões do cabeçalho JPEG. Para PNG, verifica também
CRCs, chunks, fim do arquivo, stream zlib e filtros de linha, com descompressão
limitada a 64 MiB. O catálogo local aceita RGB/RGBA 8 bits não entrelaçado,
sem APNG; isso não altera o contrato de mídia do gateway. Não executa OCR nem substitui
o decoder/validador de mídia do gateway. A CLI é ferramenta local, não endpoint.

## O que há no conjunto inicial

São as páginas 1 e 2 do episódio 1 de Pepper&Carrot, nas versões `en`, `ja`, `es`,
`ko`, `zh-Hans` e `pt-BR`: 12 JPEGs, 2481 × 3503 pixels cada, cerca de 37 MB no
total com páginas de procedência. São cópias das exportações em alta resolução
do autor, sem cortes, conversão, recompressão ou tradução feita pelo Toonlira.
Os códigos de origem `kr`, `cn` e `pt` mapeiam explicitamente para `ko`, `zh-Hans`
e `pt-BR`; não há inferência nem conversão para chinês tradicional.

As duas cenas permitem comparar idiomas com a **mesma arte**, intencionalmente.
Essa repetição facilita depuração, mas não gera 12 amostras independentes de
benchmark. A página 1 tem falas e onomatopeias sobre arte; a página 2 inclui
mudança de expressão, fala enfática e efeito sonoro. Ambas têm pouco texto:
não representam páginas textualmente densas ou complexas por si só.

A versão pt-BR é a tradução já publicada pelos colaboradores de Pepper&Carrot,
não resultado produzido pelo aplicativo e não referência OCR revisada por nossa
equipe. Serve para Ruan comparar compreensão em português durante o piloto.
Sem resultado do worker, não existe métrica de qualidade medida.

Os incrementos abaixo ampliam as fontes disponíveis. O catálogo de arquivos não
é evidência de execução real: consultar as evidências datadas e relatórios de cada
rodada. Cobertura vertical real e página genuinamente sem texto continuam pendentes.
Na inspeção da página japonesa 1, as falas estão na horizontal. Não confundir
imagem em formato retrato com escrita vertical. O catálogo formal de 18 posições
continua separado e pendente de referências independentes.

## Livros ilustrados em chinês tradicional

Implementação e gates: [evidência de 2026-09-27](png-catalog-validation-2026-09-27.md).

O catálogo v2 adiciona `zh-hant-read-p03` e `zh-hant-anansi-p04`, PNGs de páginas
completas de livros do Hong Kong Storybooks, sob **CC BY 3.0**, não CC BY 4.0.
São as páginas físicas 3 de [我喜歡看書](https://global-asp.github.io/storybooks-hongkong/stories/zh/0087/)
e 4 de [阿南西和智慧](https://global-asp.github.io/storybooks-hongkong/stories/zh/0006/).
Autoria, ilustrações e tradução publicada estão registradas por item; não houve
tradução ou conversão de caracteres feita pelo Toonlira.

A rasterização autorizada usa `pdftoppm` 26.05.0 a 200 dpi, sem recorte, rotação
ou alteração textual. Cada derivação registra hash/tamanho do PDF, página,
ferramenta, versão e resolução; o PNG tem seu próprio hash/tamanho/dimensões.
PDFs, imagens e evidência de aquisição ficam locais, fora do Git. A referência
humana independente permanece pendente. São livros ilustrados: não considerar
essas páginas prova de detecção de balões ou benchmark complexo de mangá.

Restaure cada PNG verificado em `.local/ocr-samples/images/<id>.png` a partir
do pacote privado de aquisição, preservando o PDF e os créditos. Em outra máquina,
a aquisição dos PDFs e renderização são ações explícitas separadas; nunca tratar
a URL do PDF como download direto da amostra. Não recomprimir para acertar limites.

Os doze registros antigos foram preservados exatamente para manter legíveis as
rodadas que guardam uma cópia desses metadados. Os campos globais de licença e
créditos continuam sendo defaults **somente dos itens legados Pepper&Carrot**.
Os itens derivados exigem `mime`, `license`, `credits`, `category`, `acquisition` e
`derivation`, com allowlist dos dois PDFs e páginas editoriais já revisados.
Uma comparação pt-BR só aparece se houver relação explícita válida, nunca por
coincidência de número de página entre obras diferentes.

## Capa histórica com japonês vertical — CC0

`ja-tokyo-puck-1909-cover` é o JPEG completo de
[Tokyo Puck, fevereiro de 1909](https://commons.wikimedia.org/wiki/File:Tokyo_Puck_-_Februari_1909,_RP-P-2005-572.jpg),
com CC0 1.0 declarada por item, crédito Kitazawa Rakuten / Rijksmuseum
RP-P-2005-572 / Wikimedia Commons. Não usa os direitos de Pepper&Carrot nem a
licença dos livros. Original sem corte, giro, recompressão ou conversão de texto.

Categoria `historical-satirical-magazine-cover`, orientação
`mixed-vertical-horizontal` e escopo `historical-multilingual`: japonês vertical
com pequenas anotações de leitura, inglês horizontal e possível chinês. O hint
`ja` do executor não classifica todo o conteúdo como japonês. Grafia antiga,
contraste irregular e dobras limitam a interpretação; não representa mangá moderno,
benchmark monolíngue aprovado ou direção de leitura de layout automaticamente definida.

O catálogo fixa exclusivamente o ID, a URL original e a página de procedência
desse item para CC0. Não admite qualquer imagem do Commons. `acquisition=local-original`
impede download automático: restaure o JPEG já verificado como
`.local/ocr-samples/images/ja-tokyo-puck-1909-cover.jpg`. Ausência ou divergência
de hash falha sem baixar, substituir ou transformar. Sem comparação pt-BR inventada.

[Preparação e validação offline](cc0-catalog-validation-2026-09-27.md). A inclusão
no piloto não preenche `OCR-015` nem dispensa revisão independente. Simulação usa
texto sintético e não comprova reconhecimento vertical real.

## Por que esta fonte

| Fonte pesquisada                                                                                                                                                                                 | Decisão para o conjunto inicial                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Commons / Pepper&Carrot](https://commons.wikimedia.org/wiki/Category:Pepper%26Carrot) e [site do autor](https://www.peppercarrot.com/en/about/index.html)                                       | Escolhida: arquivos diretos, versões em vários idiomas e atribuição/licença publicadas pelo autor. Downloads feitos do autor, não de um mirror.                                |
| [Manga109 e Manga109-s](https://manga109.github.io/manga109-project-website/en/index.html#license)                                                                                               | Não usados: acesso e condições específicos, com restrições de redistribuição; não são um pacote livre para copiar entre ambientes ou enviar a terceiros sem análise adicional. |
| [Hugging Face — Manga109](https://huggingface.co/datasets/hal-utokyo/Manga109) e [anotações de segmentação](https://huggingface.co/datasets/mayocream/manga109-segmentation/blob/main/README.md) | Hospedar dataset/anotações não concede direitos sobre as imagens. Essas opções mantêm dependência dos termos originais; nenhuma conta ou autorização solicitada.               |
| [Internet Archive](https://archive.org/search?query=manga)                                                                                                                                       | Busca geral não é licença por item. Nenhum item individual com direitos adequados foi admitido nesta seleção.                                                                  |
| [Manga-OCR no GitHub](https://github.com/kha-white/manga-ocr)                                                                                                                                    | É uma ferramenta OCR com exemplos selecionados. Não usar licença do código como autorização presumida dos assets nem sua saída como referência humana.                         |

Pepper&Carrot é publicado sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode.en).
Preservar crédito de David Revoy, tradutores e colaboradores, fonte e licença;
indicar alterações em derivados e não sugerir endosso ao Toonlira. A atribuição
completa está no manifesto e na galeria. A licença traz exclusão de garantias.
Não estender esta decisão a qualquer imagem encontrada nos sites pesquisados.

## Retenção e segurança

Por orientação posterior de Ruan, este **pacote licenciado de desenvolvimento**
fica guardado para reutilização, sem expiração automática de 30 dias. A pasta
ignorada pelo Git foi escolhida para facilitar o uso sem publicar binários,
não para impor novas restrições sobre o material CC BY. Não há compartilhamento
externo automático, sincronização configurada por esta ferramenta ou exclusão
agendada. Em novo computador, `download` recupera os bytes fixados se ainda
disponíveis na fonte.

Essa exceção não altera retenção de imagens de usuários, originais/manifests no
bucket, termos particulares de outras coleções ou dados pessoais de revisores.
Novos arquivos exigem sua própria licença e metadados. Dados particulares não
devem ser acrescentados ao manifesto público. `sources/` conserva localmente as
páginas de procedência desta aquisição; não executá-las como ferramenta.

Nenhum upload, Vision, tradução remota ou alteração legal/operacional está
incluído nesses comandos. Gateway e worker permanecem desabilitados.

## Manutenção e testes do utilitário

```bash
node --test api/apps/translation-gateway/scripts/ocr-samples.test.mjs
```

Para ampliar o pacote, conferir fonte/licença e registrar hash/bytes/dimensões,
procedência e eventual derivação. Comparações editoriais são opcionais para outras
obras e não podem ser inventadas. Adicionar novo acervo, licença ou conversão exige
revisão explícita da allowlist e dos testes. Repetir testes/verify/gallery; não
transformar o comando em crawler ou executor de OCR.
