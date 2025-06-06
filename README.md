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
