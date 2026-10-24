# Coleta OCR — entrega parcial de 2026-09-26

Atualização posterior: o [piloto local reutilizável](local-samples.md) foi adquirido
após Ruan autorizar download e armazenamento no projeto/computador para testes
repetidos. Contém 12 JPEGs licenciados, sem revisão independente ou execução OCR.
O registro inicial de zero downloads abaixo é histórico; não descreve o piloto
adicionado depois. Os critérios das 18 posições formais permanecem pendentes.

Parcela de TASK-004 da MOB-FEAT-018. Este registro não conclui coleta, revisão
humana ou avaliação OCR. TASK-007 permanece concluída como preparação documental
anterior; TASK-004 e TASK-005 continuam abertas e a feature segue `in-progress`.

## Entregue e pendente

- Protocolo 1.1 e modelos atualizados: prioridade de quadrinhos, alternativa de
  impressos ilustrados, custódia por Ruan, retenção de até 30 dias desde aquisição,
  revisão independente, controle de versões e aceite por evidências.
- Catálogo preserva 18 IDs e a cobertura aprovada, agora com categoria pendente
  explícita; nenhum item promovido por inferência ou resultado de busca.
- Pesquisa pública inicial realizada primeiro no Commons e depois em acervos
  institucionais; somente páginas de descrição consultadas, sem download de mídia.
- **0 imagens adquiridas, 0 autorizações registradas, 0 referências revisadas,
  0 resultados OCR.** Nenhuma inspeção de bytes/hash/geometria real foi executada.
- Faltam confirmação do destino privado e acessos, indicação de anotadores e
  revisores por idioma, seleção de páginas e triagem de direitos por item.

## Pistas públicas de pesquisa, não amostras admitidas

Os links abaixo são referências públicas de descoberta, sem transcrição ou
cópia de provas de licença. A ficha probatória de cada item só será registrada
no destino privado confirmado. Pesquisa inicial não significa busca exaustiva.

| Fonte consultada                                                                        | Utilidade e limite observado                                                                                      | Próxima verificação                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Pepper&Carrot no Commons](https://commons.wikimedia.org/wiki/Category:Pepper%26Carrot) | Categoria de quadrinhos com versões em vários idiomas e episódios sem palavras; não é página individual admitida. | Escolher páginas distintas, confirmar variante/direção, direitos e formato em cada item; não inferir cobertura dos sete idiomas pela categoria.                               |
| [Manhwa no Commons](https://commons.wikimedia.org/wiki/Category:Manhwa?uselang=pl)      | Categoria retornada pela busca de quadrinhos coreanos; não identifica por si uma amostra utilizável.              | Encontrar páginas originais, não fotografias de eventos/capas; verificar coreano e condições por item.                                                                        |
| [O Tico-Tico na BNDigital](https://bndigital.bn.gov.br/artigos/o-tico-tico/)            | Referência institucional para procurar material brasileiro; o artigo descreve conteúdos de origens variadas.      | Selecionar edição/página e verificar separadamente autoria, direitos e ausência de dados pessoais; a disponibilização pela biblioteca não resolve permissão de processamento. |
| [Zippy na Library of Congress](https://www.loc.gov/pictures/item/2005685915/)           | A busca retornou direitos não avaliados; a abertura da ficha terminou em timeout.                                 | Não admitir nem baixar; exigir informação suficiente de direitos antes de reconsiderar.                                                                                       |

A pesquisa de impressos chineses também retornou arquivos DJVU e falhas ao abrir
fichas. Eles não foram admitidos: não haverá conversão de formato nem atribuição
de chinês simplificado/tradicional com base no título. Não foi estabelecida
cobertura de japonês horizontal/vertical, espanhol, chinês ou de página vazia.

## Retomada e validação

### Informações recebidas durante a execução

Ruan informou que é o único participante e pode avaliar português; não há equipe
de revisão independente disponível. Sua proposta de conferir traduções para
português foi registrada como possível triagem assistida, não como prova de
fidelidade ao idioma fonte. Não houve tradução nem alteração do gate da 019.
O endereço privado e os acessos ainda não foram informados: os links enviados
indicam fontes públicas, não o destino de armazenamento.

Fontes adicionais indicadas pelo usuário, verificadas sem baixar arquivos:

- [Manga109](http://www.manga109.org/en/): endereço original não respondeu nesta
  consulta. A [página do projeto encontrada na busca](https://manga109.github.io/manga109-project-website/en/index.html)
  distingue Manga109 acadêmico/não comercial do subconjunto Manga109-s e acesso
  mediante solicitação. Não tratar o conjunto como domínio público; obter e
  conferir os termos aplicáveis antes de decidir sobre armazenamento e OCR remoto.
  Nenhum acesso foi solicitado e nenhum termo foi aceito.
- [Hugging Face — busca manga](https://huggingface.co/datasets?search=manga) e
  [Internet Archive — busca manga](https://archive.org/search?query=manga): URLs de
  busca, não licenças por item; indisponíveis na ferramenta nesta consulta.
  Dataset específico, procedência e condições continuam pendentes.
- [Categoria Public domain manga no Commons](https://commons.wikimedia.org/wiki/Category:Public_domain_manga):
  URL indicada não acessível na ferramenta; existência/conteúdo não confirmados.
  O nome da categoria não comprova autorização de nenhum arquivo.
- [Manga-OCR no GitHub](https://github.com/kha-white/manga-ocr): README acessível,
  descreve ferramenta OCR japonesa e exemplos selecionados. Não foi demonstrada
  autorização específica dos assets para esta coleta; a licença de código não
  foi tomada como prova de direitos sobre imagens de terceiros. Sem clone,
  instalação, download de pesos ou uso desse OCR como referência humana.

### Sequência de retomada

1. Confirmar destino, acessos e equipe na ficha privada dos [modelos](templates.md).
2. Concluir triagem por item; só então adquirir, inspecionar localmente e registrar
   hash/bytes/MIME/dimensões e vencimento, sem expor conteúdo no terminal.
3. Receber transcrição e conferência independente da imagem original; resolver
   divergências e vincular aprovação à revisão/hash exatos.
4. Atualizar apenas metadados públicos revisados e contagens do [catálogo](catalog.md).
   Falta de evidência mantém pendência; arquivo expirado não conta como disponível.

### Checks executados — 2026-09-26

- Conferência local por Node: 18 IDs únicos e sequenciais, pares simples/complexa
  dos sete idiomas, três posições verticais e uma sem texto preservados; todas
  continuam `planejada`, com categoria pendente. Verificação de estrutura do
  catálogo, não de bytes ou anotações reais.
- `pnpm check` completo aprovado: 23 testes de performance, 24 testes SDD,
  validação de specs e links, type-check, ESLint, FSD, Prettier e Jest com
  109 suítes/674 testes aprovados. Avisos preexistentes de `act(...)` não causaram
  falhas e não foram corrigidos neste escopo.
- Prettier dos documentos alterados e `git diff --check` aprovados; nenhuma
  formatação automática global. Checksums SDD atualizados apenas nas dez reviews
  que usam checksum da árvore, em consequência da alteração de tasks da 018;
  verdicts e evidências históricas foram preservados, sem nova aprovação funcional.
- Maven, suíte web e Terraform não foram reexecutados nesta parcela documental;
  não se reivindica nova evidência desses gates nem da operação cloud.

Esses checks não substituem autorização, inspeção da imagem ou revisão humana multilíngue.
Nenhum contato externo, contratação, chamada ao Vision, alteração legal,
deploy, mudança de runtime ou habilitação de uploads foi realizado.

## Verificação do piloto reutilizável — rodada posterior de 2026-09-26

- Aquisição explícita: 12 JPEGs e páginas de origem do autor, após a autorização
  do usuário para guardar um conjunto local de testes. Cada link de imagem foi
  conferido na página da versão de idioma antes do download. Sem instalação de
  pacote, clone de dataset, envio de conteúdo ou chamada de OCR/tradução.
- `file` e `sips`: todos os arquivos identificados como JPEG, 2481 × 3503 pixels;
  metadados e SHA-256 fixados em `samples.json`. Inspeção visual da página 1
  japonesa e página 2 portuguesa confirmou o material e falas horizontais na
  japonesa, sem fingir revisão humana multilíngue.
- Testes do utilitário escritos antes da implementação: falha inicial por módulo
  ausente; depois sete testes aprovados. Cobrem cabeçalho, integridade, ausência,
  corrupção sem sobrescrita, download único, respostas inválidas, symlinks,
  manifesto e galeria sem scripts/imagens remotas.
- Restauração real validada: uma imagem foi movida temporariamente para referência,
  recuperada pelo comando `download` e comparada byte a byte. A cópia redundante
  de teste foi removida após igualdade; os 12 originais foram preservados.
  Reexecução de `download` e `verify`: 12 íntegras, zero downloads.
- Galeria gerada localmente com comparação editorial pt-BR; não há resultados do
  produto nem medição CER. `.local/ocr-samples/` confirmado como ignorado pelo Git.
- `pnpm check` completo aprovado: 109 suítes/674 testes Jest; SDD, links, type-check,
  lint, FSD e formatação aprovados. Avisos preexistentes de `act(...)` não falharam.
- Web `tsc -b` aprovado usando o binário instalado no próprio app; nenhuma instalação.
- Maven global `./mvnw test`: primeira tentativa falhou no sandbox por restrições
  de Docker/attach Mockito. Com acesso autorizado ao ambiente local, os sete
  módulos passaram; gateway com 98 testes, zero falhas/erros. Sem alteração de
  código para contornar o ambiente, sem chamadas reais ao Vision.
- Prettier dos arquivos alterados e `git diff --check` aprovados.
- Checksum mobile manteve `44ef519744e7ea0fe15a7ce9289a898ac0b2a2b540770966ca2da94c5b6aba6f`;
  somente a review móvel foi acrescida nesta rodada e é excluída da assinatura.
  Não houve nova renovação de checksums ou conclusão de ACs de OCR.
