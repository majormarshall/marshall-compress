# MARSHALL Platform

> Enterprise AI-Powered Productivity SaaS: Unified Cloud Storage, Ultra-Fast Media Compression, Automated Meeting Intelligence, Collaborative Rich-Text Notes, and Provider-Agnostic AI Workflows.

---

## Overview & Core Modules

MARSHALL is an all-in-one productivity platform designed for modern professionals and distributed teams. It consolidates five core tools into a cohesive, high-performance monorepo:

### 1. 🗜️ Compress (Media Optimization Engine)
- **High-Fidelity Lossless & Lossy Compression**: Images (Sharp v0.35: AVIF, WebP, JPEG, PNG), Videos (ffmpeg-static via `child_process.spawn`: MP4, WebM, MKV), Audio (MP3, AAC, FLAC), and PDF documents.
- **Configurable Presets**: `FAST`, `BALANCED`, and `MAXIMUM` with quality dials and target size constraints.
- **Asynchronous Processing**: Background job management using BullMQ v6 and Redis with real-time progress updates.

### 2. 🎙️ Meetings (Meeting Intelligence & Diarization)
- **Automated Sync**: Integrations with Zoom and Google Meet webhooks for instant recording ingestion.
- **Whisper & AI Transcription**: Speaker-separated transcripts with precise timestamps and confidence metrics.
- **Action Item Extraction**: Automatic extraction of key takeaways, decisions, and trackable action items.

### 3. 📝 Notes (Knowledge Base & Tiptap Editor)
- **Rich-Text Collaborative Editor**: Powered by Tiptap v3 with markdown shortcuts, formatting, and media embeds.
- **Structured Hierarchy**: Nested folders, color-coded tags, and semantic search.
- **Multi-Format Export**: One-click export to PDF, DOCX, TXT, and Markdown.

### 4. 🤖 AI Assistant (Provider-Agnostic Workflows)
- **Multi-Model Orchestration**: Provider adapters for OpenAI, Google Gemini, and Anthropic Claude behind a unified interface.
- **Document Q&A**: Chat with uploaded PDFs, research papers, transcripts, and notes with cited references.
- **Smart Summaries & Content Transformation**: Context-aware summarization and generative rewriting.

### 5. ☁️ Cloud (Cloudflare R2 Object Storage)
- **Scalable Object Storage**: S3-compatible storage via Cloudflare R2 (`@aws-sdk/client-s3` and `@aws-sdk/lib-storage`).
- **Resilient Multipart Uploads**: Direct-to-bucket chunked uploads for files up to 2GB.
- **Access Control & Organization**: Folder trees, quarantine scanning, quota enforcement, and secure pre-signed URLs.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Monorepo Engine** | [Turborepo 2](https://turbo.build/) + [pnpm 9](https://pnpm.io/) workspaces |
| **Frontend Web App** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v3](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) (`--base radix`) |
| **Frontend State & Data** | [TanStack Query v5](https://tanstack.com/query/latest), [Zustand](https://zustand.docs.pmnd.rs/), [React Hook Form v7](https://react-hook-form.com/), [Zod v4](https://zod.dev/) |
| **Rich Text Editor & UI** | [Tiptap v3](https://tiptap.dev/), [Lucide React v1](https://lucide.dev/), [Recharts v3](https://recharts.org/) |
| **Backend API** | [NestJS 12](https://nestjs.com/) (ESM-First), [TypeScript 7](https://www.typescriptlang.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (`@supabase/supabase-js` v2, `@supabase/ssr` v0.12 - `getAll`/`setAll` cookies) |
| **Queue & Cache** | [BullMQ v6](https://docs.bullmq.io/) + [Redis 7](https://redis.io/) |
| **Object Storage** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) via `@aws-sdk/client-s3` v3 & `@aws-sdk/lib-storage` (MinIO for local dev) |
| **Media Processing** | [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) (`child_process.spawn`), [Sharp v0.35](https://sharp.pixelplumbing.com/) |
| **AI Adapters** | Provider-agnostic abstraction for OpenAI, Google Gemini, Anthropic Claude |

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v22.0.0` or higher
- **pnpm**: `v9.15.9` or higher (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- **Docker & Docker Compose**: For local Redis, MinIO, and MailHog

---

## Local Setup

### 1. Clone & Enter the Monorepo
```bash
git clone <repository-url>
cd "MARSHALL COM"
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Up Environment Variables
Copy `.env.example` to `.env` in the root (or configure individual apps):
```bash
cp .env.example .env
```
Update all placeholder credentials (Supabase keys, R2 tokens, Redis URLs, AI keys).

### 4. Start Infrastructure Containers
Launch local Redis, MinIO (local S3), and MailHog:
```bash
docker compose up -d
```
Verify container services:
- **Redis**: `localhost:6379`
- **MinIO S3 API**: `http://localhost:9000`
- **MinIO Console**: `http://localhost:9001` (User: `minioadmin` / Pass: `minioadminpassword`)
- **MailHog Web UI**: `http://localhost:8025`

### 5. Build Shared Packages
```bash
pnpm build
```

### 6. Start Development Servers
Run the full monorepo development pipeline via Turborepo:
```bash
pnpm dev
```

---

## Environment Variables

Key variables required across the monorepo:

| Variable | Description | Default / Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase instance URL | `https://your-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous API key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase privileged service role key | `eyJhbGci...` |
| `API_URL` / `NEXT_PUBLIC_API_URL` | NestJS backend API endpoint | `http://localhost:4000` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 / S3 access key ID | R2 Access Key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 / S3 secret access key | R2 Secret Key |
| `R2_BUCKET_NAME` | Target storage bucket | `marshall-storage` |
| `REDIS_URL` | Connection URL for Redis / BullMQ | `redis://localhost:6379` |
| `DEFAULT_AI_PROVIDER` | Default active AI provider | `openai` (`google` \| `anthropic`) |
| `OPENAI_API_KEY` | OpenAI API Secret Key | `sk-...` |
| `GOOGLE_AI_API_KEY` | Google Gemini API Secret Key | `AIzaSy...` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API Secret Key | `sk-ant-...` |
| `WORKER_CONCURRENCY` | Maximum concurrent BullMQ worker threads | `4` |
| `MAX_FILE_SIZE_MB` | Maximum allowed upload size (MB) | `2048` |

---

## Development Commands

| Command | Action |
|---|---|
| `pnpm dev` | Start all apps and services concurrently with hot reload |
| `pnpm build` | Build all shared packages and applications in topological order |
| `pnpm lint` | Run ESLint flat config checks across all workspaces |
| `pnpm test` | Run test suites across all packages and apps |
| `pnpm type-check` | Execute strict TypeScript validation (`tsc --noEmit`) |
| `pnpm format` | Format the entire codebase with Prettier |

---

## Project Structure

```text
MARSHALL COM/
├── apps/
│   ├── web/                    # Next.js 16 App Router frontend
│   ├── api/                    # NestJS 12 ESM REST & WebSocket backend
│   └── worker/                 # BullMQ v6 media & AI processing worker
├── packages/
│   ├── config/                 # Shared configs (ESLint flat configs, tsconfigs)
│   │   ├── eslint.base.js
│   │   ├── eslint.nextjs.js
│   │   ├── eslint.nestjs.js
│   │   ├── tsconfig.base.json
│   │   ├── tsconfig.nextjs.json
│   │   └── tsconfig.nestjs.json
│   ├── shared/                 # Monorepo shared library
│   │   ├── src/
│   │   │   ├── constants/      # MIME types, limits, compression presets
│   │   │   ├── schemas/        # Zod v4 validation schemas
│   │   │   ├── types/          # Core TypeScript contracts and domain models
│   │   │   ├── utils/          # Pure helper utilities
│   │   │   └── index.ts        # Shared package barrel export
│   │   └── package.json
│   └── ui/                     # Shared Tailwind v3 + shadcn/ui components
├── docker-compose.yml          # Local infra: Redis, MinIO, MailHog
├── pnpm-workspace.yaml         # pnpm workspace definition
├── turbo.json                  # Turborepo task pipeline
├── .env.example                # Canonical environment template
├── .gitignore                  # Git ignore rules
├── .prettierrc                 # Code formatting rules
└── package.json                # Monorepo root package definition
```

---

## License

Proprietary and confidential. Copyright &copy; MARSHALL. All rights reserved.
