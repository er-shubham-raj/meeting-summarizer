# SummizeAI - Production AI Meeting Summarizer & Action Item Extractor

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61dafb.svg)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%205-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20Whisper%20%2B%20Llama%20120B-f55036.svg)](https://groq.com/)

A full-stack, enterprise-grade Meeting Summarizer application that converts uploaded meeting video/audio recordings into high-accuracy speech transcripts, structured executive summaries, key decisions, and prioritized action items using **Groq Speech-to-Text (`whisper-large-v3-turbo`)**, **Groq LLM (`openai/gpt-oss-120b`)**, and **FFmpeg audio extraction**.

---
## Deployed Link - https://meeting-summarizer-shubham.up.railway.app/
## 1. Overview & Problem Statement

### The Problem
Organizations lose hundreds of hours processing meeting recordings, manually listening to audio tracks, scribbling notes, and tracking action item ownership. Manual meeting notes are often incomplete, inconsistent, or lack explicit responsibility assignments.

### The Solution
SummizeAI provides an automated end-to-end pipeline:
1. **Media Ingestion & FFmpeg Audio Extraction**: Securely accepts meeting audio/video files (MP3, WAV, M4A, MP4, MKV). If a video file is uploaded, FFmpeg automatically extracts the acoustic audio track into an optimized audio stream.
2. **High-Speed Speech-to-Text (STT)**: Converts audio into verbatim text transcripts using Groq's Hosted Whisper STT API (`whisper-large-v3-turbo`).
3. **Zero-Hallucination LLM Analysis**: Employs prompt engineering and Zod-enforced JSON schema validation using Groq's high-speed LLM engine (`openai/gpt-oss-120b`) to extract structured executive summaries, explicit key decisions, and assigned action items with deadlines.
4. **Interactive Dashboard**: Displays searchable transcripts, copy/download utilities, prioritized action item cards, and real-time processing status.

---

## 2. Architecture & Core Workflow

```mermaid
flowchart TD
    User([User / Browser]) -->|1. Upload Audio/Video File| ReactFrontend[React 18 + Vite + TS Frontend]
    ReactFrontend -->|2. POST /api/meetings/upload| ExpressBackend[Node.js + Express + TS Backend]
    
    subgraph ExpressBackend [Node.js Express Backend]
        AudioVal[Audio/Video Validation & Multer] -->|Validate MIME, Ext, Size| TempStorage[Temp Disk Storage /uploads]
        TempStorage -->|Create Record status: UPLOADED| DB[(PostgreSQL / Prisma)]
        
        AsyncPipe[Async Background Pipeline] -->|3. Extract Audio Track if Video| FFmpegEngine[FFmpeg Service ffmpeg-static]
        FFmpegEngine -->|Extracted Audio| STTService[Transcription Service]
        AsyncPipe -->|4. STT API Call status: TRANSCRIBING| STTService
        STTService -->|Return Transcript| LLMService[Summarization Service]
        AsyncPipe -->|5. LLM API Call status: SUMMARIZING| LLMService
        LLMService -->|6. Zod Schema Validation| SummaryValidator[Zod Validator]
    end

    STTService -->|Groq SDK whisper-large-v3-turbo| GroqWhisper[Groq Speech-to-Text API]
    LLMService -->|Groq SDK openai/gpt-oss-120b| GroqLLM[Groq LLM API]
    
    SummaryValidator -->|7. Store Structured Summary status: COMPLETED| DB
    ReactFrontend -->|8. Poll GET /api/meetings/:id/status| ExpressBackend
    ReactFrontend -->|9. Fetch GET /api/meetings/:id| ExpressBackend
```

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Glassmorphism aesthetic tokens
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js v20+
- **Framework**: Express.js with layered architecture (`routes` -> `controllers` -> `services` -> `Prisma`)
- **Type System**: TypeScript (Strict Mode)
- **AI SDK**: Official Groq Node.js SDK (`groq-sdk`)
- **Audio Extraction**: FFmpeg (`ffmpeg-static` + `fluent-ffmpeg`)
- **Validation**: Zod (Schema validation for API inputs and LLM structured outputs)
- **File Handling**: Multer (Multipart audio/video upload handling)
- **Security**: Helmet, CORS, Express Rate Limit

### Database & ORM
- **Database**: PostgreSQL
- **ORM**: Prisma ORM v5

### DevOps & Testing
- **Containers**: Docker & Docker Compose
- **Testing**: Vitest + Supertest

---

## 4. Key Technical Rationale

### Why Speech-to-Text (ASR) is Required
Audio/video binary data cannot be processed directly by language models. Speech-to-text conversion bridges raw acoustic waveforms and textual semantic tokens. Utilizing Groq's Hosted Whisper API (`whisper-large-v3-turbo`) ensures ultra-fast, high-accuracy multilingual transcription.

### Why Provider Abstraction Architecture Was Implemented
The application uses modular provider interfaces (`ISpeechToTextProvider` and `ILLMProvider`) under `server/src/services/providers/`. This decouples the core meeting domain logic from specific AI vendors, making it easy to swap or test providers without modifying database schemas or frontend components.

### Why PostgreSQL + Prisma
Structured meeting summaries require relational models (meetings linked to JSON/relational action items, timestamps, status transitions). PostgreSQL provides reliability, while Prisma offers type-safe database queries and automated schema migrations.

---

## 5. Folder Structure

```
meeting-summarizer/
├── client/                     # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── AudioUploader.tsx
│   │   │   ├── ProcessingTracker.tsx
│   │   │   ├── MeetingCard.tsx
│   │   │   ├── SummaryTab.tsx
│   │   │   ├── TranscriptTab.tsx
│   │   │   ├── ActionItemsTab.tsx
│   │   │   └── DecisionsTab.tsx
│   │   ├── pages/              # Main route pages
│   │   │   ├── DashboardPage.tsx
│   │   │   └── MeetingDetailsPage.tsx
│   │   ├── services/           # Axios API client
│   │   │   └── api.ts
│   │   ├── types/              # Frontend TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
│
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Environment, DB, Zod configs
│   │   ├── controllers/        # REST controller handlers
│   │   ├── middleware/         # Multer, Error, Rate Limit middleware
│   │   ├── prompts/            # System & user LLM prompts
│   │   ├── routes/             # Health & Meeting API routes
│   │   ├── services/           # Transcription, Summarization, Meeting, FFmpeg services
│   │   │   └── providers/      # Groq Speech & LLM Provider abstractions
│   │   │       ├── speechProvider.interface.ts
│   │   │       ├── llmProvider.interface.ts
│   │   │       ├── groqSpeechProvider.ts
│   │   │       └── groqLLMProvider.ts
│   │   ├── types/              # Backend TypeScript types
│   │   ├── validators/         # Zod schemas for requests & LLM output
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # HTTP server listener
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Prisma migration history
│   ├── tests/                  # Vitest API integration tests
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Container orchestrator
├── .env.example                # Environment variables template
└── README.md
```

---

## 6. API Documentation

### Health Check
`GET /api/health`
```json
{
  "status": "healthy",
  "timestamp": "2026-08-24T00:00:00.000Z",
  "env": "development",
  "mockAi": false
}
```

### Upload Meeting Audio/Video
`POST /api/meetings/upload`
- **Content-Type**: `multipart/form-data`
- **Fields**: `audio` (File, max 25MB), `title` (string, optional)
- **Response**: `202 Accepted`
```json
{
  "success": true,
  "message": "Meeting audio uploaded successfully. Processing started.",
  "data": {
    "id": "e2a4b890-7c2d-419b-a63e-118f98d5c412",
    "title": "Q3 Engineering Roadmap Review",
    "status": "UPLOADED",
    "createdAt": "2026-08-24T00:00:00.000Z"
  }
}
```

### Get All Meetings
`GET /api/meetings?search=roadmap`
```json
{
  "success": true,
  "data": [
    {
      "id": "e2a4b890-7c2d-419b-a63e-118f98d5c412",
      "title": "Q3 Engineering Roadmap Review",
      "originalFileName": "roadmap.mp3",
      "status": "COMPLETED",
      "createdAt": "2026-08-24T00:00:00.000Z"
    }
  ]
}
```

### Status Polling
`GET /api/meetings/:id/status`
```json
{
  "success": true,
  "data": {
    "status": "SUMMARIZING",
    "errorMessage": null
  }
}
```
*Possible Statuses*: `UPLOADED`, `TRANSCRIBING`, `SUMMARIZING`, `COMPLETED`, `FAILED`.

---

## 7. Environment Variables Reference

| Variable | Description | Required in Prod | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Server HTTP port | No (default `5000`) | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | Yes | `production` |
| `CLIENT_URL` | Frontend URL for CORS | Yes | `https://my-app.up.railway.app` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:password@host:5432/dbname` |
| `GROQ_API_KEY` | Groq AI API key | Yes (when `MOCK_AI=false`) | `gsk_your_groq_api_key_here` |
| `OPENAI_API_KEY` | Optional legacy key | No | `sk-...` |
| `MOCK_AI` | Mock AI mode toggle (`false` for real AI) | Yes (`false`) | `false` |

---

## 8. Environment Setup & Running Locally

### 1. Clone & Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/meetingsummarizer?schema=public
GROQ_API_KEY=gsk_your_groq_api_key_here
MOCK_AI=false
```

### 3. Apply Database Migrations
```bash
cd server
npm run prisma:deploy
```

### 4. Run in Development Mode
```bash
# Start both backend and frontend concurrently from root
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### 5. Running Backend Tests
```bash
cd server
npm run test
```

---

## 9. Docker Setup

To run the complete system with PostgreSQL in Docker containers:

```bash
docker-compose up --build
```
- **Web App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL**: `localhost:5432`

---

## 10. Security Considerations

1. **API Key Isolation**: `GROQ_API_KEY` is kept strictly on the backend server and never exposed to client bundles.
2. **File Sanitization**: Multer validates audio extension, MIME type, and restricts file size to 25MB.
3. **Safe Error Handling**: Technical error details are logged server-side, returning user-friendly messages.
4. **Temporary Storage Cleanup**: Uploaded files and extracted MP3 audio files are deleted immediately after processing.
5. **Security Headers & Rate Limiting**: Enforced via `helmet` and `express-rate-limit`.
