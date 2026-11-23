# Disponibilização privada — plano incremental da TASK-006

## Escopo e sequência

Preparar primeiro contratos internos e adapter de assinatura; integrar depois
projeção owner-scoped, consulta HTTP/OpenAPI e parser mobile de forma conjunta.
A preparação isolada não expõe URL no `/v1`, não abre a 021 e não habilita upload.
Nenhuma credencial, chamada Google ou recurso cloud será usado na validação local.

## Banco escolhido

PostgreSQL para identidade/estado/metadados; bucket privado para arquivos.
Reutilizar jobs e etapas V1–V6, sem conteúdo textual no banco.

## Modelo BCNF, integridade e índices

`job_id` determina os dados do job; `(job_id, stage)` determina os artefatos,
hashes e conclusão da etapa. São chaves existentes. Preservar FK cascade,
unicidades e CHECKs. MIME WebP e dimensões vêm do contrato/job; tamanho da imagem
já está na V6. Tamanho do manifesto é consultado no storage, não duplicado em
coluna. Consulta futura por instalação+referência usará unicidade de job e PK
da etapa; nenhum índice redundante, contador ou cache.

## Migration e implementação coordenada

Nenhuma V7. Adicionar porta específica sem mudar ObjectStoragePort nem fakes do
worker. Domínio sem Spring/Google, coleções imutáveis e representações redigidas.
Adapter confere metadados do objeto com hash esperado e tamanho/limite; gera
somente GET V4 HTTPS path-style em storage.googleapis.com, vinculado à geração
observada e chave privada persistida. Não recebe URL, bucket ou conta do usuário.

Prazo de URL: no máximo cinco minutos e nunca depois do deadline do resultado.
Conferir o prazo efetivamente assinado, não presumir que o relógio do SDK é igual
ao do caso de uso. HEAD/assinatura fora de transação. Metadata SHA-256 não prova
bytes baixados: a 021 deverá verificar os bytes antes do commit local.

Somente modo explícito gcs, storage gcs e conta de assinatura válida permitem
preparar client/ADC. Default disabled não inicializa client nem credencial e
não produz URL local fictícia. Impersonação via signBlob, sem chave privada
gerada/salva. Configuração/IAM operacional e exposição HTTP serão parcelas
posteriores; a preparação não declara produção pronta.

## Segurança e verificação

Objeto ausente, metadado/hash divergente, generation ausente, MIME/tamanho
inválido, prazo vencido e falha de signer retornam storage-unavailable sanitizado,
sem causa, chave ou URL. Não há retry explícito; client de leitura usa no máximo
uma tentativa. Assinatura não é OCR/tradução e não repete providers do pipeline.

URLs são credenciais bearer temporárias; após emissão não há promessa de
revogação instantânea pelo ACK. Deleção durável e expiração limitam acesso.
Consulta futura revalidará ownership/READY/TTL após assinatura antes de responder.

Testes sintéticos: validação, metadados falsos, relógios divergentes, deadline,
assinatura criptográfica real local com SDK e signer efêmero de testes, geração
fixada, GET/host/path, erros sanitizados e disabled sem ADC/rede. Não usar
capturas privadas. Gates leves/completos, Docker, web/mobile, SDD e diff.

Referências oficiais: [GET V4 Java](https://docs.cloud.google.com/storage/docs/samples/storage-generate-signed-url-v4),
[credenciais de impersonação](https://docs.cloud.google.com/java/docs/reference/google-auth-library/latest/com.google.auth.oauth2.ImpersonatedCredentials)
e [segurança das URLs assinadas](https://docs.cloud.google.com/storage/docs/access-control/signed-urls).
SDKs usados são os já fixados no BOM; não atualizar/instalar dependências.
