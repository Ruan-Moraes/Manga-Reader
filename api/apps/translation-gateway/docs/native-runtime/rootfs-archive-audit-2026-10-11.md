# Auditoria física do rootfs e filtro sem reescrita — 2026-10-11

Continuação do [empacotamento experimental](single-jre-packaging-2026-10-11.md).
020 `in-progress/open`; 021 `approved/blocked`. Somente JavaScript/Node e arquivos
locais. Sem instalações, extração no host, credenciais, imagens novas no Docker,
cloud, chamada paga, publicação ou troca do runtime padrão.

## Finding real: nomes Unicode alterados

A leitura direta dos headers dos quatro archives históricos encontrou duas
entradas retidas com nomes diferentes no resultado do filtro anterior:

- `etc/ssl/certs/NetLock_Arany_=Class_Gold=_Főtanúsítvány.pem`;
- `usr/share/ca-certificates/mozilla/NetLock_Arany_=Class_Gold=_Főtanúsítvány.crt`.

No original, os nomes possuem caracteres compostos; no resultado anterior, a
sequência correspondente foi decomposta. As strings são canonicamente
equivalentes em Unicode, mas **não são os mesmos nomes em bytes no Linux**.
Não se aceitou normalização como alias nem exceção para esses certificados.

Também mudaram os destinos dos symlinks desse `.pem` e de
`etc/ssl/certs/988a38cb.0`. A comparação completa registrou o mesmo conjunto
de três entradas afetadas nos dois alvos: duas mudanças de nome e duas de
destino de link. Os payloads retidos não tiveram outro delta observado nesta
comparação; isso não constitui teste de TLS ou aprovação do filesystem vivo.

As listas/mtree produzidas no macOS também exibiam os nomes decompostos ao ler
o original. Por isso, comparar esses dois registros não demonstrava preservação
dos nomes físicos. O decoder octal corrigido anteriormente continua correto,
mas esse fix isolado não eliminava a transformação feita pela ferramenta de
arquivo. Não houve nova avaliação de OCR/tradução ou conclusão sobre impacto
operacional dos certificados.

A auditoria física reprova os dois archives anteriores. Os recibos ARM64
`b6875732d9729b7ce702cd8987e3e1f1356b964aee858cdfeb57256a0d872e41`
e x86_64 `d188437c2031fdea34b2f33259cae71155bc5540d67443fea291b187f8466453`
agora são rejeitados pelo preparador opt-in. Arquivos, imagens e logs antigos
permanecem preservados; as provas funcionais anteriores não são apagadas nem
convertidas em admissão da distribuição.

## Implementação e proteção

[rootfs-archive-audit.mjs](../scripts/rootfs-archive-audit.mjs) lê os próprios
archives, sem extrair ou executar suas entradas. Confere SHA-256 integral,
checksums USTAR, tipos, tamanhos/padding, UTF-8 estrito, PAX e fim do archive.
Rejeita duplicatas, traversal, hardlinks sem destino regular/cíclicos, extensions
desconhecidas, truncamento, padding/trailer não zero e alterações de entradas
que deveriam permanecer. Além do conteúdo, compara mode/UID/GID, timestamps,
links, nomes de owner/group, devices e hashes dos valores PAX adicionais.

O formato suportado é USTAR POSIX com PAX local `x`. GNU longname/sparse,
numéricos base-256, PAX global `g` e charset binário permanecem fora desse
subset e falham, em vez de serem interpretados por aproximação. O layout dos
headers está documentado no [GNU tar](https://www.gnu.org/software/tar/manual/html_node/Standard.html).
Comprimentos PAX são contados em bytes, incluindo a própria linha; valores de
xattr podem ser binários, conforme o
[writer libarchive 3.7.4](https://raw.githubusercontent.com/libarchive/libarchive/v3.7.4/libarchive/archive_write_set_format_pax.c).
Não se copia nem compila código C desses projetos.

Limites do tooling: archive 2 GiB, 10.000 entradas, PAX individual/preamble
1 MiB e metadata acumulada 16 MiB. São limites do arquivo de distribuição,
não mudanças nos limites de mídia da API. Payloads são lidos em chunks de
64 KiB; não há um buffer com o archive inteiro em memória.

O comando `filter` usa a política de exclusões já existente, mas copia os bytes
originais de headers/PAX/payload/padding das entradas retidas. Não redimensiona,
normaliza nomes ou reconstrói headers. A saída é exclusiva e conferida novamente
pelo auditor. Falha deixa evidência parcial privada, sem recibo de sucesso,
sem sobrescrita/retomada ou limpeza abrangente. Nenhum arquivo fonte é removido.

O [verificador de recibos](../scripts/single-jre-proof.mjs) agora exige também
essa auditoria física, não apenas capturas e hashes de arquivos. Retorna
`captured-records-and-archive-headers-content`; `baseSecurityApproved=false`,
`baseOperationalApproved=false` e a pendência de metadata do filesystem ficam.
O preparador Temurin continua com o contrato anterior, sem mudança de default.

## Execução sobre os archives existentes

| Alvo   | Mantidas / removidas | Bytes do novo tar | SHA-256 do tar filtrado sem reescrita                              |
| ------ | -------------------: | ----------------: | ------------------------------------------------------------------ |
| ARM64  |          5.823 / 375 |       395.836.928 | `f15b8287d1605c35e00f197e5fd1ec8206a0697e8cd37a5627c7b655296762bf` |
| x86_64 |          5.832 / 376 |       371.041.792 | `025ad17cc4d990933f5de34d114439779fb3a4216c4f3c5921d136c0b0db922c` |

Ambas as novas saídas passaram na comparação física contra seus originais:
mesmos headers efetivos/conteúdo das entradas mantidas, três headers PAX e
dois hardlinks em cada alvo. Mesmos tamanhos do filtro anterior não implicavam
mesmos bytes; os novos hashes são distintos. Nenhuma imagem foi importada ou
worker reconstruído nesta parcela, e nenhuma matriz antiga foi atribuída aos
novos archives. Ainda não existem recibos de base vinculados a esses novos hashes.

Os originais têm zero entradas PAX de xattr/ACL/capability, assim como os
archives filtrados. **Isso prova apenas ausência dessas informações no tar**,
não ausência no filesystem anterior ao export. A verificação direta no Linux,
incluindo atributos que o export possa ter omitido, continua pendente.

## Repetição local

Substituir placeholders por caminhos absolutos/canônicos e pins verificados.
O diretório-pai deve existir e ser privado; a saída deve ser nova. Inputs são
readonly. Nenhum comando baixa dependências ou arquivos automaticamente.

```bash
node /repo/api/apps/translation-gateway/scripts/rootfs-archive-audit.mjs filter \
  --source /privado/source-rootfs.tar \
  --source-sha256 <sha256-original> \
  --architecture arm64 \
  --destination /privado/nova-filtragem

node /repo/api/apps/translation-gateway/scripts/rootfs-archive-audit.mjs \
  --before /privado/source-rootfs.tar \
  --before-sha256 <sha256-original> \
  --after /privado/nova-filtragem/rootfs.tar \
  --after-sha256 <sha256-filtrado> \
  --architecture arm64 \
  --destination /privado/nova-auditoria
```

Para x86_64 usar `amd64`. `filter.json` contém resultado e audit; `audit.json`
é a conferência independente. Saída CLI é sanitizada, sem payloads, caminhos
pessoais ou valores de atributos. Erros internos são sanitizados; diretórios
parciais requerem inspeção explícita, nunca reuso automático.

## Verificação e próximo passo

As regressões foram escritas antes dos fixes: nomes NFC/NFD distintos, conteúdo
físico adulterado oculto por capturas idênticas, xattrs binários/ACLs, headers,
hardlinks, EOF, isolamento e reserva concorrente. A ausência da implementação e
a aceitação indevida do payload adulterado foram reproduzidas antes da correção.

Gates desta execução:

- 11 testes de audit/filter e a regressão adicional do recibo, incluindo reserva
  concorrente, hash incorreto sem recibo de sucesso e original preservado;
- tooling Node completo: 139 aprovados, um skip opt-in, zero falhas;
- Maven global offline com Docker: sete módulos `SUCCESS`, 2.741 testes,
  zero falhas/erros, 103 skips opt-in, 3min12s;
- `tsc -b` web e `pnpm check` mobile integral aprovados, 116 suítes/892 testes,
  incluindo SDD, links, lint/FSD, type-check e formatação; sem reinstalação;
- CLI real sem ambiente de credenciais conferiu os dois novos archives;
  Prettier direcionado, links documentais e diff do gateway aprovados;
- diff global permanece vermelho pelo baseline externo
  `web/landing-page/src/shared/component/PlatformBadge.tsx:44`, preservado.

Snapshot técnico corrente: **410 arquivos**, SHA-256
`730309acb68311a0eed83f01704740d5b7ceeaf0568a0d65906ae9d545867c94`.
Mesmo escopo/algoritmo do registro anterior: `src/`, `scripts/`, `openapi/`,
`pom.xml` e `.tf`/`.tfvars.example` diretos de `infra/terraform/`; caminhos
relativos ordenados + NUL + bytes completos + NUL. Snapshots anteriores de
402/407 arquivos permanecem históricos, não são renovados retroativamente.
Nenhum arquivo mobile foi alterado; seu checksum não representa esse tooling.

Próximo: conferir atributos diretamente nos filesystems Linux; depois preparar
bases/imagens com esses novos archives e suas próprias provas. Segurança
residual, memória operacional e revisão de qualidade continuam abertas. Não
há promoção da 020, abertura da 021 ou ativação operacional.
