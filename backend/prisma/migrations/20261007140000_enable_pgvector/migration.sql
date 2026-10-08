-- Habilita a extensao pgvector, necessaria pro LightRAG (SCRUM-31) guardar
-- os embeddings. Exige a imagem pgvector/pgvector:pg16 no Postgres (ja
-- trocada no docker-compose.yml).
-- As tabelas do LightRAG (prefixo LIGHTRAG_) nao sao criadas aqui: a propria
-- biblioteca cria na inicializacao, no schema "public" (nao usa schema
-- separado; isola linhas pela coluna "workspace").
CREATE EXTENSION IF NOT EXISTS vector;
