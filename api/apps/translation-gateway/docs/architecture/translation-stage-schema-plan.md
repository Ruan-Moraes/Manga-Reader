# Plano de dados — etapa de tradução (MOB-FEAT-019)

## Banco escolhido

PostgreSQL mantém somente estado, referência privada e hash da etapa; o bucket
privado mantém o manifesto com texto. Não há conteúdo OCR/traduzido no banco.

## Modelo BCNF

Reutilizar `processing_jobs` e `processing_job_stages`. Em
`processing_job_stages`, `(job_id, stage)` é a chave candidata e determina
`status`, timestamps, erro, chave e hash do artefato. A tradução ocupa a linha
`stage='TRANSLATING'`; não há tabela de regiões nem duplicação de idioma, pois o
par já pertence ao job. Nenhum atributo novo ou desnormalização é necessário.

## Integridade e índices

A PK composta e a FK `job_id → processing_jobs(id) ON DELETE CASCADE` já
garantem unicidade e ciclo de vida. A V4 acrescenta somente um CHECK: sucesso
de `TRANSLATING` exige `output_object_key` e `output_sha256`; o CHECK de par e
formato SHA-256 da V2 continua aplicável. `job_ref` tem UNIQUE para consulta, e
a PK composta cobre leitura/atualização da etapa; não criar índice redundante.

## Derivados e migration

Sem contador, cache ou materialização de texto. Flyway V4 é aditiva e
forward-only, sem backfill porque nenhum job de tradução foi executado em
produção. Porta SQL, serviço transacional, cleanup e testes PostgreSQL devem
evoluir juntos. A cadeia V1–V4 precisa de PostgreSQL 17; até o Docker estar
acessível, sua execução permanece pendente e não é apresentada como validada.
