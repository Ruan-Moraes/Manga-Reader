# SystemSettings — Configurações do sistema

> Configurações globais (não-perfil): leitor, idioma, tema, acessibilidade.
> Separada de ProfileEdit (que é conta+identidade+privacidade).

## Rota

`/settings`

## Layout em árvore

```
<PageContainer asMain size="narrow" paddingY="md">
├── <SectionHeader>
│   eyebrow="Sistema"
│   title="Configurações"
│   meta="alterações aplicadas em tempo real"
│
├── Sticky tabs (vertical em ≥lg)
│   ├── Leitor (default)
│   ├── Aparência
│   ├── Idioma e região
│   ├── Acessibilidade
│   ├── Dados
│   └── Sobre
│
└── TabPanel content
    │
    ├── Leitor:
    │   ├── Direção padrão — SegmentedControl (LTR/RTL/Webtoon)
    │   ├── Modo padrão — SegmentedControl (Vertical/Paged/Double)
    │   ├── Ajuste padrão — SegmentedControl (Largura/Altura/Original)
    │   ├── Qualidade — Select (Auto/Baixa/Média/Alta/Original)
    │   ├── Gap vertical — Slider 0-32
    │   ├── Background — SegmentedControl (Preto/Escuro/Papel)
    │   ├── Marcar como lido automaticamente — Switch
    │   └── Pré-carregar próximas X páginas — Slider 0-10
    │
    ├── Aparência:
    │   ├── Tema — RadioGroup (Escuro / Claro (em breve) / Sistema)
    │   ├── Tamanho de fonte global — SegmentedControl (Compacto/Padrão/Confortável)
    │   ├── Densidade — SegmentedControl (Confortável/Compacta)
    │   └── Animações — Switch (desabilita customizado, mantém prefers-reduced-motion)
    │
    ├── Idioma e região:
    │   ├── Idioma da interface — Select (PT-BR / EN-US / JA)
    │   ├── Idiomas de leitura preferidos — Checkbox group
    │   ├── Formato de data — RadioGroup (12mai · 12/05 · May 12)
    │   └── Fuso — Select com search
    │
    ├── Acessibilidade:
    │   ├── Reduzir movimento — Switch
    │   ├── Aumentar contraste — Switch (futuro)
    │   ├── Subtítulos em vídeos — Switch (futuro)
    │   └── Atalhos de teclado — link "Ver lista"
    │
    ├── Dados:
    │   ├── Cache do leitor — usado/total + Button "Limpar"
    │   ├── Exportar minha biblioteca — Button (gera CSV/JSON)
    │   ├── Importar lista — Button (abre modal MAL/AniList/CSV)
    │   └── Histórico de leitura — Button "Limpar"
    │
    └── Sobre:
        ├── Versão do app + commit hash
        ├── Status do sistema — link
        ├── Changelog — link
        └── Atalhos de teclado (tabela com Kbd)
```

## Componentes

`PageContainer`, `SectionHeader`, `Tabs`, `SegmentedControl`, `Select`, `Switch`, `RadioGroup`, `Checkbox`, `Button`, `Card`, `Kbd`, `Modal`, `Toast`.

## Estados

- Cada mudança é **persistida live** em localStorage + sincroniza com backend (se logado)
- Toast confirmando salvamento aparece pra mudanças não-óbvias (ex.: "tema atualizado")
- Mudanças que requerem reload mostram banner "Recarregue pra ver a mudança" + Button reload

## Responsividade

| Breakpoint | Tabs |
|---|---|
| <lg | tabs horizontais scroll |
| ≥lg | sidebar vertical 240 + content flex-1 |

Campos: max-w 480 dentro do panel.

## A11y

- Mudanças via aria-live "Configuração salva"
- Acessibilidade tab: opções têm hints explicando o efeito
- Lista de atalhos: tabela semântica `<table>` com `<th>`/`<td>` + `<Kbd>` no body
