# Persistência do renderer — plano anterior ao código

Parcela da TASK-005/006 da MOB-FEAT-020. A spec permanece `in-progress/open`;
este incremento não habilita runtime, uploads ou provider. A 021 continua
bloqueada. O adapter de arquivos já entregue será integrado sobre esta fronteira.

## Banco escolhido

PostgreSQL mantém estados, locks e metadados; o bucket privado mantém imagem e
manifestos. Texto e geometria não entram no banco. Não usar MongoDB, jsonb,
cache ou segunda fonte de estado.

## Modelo BCNF

Reutilizar `processing_job_stages`: `(job_id, stage)` determina estado,
timestamps, erro e referências dos artefatos. A chave candidata existente
continua suficiente. `output_object_key/output_sha256` de `RENDERING` representam
o manifesto final; a imagem final usa três colunas adicionais opcionais:

- `rendered_image_object_key VARCHAR(512)`;
- `rendered_image_sha256 CHAR(64)`;
- `rendered_image_byte_size BIGINT`.

Não criar tabela filha com o mesmo determinante. MIME é sempre `image/webp`;
dimensões são as do original, pois o renderer não redimensiona a página. Ambos
são derivados do contrato e do job, não copiados em outras colunas. A chave do
objeto não é identidade global reutilizável: cada execução gera objetos privados
create-only. O hash tampouco é chave candidata (duas páginas podem ter bytes iguais).

## Integridade

Preservar PK e FK `job_id → processing_jobs(id) ON DELETE CASCADE` e CHECKs
existentes. As três colunas são todas nulas ou todas preenchidas; chave não
vazia, hash hexadecimal minúsculo e bytes entre 1 e 67.108.864 (teto defensivo
da política atual). Somente `RENDERING/SUCCEEDED` pode tê-las preenchidas.
Essa combinação exige também chave/hash não vazios do manifesto. Imagem e
manifesto usam chaves diferentes; o repository recusa também referências iguais
ao original/OCR/tradução do job. Sem timestamps redundantes: usar os da etapa.

## Índices e derivados

Nenhum índice novo: PK `(job_id, stage)` cobre consulta, joins e FK; jobRef já
tem UNIQUE. Claims e commits bloqueiam o job pela chave. Cleanup limitado usa
os jobs não terminais e a PK das etapas; o índice parcial não terminal existente
evita adicionar um índice sobre a mesma população sem evidência. Não há
contador ou cache. Inspecionar EXPLAIN no PostgreSQL 17 e manter profiling de
produção como verificação separada.

## Migration e implementação coordenada

V6 aditiva `V6__rendered_stage_artifacts.sql`, sem modificar V1–V5. Acrescentar
porta de persistência e wrapper transacional da aplicação, adapter JDBC e
testes PostgreSQL. Ajustar a fixture histórica de ACK que tinha um único objeto
`RENDERING`: agora ela deve representar WebP e manifesto distintos. Incluir a
nova referência de imagem no claim de limpeza durável do ACK.

O runtime anterior não produzia etapas `RENDERING/SUCCEEDED`. Se um banco tiver
linhas manuais desse estado sem ambos os artefatos, a migration deve falhar;
não inventar hash, objeto ou backfill para validar um resultado inexistente.
O teste de upgrade usa somente estados válidos da implementação V5.

Reserva bloqueia o job e insere `RENDERING/RUNNING` uma vez. Validação anterior
à reserva só falha uma etapa ainda não possuída. Uma reentrega em cancelamento
nunca encerra OCR, tradução ou renderização ativa de outra entrega. Commit
atômico grava os dois vínculos e promove `READY`; cancelamento vence antes do
commit e não grava artefatos. Rollback preserva `RUNNING` sem referências.
Falha de quem possui a etapa e expiração de RUNNING mantêm os mesmos locks.
Falhas internas usam o código público existente `internal-error` nesta
fronteira; não ampliar enums HTTP/mobile silenciosamente.

Consulta de confirmação perdida conserva referências mesmo após ACK/expiração:
os dois pares chave/hash, não apenas o status intermediário, provarão o commit.
Upload, inferência e remoção ficam fora das transações; o futuro use case é dono
dos arquivos/objetos e só remove artefatos comprovadamente não referenciados.
Banco indisponível não autoriza apagar objetos de commit ambíguo; o failsafe
de uma hora continua obrigatório.

Correção posterior de 2026-10-09 UTC: snapshot anterior à conclusão de uma
transação pendente não prova rollback. Antes de apagar uploads sem referência,
os três workers resolvem a falha condicional sob o lock existente e releem os
vínculos. Commit vencedor preserva arquivos; rollback vencedor permite descarte;
resolução desconhecida preserva órfãos para o failsafe. Ver a
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/commit-resolution-2026-10-09.md).
V1–V7, índices, formato dos manifestos e códigos públicos permanecem iguais.

## Verificação e limites desta parcela

Testes primeiro: cadeia V1–V6, CHECKs/FK/cascade, reserva concorrente única,
rollback, sucesso atômico, cancelamento antes/durante execução, falhas anteriores
à reserva, etapas abandonadas, isolamento de jobs e ACK incluindo ambos os
artefatos. Testar também que reentregas OCR/tradução não cancelam rendering
ativo. Gates offline do módulo/global, web e mobile serão registrados na review.

Não existe ainda chamador de produção do renderer: retenção do original no
fluxo OCR/tradução, use case de arquivos/uploads, configuração, consulta com
URLs assinadas e validação integral permanecem nas parcelas seguintes da 020.
Não anunciar `READY` público funcional somente pelo repository. Nenhum novo
endpoint, dependência, download, credencial, migration compartilhada ou deploy.
