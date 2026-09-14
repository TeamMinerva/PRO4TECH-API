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

### 2. Subir a aplicação com Docker

Na raiz do projeto, execute:
```
docker-compose up --build
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