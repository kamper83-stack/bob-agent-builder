# Agent Studio

Agent Studio lets you build personal AI agents grounded in company knowledge — no code required. Define your agent's role, test it against real queries, and let it improve itself based on your ratings.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Screens

- **Define** (`/define`) — configure your agent's name, role, and policy
- **Test** (`/test`) — run the agent against a query and view its output
- **Improve** (`/improve`) — rate the output and accept AI-generated improvements

## Environment

Copy `.env.local.example` to `.env.local` and fill in your values before connecting to the backend.

```bash
cp .env.local.example .env.local
```
