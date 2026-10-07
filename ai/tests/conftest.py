import httpx
import pytest

from app.main import app


@pytest.fixture
async def client():
    # ASGITransport so dispara requisicoes HTTP, nao o lifespan — por isso
    # rag.startup() (e a conexao real com o Postgres/LightRAG) nunca roda
    # nos testes. Testes de /knowledge* mockam app.rag diretamente.
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
