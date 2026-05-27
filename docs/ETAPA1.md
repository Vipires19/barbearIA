# ETAPA 1 — Infraestrutura base

## Objetivo

Monorepo com Docker Compose, PostgreSQL, Redis, FastAPI e Next.js comunicando via health check.

## Estrutura

```
barber_refac/
├── backend/          # FastAPI
├── frontend/         # Next.js
├── docker/           # docker-compose.yml
├── docs/
├── .env.example
└── README.md
```

## Comandos

```bash
# Copiar variáveis
cp .env.example .env

# Subir stack
docker compose -f docker/docker-compose.yml up --build

# Apenas infra (postgres + redis)
docker compose -f docker/docker-compose.yml up postgres redis -d
```

## Endpoints

- API root: `http://localhost:8000/`
- Health: `http://localhost:8000/api/v1/health`
- Docs: `http://localhost:8000/docs`
- Frontend: `http://localhost:3000`
