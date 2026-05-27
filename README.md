# Barber SaaS Platform

**AI-ready barber shop operations platform** with public booking, role-based dashboard, and a dynamic scheduling engine — built as a modern refactor from a legacy Django stack.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Português:** see [README.pt-BR.md](./README.pt-BR.md)

---

## Overview

This is **not** a generic barbershop CRUD demo. It is an **operational SaaS foundation** designed for:

- **Public self-service booking** (no account required)
- **Internal operations** (admin + barber roles)
- **Interval-based scheduling** (not fixed slots)
- **Multi-service appointments** (session model)
- **Future AI layer** (WhatsApp agent, automation) without coupling business logic to the UI

| Layer | Status |
|-------|--------|
| Core API + PostgreSQL + migrations | ✅ Implemented |
| JWT auth + RBAC (`admin`, `barber`) | ✅ Implemented |
| Public booking + “My appointments” | ✅ Implemented |
| Dynamic scheduling base (`AppointmentItem`, `ProfessionalAvailability`) | ✅ Implemented (evolving) |
| Financial / inventory / AI agents | 📋 Planned |

**Version:** API `0.2.0` · **Active development**

---

## Preview

Screenshots will be added before the public GitHub release. Placeholders below mark the main product surfaces.

| Surface | Route | Description |
|---------|-------|-------------|
| **Public home** | `/` | Landing, services showcase, professionals, WhatsApp CTA |
| **Booking flow** | `/booking` | Service → professional → date → time → confirmation |
| **My appointments** | `/my-appointments` | Lookup by phone, cancel / reschedule |
| **Dashboard** | `/dashboard` | Role-based operational overview |
| **Calendar** | `/dashboard/calendar` | Appointment calendar view |
| **Settings → Profile** | `/dashboard/settings/profile` | Professional public profile (photo, bio, services) |

```text
┌─────────────────────────────────────────────────────────────┐
│  [ Public Home ]     [ Booking ]     [ My Appointments ]    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  FastAPI API  ◄──►  PostgreSQL  │  Redis (infra ready)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Dashboard (admin / barber)  ·  Calendar  ·  Professionals  │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### Public experience

| Feature | Status |
|---------|--------|
| Public landing page | ✅ |
| Service catalog (public) | ✅ |
| Professionals showcase (visibility-controlled) | ✅ |
| Step-by-step booking flow | ✅ |
| Available slots API (duration-aware, 15 min granularity) | ✅ |
| “My appointments” by phone (list / cancel / reschedule) | ✅ |
| WhatsApp deep link CTA | ✅ (manual link; WAHA automation planned) |
| Multi-service selection in one booking (UI) | 📋 Planned (API supports `service_ids`) |

### Operational dashboard

| Feature | Status |
|---------|--------|
| JWT login (access + refresh) | ✅ |
| Admin seed on first startup | ✅ |
| Role-based navigation (`admin` / `barber`) | ✅ |
| Services CRUD | ✅ |
| Professionals onboarding (name, login, active flag) | ✅ |
| Professional profile (bio, avatar, specialties, services, visibility) | ✅ |
| Professional ↔ User linking (admin can operate as barber) | ✅ |
| Appointments management | ✅ |
| Calendar view | ✅ |
| `ProfessionalAvailability` (weekly rules) | ✅ API + model |
| Availability management UI | 📋 In progress |
| Financial module | 📋 Placeholder only |

### AI-ready architecture

The codebase is structured so an **AI / automation layer** can call the same REST API and domain services without rewriting scheduling rules.

| Capability | Status |
|------------|--------|
| Stateless API suitable for agents | ✅ |
| Clear domain boundaries (services / repositories) | ✅ |
| Public appointment endpoints (phone-scoped) | ✅ |
| LangGraph operational agent | 📋 Planned |
| WAHA WhatsApp integration | 📋 Planned |
| Automated reminders / rescheduling | 📋 Planned |

---

## Tech stack

### Backend

- **FastAPI** — async REST API, OpenAPI docs
- **SQLAlchemy 2** — ORM (async)
- **PostgreSQL 16** — primary datastore
- **Redis 7** — connected at startup (caching/queues ready)
- **Alembic** — schema migrations (001–007)

### Frontend

- **Next.js** (App Router)
- **React** + **TypeScript**
- **TanStack React Query** — server state
- **Tailwind CSS** + **shadcn/ui** — UI system
- **React Hook Form** + **Zod** — forms and validation

### Infrastructure

- **Docker** + **Docker Compose** — `postgres`, `redis`, `api`, `web`

### Future AI layer (planned)

- **LangGraph** — operational agent workflows
- **OpenAI** — LLM provider
- **WAHA** — WhatsApp HTTP API gateway

---

## Architecture

### Two flows, one domain

```text
                    PUBLIC FLOW                         OPERATIONAL FLOW
                          │                                    │
    Guest ──► Landing / Booking / My Appointments      Staff ──► Dashboard (JWT)
                          │                                    │
                          └──────────────┬─────────────────────┘
                                         ▼
                              FastAPI (v1 REST)
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
              Services            Professionals           Appointments
                    │                    │                    │
                    └──────── professional_services ────────┘
                                         │
                                         ▼
                                   PostgreSQL
```

### RBAC

| Role | Responsibility |
|------|----------------|
| **User** (`admin` / `barber`) | Authentication only — login, password, role |
| **Professional** | Public profile, services performed, availability, calendar |
| **Guest** | Booking and appointment lookup via phone (no User record) |

- **Admin:** full operational control (services, professionals, all appointments).
- **Barber:** own appointments + profile; restricted navigation.

### Scheduling engine (core concept)

> **An appointment is not a single service.**  
> **An appointment is a session.** Services inside the session are **appointment items**.

| Entity | Meaning |
|--------|---------|
| **Appointment** | Client session: `start_time`, `end_time`, `total_duration_minutes`, `total_price` |
| **AppointmentItem** | One service in the session: `service_id`, `duration_minutes`, `price`, `position` |
| **ProfessionalAvailability** | Weekly availability rule: `weekday`, `start_time`, `end_time`, `active` |

**Slot algorithm (current):**

1. Client selects service(s) → total duration is summed.
2. System loads professionals who can perform those services (M2M).
3. Weekly availability windows are applied per weekday.
4. Existing appointments block **real time intervals** (overlap detection).
5. Candidate start times advance in **15-minute** steps.

Designed for future: breaks, vacations, exceptions, combos, and AI-suggested gaps.

### Layering (backend)

```text
api/v1  →  services  →  repositories  →  models
              ↑
         schemas (Pydantic)
```

---

## Folder structure

```text
barber_refac/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST routers (auth, services, professionals, appointments, public)
│   │   ├── core/            # config, deps, RBAC, exceptions
│   │   ├── db/              # SQLAlchemy session, Redis
│   │   ├── models/          # domain models
│   │   ├── repositories/    # data access
│   │   ├── schemas/         # request/response DTOs
│   │   ├── services/        # business logic
│   │   └── utils/           # security, phone, uploads
│   ├── alembic/             # migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js routes (public + dashboard + auth)
│   │   ├── features/        # domain modules (appointments, professionals, …)
│   │   ├── components/      # shared UI
│   │   └── config/          # nav, branding
│   ├── Dockerfile
│   └── package.json
├── docs/                    # entity reference, stage notes
├── docker-compose.yml       # full stack
├── .env.example
├── README.md                # English (this file)
└── README.pt-BR.md          # Portuguese
```

---

## Running locally

### Prerequisites

- Docker & Docker Compose **or**
- Python 3.12+, Node.js 20+, PostgreSQL 16, Redis 7

### Quick start (Docker — recommended)

```bash
cd barber_refac
cp .env.example .env
# Edit JWT secrets and admin password before any shared deployment

docker compose up --build
```

| Service | URL |
|---------|-----|
| Web (dev) | http://localhost:3001 (default `WEB_PORT`) |
| API | http://localhost:8000 |
| OpenAPI | http://localhost:8000/docs |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Migrations run on API container startup via Alembic. Current head: **007** (booking refactor).

Default admin (seeded if none exists): see `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.

### Backend only (local)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Use .env at project root or export DATABASE_URL
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend only (local)

```bash
cd frontend
npm install
# NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Copy variables from `.env.example` into `.env` (root) for Compose, or `.env.local` in `frontend/` for local Next.js.

### Environment variables (essential)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Async PostgreSQL connection |
| `REDIS_URL` | Redis connection |
| `JWT_SECRET_KEY` / `JWT_REFRESH_SECRET_KEY` | Token signing |
| `CORS_ORIGINS` | Allowed frontend origins |
| `NEXT_PUBLIC_API_URL` | Frontend → API base URL |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First-run admin seed |

---

## Current development status

This repository is under **active development**. What is stable today:

- Decoupled **FastAPI + Next.js** architecture
- **PostgreSQL** schema with Alembic migrations
- **Public booking** and **phone-based appointment self-service**
- **Appointment session model** with `AppointmentItem`
- **Professional availability** as weekly rules (not fixed hours on `Professional`)
- **RBAC** and professional ↔ user linking rules

What is still evolving:

- Scheduling engine (multi-service UX, exceptions, breaks, vacations)
- Operational UX polish (availability editor, calendar enhancements)
- Financial and inventory modules
- **No AI agents implemented yet** — structure is ready, not the runtime

---

## Roadmap / next steps

### Current focus · in progress

- [ ] Scheduling engine stabilization (gaps, overlap rules, edge cases)
- [ ] Multi-service booking in public UI (`service_ids`)
- [ ] Professional availability management UI
- [ ] Operational UX (dashboard, calendar, mobile-first polish)
- [ ] Booking flow QA and error handling

### Next modules · planned

- [ ] Financial module (revenue, cash flow)
- [ ] Inventory / retail products
- [ ] Commissions per professional
- [ ] Sales tracking
- [ ] Operational expenses

### AI layer · planned

- [ ] WhatsApp operational agent (LangGraph + WAHA)
- [ ] Automated booking via chat
- [ ] Appointment reminders
- [ ] Rescheduling assistance
- [ ] Customer support automation (FAQ + handoff)

### Future improvements · planned

- [ ] White-label branding per tenant
- [ ] Custom themes
- [ ] Analytics dashboard
- [ ] Notification system (email / push / WhatsApp)
- [ ] Production deployment guide
- [ ] CI/CD pipeline

---

## AI vision

The long-term goal is an **operational WhatsApp agent** that uses the same scheduling rules as the web app:

- Answer availability questions using `ProfessionalAvailability` + live appointments
- Create sessions with multiple `AppointmentItem` rows
- Send reminders and handle reschedule/cancel flows with phone verification
- Escalate to human staff when confidence is low

No LLM or graph runtime ships in this repo yet. The API and service layer are intentionally **agent-friendly** so automation can be added without redesigning the core domain.

---

## API overview

| Area | Prefix | Notes |
|------|--------|-------|
| Health | `/api/v1/health` | Liveness |
| Auth | `/api/v1/auth` | Login, refresh |
| Services | `/api/v1/services` | Catalog |
| Professionals | `/api/v1/professionals` | CRUD, profile, availability, slots |
| Appointments | `/api/v1/appointments` | Staff (JWT) |
| Public appointments | `/api/v1/public/appointments` | Guest booking |

Interactive docs: **http://localhost:8000/docs**

---

## Documentation

- [`docs/ENTIDADES.md`](docs/ENTIDADES.md) — legacy domain reference (migration guide)
- [`docs/ETAPA1.md`](docs/ETAPA1.md) — early infrastructure notes

---

## Contributing

This project is primarily a portfolio / product refactor. Issues and PRs are welcome once the public repository is published.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-change`)
3. Commit with clear messages
4. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) file in the repository root (add `LICENSE` if not present yet).

---

<p align="center">
  <sub>Built as a professional SaaS refactor · PostgreSQL-first · AI-ready by design</sub>
</p>
