# Plano da prova integrada volátil — 2026-11-02

Esta prova deriva da arquitetura aprovada em
[processamento volátil](../../../../docs/volatile-processing-architecture.md).
Não autoriza ativação pública, chamadas pagas ou admissão de ambiente cloud.
A matriz nativa isolada não comprova o serviço combinado.

## Fronteira e identidade

- JAR e imagem fixados, sem classes de gravação de conteúdo do transporte anterior.
- Aplicação Spring de produção, perfil volatile, ingresso HTTP real e bearer
  anônimo emitido pelos use cases reais. HTTP é privado/local nesta prova;
  não comprova TLS público nem integração no aparelho.
- PostgreSQL real dedicado em rede Docker interna, sem imagem/texto nos dados.
- Os SDKs reais apontam exclusivamente a um servidor gRPC sintético em loopback,
  sem ADC ou conexão Google. Só factories de endpoint/credencial são substituídas.
- Configuração/probe ficam em classes de teste montadas readonly, separadas do
  JAR. Não montar a árvore inteira de testes: isso faria Spring descobrir os
  componentes históricos de gravação que foram retirados de produção.

## Limites e posse

Servidor e filha compartilham cgroup limitado a 8 GiB, swap zero, pids 64,
scratch tmpfs de 512 MiB e core dumps desabilitados. Pai/filha mantêm os limites
Linux e de JVM da candidata. Cliente da prova e PostgreSQL ficam fora do cgroup
do servidor, como aparelho e banco separados; não confundir essa separação com
medição de toda a VM. O teste registra identidade da imagem e métricas reais.

Admissão precede leitura/decode/providers; uma sessão pesada ocupa a instância.
O supervisor só libera posse depois do término confirmado da filha e de seus
writers. Cancelar o cliente não equivale a confirmar cancelamento do provider.
Não reduzir dimensões/qualidade nem ampliar limites para obter aprovação.

## Cenários previstos

1. Primeira página sintética máxima, bytes inline, OCR e tradução em uma chamada
   cada, renderer real e retorno binário verificado pelo cliente.
2. Sem sessão: rejeição antes de providers; outro proprietário: recibo ausente;
   proprietário: metadados mínimos no-store e nenhum conteúdo recuperável.
3. Replay da mesma chave: recusa sem outra chamada/quota; nova execução depende
   de nova chave e ação explícita na aplicação.
4. Falha sintética do provider e página válida seguinte para recuperação.
5. Sessão concorrente recusada, término da filha nativa possuída e página válida
   seguinte, com resultado tardio recusado e capacidade sem liberação antecipada.
6. Inspeção de scratch, tabelas e logs. Fontes/bibliotecas públicas de runtime e
   registros operacionais não são conteúdo do usuário; arquivos desconhecidos
   exigem diagnóstico, sem serem classificados automaticamente como inofensivos.

## Evidência e retirada

Guardar apenas recibos operacionais, métricas, hashes de artefatos e resultados
de asserções. Não exportar tokens, Authorization, URLs privadas ou corpo do
provider. Fixtures são sintéticos e autorizados; resultados continuam no cliente
de teste. Remover somente containers/rede desta rodada e conferir a retirada.

A prova é opt-in, falha fechada e não aceita skips como resultado. Os gates e a
revisão por critério continuam necessários, assim como qualquer admissão do
ambiente alvo. Nenhuma hipótese deste plano é apresentada como teste executado.

## Diagnóstico das primeiras execuções

A primeira tentativa parou no harness: rede Docker interna não publicou a porta
esperada pelo cliente host. O cliente foi movido para container separado na mesma
rede, preservando a medição independente do cgroup do servidor e sem publicar
portas ou permitir saída externa do serviço.

A segunda execução completou o fluxo, mas o log registrou `pthread_create`
`EAGAIN` em threads Gax. A seguinte falhou ao processar a página válida depois
da morte da filha. A execução funcional positiva não foi aceita como admissão
sob o teto de 64 PIDs. Os pools dos SDKs devem ficar explícitos, com duas threads
cada, e o perfil volatile deve limitar Tomcat a duas threads ociosas e oito
máximas, 32 conexões e backlog de 16. Esses limites não alteram a sessão pesada
única, os bytes/dimensões, a política de render ou o deadline dos providers.

O SIGKILL deixou cinco arquivos de runtime em scratch, sem imagem/texto detectado.
O carregador de fontes usa a API AWT por stream, que pode manter arquivos de
fontes públicas. Cada filha deve receber um diretório técnico privado, removido
somente depois da morte confirmada e do encerramento do writer. Nenhum byte de
imagem/OCR/tradução/manifesto será escrito nesse diretório pelo pipeline.
Falha de cleanup mantém capacidade indisponível; não há liberação presumida.

A admissão e a criação desse diretório podem atrasar. Revalidar a cerca de
cancelamento/deadline depois dessas operações e antes de clonar/escrever/iniciar
uma filha; retorno tardio de uma admissão que engoliu interrupção não pode
iniciar trabalho. A regressão dessa corrida deve falhar antes da correção.

Repetir com `pids.events` observado, ausência de EAGAIN e diretório técnico
recolhido. O sucesso anterior e seus logs permanecem preservados, sem converter
seus resultados em aprovação operacional.
