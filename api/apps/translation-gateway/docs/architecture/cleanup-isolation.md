# Isolamento do purge por objeto — plano antes do código

Parcela de 020/TASK-006 e 017/TASK-017. Um locator inválido ou falha de delete
não pode bloquear os outros objetos vencidos. A execução incompleta deve
continuar falhando com código sanitizado, nunca ser reconhecida como sucesso.
Sem provider, cloud, credenciais, mídia real ou mudança de prazos/qualidade.

## Banco/modelo/integridade

PostgreSQL para estados e intenções existentes; bucket privado para bytes.
Nenhuma tabela/coluna/status/FK nova. BCNF, PKs, cascades e CHECKs V1–V9
permanecem. Nenhuma migration, índice, cache ou contador persistido novo.
Não alterar leases, ACK, disponibilidade, reserva ou transições do job.

## Algoritmo e limites

- Varredura segue somente a namespace privada de sua fase, com root validado
  e sem seguir symlink. GCS confere prefixo/bucket antes de autorizar delete.
- Tratar erro de metadados, locator ou delete por objeto e continuar o que
  ainda for enumerável. Ao final, qualquer erro propaga storage-unavailable
  sem chave, caminho, resposta bruta ou causa. Nenhum retry automático aqui.
- Falha da enumeração não permite presumir inventário completo: propagar erro;
  objetos já removidos ficam removidos, e uma futura rodada reconcilia o resto.
- Contar somente deleções confirmadas quando toda a rodada concluir. Não
  devolver contagem parcial como sucesso se houve falha.
- Iterar os caminhos locais sem materializar todos os objetos numa lista.
  Isso limita a estrutura auxiliar; não é alegação de benchmark/memória medida.

## Provas

Testes antes do fix com objetos ruins seguidos por válidos: original, resultado
e failsafe por idade. GCS mockado e arquivos locais sintéticos, erro sanitizado,
prefixo/bucket, fonte reutilizável/symlinks preservados, boundary, parcial e
rodada seguinte. Gates offline de módulo/global, web/mobile/SDD/links/formato/diff.
Nenhuma imagem privada ou chamada Google necessária. SLA cloud permanece pendente.
