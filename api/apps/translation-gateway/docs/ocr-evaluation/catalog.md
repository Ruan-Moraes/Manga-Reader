# Catálogo planejado — OCR

Relacionado ao [protocolo](protocol.md). Este é um inventário de posições,
não de arquivos disponíveis: **0 imagens obtidas, 0 autorizações registradas,
0 referências revisadas e 0 resultados reais** nesta preparação.

Essas contagens se referem ao benchmark independente de 18 posições. O
[piloto local reutilizável](local-samples.md) contém 15 imagens licenciadas,
sem referências independentes: 12 iniciais (duas cenas em seis idiomas), duas
páginas ilustradas tradicionais chinesas e uma capa histórica japonesa.
As 15 rodadas reais nos sete idiomas foram [revalidadas](../../../../../mobile/docs/specs/features/MOB-FEAT-018-multilingual-ocr-regions/evidence/ocr-consolidation.md).
A [consolidação inicial](pilot-review-2026-09-27.md) preserva o histórico das
primeiras 12 execuções e aprovações exploratórias.
Seus IDs e objetivo são separados; não preencher automaticamente esta tabela
com a mesma página em várias traduções.

| ID      | Idioma de origem      | Orientação    | Dificuldade/caso | Categoria | Estado    |
| ------- | --------------------- | ------------- | ---------------- | --------- | --------- |
| OCR-001 | ja                    | horizontal    | simples          | pendente  | planejada |
| OCR-002 | ja                    | horizontal    | complexa         | pendente  | planejada |
| OCR-003 | en                    | horizontal    | simples          | pendente  | planejada |
| OCR-004 | en                    | horizontal    | complexa         | pendente  | planejada |
| OCR-005 | es                    | horizontal    | simples          | pendente  | planejada |
| OCR-006 | es                    | horizontal    | complexa         | pendente  | planejada |
| OCR-007 | ko                    | horizontal    | simples          | pendente  | planejada |
| OCR-008 | ko                    | horizontal    | complexa         | pendente  | planejada |
| OCR-009 | zh-Hans               | horizontal    | simples          | pendente  | planejada |
| OCR-010 | zh-Hans               | horizontal    | complexa         | pendente  | planejada |
| OCR-011 | zh-Hant               | horizontal    | simples          | pendente  | planejada |
| OCR-012 | zh-Hant               | horizontal    | complexa         | pendente  | planejada |
| OCR-013 | pt-BR                 | horizontal    | simples          | pendente  | planejada |
| OCR-014 | pt-BR                 | horizontal    | complexa         | pendente  | planejada |
| OCR-015 | ja                    | vertical      | texto vertical   | pendente  | planejada |
| OCR-016 | zh-Hans               | vertical      | texto vertical   | pendente  | planejada |
| OCR-017 | zh-Hant               | vertical      | texto vertical   | pendente  | planejada |
| OCR-018 | ja (hint de controle) | não aplicável | página sem texto | pendente  | planejada |

Simples: texto legível com contraste e espaçamento claros. Complexa: múltiplas
regiões, fundos ou tipografia variável, ainda legíveis por humano. Registrar as
dificuldades observadas; não degradar artificialmente uma amostra para preencher
a categoria. Vertical não implica ordem humana já conhecida.

Categoria será `quadrinhos`, `livro ilustrado` ou `revista ilustrada`, somente após
seleção. Quadrinhos são prioritários; outra categoria exige motivo e limitação
registrados na ficha privada e nos agregados. Não traduzir, gerar ou girar páginas
para atender uma posição. Não presumir variante chinesa ou pt-BR pela localização
do acervo. Cada posição usa uma página distinta.

Para **cada** posição, os campos abaixo estão pendentes e serão registrados na
[ficha privada](templates.md): origem/proveniência, autorização de processamento
remoto, restrições de redistribuição, aquisição/vencimento, categoria, confirmação
humana do idioma/orientação, SHA-256, largura, altura, bytes, MIME real, anotador,
revisor independente competente, datas, versão e hash da referência. Não substituir ausência
por dados de exemplo que possam parecer reais.

Atualizações públicas limitam-se a ID, metadados não sensíveis e estado comprovado.
Não versionar a ficha preenchida, links privados, texto ou imagem. A cobertura é
exploratória: 14 páginas horizontais, 3 verticais e 1 sem texto; não prova qualidade
por idioma nem representatividade de mangás/manhwas/manhuas.

## Pendências da coleta — registro anterior ao piloto local, 2026-09-26

O custodiante está definido como Ruan; diretório privado, acessos e colaboradores
por idioma ainda aguardam confirmação. Retenção aprovada: até 30 dias desde a
aquisição, limitada por condições mais restritas do item. Nenhum prazo começou,
pois nenhuma imagem foi adquirida nesta coleta.

A [pesquisa inicial e o registro de entrega parcial](collection-review.md)
não são fichas de autorização. Nenhum resultado da busca foi atribuído a um ID;
as 18 posições continuam planejadas. Aceite integral: 18 amostras autorizadas e
18 referências revisadas e vigentes, sem resultados OCR neste incremento.
