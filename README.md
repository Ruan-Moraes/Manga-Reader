# Manga Reader - Projeto Pessoal

![Manga Reader]()

## Descrição

Este projeto implementa a arquitetura de microserviços, utilizando **Docker** e **Docker Compose** para orquestrar os containers dos microserviços. O sistema é um leitor de mangás, onde o usuário pode visualizar os mangás e seus capítulos, além de acessar as imagens dos capítulos.

Cada microserviço é responsável por uma parte específica do sistema, conforme descrito abaixo:

- **Manga Reader**: Microserviço responsável pela interface do usuário (Frontend). [Link do Projeto]()
- **Manga Service**: Microserviço responsável pela gestão dos mangás e seus capítulos (Backend). [Link do Projeto]()
- **Image Service**: Microserviço responsável por armazenar e disponibilizar as imagens dos capítulos dos mangás (Backend). [Link do Projeto]()
- **Auth Service**: Microserviço responsável pela autenticação dos usuários (Backend). [Link do Projeto]()

## Tecnologias

- **React**: Framework utilizado para a criação do frontend do projeto.
- **Spring Boot**: Framework utilizado para a criação dos microserviços no backend.
- **Docker**: Ferramenta para criar os containers dos microserviços.
- **Docker Compose**: Ferramenta para orquestrar os containers dos microserviços.
- **PostgreSQL**: Banco de dados utilizado para armazenar as informações dos mangás, capítulos e usuários.
- **MongoDB**: Banco de dados utilizado para armazenar as imagens dos capítulos dos mangás.
- **JWT (JSON Web Token)**: Tecnologia utilizada para autenticação e autorização de usuários.
