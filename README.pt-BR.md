# Plataforma SaaS para Barbearia

**Plataforma operacional para barbearias, preparada para IA**, com agendamento público, painel interno e motor de agenda dinâmico — refatoração moderna de um sistema legado em Django.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Licença: MIT](https://img.shields.io/badge/Licença-MIT-yellow.svg)](LICENSE)

> **English:** see [README.md](./README.md)

---

## Visão geral

Este projeto **não é** um CRUD genérico de barbearia. É uma **base SaaS operacional** pensada para:

- **Agendamento público** sem cadastro de cliente
- **Operação interna** com papéis `admin` e `barber`
- **Agenda por intervalos de tempo** (não slots fixos engessados)
- **Atendimentos com vários serviços** (modelo de sessão)
- **Camada de IA futura** (WhatsApp, automação) sem acoplar regra de negócio à interface

| Camada | Situação |
|--------|----------|
| API + PostgreSQL + migrations | ✅ Implementado |
| Auth JWT + RBAC | ✅ Implementado |
| Booking público + “Meus agendamentos” | ✅ Implementado |
| Base do scheduling (`AppointmentItem`, `ProfessionalAvailability`) | ✅ Implementado (em evolução) |
| Financeiro / estoque / agentes de IA | 📋 Planejado |

**Versão da API:** `0.2.0` · **Desenvolvimento ativo**

---

## Prévia do produto

As capturas de tela serão adicionadas antes da publicação no GitHub. Abaixo, os fluxos principais já existentes no código.

| Tela | Rota | Descrição |
|------|------|-----------|
| **Home pública** | `/` | Landing, serviços, profissionais, CTA WhatsApp |
| **Agendamento** | `/booking` | Serviço → profissional → data → horário → confirmação |
| **Meus agendamentos** | `/my-appointments` | Consulta por telefone, cancelar / reagendar |
| **Dashboard** | `/dashboard` | Visão operacional por perfil |
| **Agenda** | `/dashboard/calendar` | Calendário de atendimentos |
| **Configurações → Perfil** | `/dashboard/settings/profile` | Perfil público do profissional |

```text
┌─────────────────────────────────────────────────────────────┐
│  [ Home ]          [ Agendar ]       [ Meus agendamentos ]  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  API FastAPI  ◄──►  PostgreSQL  │  Redis (infra pronta)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Dashboard  ·  Agenda  ·  Profissionais  ·  Serviços        │
└─────────────────────────────────────────────────────────────┘
```

---

## Funcionalidades

### Experiência pública

| Funcionalidade | Situação |
|----------------|----------|
| Landing page | ✅ |
| Catálogo de serviços | ✅ |
| Vitrine de profissionais (controle de visibilidade) | ✅ |
| Fluxo de agendamento em etapas | ✅ |
| Horários disponíveis (duração dinâmica, granularidade 15 min) | ✅ |
| “Meus agendamentos” por telefone | ✅ |
| Link para WhatsApp | ✅ (manual; automação WAHA planejada) |
| Seleção de múltiplos serviços na UI | 📋 Planejado (API já aceita `service_ids`) |

### Painel operacional

| Funcionalidade | Situação |
|----------------|----------|
| Login JWT (access + refresh) | ✅ |
| Seed de admin na primeira subida | ✅ |
| Menu por papel (`admin` / `barber`) | ✅ |
| CRUD de serviços | ✅ |
| Onboarding de profissionais (nome, login, ativo) | ✅ |
| Perfil do profissional (foto, bio, especialidades, serviços, visibilidade) | ✅ |
| Vínculo Professional ↔ User (admin pode operar como barber) | ✅ |
| Gestão de agendamentos | ✅ |
| Visão de calendário | ✅ |
| `ProfessionalAvailability` (regras semanais) | ✅ API + modelo |
| Interface de edição de disponibilidade | 📋 Em andamento |
| Módulo financeiro | 📋 Apenas placeholder |

### Arquitetura preparada para IA

A estrutura permite que agentes e automações consumam a **mesma API REST** e as mesmas regras de agenda.

| Capacidade | Situação |
|------------|----------|
| API stateless para agentes | ✅ |
| Camadas de domínio desacopladas | ✅ |
| Endpoints públicos com escopo por telefone | ✅ |
| Agente operacional LangGraph | 📋 Planejado |
| Integração WAHA (WhatsApp) | 📋 Planejado |
| Lembretes e reagendamento automático | 📋 Planejado |

---

## Stack tecnológica

### Backend

- **FastAPI** — API REST assíncrona, OpenAPI
- **SQLAlchemy 2** — ORM async
- **PostgreSQL 16**
- **Redis 7** — conexão na subida (pronto para cache/filas)
- **Alembic** — migrations 001–007

### Frontend

- **Next.js** (App Router)
- **React** + **TypeScript**
- **TanStack React Query**
- **Tailwind CSS** + **shadcn/ui**
- **React Hook Form** + **Zod**

### Infraestrutura

- **Docker** + **Docker Compose** — `postgres`, `redis`, `api`, `web`

### Camada de IA (futura)

- **LangGraph** — fluxos do agente operacional
- **OpenAI** — provedor LLM
- **WAHA** — gateway HTTP para WhatsApp

---

## Arquitetura

### Dois fluxos, um domínio

```text
                 FLUXO PÚBLICO                      FLUXO OPERACIONAL
                       │                                    │
   Cliente ──► Home / Booking / Meus agendamentos    Staff ──► Dashboard (JWT)
                       │                                    │
                       └──────────────┬─────────────────────┘
                                      ▼
                           FastAPI (REST v1)
                                      │
                 ┌────────────────────┼────────────────────┐
                 ▼                    ▼                    ▼
           Serviços            Profissionais          Agendamentos
                 │                    │                    │
                 └──── professional_services (N:N) ──────┘
                                      ▼
                                PostgreSQL
```

### RBAC

| Entidade | Papel |
|----------|--------|
| **User** (`admin` / `barber`) | Autenticação — login, senha, papel |
| **Professional** | Perfil público, serviços executados, disponibilidade, agenda |
| **Cliente (guest)** | Agendamento e consulta por telefone — sem User |

- **Admin:** controle total da operação.
- **Barber:** própria agenda e perfil; navegação restrita.

### Motor de agenda (conceito central)

> **Agendamento ≠ um único serviço.**  
> **Agendamento = sessão de atendimento.** Os serviços ficam em **itens da sessão**.

| Entidade | Significado |
|----------|-------------|
| **Appointment** | Sessão: `start_time`, `end_time`, `total_duration_minutes`, `total_price` |
| **AppointmentItem** | Serviço na sessão: `service_id`, duração, preço, ordem |
| **ProfessionalAvailability** | Regra semanal: dia, início, fim, ativo |

**Algoritmo atual:**

1. Soma da duração dos serviços escolhidos.
2. Profissionais compatíveis (relação N:N com serviços).
3. Janelas de `ProfessionalAvailability` no dia da semana.
4. Bloqueio por intervalos já ocupados (sobreposição real).
5. Passo de busca de horários: **15 minutos**.

Preparado para: folgas, férias, exceções, combos e encaixes sugeridos por IA.

### Camadas no backend

```text
api/v1  →  services  →  repositories  →  models
              ↑
         schemas (Pydantic)
```

---

## Estrutura de pastas

```text
barber_refac/
├── backend/           # FastAPI, modelos, migrations
├── frontend/          # Next.js, features por domínio
├── docs/              # referências de entidades e etapas
├── docker-compose.yml # stack completa
├── .env.example
├── README.md          # inglês
└── README.pt-BR.md    # português (este arquivo)
```

Detalhe do backend: `app/api`, `app/services`, `app/repositories`, `app/models`, `alembic/`.  
Detalhe do frontend: `src/app` (rotas), `src/features` (módulos de negócio).

---

## Como rodar localmente

### Requisitos

- Docker e Docker Compose **ou**
- Python 3.12+, Node 20+, PostgreSQL 16, Redis 7

### Início rápido (Docker — recomendado)

```bash
cd barber_refac
cp .env.example .env
# Ajuste JWT e senha do admin antes de ambientes compartilhados

docker compose up --build
```

| Serviço | URL |
|---------|-----|
| Frontend (dev) | http://localhost:3001 (`WEB_PORT` padrão) |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Migration atual no Alembic: **007**. Admin inicial: variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

### Só backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Só frontend

```bash
cd frontend
npm install
npm run dev
```

Use `.env` na raiz para Compose ou `.env.local` no frontend com `NEXT_PUBLIC_API_URL=http://localhost:8000`.

### Variáveis essenciais

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Conexão PostgreSQL async |
| `REDIS_URL` | Redis |
| `JWT_SECRET_KEY` / `JWT_REFRESH_SECRET_KEY` | Tokens |
| `CORS_ORIGINS` | Origens do frontend |
| `NEXT_PUBLIC_API_URL` | Base da API no Next.js |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed do administrador |

---

## Status do desenvolvimento

Repositório em **evolução contínua**. Hoje está sólido:

- Arquitetura **FastAPI + Next.js** desacoplada
- **PostgreSQL** com migrations versionadas
- **Booking público** e autoatendimento por telefone
- Modelo de **sessão** com `AppointmentItem`
- **Disponibilidade** em tabela própria (não mais horário fixo no profissional)
- **RBAC** e regras de vínculo User ↔ Professional

Ainda em construção:

- Motor de agenda (multi-serviço na UI, exceções, pausas)
- UX operacional e editor de disponibilidade
- Módulos financeiro e estoque
- **Nenhum agente de IA em produção** — apenas estrutura preparada

---

## Roadmap / próximos passos

### Foco atual · em andamento

- [ ] Estabilização do scheduling engine
- [ ] Booking público com múltiplos serviços (`service_ids` na UI)
- [ ] UI de gestão de `ProfessionalAvailability`
- [ ] Refino do dashboard e calendário (mobile-first)
- [ ] QA do fluxo de agendamento

### Próximos módulos · planejado

- [ ] Financeiro (faturamento, fluxo de caixa)
- [ ] Estoque / produtos
- [ ] Comissões por profissional
- [ ] Registro de vendas
- [ ] Despesas operacionais

### Camada de IA · planejado

- [ ] Agente operacional no WhatsApp (LangGraph + WAHA)
- [ ] Agendamento automatizado por chat
- [ ] Lembretes de horário
- [ ] Assistência a reagendamento
- [ ] Suporte ao cliente com escalonamento humano

### Melhorias futuras · planejado

- [ ] White-label por unidade
- [ ] Temas customizáveis
- [ ] Analytics
- [ ] Sistema de notificações
- [ ] Deploy em produção documentado
- [ ] CI/CD

---

## Visão de IA

Objetivo: um **agente operacional no WhatsApp** que respeite as mesmas regras da aplicação web:

- Consultar disponibilidade real (regras semanais + agenda ocupada)
- Criar sessões com vários `AppointmentItem`
- Enviar lembretes e tratar cancelamento/reagendamento com validação por telefone
- Encaminhar para humano quando necessário

Não há runtime LangGraph neste repositório ainda. A API foi desenhada para que a automação seja plugada depois, sem reescrever o domínio.

---

## API (resumo)

| Área | Prefixo |
|------|---------|
| Health | `/api/v1/health` |
| Auth | `/api/v1/auth` |
| Serviços | `/api/v1/services` |
| Profissionais | `/api/v1/professionals` |
| Agendamentos (staff) | `/api/v1/appointments` |
| Agendamentos públicos | `/api/v1/public/appointments` |

Documentação interativa: **http://localhost:8000/docs**

---

## Documentação complementar

- [`docs/ENTIDADES.md`](docs/ENTIDADES.md) — mapa do domínio legado (referência de migração)
- [`docs/ETAPA1.md`](docs/ETAPA1.md) — notas da infraestrutura inicial

---

## Contribuindo

Projeto de portfólio / produto em refatoração. Após publicação no GitHub:

1. Faça fork
2. Branch (`git checkout -b feature/minha-mudanca`)
3. Commits claros
4. Abra um Pull Request

---

## Licença

MIT — arquivo `LICENSE` na raiz do repositório.

---

<p align="center">
  <sub>Refatoração SaaS profissional · PostgreSQL-first · Preparado para IA operacional</sub>
</p>
