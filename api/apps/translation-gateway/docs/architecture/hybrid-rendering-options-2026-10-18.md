# Renderização híbrida — investigação urgente

Data: 2026-10-18. Prioridade **urgente/P1**, solicitada por Ruan. Estado:
pesquisa e proposta, **não implementada nem admitida**. Fonte de backlog:
[DT-76](../../../../docs/tech-debt.md#dt-76-renderização-híbrida-de-tradução--urgentep1).

## Decisão vigente

Continuar implementando e validando a renderização no servidor. Investigar a
divisão de trabalho com o aparelho sem substituir silenciosamente a 020,
desbloquear a 021 ou anunciar menor custo/memória sem medição. Gateway, worker
cloud e uploads continuam desabilitados. Não instalar bibliotecas, modelos ou
aplicativos por esta pesquisa. Não alterar os arquivos da auditoria de performance.

## Fatos locais e limites

O renderer Java já compõe pixels de limpeza e tipografia; ainda falta admissão
operacional completa. `CleanBoxPainter` estima cor de fundo e cobre os polígonos
OCR: não é reconstrução semântica de desenho. O app tem overlay demonstrativo,
não uma implementação real desta proposta. `mobile/package.json` já declara
`react-native-svg`; não declara React Native Skia. A presença de uma biblioteca
não demonstra qualidade tipográfica, memória ou exportação prontas.

Mover somente limpeza/composição não evita o envio necessário ao Vision nem a
tradução remota. Providers continuam no servidor e suas credenciais nunca ficam
no app. Não confundir imagem original preservada com texto já removido.

## Alternativas encontradas

As economias abaixo são **hipóteses de engenharia**. Nenhuma foi medida no
Toonlira, e as opções não constituem contrato de entrega vigente.

| Opção                          | Servidor                                                                                        | Aparelho                                                                | Principal limitação                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A — instruções e overlay       | OCR/tradução, geometria validada, classificação conservadora do fundo e sugestões de composição | Exibe original; cobre apenas regiões simples e desenha tradução visível | Fundo uniforme errado apaga desenho; tipografia difere entre plataformas        |
| B — A com pequenos patches     | Além de A, prepara recortes corrigidos somente de regiões complexas admitidas                   | Compõe patches e texto sobre o original, sem inpainting local           | Mais artefatos/rede; decodificar a página no servidor ainda pode custar memória |
| C — página limpa + texto local | Gera e transmite uma página inteira sem letras originais                                        | Desenha somente o texto traduzido                                       | Mantém rasterização/encode de página no servidor e download de imagem completa  |

**Candidata preferida para protótipo: A, evoluindo seletivamente para B.** Não
colocar modelo de inpainting ou OCR no aparelho como requisito inicial. C pode
servir de comparação, mas não é presumida como solução mais barata. A imagem
inteira já renderizada pelo servidor permanece o baseline existente; um fallback
futuro para ela também exigirá admissão/custo, nunca execução cobrada silenciosa.

Não classificar automaticamente todo quadrilátero OCR como balão. Balões/layout
experimentais não são fonte normativa; incerteza mantém o original ou pede
revisão, sem apagar região arbitrária nem fingir sucesso de limpeza.

## Caminhos de desenho pesquisados

- **SVG existente:** a documentação Expo descreve `Rect`, `Path`, `ClipPath` e
  `Polygon`. É candidato a coberturas simples e coordenadas; SVG não resolve
  sozinho encaixe multilíngue ou inpainting. Usar elementos estruturados e texto
  validado, nunca SVG/XML remoto arbitrário. Não assumir que centenas de nós
  custem pouco: comparar com outra implementação antes de escolher.
- **Canvas/Paragraph nativo:** React Native Skia documenta desenho de imagens,
  parágrafos, fontes e medidas de layout. É candidato se o primeiro protótipo
  justificar nova dependência. Requer autorização para instalar, compatibilidade
  com o SDK realmente fixado, licenças/fontes e medição de memória/GPU. Não está
  instalado e não foi escolhido neste marco.
- **Decodificação compatível com o viewport:** a orientação oficial Android é
  conferir dimensões antes de alocar e carregar resolução apropriada à exibição.
  Não assumir que recortar um desenho no Canvas também limita o decode da
  imagem. Tiles/region decode, zoom e suporte por formato precisam ser provados
  no carregador escolhido, não apenas descritos no plano.

Fontes primárias consultadas em 2026-10-18:
[Expo SVG](https://docs.expo.dev/versions/latest/sdk/svg/),
[uso do react-native-svg](https://github.com/software-mansion/react-native-svg/blob/main/USAGE.md),
[Skia Paragraph v2](https://wcandillon.github.io/react-native-skia/v2/docs/text/paragraph/),
[Skia Images v2](https://wcandillon.github.io/react-native-skia/v2/docs/images/),
[Android: carregar bitmaps grandes](https://developer.android.com/topic/performance/graphics/load-bitmap).
As páginas `latest` não autorizam atualizar dependências automaticamente.

## Como limitar os dois lados

1. Reutilizar o original local por hash/dimensões/orientação; não baixar uma
   segunda página completa por padrão nem transferir pixels como base64/array JS.
2. Servidor calcula sugestões uma vez por versão de resultado; não repetir OCR
   ou tradução por zoom, troca de tela ou falha da camada visual. Reutilização
   somente dentro da retenção/escopo autorizado, sem cache global de obras.
3. Desenhar apenas página/regiões visíveis, limitar prefetch e concorrência,
   liberar imagens/texturas/fontes não necessárias. Isso precisa incluir memória
   nativa/GPU, não apenas heap JavaScript.
4. Não rasterizar/encodar a página inteira no telefone durante a leitura. A
   composição é reversível; exportação será uma operação separada e limitada.
5. Para B, limitar quantidade, dimensões, área total e bytes dos patches; medir
   sobreposição/requisições. Se os recortes não economizarem frente à página
   inteira, não afirmar vantagem e não despachá-los sem decisão explícita.
6. Fontes fixadas e shaping devem cobrir CJK, acentos, emoji, pontuação e
   overflow. Ordem estrutural e texto OCR não serão corrigidos por heurística.

Uma página no limite atual de 80 milhões de pixels ocupa aproximadamente
320 milhões de bytes em uma única representação RGBA8, antes de cópias,
texturas e fontes. Overlay não elimina esse decode automaticamente. Não há
garantia de adequação a aparelhos modestos ou de operação barata por haver GPU.

## Próximo estudo e critérios de decisão

Após a validação atual do servidor, planejar um protótipo isolado com fixtures
sintéticas/licenciadas já disponíveis e respostas gravadas, sem novos providers:

- comparar baseline servidor, A e A+B em Android/iOS de entrada e intermediário;
- incluir fundos uniformes/texturizados, zoom/rotação, páginas grandes,
  desconexão/retomada, CJK, texto vertical, overflow e erro de hash;
- medir tempo até leitura, pico de RAM nativa/JS/GPU, fluidez, energia/temperatura,
  bytes transferidos e persistidos, CPU/RAM/tempo do servidor e custo estimado;
- verificar alinhamento original/patch/texto e preservar original quando a
  composição não for segura; registrar perda de qualidade sem aprovação presumida;
- definir os orçamentos numéricos **antes do benchmark**, com base nos aparelhos
  alvo e no baseline; só promover se ambos os lados couberem e a qualidade passar.

Antes de integrar: revisar contratos/SDD de 020/021, capabilities, integridade,
resultado disponível, ACK, retenção, fontes e eventual exportação. O ACK não
pode apagar patches antes de persistência local completa. Nenhum `READY`, schema,
manifesto OCR/traduzido, rota `/v1` ou estado público foi alterado neste marco.

## Aceite desta investigação

Registro urgente rastreável, alternativas/fonte primária, recomendação com
limites e roteiro de comparação. **Não** é aceite de protótipo híbrido, operação
cloud, economia, qualidade ou entrega ao usuário final.
