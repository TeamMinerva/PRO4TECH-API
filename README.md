# PRO4TECH-API

<p align="center">
  |    
    <a href="#-descrição-do-desafio"> Descrição do Desafio </a> |
    <a href="#-backlog-do-produto"> Backlog do Produto </a> |
    <a href="#-mvp"> MVP </a> |
    <a href="#-sprints"> Sprints </a> |
    <a href="#-tecnologias-utilizadas"> Tecnologias Utilizadas </a> |
    <a href="#links-do-projeto"> Links do projeto </a> |
    <a href="#equipe"> Equipe </a> |
</p>

## 📌 Descrição do desafio

Durante o desenvolvimento de projetos de software, Product Owners (POs) precisam lidar com uma grande quantidade de informações relacionadas a projetos, épicos, features e itens de backlog. Com o passar do tempo, conhecimentos importantes sobre decisões, problemas encontrados, soluções adotadas e experiências de projetos anteriores podem ficar dispersos ou deixar de ser aproveitados em novos projetos.

O desafio consiste em desenvolver uma solução capaz de **centralizar e organizar o conhecimento produzido durante os projetos de desenvolvimento de software**, permitindo que essas informações sejam posteriormente reutilizadas como apoio aos Product Owners.

Por meio do uso de Inteligência Artificial, a solução deverá utilizar o conhecimento armazenado para auxiliar os POs na análise e elaboração de novos projetos e backlogs, identificando informações relevantes, possíveis relações com projetos anteriores, inconsistências e oportunidades de melhoria.

A proposta não é substituir a atuação do PO ou permitir que a IA tome decisões por ele, mas **oferecer uma ferramenta de apoio à tomada de decisões**, facilitando o acesso ao conhecimento já produzido pela equipe e contribuindo para a criação de projetos e backlogs mais consistentes e bem estruturados.

## 🗂 Backlog do produto

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Sprint</th>
      <th>User Story</th>
      <th>Prioridade</th>
      <th>Estimativa</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>1</td>
      <td>Como usuário, quero me cadastrar e fazer login com email e senha para ter acesso ao sistema.</td>
      <td>Alta</td>
      <td>5</td>
    </tr>
    <tr>
      <td>2</td>
      <td>1</td>
      <td>Como usuário, quero cadastrar um desenvolvedor com nome, competências técnicas e status (ativo/inativo) para alimentar a base de conhecimentos.</td>
      <td>Alta</td>
      <td>3</td>
    </tr>
    <tr>
      <td>3</td>
      <td>1</td>
      <td>Como usuário, quero cadastrar um projeto com nome e status para começar a organizar as informações da base de conhecimento.</td>
      <td>Alta</td>
      <td>3</td>
    </tr>
    <tr>
      <td>4</td>
      <td>1</td>
      <td>Como usuário, quero criar um épico informando seu nome, descrição, objetivo e resultado esperado para representar uma iniciativa de alto nível do projeto.</td>
      <td>Alta</td>
      <td>5</td>
    </tr>
    <tr>
      <td>5</td>
      <td>1</td>
      <td>Como usuário, quero criar uma feature vinculada a um épico, informando seu nome, descrição e critérios de aprovação para detalhar uma capacidade funcional que faça parte do escopo do projeto.</td>
      <td>Alta</td>
      <td>5</td>
    </tr>
    <tr>
      <td>6</td>
      <td>1</td>
      <td>Como usuário, quero criar um PBI vinculado a uma feature, informando seu título, história do usuário, critérios de aceitação e desenvolvedor(es) responsável(is) para detalhar um comportamento específico que deverá ser implementado no projeto.</td>
      <td>Alta</td>
      <td>8</td>
    </tr>
    <tr>
      <td>7</td>
      <td>1</td>
      <td>Como usuário, quero ver uma galeria com todos os projetos e desenvolvedores cadastrados para explorar a base de conhecimento.</td>
      <td>Média</td>
      <td>3</td>
    </tr>
    <tr>
      <td>8</td>
      <td>2</td>
      <td>Como usuário, quero clicar em um projeto e visualizar seus detalhes (nome, épicos, features, PBIs, equipe de desenvolvimento e projetos semelhantes), além de poder utilizar um chat com IA contextualizado para tirar dúvidas sobre o projeto, para compreender rapidamente seu contexto e obter informações relevantes sobre ele.</td>
      <td>Alta</td>
      <td>8</td>
    </tr>
    <tr>
      <td>9</td>
      <td>2</td>
      <td>Como usuário, quero clicar em um desenvolvedor e visualizar seus detalhes (competências técnicas, projetos em que atuou, problemas e soluções dadas), além de poder utilizar um chat com IA contextualizado para tirar dúvidas sobre sua experiência e atuação nos projetos, para compreender melhor seu perfil e obter informações relevantes sobre ele.</td>
      <td>Alta</td>
      <td>8</td>
    </tr>
    <tr>
      <td>10</td>
      <td>2</td>
      <td>Como usuário, quero registrar um bug com problema, solução e desenvolvedor que resolveu para manter um histórico de aprendizado técnico.</td>
      <td>Alta</td>
      <td>3</td>
    </tr>
    <tr>
      <td>11</td>
      <td>2</td>
      <td>Como usuário, quero que, ao finalizar o cadastro de um projeto, a IA me mostre uma lista de projetos semelhantes para evitar retrabalho e aproveitar conhecimento anterior.</td>
      <td>Alta</td>
      <td>8</td>
    </tr>
    <tr>
      <td>12</td>
      <td>2</td>
      <td>Como usuário, quero ver a porcentagem de semelhança e uma breve explicação do porquê cada item é semelhante para entender a recomendação.</td>
      <td>Baixa</td>
      <td>5</td>
    </tr>
    <tr>
      <td>13</td>
      <td>3</td>
      <td>Como usuário, quero clicar em "Analisar projeto" durante o cadastro para que a IA analise as informações preenchidas, faça perguntas e identifique inconsistências e ambiguidades, a fim de melhorar a qualidade do projeto.</td>
      <td>Alta</td>
      <td>8</td>
    </tr>
    <tr>
      <td>14</td>
      <td>3</td>
      <td>Como usuário, quero poder fazer perguntas livres à IA durante o cadastro do projeto para tirar dúvidas em tempo real.</td>
      <td>Média</td>
      <td>5</td>
    </tr>
    <tr>
      <td>15</td>
      <td>3</td>
      <td>Como usuário, quero que a IA mencione desenvolvedores que trabalharam em funcionalidades semelhantes para me ajudar a atribuir responsáveis.</td>
      <td>Média</td>
      <td>5</td>
    </tr>
    <tr>
      <td>16</td>
      <td>3</td>
      <td>Como usuário, quero utilizar um chat com IA que tenha acesso à base de conhecimento completa do sistema para tirar dúvidas sobre projetos, funcionalidades, problemas já registrados e suas respectivas soluções, para obter informações e encontrar soluções com base no conhecimento existente.</td>
      <td>Alta</td>
      <td>8</td>
    </tr>
    <tr>
      <td>17</td>
      <td>3</td>
      <td>Como usuário, quero que, ao mencionar dados da base de conhecimento, a IA inclua um link clicável que abre o item mencionado (projeto/epic/feature/PBI/dev), preferencialmente em nova aba/janela, sem fechar o chat atual.</td>
      <td>Média</td>
      <td>5</td>
    </tr>
    <tr>
      <td>18</td>
      <td>3</td>
      <td>Como usuário, quero exportar um projeto em formato CSV para poder importar essas informações no Azure Boards.</td>
      <td>Média</td>
      <td>5</td>
    </tr>
  </tbody>
</table>

## 🏆 MVP

## 📅 Sprints
### 🎯 Sprint 1
- ✅ Status: Em andamento
- 📅 Período: 07/09 - 27/09
- 📄 Documentação: [Clique aqui]

### 🎯 Sprint 2
- ✅ Status: Em andamento
- 📅 Período: 13/04 - 03/05
- 📄 Documentação: [Clique aqui]

### 🎯 Sprint 3
- ✅ Status: Em andamento
- 📅 Período: 11/05 - 31/05
- 📄 Documentação: [Clique aqui]

## 💻 Tecnologias utilizadas
<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
</p>

<a name="links-do-projeto"></a>
## 🔗 Links do projeto
- [DoR (Definition of Ready) e DoD (Definition of Done)](docs/DoR-e-DoD.md)
- [Manual de instalação](docs/manual-de-instalação.md)

<a name="equipe"></a>
## 👨‍💻 Equipe
<div align="center">
    <table>
        <tr>
            <th>Membro</th>
            <th>Função</th>
            <th>Github</th>
            <th>Linkedin</th>
        </tr>
        <tr>
            <td>Letícia Furtado</td>
            <td>Product Owner</td>
            <td><a href="https://github.com/LeticiaG24"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
            <td><a href="https://www.linkedin.com/in/letícia-furtado-053b6033a"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
        </tr>
        <tr>
            <td>Isaura Batista</td>
            <td>Scrum Master</td>
            <td><a href="https://github.com/sunrhse"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
            <td><a href="https://www.linkedin.com/in/isaura-de-lourdes-0561742aa"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
        </tr>
        <tr>
            <td>Fernanda Pereira</td>
            <td>Developer</td>
            <td><a href="https://github.com/Fernanda192028"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
            <td><a href="https://www.linkedin.com/in/fernanda-pereira-252076362"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
        </tr>
        <tr>
            <td>Guilherme Rosa</td>
            <td>Developer</td>
            <td><a href="https://github.com/GuilhermeMRosa"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
            <td><a href="https://www.linkedin.com/in/guilherme-rosa-518047387/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
        </tr>
        <tr>
            <td>Caio César</td>
            <td>Developer</td>
            <td><a href="https://github.com/JkDeltaz"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
            <td><a href="https://www.linkedin.com/in/caio-c%C3%A9sar-santos-79976636a/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
        </tr>
        <tr>
            <td>Wendy Mininel</td>
            <td>Developer</td>
            <td><a href="https://github.com/JkDeltaz"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
            <td><a href="https://www.linkedin.com/in/caio-c%C3%A9sar-santos-79976636a/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
        </tr>
        <tr>
            <td>Gustavo Garcia</td>
            <td>Developer</td>
            <td><a href="https://github.com/JkDeltaz"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
            <td><a href="https://www.linkedin.com/in/caio-c%C3%A9sar-santos-79976636a/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
        </tr>
    </table>
</div>
