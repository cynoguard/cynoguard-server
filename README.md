---

# Fastify + TypeScript + Prisma + PostgreSQL Starter

A minimal, production-ready backend starter using **Fastify**, **TypeScript**, **Prisma**, and **PostgreSQL** with Docker support.

Designed for:

* Clean architecture
* Fast local development
* Easy DB setup
* Public GitHub reuse

---

## ✨ Features

* ⚡ Fastify (high-performance Node.js framework)
* 🧠 TypeScript (strict typing)
* 🗄️ Prisma ORM (PostgreSQL)
* 🐘 PostgreSQL via Docker
* 🔁 Auto-restart with `tsx watch`
* 🧪 DB health check endpoint
* 📦 Clean Prisma adapter setup (`@prisma/adapter-pg`)

---

## 🏗️ Project Structure

```
.
├── prisma/
│   └── schema.prisma
├── src/
│   ├── plugins/
│   │   └── prisma.ts
│   └── server.ts
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```

---

## 🔧 Requirements

* Node.js ≥ 18
* Docker & Docker Compose
* npm / pnpm / yarn

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/fastify-prisma-postgres-starter.git
cd fastify-prisma-postgres-starter
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://testuser:testpassword@localhost:5440/fastify_prisma_starter"
```

> ℹ️ Fastify runs **outside Docker**, PostgreSQL runs **inside Docker**.

---

## 🐘 PostgreSQL (Docker)

### Start Database & Adminer

```bash
docker compose up -d
```

**Services**

* PostgreSQL → `localhost:5440`
* Adminer UI → `http://localhost:8877`

### Adminer Login

```
System: PostgreSQL
Server: localhost
Port: 5440
Username: testuser
Password: testpassword
Database: fastify_prisma_starter
```

---

## ⚠️ Important Docker Note (READ THIS)

PostgreSQL credentials are applied **only on first run**.

If authentication fails:

```bash
docker compose down -v
docker compose up -d
```

This removes old volumes and re-initializes Postgres.

---

## 🧬 Prisma Setup

### Initialize Prisma (already done)

```bash
npx prisma init
```

### Run Migrations

```bash
npx prisma migrate dev --name init
```

### Open Prisma Studio (optional)

```bash
npx prisma studio
```

---

## ▶️ Running the Server (Dev Mode)

The server uses **tsx watch** for auto-restart.

```bash
npm run dev
```

Server starts on:

```
http://localhost:4000
```

---

## 🔍 Health Check Endpoints

### App Health

```
GET /
```

Response:

```json
{ "status": "Ok" }
```

### Database Health

```
GET /api/health/db
```

Response:

```json
{
  "status": "ok",
  "dbTime": "2026-01-21T10:15:32.123Z"
}
```

---

## 🧠 Prisma Integration

### Prisma Plugin

```ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

export const prisma = new PrismaClient({ adapter })
```

### Fastify Decoration

```ts
fastify.decorate('prisma', prisma)
```

Fully typed via module augmentation.

---

## 📜 Scripts

```bash
npm run dev        # Start server with tsx watch
npm run build      # Build TypeScript
npm run start      # Run compiled server
npx prisma studio  # Prisma DB UI
```

---

## 🧪 Example Model

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🚀 Production Notes

* Use managed PostgreSQL (Neon, RDS, Supabase)
* Use `prisma migrate deploy`
* Enable Fastify plugins:

  * rate-limit
  * helmet
  * pino transport
* Add graceful shutdown

---

## 📄 License

MIT

---

## 🤝 Contributing

PRs are welcome.
If you use this starter, ⭐ the repo.

---

