# Corpus de validação do translation-gateway

Capítulos livres de direitos usados pelo **Pipeline de validação** do gateway-tester. Cada capítulo
cobre um conjunto de cenários de texto (catálogo em `corpus.json` → `scenarioCatalog`), para que
uma mudança no OCR, na tradução ou no render possa ser conferida em várias obras de uma vez — e
não só no caso que motivou a correção (ver `api/apps/translation-gateway/docs/principios-de-correcao.md`).

As páginas são versionadas no git (≈24 MB, para testar em qualquer máquina); só os lotes gerados
(`corpus/runs/`) ficam fora.

## Rebaixar as páginas

Só é preciso para incluir capítulos novos ou restaurar um arquivo:

```bash
cd web/apps/gateway-tester
node scripts/fetch-corpus.mjs                    # tudo (pula o que já está no disco)
node scripts/fetch-corpus.mjs ubunchu-ja-ch01    # um capítulo
```

O script usa `curl` (o `upload.wikimedia.org` responde 429 ao fetch nativo do Node) e confere
que cada resposta é JPEG/PNG/WebP.

## Capítulos

| id | obra | par | cenários principais | licença |
| --- | --- | --- | --- | --- |
| `pepper-carrot-en-ep06` | Pepper&Carrot ep. 6 | en → pt-BR | balões, grito, onomatopeia na arte, texto sobre a borda, título | CC BY 4.0 |
| `pepper-carrot-ja-ep06` | o mesmo episódio em japonês | ja → pt-BR | idem, japonês horizontal (mesma arte: compara idiomas) | CC BY 4.0 |
| `pepper-carrot-ko-ep11` | Pepper&Carrot ep. 11 | ko → pt-BR | coreano, letra pequena, título em pincel | CC BY 4.0 |
| `pepper-carrot-zh-ep19` | Pepper&Carrot ep. 19 | zh-Hans → pt-BR | chinês simplificado, símbolos (♪) no texto | CC BY 4.0 |
| `pepper-carrot-es-ep24` | Pepper&Carrot ep. 24 | es → pt-BR | onomatopeias, texto em livros, texto denso | CC BY 4.0 |
| `golden-age-pd-en` | Fiction House (Jungle/Planet/Fight/Wings Comics, anos 1940) | en → pt-BR | legendas em caixa, letreiramento manual em caixa alta, splash page | domínio público (PD US not renewed) |
| `ubunchu-ja-ch01` | Ubunchu! cap. 1 | ja → pt-BR | mangá P&B, texto vertical, onomatopeias, telas/UI na arte, notas fora do quadro | CC BY-NC-SA 4.0 |
| `pepper-carrot-silent-ep15` | Pepper&Carrot ep. 15 (páginas mudas) | ja → pt-BR | **controle negativo**: sem texto, a saída deve ser idêntica ao original | CC BY 4.0 |

Atribuições: Pepper&Carrot — David Revoy, www.peppercarrot.com (traduções pela comunidade
Pepper&Carrot). Ubunchu! — Hiroshi Seo (archive.org/details/ubuntu-ja-png); NC-SA: uso não comercial, derivados
sob a mesma licença. Golden Age — Fiction House, via Wikimedia Commons (miniaturas de 960 px).

Para incluir um capítulo: adicione-o em `corpus.json` (licença verificável, `sourceLanguage`/
`targetLanguage` habilitados no gateway, `scenarios` do catálogo, opcionalmente `scenarios` por página)
e rode o fetch.

## Rodar o pipeline

1. Gateway local real: `dev-api.sh`, `dev-worker.sh` e `dev-dispatcher.sh` em
   `api/apps/translation-gateway/scripts/local/` (cada página chama OCR/tradução pagos).
2. `pnpm --filter gateway-tester dev` → http://localhost:5175.
3. No painel **🧪 Pipeline de validação**, marque os capítulos e clique **▶ Rodar pipeline**.
   O painel cria sua própria instalação/sessão anônima (renova a sessão em 401).

Cada execução grava **um lote** em `corpus/runs/<data>-<sufixo>/`:

```
report.json                         totais, tempo, status do gateway, qualidade e erro por página
index.html                          galeria original × traduzido (abre pelo dev server ou direto do disco)
<capítulo>/<página>.translated.webp imagem renderizada
<capítulo>/<página>.manifest.json   manifesto do resultado (OCR, tradução, regiões)
```

### Ver os resultados

Tela **📖 Resultados** (botão no painel, ou `http://<host>:5175/#/resultados`): lista as obras/capítulos
do lote mais recente (com seletor de lotes anteriores). Cada capítulo abre o leitor
(`#/resultados/<lote>/<capítulo>`) com os botões **Original** e **Tradução**, que trocam todas as
páginas no lugar — dá para alternar no mesmo ponto da página e procurar regressões. O dev server
escuta em todas as interfaces (`vite --host`), então a tela abre no celular pela rede local ou Tailscale
enquanto o tester estiver rodando nesta máquina.

Uma página que falha é registrada e o lote continua; **Parar** encerra sem enviar novas páginas e ainda
grava o relatório. Os endpoints `/__corpus/*` existem só no dev server do Vite (`vite/corpusPlugin.ts`).

Limitação: a direção de leitura do agrupamento (`GATEWAY_LAYOUT_DIRECTION`, `rtl` no `dev-worker.sh`)
é global ao worker, não por job — capítulos ocidentais (ltr) rodam com a ordem de mangá.
