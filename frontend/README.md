# Manga Reader - Projeto Pessoal

![Manga Reader]()

## Descrição

Este projeto implementa a arquitetura de microserviços, utilizando **Docker** e **Docker Compose** para orquestrar os containers dos microserviços. O sistema é um leitor de mangás, onde o usuário pode visualizar os mangás e seus capítulos, além de acessar as imagens dos capítulos.

Cada microserviço é responsável por uma parte específica do sistema, conforme descrito abaixo:

- **Manga Reader**: Microserviço responsável pela interface do usuário (Frontend). [Link do Projeto]()
- **Manga ReaderAPI**: Microserviço responsável por disponibilizar as informações dos mangás e capítulos (Backend). [Link do Projeto]()
- **Manga ReaderImage**: Microserviço responsável por disponibilizar as imagens dos capítulos dos mangás (Backend). [Link do Projeto]()
- **Manga ReaderAuth**: Microserviço responsável por autenticar e autorizar os usuários (Backend). [Link do Projeto]()
- **Manga ReaderAdmin**: Microserviço responsável por gerenciar os mangás, capítulos e usuários (Backend). [Link do Projeto]()

## Tecnologias

- **Typescript (Node.js with Express + React) | Java (Spring Boot)**: Tecnologias utilizadas para desenvolver os microserviços.
- **Docker**: Ferramenta para criar os containers dos microserviços.
- **Docker Compose**: Ferramenta para orquestrar os containers dos microserviços.
- **PostgreSQL**: Banco de dados utilizado para armazenar as informações dos mangás, capítulos e usuários.
- **MongoDB**: Banco de dados utilizado para armazenar as imagens dos capítulos dos mangás.
- **JWT (JSON Web Token)**: Tecnologia utilizada para autenticação e autorização de usuários.
- **Bcrypt**: Tecnologia utilizada para criptografar as senhas dos usuários.
- **Swagger**: Ferramenta utilizada para documentar a API dos microserviços.

## Melhorias de UX implementadas

### Navegação e estado de autenticação (mock)
- O menu lateral agora possui navegação contextual para usuário logado/visitante.
- Novas rotas:
  - `/profile`: edição de nome e bio do usuário com avatar.
  - `/library`: biblioteca por status (Lendo, Quero Ler, Concluído).
  - `/reviews`: histórico de avaliações com edição de nota/comentário e exclusão.
- Login mock persiste no `localStorage` e altera cabeçalho/menu automaticamente.

### Cards, avaliações e favoritos
- Removido botão de salvar dos cards de listagem (vertical, horizontal e destaque).
- Cards exibem apenas média de avaliação com estrelas de alto contraste (preenchidas/vazadas + sombra).
- O salvar/favoritar permanece na página individual do título, com feedback via toast.

### Seção "Onde Comprar"
- Redesenhada para uma lista limpa de lojas parceiras.
- Sem preços, com foco em acesso direto ao site da loja.
- Visual consistente com o tema do app.

## Como testar os novos fluxos
1. Acesse `/login` e entre (mock).
2. Abra o menu e valide links: Perfil, Minha Biblioteca, Minhas Avaliações e Grupos.
3. Entre em um título e salve/remova da biblioteca (toast de feedback).
4. Acesse `/library` e verifique organização por status.
5. Acesse `/reviews` para editar nota/comentário e excluir avaliações.
6. Em um título, abra "Onde Comprar" e teste os links externos.
