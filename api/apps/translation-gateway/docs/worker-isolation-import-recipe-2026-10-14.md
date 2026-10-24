# Entrega privada: cotação e receita — 2026-10-14

**Preparação local concluída; nenhuma ação cloud executada ou autorizada aqui.**
Continua a [consulta de IAM](worker-isolation-import-iam-2026-10-14.md).
020 `in-progress/open`, 021 bloqueada; providers/uploads/defaults preservados.
Não é receita de deploy, execução de VM ou aprovação de segurança.

## 1. Divergência de preços resolvida

Às **05:53 de Brasília**, duas páginas públicas oficiais foram consultadas por
HTTPS, sem cookies, login, ADC ou SDK. Dados regionais embutidos foram lidos
com `JSON.parse`, sem executar scripts da página. Seleção exige exatamente
`Sao Paulo (southamerica-east1)`, moeda/unidade e uma única linha correspondente.
Não confundir tabela de disco zonal com a opção de disco regional replicado.

O seletor da consulta anterior continuava exibindo Iowa; a nova leitura usa
os dados publicados para São Paulo, não os valores visuais desatualizados.
O [registro anterior](worker-isolation-import-preflight-2026-10-14.md) permanece
como histórico da tentativa inconclusiva, agora resolvida por esta evidência.

| Item em São Paulo |   USD/GiB-h | USD/GiB-mês |
| ----------------- | ----------: | ----------: |
| pd-standard zonal | 0,000082192 |        0,06 |
| Custom image      |  0,00010274 |       0,075 |
| Storage Standard  | 0,000047945 |       0,035 |

Fontes: [discos/imagens](https://cloud.google.com/compute/disks-image-pricing)
e [Storage](https://cloud.google.com/storage/pricing). Tarifas públicas de lista,
não preço específico da conta, créditos, moeda BRL, impostos ou teto de gasto.

Exemplos de armazenamento, não orçamento total:

- Disco auxiliar de 10 GiB: USD 0,00082192/h; 24 h: USD 0,01972608.
- Imagem com **1 GiB faturável hipotético**: USD 0,00246576 por 24 h.
  Tamanho faturável real depende da imagem criada; não igualar ao gzip local.
- Archive de 62.359.506 bytes: aproximadamente USD 0,00006683 por 24 h;
  mais USD 0,00046779 para sete dias soft-deleted.

Storage Standard regional/namespace plano: classe A USD 0,005/1.000 operações;
classe B USD 0,0004/1.000. Uma leitura integral ao Mac, usando a primeira faixa
pública de saída para o Brasil de USD 0,12/GiB, acrescenta aproximadamente
USD 0,00696922. Exemplo com 24 h, sete dias soft-deleted, uma leitura, 20 operações
A e 40 B: **USD 0,00762**, arredondado a USD 0,008. Quantidades hipotéticas,
não cobrança observada, limite financeiro ou duração garantida. CLI pode fazer
operações adicionais; configurações faturáveis preexistentes da conta não foram
auditadas. Não presumir faixa gratuita. Fonte: mesma tabela Storage acima.

VM/boot disk, registry, DNS, logs e eventuais transferências de importação são
itens separados. **STOP não encerra cobrança de discos/imagens/objetos.**
As tarifas históricas de VM não foram redatadas como cotação atual completa.

## 2. Entrada local e evidência reproduzível

Pacote ignorado pelo Git: `import-pricing.ZDFp6x`, sem HTML integral, navegação de
conta ou arquivos de credencial. `pricing.json` guarda tabelas públicas selecionadas,
paths estruturais, URLs, bytes, horários e hashes; `verification.json` registra
conferência local. Não executa importação nem prova acesso ao bucket.

| Artefato                      | SHA-256                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| Recibo público `pricing.json` | `d03e86f9db7d9d8a4c2a3f938a5081da7a880c0823e565990fe54fad66b20a06` |
| Leitor JS `pricing.mjs`       | `4b09c1d3fc908f1fa73d60c14e9ba8d0192204288018749fbc10858170ea6135` |
| Testes `pricing.test.mjs`     | `b722f66d74ade56ef0d36532d409246ab6b62a404afd33cdd5aac87abfb7092d` |
| Archive de dados existente    | `f8b8009f1684e29050a5472c2dc3077e6177ef322c667000e532c8bc2dd6135c` |

Archive correto: `prepull-delivery.y8W1ma/data-disk/data-disk.tar.gz`, 62.359.506
bytes. A primeira conferência omitiu o diretório `data-disk` e recebeu ENOENT;
inventário local resolveu o caminho. Não houve divergência de conteúdo ou recriação.
Leitura streaming confirmou o hash, sem fazer cópia grande. O RAW ext4 de 1 GiB,
runtime, licença e launcher anteriores foram preservados.

Reprodução local dos testes, sem rede/credenciais:

```bash
node --test .local/worker-isolation/import-pricing.ZDFp6x/pricing.test.mjs
```

O leitor exige `--public`, usa apenas URLs oficiais fixas, recusa redirects,
limita cada página a 5 MB/30 s e grava o recibo create-only. Reexecutar sobre
um recibo existente não o sobrescreve; não usar execução repetida para redatar
fotografias históricas. Preparar diretório novo se uma cotação futura for necessária.

## 3. Receita em quatro parcelas, ainda não executadas

### A. Staging privado — próxima autorização proposta

Proposta limitada a **um bucket novo + um objeto**, no `toonlira-rm`:

1. Reservar uma rodada local exclusiva e nome específico de bucket; conferir
   ausência/identidade, sem usar bucket OCR/site ou recurso desconhecido.
2. Criar Standard em `southamerica-east1`, namespace plano, acesso uniforme,
   public access prevention `enforced`, versionamento desabilitado e soft delete
   explícito de **604800 segundos**. Sem website, Autoclass, retention lock,
   ACL pública, URL assinada, papel novo ou service account nova.
3. Conferir resposta, localização/proteções/IAM e permissões no **bucket alvo**.
   Falta de permissão interrompe a ação, não autoriza grant.
4. Enviar somente o archive acima, com nome exclusivo e `ifGenerationMatch=0`.
   Não enviar imagem de mangá, texto OCR, captura, token ou arquivo de performance.
5. Conferir geração/tamanho/checksums; uma leitura integral streaming, fixada
   na geração observada, confirma SHA-256 sem guardar nova cópia no Mac.
6. Registrar resultado e remover somente essa geração e o bucket criado,
   ainda na parcela autorizada. Sem wildcard/recursão/limpeza do projeto.
   Confirmar remoção lógica; registrar `hardDeleteTime` quando disponível.

Base dos campos: [bucket resource](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets),
[bucket insert](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/insert),
[object insert](https://docs.cloud.google.com/storage/docs/json_api/v1/objects/insert)
e [bucket delete](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/delete).
Não enviar `predefinedAcl` junto do acesso uniforme. Soft-deleted não significa
exclusão física imediata; preservar os sete dias, sem desabilitar a proteção
para obter cobrança menor. Identidades privadas ficam somente em memória.

Essa parcela testa upload privado e integridade, **não importação**. Retirar o
staging ao final implica upload próprio numa futura parcela B; não deixá-lo
permanentemente para evitar um segundo upload ou presumir autorização futura.

### B. Imagem de dados — autorização própria futura

Somente após A comprovada: preparar origem privada novamente, com geração
fixada e sem overwrite. Usar criação direta de custom image com RAW/TAR e
storage location explícita `southamerica-east1`, sem Cloud Build/helper VM.
Referências: [images create](https://docs.cloud.google.com/sdk/gcloud/reference/compute/images/create)
e [images.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/insert).

Registrar operação/ID e aguardar estado `READY` em prazo limitado. Inspecionar
local de armazenamento, tamanho e identidade antes de avançar. Aceitação deste
ext4 de dados sem partição continua **não comprovada**. Sem guest features de
boot, UEFI, fallback de importador, grant amplo ou troca de filesystem.
O agente Compute tem permissão declarada de leitura, mas principal efetivo e
acesso ao objeto ainda não foram comprovados. Falha vira finding, não grant.

### C. Disco auxiliar — autorização própria futura

Criar somente um pd-standard zonal de 10 GiB da imagem identificada. Fixar
zona/ID/source no recibo e verificar antes de preencher o attachment proposto
`READ_ONLY`, `boot=false`. Nenhuma VM criada nesta parcela; não anexar a VM
existente. Não comparar SHA integral do dispositivo expandido ao RAW de 1 GiB.
Filesystem/conteúdo/modes precisam da validação posterior de montagem.

### D. VM diagnóstica — permanece bloqueada

Segurança COS/JRE, mitigação DNS/TLS do pull, egress, boot/systemd/montagem,
orçamento completo e autorização operacional própria continuam abertos.
Bucket/imagem/disco aceitos não liberam Docker pull ou execução. Não criar
Cloud DNS/VPC/SA/registry/VM para contornar gates. Não promover 020/021.

## 4. Falhas, retirada e aceite

Toda parcela mutante exige alvo/rodada/hash explícitos e ledger local de
operações. Resultado ambíguo exige consulta do alvo antes de decidir retirada;
**não repetir create/upload/import automaticamente**. Não iniciar outra parcela
porque a anterior terminou. Colisão não autoriza reutilização ou exclusão.

Remoção só alcança IDs/gerações criados e registrados na própria autorização.
Se aparecer objeto/disco estranho, attachment ou drift de identidade, interromper
a remoção e relatar. Registrar falha de cleanup e custo persistente; não afirmar
«tudo removido» somente por STOP/timeout ou aceite HTTP de delete. Imagens/discos
de uma futura prova descartável também terão retirada explícita no seu escopo.

Nesta entrega: red antes do parser; seis testes novos e **72 testes Node locais
aprovados**, zero failures/skips. Cobrem JSON sem eval, região exata, unidades,
moeda, ausência/ambiguidade e regressões do isolamento. Dados de teste sintéticos,
não prova Google. Os 419 arquivos da fotografia técnica continuam com
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.

Sem instalação, ADC/credenciais, upload, grant, recurso cloud ou provider.
Sem cópia grande/limpeza/performance. Maven/web/mobile/SDD não reexecutados ou
redatados por esta preparação local/documental sem alteração de runtime/status.
Links, formatação e diff serão verificados separadamente; baseline global
alheio não será corrigido automaticamente.

Fechamento: 31 links relativos nos três documentos conferidos, Prettier dos
dois fontes locais/três documentos e whitespace/EOF aprovados. Diff-check
direcionado do gateway aprovado; global mantém
`web/landing-page/src/shared/component/PlatformBadge.tsx:44` (EOF alheio).
Mac reportava 27 GiB disponíveis. Nenhuma autorização cloud inferida do pedido
de continuação; próxima confirmação será somente da parcela A, não de B–D.

Após Ruan responder «Sim», a [prova da parcela A foi executada](worker-isolation-private-staging-2026-10-14.md):
bucket privado, upload/hash íntegros e retirada ativa confirmados. Erro local ao
ler corpo 204 foi resolvido por consulta, sem repetir delete do objeto; leitura
do bucket soft-deleted recebeu 403, sem grant. Retenção física não confirmada;
83 testes locais aprovados. A autorização não abrange importação/imagem/disco/VM.
