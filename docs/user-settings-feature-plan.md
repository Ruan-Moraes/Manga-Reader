# Plano de implementação — Configurações do Usuário (Manga Reader)

## 1) Objetivo da feature
Expandir a área inferior do menu lateral (onde hoje existem os botões **Limpar cache** e **Sair**) para incluir acesso e gerenciamento de **Configurações do Usuário**, com foco em experiência de leitura de mangá:

- Preferências de leitura (direção, modo contínuo/paginado, zoom, qualidade de imagem, preload).
- Idioma (interface e idioma preferencial de conteúdo/tradução).
- Notificações (novos capítulos, favoritos, notícias, eventos).
- Privacidade e conta (sessão, dados, visibilidade).

## 2) Estado atual observado
- O componente `SidebarMenuContent` já possui uma seção de links de configurações (`Meu Perfil`, `Notificações`, `Aparência`, `Modo Leitura`, `Privacidade`), mas a área de ações rápidas no rodapé contém somente **Limpar cache** e **Sair**. 
- O botão de limpar cache chama `clearCache`, que reseta queries, limpa `localStorage`, exibe toast e recarrega a página.

## 3) Abordagem recomendada (alto nível)
### 3.1 UX e arquitetura
1. **Adicionar botão “Configurações” no bloco inferior** (ao lado de Limpar cache / Sair).
2. Abrir um **Painel de Configurações** (modal ou drawer) com abas:
   - Leitura
   - Idioma
   - Notificações
   - Conta e Privacidade
3. Persistir preferências locais imediatamente (UX responsiva) e sincronizar com backend quando usuário autenticado.
4. Para visitantes, manter persistência local e oferecer CTA para salvar na conta após login.

### 3.2 Modelo de dados sugerido
```ts
export type UserSettings = {
  reading: {
    mode: 'paged' | 'continuous';
    direction: 'ltr' | 'rtl' | 'vertical';
    imageQuality: 'auto' | 'high' | 'data-saver';
    preloadPages: number; // 0-5
    autoNextChapter: boolean;
    showPageNumber: boolean;
  };
  language: {
    uiLanguage: 'pt-BR' | 'en-US' | 'es-ES';
    preferredContentLanguage: 'pt-BR' | 'en-US' | 'ja-JP' | 'es-ES';
    preferredScanlator?: string;
  };
  notifications: {
    newChapterFromFollowed: boolean;
    recommendations: boolean;
    communityNews: boolean;
    events: boolean;
    email: boolean;
    push: boolean;
  };
  privacy: {
    showReadingHistory: boolean;
    showOnlineStatus: boolean;
    adultContent: 'hide' | 'blur' | 'show';
  };
  updatedAt: string;
};
```

## 4) Plano de implementação por fases

### Fase A — Foundation (UI + estado local)
- Criar `UserSettingsPanel` com UI por abas e componentes reutilizáveis (switch, select, radio, slider).
- Criar hook `useUserSettings` com:
  - defaults;
  - leitura/escrita em `localStorage`;
  - validação básica de schema (ex.: zod opcional).
- Adicionar botão “Configurações” no rodapé do sidebar e controlar abertura/fechamento do painel.

**Critério de aceite**
- Usuário altera opções e vê efeito imediato (ex.: modo de leitura).
- Recarregar página mantém preferências locais.

### Fase B — Integração com backend
- Definir endpoints (ou BFF) para GET/PUT `user-settings`.
- Em login:
  - buscar settings remotos;
  - aplicar estratégia de merge (`updatedAt` mais recente vence) entre local e remoto.
- Salvar com debounce (ex.: 500–1000ms) e estado de sincronização visual (“Salvando…”, “Salvo”).

**Critério de aceite**
- Preferências persistem entre dispositivos para usuário logado.
- Em falha de rede, manter alteração local e sinalizar “pendente de sincronização”.

### Fase C — Aplicação real nas telas de leitura
- Conectar `reading.mode`, `direction`, `imageQuality`, `preloadPages` ao reader real.
- Conectar idioma da UI ao i18n existente (ou preparar camada).
- Conectar notificações ao centro de notificações e preferências de envio.

**Critério de aceite**
- Alterações impactam comportamento do leitor sem precisar reload completo.

### Fase D — Hardening
- Telemetria (evento de alteração por categoria).
- Testes unitários (hook/reducer/schema).
- Testes E2E do fluxo de salvar/restaurar configurações.
- Flags para rollout progressivo.

## 5) Regras de negócio recomendadas
1. `clearCache` **não deve apagar** `user-settings` (usar namespace, ex.: `mr:user-settings:v1`).
2. Visitante: configurações locais; autenticado: local + remoto.
3. Controle de conteúdo adulto respeita região/idade quando aplicável.
4. Preferência de idioma de conteúdo deve influenciar listagem/capítulos antes de fallback.

## 6) Estrutura de pastas sugerida
- `frontend/src/shared/component/settings/UserSettingsPanel.tsx`
- `frontend/src/shared/component/settings/tabs/*.tsx`
- `frontend/src/shared/hook/useUserSettings.ts`
- `frontend/src/shared/service/user-settings/userSettingsService.ts`
- `frontend/src/shared/type/user-settings.types.ts`
- `frontend/src/shared/constant/USER_SETTINGS_DEFAULTS.ts`

## 7) Estratégia de testes
### Unit
- parser/normalizer de settings;
- merge local/remoto;
- reducer/hook de atualização de campos.

### Integração
- abertura de modal pelo botão do sidebar;
- persistência local após salvar;
- estado visual de sincronização.

### E2E
- alterar preferência de leitura e validar efeito no reader;
- login em novo device e validar carregamento remoto.

## 8) Métricas de sucesso (KPIs)
- % de usuários logados com settings salvos no backend.
- Redução de abandono na leitura após primeiro capítulo.
- Aumento de sessões com personalização ativa (>=1 setting alterado).
- Taxa de erro de sincronização < 1%.

## 9) Riscos e mitigação
- **Conflito local vs remoto**: usar `updatedAt`, auditoria simples e fallback seguro.
- **Complexidade visual no mobile**: usar drawer full-height com navegação por abas simplificada.
- **Acoplamento excessivo ao reader**: aplicar camada de configuração central (hook + context).

## 10) Entrega incremental sugerida (sprints)
- **Sprint 1:** UI do painel + localStorage + botão no sidebar.
- **Sprint 2:** API + sincronização remota + estados de erro/sucesso.
- **Sprint 3:** integração completa com reader + métricas + hardening.
