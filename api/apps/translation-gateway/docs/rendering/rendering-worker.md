# Worker do renderer — plano anterior ao código

Parcela de TASK-005/006 da MOB-FEAT-020. Execução local/offline; nenhum
provider, credencial, recurso cloud ou upload público será ativado.

## Persistência — database-design

- Banco: PostgreSQL para estados e locks, storage privado para arquivos.
- BCNF: reutilizar jobs e `(job_id, stage)` da V6; não duplicar texto ou geometria.
- Integridade: preservar FKs cascade, CHECKs, reserva única e commit de imagem,
  manifesto e READY. Uma falha anterior à reserva não encerra outra execução.
- Índices: consultas por jobRef e PK existentes; nenhuma nova listagem ou índice.
- Derivados: nenhum contador/cache. Referências são a prova de commit, inclusive
  depois de ACK; estado intermediário não é prova suficiente.
- Migration: nenhuma V7. Coordenar aplicação, configuração, controller e testes
  sobre V1–V6. Uma consulta OCR de referências poderá usar a PK existente para
  proteger confirmação perdida ao conservar o original para rendering.

## Execução e segurança

`gateway.rendering.mode=disabled|local`, default disabled. Somente worker/local
constrói o adapter: caminhos absolutos, hashes e versão dos tools já preparados,
diretório temporário existente e fontes empacotadas verificadas. Não usar PATH,
instalar tools, buscar ADC ou baixar fontes. Configuração inválida falha fechada.

Antes da reserva, ler manifestos limitados e verificar hashes, job, par,
dimensões, IDs e ordem; revalidar original em cópia temporária limitada contra
os metadados do job/capabilities. Recusar original com uma hora ou mais desde
created_at. Reservar somente depois de validar; nenhuma transação engloba I/O.

Uma reserva executa RenderPort uma vez. Revalidar arquivo WebP final e manifesto
contra a requisição, sem alterar texto/geometry. Upload privado create-only
com duas chaves aleatórias. Gravar ambas na transação existente; só então READY.
Falha/cancelamento remove apenas outputs da execução comprovadamente não
referenciados. Commit ambíguo exige consultar os dois vínculos exatos; banco
indisponível conserva objetos incertos para TTL. Reentrega não renderiza novamente.

Original remoto permanece depois do OCR bem-sucedido, até render/terminal ou
failsafe de uma hora. Nunca excluir a imagem reutilizável/local do usuário.
Arquivos de trabalho são apagados depois da chamada; saída fora do diretório
autorizado, symlink ou alias do input não será aceita nem removida arbitrariamente.
Código público de falha permanece internal-error, sem texto/path/causa nos logs.

## Verificação e parcelas seguintes

Testes primeiro: default sem I/O; bindings/hashes/limites; claim único; falhas de
render/storage/commit; confirmação perdida em READY e RESULT_EXPIRED; DB incerto;
cancelamento; isolamento e preservação dos arquivos. Integração PostgreSQL 17
com codec real local opt-in, sem Google, incluindo controller com filtros ativos.

URLs assinadas, distribuição de codec para produção, deadline global/profiling,
limpeza terminal integral desde OCR/tradução e qualidade visual permanecem
parcelas posteriores; não fechar TASK-005/006 por testes parciais. Defaults off.
