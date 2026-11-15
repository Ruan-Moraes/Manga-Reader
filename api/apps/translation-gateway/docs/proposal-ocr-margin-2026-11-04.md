# Proposta para revisão humana: margem de limpeza do OCR

**Estado: proposta; não autorizada nem implementada.** A especificação atual da
MOB-FEAT-020 limita alterações às regiões textuais detectadas. Nesta fixture
sintética, algumas linhas do texto original atravessam esses limites: em uma
faixa externa de cinco pixels há 225 pixels escuros acima e 278 abaixo da
primeira região, e 33 acima da segunda. A medição e o resultado visual são da
fixture local identificada pelo SHA-256
`17d8b4d02a4846692e9910c24234b91ccfea7b76eb8c2cf06848e0562303bc4e`;
não representa medição de mídia de usuário.

## Mudança proposta

Substituir o limite de alteração estritamente interno ao polígono pela união
do polígono com uma margem externa de **até cinco pixels da imagem original**,
recortada nas bordas. A distância é medida a partir do polígono, não da caixa
retangular de um polígono inclinado; limitar a alteração à união dessas áreas.
A cor continua estimada a partir do raster original, sem persistir mídia e sem
inpainting generativo. A composição do texto permanece dentro da região interna;
a margem proposta serve apenas à limpeza dos vestígios.

Isso pode remover detalhes da arte que coincidam com essa faixa. Cinco pixels
são uma proposta inicial para a fixture observada, não uma garantia de apagar
todos os traços ou preservar toda a arte. Um resultado que não passe na revisão
visual deve permanecer pendente, e uma expansão maior exige nova decisão.
Nenhum texto, polígono retornado ao cliente ou contrato público deve ser
alterado apenas para ocultar o aumento da área modificada: a política de
renderização e sua documentação devem identificar explicitamente a margem.

## Condições antes de implantação

1. Aprovar expressamente a mudança do limite de alteração do AC-001; atualizar
   a spec, tasks e rastreabilidade antes do código.
2. Acrescentar regressões para fixture com glifos que atravessam a borda,
   regiões inclinadas, bordas da imagem, sobreposição, imagens sem regiões e
   detalhes próximos à margem. Verificar que pixels fora da união expandida
   permaneçam idênticos no raster antes do codec; manter original intacto.
3. Rever visualmente fixtures sintéticas de balões e arte próxima, incluindo
   overflow, e registrar casos em que a margem apaga traços legítimos. Não
   substituir a matriz física nem tratar esta fixture como aprovação geral.
4. Repetir gates backend, memória/isolamento AMD64 e verificação de ausência de
   conteúdo persistido para o novo binário. Preservar os artefatos e resultados
   anteriores; publicar por digest apenas depois das verificações e preservar
   o ambiente de teste existente até haver substituto verificável.

A decisão deve ponderar legibilidade contra preservação da arte. Até a aprovação,
o gateway atual permanece com a regra e a limitação observada.
