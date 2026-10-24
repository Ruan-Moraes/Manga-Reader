# Decisão de admissão operacional — 2026-10-18

Atualização posterior: Ruan substituiu o teto de USD 5 por
[USD 100 no total](worker-isolation-budget100-2026-10-18.md). A análise abaixo
preserva a fotografia anterior; a nova autorização e o preflight de leitura
não aprovam automaticamente a segurança ou execução cloud.

Revisão às 11:58 UTC, após a [ligação nativa de identidade e HTTP](worker-isolation-native-io-2026-10-18.md).
**Decisão: não liberar criação cloud nesta parcela.** A 020 permanece
`in-progress/open`, a 021 bloqueada. Não é nova aprovação da 018/019.

## O que está e não está validado

| Área                    | Evidência conferida nesta revisão                                                                                                  | Decisão                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Integridade local       | Preflight somente leitura: 20 recibos/148 fontes históricos e snapshot técnico de 419 caminhos íntegros; ledger preservado.        | Validado nesse escopo; nenhum teste Java/global reexecutado.                                 |
| Receita da prova mínima | Requests canônicos, rede privada IPv4, ausência de service account/IP externo, deny-all, disco readonly e exclusão agendada da VM. | Codificado/testado localmente; não observado no Google Cloud.                                |
| Conteúdo da prova       | Unidades nativas verificam device, montagem, topologia e hashes; sem JRE, renderer, OCR, tradução ou pull.                         | Não confundir prova de montagem com execução da aplicação.                                   |
| Identidade/transporte   | Implementação concreta e recibo anterior de testes offline.                                                                        | Não inicializados contra credencial real nesta revisão; permissões atuais não confirmadas.   |
| Custo                   | Cenário histórico da tabela BRL reproduzido sem alterar sua data.                                                                  | Estimativa, não admissão financeira nem gasto efetivamente medido.                           |
| Segurança do host       | Fontes oficiais e diferença entre pull e montagem reavaliadas.                                                                     | Revisão específica da receita mínima ainda não equivale a aprovação do host/worker completo. |
| CLI operacional         | O `execute` selado continua recusando antes de credenciais/reserva.                                                                | Não substituir essa recusa por callbacks permissivos.                                        |

SHA-256 do snapshot técnico, que não cobre docs/tooling privado:
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.

## Segurança: escopo importa, mas não é prova de execução

O [advisory do Moby](https://github.com/moby/moby/security/advisories/GHSA-7cfq-22r6-qp73)
continua indicando correção em Docker 29.8.2 e mitigação por DNS/egress confiável.
Digest fixo não evita vazamento de credencial. A página oficial de
[COS 125](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m125)
continua mostrando o pin `cos-125-19216-739-5`, de 12/10, com Docker 27.5.1;
versão base não decide backports. A consulta textual às notas
[129](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m129)
e [133](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m133)
não encontrou `92543`; isso não prova ausência de correção.

A [revisão estática anterior](worker-isolation-vm-security-2026-10-13.md)
permanece válida como finding para a receita que usa pull com credencial.
A prova mínima corrente é diferente: `systemctl mask --now` de Docker,
socket e containerd precede as checagens de device/montagem/inventário; não há
comando de container nem execução do payload. As requests removem acesso externo,
PGA e service account, e o ciclo exige barreira de rotas antes da instância.

Isso **não demonstra que os daemons nunca iniciaram durante o boot**, que todos
os CVEs estejam corrigidos, nem que os controles foram aplicados pelo host.
O metadata server e os serviços de plataforma também não são substituídos por
`PrivateNetwork` das unidades. Não usar a mitigação de uma operação sem pull
como autorização automática para o worker com containers/credenciais.

Para concluir a admissão mínima ainda é preciso vincular a revisão ao bundle,
imagem/ID e janela exatos, verificar os controles aplicáveis e registrar a decisão
antes de qualquer criação. O boot deve produzir evidência vinculada ao plano;
um marcador serial isolado não aprova isolamento ou a 020.

## Financeiro: restrição do usuário preservada

O teto autorizado continua **US$ 5 no total**, não por rodada. Nenhuma reserva
foi acrescentada. As duas reservas locais existentes não representam conciliação
da fatura ou prova do valor efetivamente cobrado.

O [cenário da conta](worker-isolation-account-pricing-2026-10-17.md) reproduziu
R$ 5,20, equivalentes a aproximadamente US$ 0,88 sob a taxa observada. Inclui
quantidades hipotéticas, adicional tributário hipotético de 30% e fator 2;
esses fatores não demonstram completude ou teto. Não houve renovação da
observação de preços nem acesso a faturamento/credenciais nesta revisão.

As páginas oficiais consultadas continuam descrevendo condições diferentes:
[Billing](https://docs.cloud.google.com/billing/docs/resources/vat-overview)
informa preços SKU sem tributos e 14% na contratação local brasileira;
a [FAQ de migração brasileira](https://support.google.com/cloud/answer/7522866?hl=en)
descreve preços com tributos e sobretaxa. Não deduzir o tratamento da conta
apenas dessas páginas ou somar percentuais automaticamente.

A exclusão da VM após 600 segundos não expira imagem, disco de dados ou objeto
retido. O prazo de retirada assumido no cenário depende do operador e de APIs
disponíveis. Limites de requests locais, timeout e reserva no ledger não impõem
limite de cobrança ao Google. Portanto, a estimativa não pode ser apresentada
como garantia de respeitar um corte financeiro exato em US$ 5.

Se for necessária aceitação de risco além dessa restrição, pedir decisão ao
usuário antes da ativação, sem inferi-la de “continuar” ou do orçamento nominal.
Não há essa exceção registrada nesta parcela.

## Verificação reproduzível executada

```bash
node .local/worker-isolation/mount-rejected-cycle.r4MCRI/verify.mjs --preflight
node .local/worker-isolation/mount-account-pricing.59OFxj/scenario.mjs --report
node --test --test-concurrency=2 .local/worker-isolation/mount-requests.498LRD/requests.test.mjs .local/worker-isolation/systemd-verify.y4XEpr/mount-proof-v2.test.mjs .local/worker-isolation/mount-account-pricing.59OFxj/pricing.test.mjs
```

Resultado focal: **80 testes, 80 pass, zero failures, zero skips/cancelamentos**,
exit 0. São regressões existentes, não testes novos nem prova cloud.
O preflight não executa os testes históricos que inventaria.
O relatório de cenário preserva `quoteComplete=false`, `permitsMutation=false`
e `currentPriceFreshnessUnverified=true`.

Nenhuma instalação, download de binário, uso de ADC/SDK real, autenticação,
upload, recurso, chamada a provider ou edição de runtime ocorreu nesta parcela.
Somente HTTPS público para documentação. Maven/web/mobile/SDD não reexecutados;
recibos, capturas, auditoria de performance e estudo híbrido urgente preservados.

Fechamento documental: 189 links relativos nos três documentos conferidos,
Prettier direcionado e diff do escopo aprovados; preflight final inalterado.
O diff global mantém somente a ocorrência externa de linha vazia no EOF de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, sem correção alheia.

## Próximo trabalho concreto

1. Resolver a admissão financeira dentro da restrição autorizada, sem converter
   hipótese em cobrança conhecida; eventual mudança de tolerância exige decisão.
2. Fechar a revisão delimitada da prova mínima e ligar a admissão ao comando
   real, com reserva exclusiva e validação antes da primeira operação mutante.
3. Executar e retirar somente essa prova admitida, registrando recursos/custo
   observados e pendências de conciliação; depois validar o worker completo.

Não há justificativa para criar mais recursos ou repetir suites offline apenas
para produzir outro recibo verde enquanto essas decisões permanecem abertas.
