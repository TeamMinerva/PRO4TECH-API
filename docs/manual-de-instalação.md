# 📦 Setup do Projeto

## 🚀 Pré-requisitos

Antes de começar, instale:

### 🔹 Docker
Baixe e instale o Docker Desktop:  
https://www.docker.com/products/docker-desktop/

### 🔹 (Apenas Windows) WSL
No Windows, o Docker utiliza o WSL. Para instalar, execute no PowerShell:

```bash
wsl --install
```
## ⚙️ Instalação
### 1. Clonar o repositório
```
git clone https://github.com/TeamMinerva/PRO4TECH-API.git
```

### 2. Configurar os arquivos `.env`

O projeto utiliza dois arquivos de configuração `.env`: um para o backend e outro para o serviço de Inteligência Artificial (IA).

**2.1. Configurar o backend**

Renomeie o arquivo `.env.example`, localizado na pasta `backend`, para `.env`.

Abra o arquivo e configure a senha do banco de dados como:

```env
postgres
```

Certifique-se de que as demais configurações estejam preenchidas conforme o arquivo de exemplo.

**2.2. Configurar a IA**

O serviço de IA também utiliza um arquivo `.env`, localizado na raiz do projeto.

Verifique se esse arquivo está presente na raiz do repositório. **Não é necessário alterar suas configurações** para realizar a instalação padrão.

### 3. Subir a aplicação com Docker

**3.1. Iniciar a aplicação principal**

Na raiz do projeto, execute:

```bash
docker compose up --build -d
```

Esse comando constrói as imagens necessárias e inicia os serviços definidos no arquivo `docker-compose.yml` em segundo plano.

**3.2. Iniciar o serviço de IA**

Após iniciar a aplicação principal, execute um dos comandos abaixo, conforme o hardware disponível.

**Opção 1 — Execução padrão (CPU)**

```bash
npm run docker:up:ai
```

Utilize essa opção para iniciar o serviço de IA sem a configuração específica para GPU.

**Opção 2 — Execução com GPU**

```bash
npm run docker:up:ai:gpu
```

Essa opção utiliza uma configuração adicional do Docker Compose para habilitar o uso de GPU, podendo proporcionar um processamento mais rápido.

**Atenção:** utilize a opção com GPU somente se possuir uma placa de vídeo dedicada compatível e os drivers e componentes necessários configurados para uso com Docker.


### 4. Executar migrations do Prisma
```
docker compose exec backend npx prisma migrate deploy
```

## 🌐 Acessos

Após subir os containers:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 🛑 Observações
- O primeiro build pode demorar alguns minutos
- Certifique-se de que o Docker está em execução
- No Windows, verifique se o WSL está ativo:
```
wsl -l -v
```
## 💡 Comandos úteis
Parar os containers:
```
docker-compose down
```

Para desenvolvimento e criação de novas migrations, utilize:
```
docker compose exec backend npx prisma migrate dev --name nome-da-migration
```

Após alterar o schema.prisma, é possível gerar novamente o Prisma Client com:
```
docker compose exec backend npx prisma generate
```