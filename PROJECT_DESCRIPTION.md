Project: Concept in 60 Seconds
=============================

Overview
--------
"Concept in 60 Seconds" is a lightweight learning web app that generates short, practical explanations of concepts and short-form video/storyboard assets using LLMs and cloud services. The app provides search, saved-history, PDF Q&A, and user progress tracking.

Primary Goals
-------------
- Help learners quickly understand concepts via concise explanations and examples.
- Persist and sync user history across devices with Firebase Auth + Firestore.
- Generate media (video/storyboard/slides) on demand via AI services.
- Provide accessibility features (dyslexia mode, focus reader, reading settings).

Key Features
------------
- Concept generation endpoint with LLM integration and JSON parsing.
- Saved searches and recent local searches with merge and deduplication.
- Profile with progress metrics and weekly activity chart.
- PDF Q&A for extracting answers from uploaded PDFs.
- Video/storyboard generation service.

Architecture Overview
---------------------
- Client: React + Vite — UI, auth flows, localStorage for recent searches and progress.
- Server: Express (Node) — API routes for concept generation, video, QA, and authenticated history endpoints.
- Auth & Persistence: Firebase Auth (client) + Firebase Admin / Firestore (server) for saved history.
- AI Services: Anthropic / OpenAI / Google generative API integrations behind server routes.

Tech Stack
----------
- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database/Auth: Firebase Auth, Firestore (server-side access with firebase-admin)
- AI: Anthropic/OpenAI/Google generative APIs (server-side)

Security & Hardening (implemented / recommended)
------------------------------------------------
- Server-side `requireAuth` middleware for sensitive endpoints (implemented for history routes).
- CORS restricted to `CLIENT_ORIGIN` (defaults to `http://localhost:5173`).
- Helmet HTTP security headers enabled.
- Request body size limit and basic rate limiting added to the server.
- Firestore security rules added to restrict `/users/{userId}` access to the authenticated user.

Recommended Next Security Steps
-------------------------------
- Move service account keys to a secret manager and do not commit them.
- Add dependency scanning (Dependabot/Snyk) and CI `npm audit` step.
- Configure CSP policy and strict HSTS via Helmet for production.
- Centralized logging/monitoring (Sentry) and alerting for auth failures or rate-limit events.

API Endpoints (summary)
-----------------------
- POST /api/concept — generate a concept explanation (optional auth; server saves to user history when authenticated)
- POST /api/video — generate video / storyboard assets (optional auth)
- POST /api/qa/pdf-question — ask a question about PDF text
- GET /api/history — (requireAuth) fetch user's saved searchHistory
- DELETE /api/history/:entryId — (requireAuth) delete user's saved item

Data Model (Firestore)
----------------------
Collection: `users/{uid}/searchHistory`
- Fields: `concept`, `category`, `oneLiner`, `scenario`, `exampleScenarios` (array), `keywords` (array), `searchedAt` (timestamp)

Local storage keys
------------------
- `concept60_recent_searches` — recent local searches (keeps duplicates with unique local IDs)
- `concept60_learning_progress` — conceptsReviewed, quizzesCompleted, lessonsSaved, pdfQuestionsAnswered

Developer Setup
---------------
Prereqs: Node.js, npm, Firebase CLI (for rules deploy)

1. Client
```
cd client
npm install
npm run dev
```

2. Server
```
cd server
npm install
# set CLIENT_ORIGIN and other env vars in .env
npm run dev
```

3. Deploy Firestore rules
```
firebase deploy --only firestore:rules
```

Environment variables (not exhaustive)
-------------------------------------
- `PORT` — server port
- `CLIENT_ORIGIN` — allowed client origin for CORS
- `GOOGLE_APPLICATION_CREDENTIALS` — path or secret for Firebase Admin credentials
- AI provider keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` (as applicable)

Testing & Validation
--------------------
- Run `npm run dev` locally for both client and server and exercise the flows:
  - Search → generate concept → saved locally and (if signed in) in Firestore.
  - Open `Saved` and `Profile` pages to validate merges and weekly activity.
- Add automated unit/integration tests in CI for concept route validation and auth-protected history endpoints.

Contributing
------------
- Follow existing code style and run lint/tests before PRs.
- Do not commit credentials or service-account JSON; use environment variables or secrets manager.

Contact
-------
Project maintainer: Mano (local workspace)

License
-------
Proprietary (no license file present) — add an open source license if you intend to open-source the project.
