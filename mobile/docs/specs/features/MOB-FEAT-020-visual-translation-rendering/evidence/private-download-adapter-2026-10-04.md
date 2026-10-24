# Evidência parcial — assinatura privada, 2026-10-04

Parcela da TASK-006/AC-005. Contratos internos, porta separada e adapter GCS,
sem chamador HTTP, alterações mobile, migrations, Terraform ou provider real.
020 in-progress/open; 021 approved/blocked; TASK-006 permanece aberta.

## Plano anterior e inspeção

[Plano](../../../../../../api/apps/translation-gateway/docs/private-result-downloads.md):
reutilizar metadados BCNF V1–V6, sem duplicar tamanho de manifesto em coluna;
consulta futura owner-scoped usará PKs/uniques existentes. Nenhuma migration,
índice/cache/tabela/texto no PostgreSQL. ObjectStoragePort/worker não mudam.

PrivateDownloadRequest exige chave privada de rendering, tipo, hash e deadline;
imagem exige tamanho esperado. Manifesto permite tamanho observado no storage,
limitado a 4 MiB; imagem limitada a 64 MiB. Não recebe URL/bucket/conta da task.
PrivateDownload é imutável, restringe HTTPS/host/port/fragment/userinfo e limites.
Ambos têm toString redigido; falhas usam storage-unavailable sem causa.

GoogleCloudPrivateDownloadAdapter consulta somente metadados e assina GET V4,
path-style, bucket configurado e generation observada. Revalida identidade do
objeto, MIME, hash declarado, tamanho e geração; não lê mídia. URL tem no máximo
300 segundos e não passa do deadline. Prazo efetivo vem do X-Goog-Date/Expires
assinado, conferido também depois da operação. Relógio divergente ou resposta
malformada impede retorno. Hash de metadata não é prova dos bytes baixados.

Factory usa ADC/impersonação apenas no opt-in explícito gcs, com conta do mesmo
projeto; não gera/salva chave. Storage tem maxAttempts=1. Não há retry explícito
de assinatura; isso não implica eliminar mecanismos internos de autenticação
do SDK nem aprovar deadline operacional. Modo disabled não usa client/ADC;
perfil worker não inicializa esta fronteira. Config inválida falha antes do ADC.

URLs bearer não têm revogação instantânea prometida após ACK. A integração
posterior revalidará owner/READY/TTL depois de assinar e alinhará HTTP/OpenAPI/
parser estrito. Nenhum READY com URL pública/fictícia é exposto nesta parcela.

## Testes e limitações

48 casos novos (15 domínio, 26 adapter, sete configuração), todos sintéticos:

- SDK Storage real gera assinatura com chave RSA efêmera só em memória;
  verificação criptográfica e hash do canonical request comprovam GET, caminho,
  query assinada, generation e deadline. Nenhuma chave é escrita em disco.
- Ausência/adulteração de MIME/hash/tamanho/generation/identidade bloqueia
  assinatura. Manifesto excessivo falha sem truncamento.
- Host/path/generation/algoritmo/date/signature/fragment/query duplicada
  adulterados são rejeitados. Expiração durante HEAD impede assinatura;
  assinatura que ampliaria o deadline é recusada.
- Erros de storage/signer sanitizados, sem segunda invocação do SDK.
- Config disabled intercepta GoogleCredentials estático e comprova zero ADC;
  worker não cria a porta. Factory fake valida opt-in sem acesso Google.

Red de compilação por tipos/config ausentes; depois fixtures corrigidas por
stubbing aninhado e varargs expandidos do Mockito. Asserções funcionais não
foram removidas. Testes focalizados passaram. Testes não provam IAM real, bytes
baixados, integração HTTP ou qualidade visual. Não há captura privada utilizada.

## Fotografia técnica e gates

255 arquivos técnicos do gateway, SHA-256
`454f73d6fbfda7ce45ae23bf345aaa53a029304377bba703d1b9b9ae06e9bf53`.
Algoritmo reproduzível anterior preservado: paths relativos ordenados em
src/scripts/openapi, pom.xml e Terraform tf/tfvars.example; path+NUL+bytes+NUL.
Docs/build/dados privados excluídos. Checksum mobile é governança, não Java.

```bash
cd api
./mvnw -o -pl apps/translation-gateway -am test \
  -Dtest=PrivateDownloadTest,GoogleCloudPrivateDownloadAdapterTest,PrivateDownloadConfigurationTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

Gates concluídos: Maven global offline/Docker com opt-in do codec já preparado
exit 0; suíte leve do gateway exit 0; testes Node 85 aprovados/um opt-in de fonte
ignorado; web tsc -b exit 0. pnpm check integral exit 0: 116 suítes/859 testes,
30 performance, 24 SDD e seis FSD, type-check/lint/formato/links aprovados.
Os XMLs Java são sobrescritos pela suíte leve posterior: não usar essa contagem
mista para afirmar volume de testes da execução global; o exit 0 e os 48 casos
focalizados concluídos são as provas registradas. Nativos desabilitados na
suíte leve não equivalem a falha. Nenhum teste foi removido.

Nenhuma dependência reinstalada/atualizada; defaults permanecem desabilitados.
Formatação direcionada e git diff --check passaram. Rebase mecânico dos headers
não renova conclusões históricas de outras features. SDD/links revalidados após
estabilização. Pendências: exposição/metadados owner-scoped, retenção terminal
integral, distribuição do codec, limites globais, profiling e revisão visual.
