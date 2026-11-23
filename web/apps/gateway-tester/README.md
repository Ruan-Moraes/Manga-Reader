# Gateway Tester

Frontend web para testar e debugar o Translation Gateway em ambiente de desenvolvimento.

## Features

- 📊 Monitoramento de status do gateway em tempo real
- 🔧 Criação de instalações e sessões
- 📄 Upload e envio de páginas para processamento
- 📦 Acompanhamento de jobs em tempo real
- 📋 Histórico de requisições
- 🧪 Pipeline de validação: traduz um corpus de capítulos livres de direitos e grava tudo em um lote (`corpus/runs/`) — ver [`corpus/README.md`](corpus/README.md)
- 🎨 UI moderna com Tailwind CSS e temas dark/light

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Axios

## Getting Started

```bash
# Instalar dependências do workspace
cd web
pnpm install

# Desenvolver
pnpm --filter gateway-tester dev

# Build
pnpm --filter gateway-tester build

# Preview
pnpm --filter gateway-tester preview
```

## Como Usar

1. Certifique-se que o Translation Gateway está rodando em `http://localhost:8084`
2. Abra `http://localhost:5175` no navegador
3. Clique em "Criar Instalação" para obter as credenciais
4. Clique em "Criar Sessão" para autenticar
5. Selecione uma imagem e configure os idiomas
6. Clique em "Enviar Página" para processar
7. Acompanhe o progresso do job em tempo real

## API Endpoints Testados

- `GET /v1/capabilities` - Status e capacidades
- `POST /v1/anonymous/installations` - Criar instalação
- `POST /v1/anonymous/sessions` - Criar sessão
- `POST /v1/page-jobs` - Enviar página
- `GET /v1/page-jobs/{jobRef}` - Status do job
- `POST /v1/page-jobs/{jobRef}/cancel` - Cancelar job
- `POST /v1/page-jobs/{jobRef}/ack` - Confirmar resultado
