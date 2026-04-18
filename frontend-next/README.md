# Qualifier — Next.js Frontend

Premium production-style frontend for the Sales Lead Qualifier API, built with Next.js (App Router), Tailwind CSS, and shadcn/ui-style components.

## Design

- Clean light theme with slate neutrals and an emerald accent (no generic AI purple)
- Inter body + Manrope display for a modern RevOps feel
- Subtle motion, soft shadows, grid backdrop
- Responsive: sidebar nav on desktop, top bar on mobile

## Pages

- `/` — Qualify a single lead with ICP panel + live result view
- `/bulk` — CSV upload, progress, results table, enriched CSV export
- `/history` — All previously qualified leads
- `/leads/[id]` — Full lead detail view

## Getting started

From this directory:

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

The app runs at `http://localhost:3000` and expects the FastAPI backend at `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL`).

Start the backend in a separate terminal from the project root:

```bash
uvicorn app.main:app --reload
```

CORS for `http://localhost:3000` is already enabled on the backend.

## Structure

```
frontend-next/
├── app/                 # App Router pages
│   ├── layout.tsx       # Root layout (fonts, shell, toaster)
│   ├── page.tsx         # Dashboard (qualify a lead)
│   ├── bulk/page.tsx    # Bulk CSV upload
│   ├── history/page.tsx # Lead history
│   └── leads/[id]/page.tsx # Lead detail
├── components/
│   ├── ui/              # Primitives (button, card, table, …)
│   ├── result/          # Score breakdown, signals, outreach, …
│   ├── bulk/            # CSV uploader
│   ├── app-shell.tsx    # Sidebar + top nav
│   ├── icp-panel.tsx    # ICP editor with presets
│   └── qualify-form.tsx # Single-lead form
├── lib/                 # utils, formatters, ICP presets
├── services/api.ts      # Typed API client
└── types/lead.ts        # Shared types mirroring the FastAPI schemas
```

## Notes

- State lives client-side; pages use `"use client"` for interactivity.
- The API client handles timeouts, abort, and structured errors via `ApiError`.
- CSV parse and export use `papaparse`. Exports include a UTF-8 BOM so Excel renders non-ASCII characters correctly.
- Toasts are handled by `sonner`.
