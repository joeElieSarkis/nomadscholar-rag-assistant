# NomadScholar AI Frontend

React/Vite interface for NomadScholar AI, a bilingual scholarship and admissions RAG assistant.

## Features

- Multi-chat interface with local chat history
- English and Arabic message support
- Selected-text replies with jump/highlight navigation
- Image and digital PDF attachment flow
- Retrieved source display
- Message copy and edit/regenerate actions
- Checklist extraction panel with PDF export
- Light and dark themes

## Setup

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

The app expects the FastAPI backend at:

```text
http://127.0.0.1:8000
```

To use a different backend URL, create a frontend environment file and set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Checks

```bash
npm run lint
npm run build
```
