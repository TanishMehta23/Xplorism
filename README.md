<p align="center">
  <img src="./xplorism-web/frontend/public/logo-removebg.png" alt="Xplorism Logo" width="140">
</p>

<h1 align="center">Xplorism</h1>

<p align="center">
  <strong>AI-Powered Premium Travel Planner &amp; Collaborative Trip Workspace</strong>
</p>

<p align="center">
  <a href="#key-features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Node.js-ES_Modules-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-UUID-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-8E75B2?logo=google&logoColor=white" alt="Gemini AI">
  <img src="https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socket.io&logoColor=white" alt="Socket.io">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License">
</p>

---

## Overview

**Xplorism** is a full-stack, AI-powered travel planning platform that combines intelligent itinerary generation, real-time collaboration, interactive maps, budget management, and secure document storage into a single, premium experience. Instead of hopping between search engines, spreadsheets, and messaging apps, Xplorism provides a centralized hub where travelers can plan, track, and share every aspect of their journey.

The platform leverages **Google Gemini AI** for itinerary generation, budget insights, and an intelligent travel chatbot — with automatic fallback to **Ollama** (local LLM) and **Groq Cloud** when the primary AI is unavailable. Real-time collaboration is powered by **WebSockets** and **RabbitMQ** message streaming, while sensitive documents are protected with **AES-256-GCM encryption**.

### 🌍 Supported Languages

Xplorism ships with full internationalization (i18n) support across **7 languages**:

| Language | Code |
|----------|------|
| 🇬🇧 English | `en` |
| 🇪🇸 Spanish | `es` |
| 🇫🇷 French | `fr` |
| 🇩🇪 German | `de` |
| 🇮🇳 Hindi | `hi` |
| 🇸🇦 Arabic | `ar` |
| 🇧🇷 Portuguese | `pt` |

---

## Key Features

### 🤖 AI Itinerary Generation

- **Multi-Model AI Engine** — Primary itinerary generation via **Gemini 1.5 Flash**, with automatic failover to local/remote **Ollama** (Llama 3, Qwen 2.5) and **Groq Cloud** (GPT-OSS, Compound).
- **Smart Customization** — Tailors itineraries based on travelers count, budget, interests (Food, Nature, Architecture, Nightlife, Art, History, Beaches, Shopping, Hiking), and travel style (Adventure, Luxury, Budget, Cultural, Romantic, Relaxing).
- **Structured Day Planner** — Each day is divided into Morning, Afternoon, and Evening blocks with detailed activity descriptions, precise locations, and itemized cost estimates in the destination's local currency.
- **Auto-Currency Detection** — Automatically detects the destination country from geocoding and sets the correct local currency (INR, JPY, EUR, GBP, USD, AED, THB, SGD, AUD, CAD, CHF, and more).

### 💬 Xplorism AI Chatbot

- **RAG-Powered Conversations** — Retrieval-Augmented Generation using **pgvector** cosine similarity search over a curated travel knowledge base, combined with Gemini AI for contextually rich responses.
- **Function Calling / Tool Use** — The chatbot can autonomously invoke tools to search destinations, fetch live weather, retrieve user preferences, and query saved trips — all within the conversation flow.
- **Multi-Conversation History** — Full conversation persistence with per-user isolated chat threads, rename, and delete functionality.
- **Scope-Restricted** — Strictly limited to travel-related inquiries; politely declines off-topic requests.

### 🗺️ Interactive Destination Maps

- **Leaflet Integration** — High-fidelity vector maps with custom marker overlays, smooth panning, and responsive layouts.
- **Dual Geocoding** — Primary geocoding via **OpenStreetMap Nominatim** with automatic fallback to **Open-Meteo Geocoding API**. Includes intelligent query resolution for composite location names (e.g., "Temple at City").
- **Dynamic Autocomplete** — City suggestions with descriptive tags (city, district, country) rendered as the user types.
- **HTML5 Geolocation** — Detects user coordinates, reverse-geocodes the city, and centers the map instantly.

### 🏛️ Attractions & Amenities Discovery

- **Overpass API** — Queries castles, temples, museums, parks, beaches, and monuments from OpenStreetMap data.
- **Multi-Mirror Failover** — Cycles through 5 public Overpass mirrors (main, French, LZ4, Kumi, Russian) with 12-second timeouts per endpoint.
- **Wikipedia Geosearch Fallback** — When all Overpass mirrors are exhausted, Wikipedia's Geosearch API fills in points of interest.
- **Nearby Amenities** — Click any attraction to discover cafés, restaurants, bars, and parks within a 1 km radius.

### 🌤️ Global Weather Forecasts

- **Open-Meteo Integration** — Real-time conditions and 5-day daily forecasts (highs/lows, sunrise/sunset, wind speed, humidity).
- **Dynamic Theming** — Background themes, weather icons (Lucide-React), and badge styling automatically adapt to the destination's live WMO weather code.

### ✈️ Live Aviation Radar (Sky Radar)

- **Flight Tracking** — Real-time flight position tracking with interactive Leaflet map overlays, route visualization, and airport markers.
- **Search & Filter** — Search flights by callsign, airline, or route; toggle between split, map-only, and list views.
- **Auto-Refresh** — Configurable live polling intervals with countdown timers for continuous position updates.


### 👥 Real-Time Collaborative Workspace

- **Multi-User Sync** — Live collaborative editing of itineraries, budgets, packing lists, notes, documents, and polls via **Socket.io** WebSockets.
- **Presence Tracking** — See which co-travelers are currently online and which workspace tab (Itinerary, Budget, Docs, etc.) they're viewing.
- **RabbitMQ Group Chat** — Topic-based trip messaging through **RabbitMQ** with fanout exchanges (automatic fallback to an in-memory `EventEmitter` broker when RabbitMQ is unavailable).
- **Trip Polls** — Create polls, vote on options, and see real-time results synced across all collaborators.
- **Invite System** — Email-based trip invitations powered by **Nodemailer** (Gmail SMTP) with **Brevo API** fallback. Invitees receive styled HTML emails with one-click accept/decline links.
- **Workspace Notifications** — Persistent offline notifications for changes made while you were away.

### 🔒 Secure Document Vault

- **AES-256-GCM Encryption** — Documents (passports, visas, tickets, insurance) are encrypted in-memory using per-file random keys, which are themselves wrapped with a master key derived from `VAULT_MASTER_KEY`.
- **Granular Access Control** — Decryption endpoints verify ownership or approved collaborator status before returning files.
- **Document Categorization** — Organize by type (Passport, Visa, Ticket, Insurance, Other) with per-trip association.

### 💰 Budget Tracker & AI Insights

- **Planned vs. Actual** — Track expenses by category (Food & Dining, Accommodation, Transportation, Activities & Tours, Shopping, Miscellaneous) comparing planned budgets against actual spending.
- **Live Currency Converter** — Real-time exchange rates via the **Open Exchange Rates API** with static fallback rates.
- **Split Share Ledger** — Track who paid what across co-travelers for bill splitting.
- **AI Financial Insights** — Gemini AI analyzes spending patterns and provides optimization recommendations.
- **Daily Breakdown** — Expandable accordion-style day-by-day expense breakdowns.

### 👤 User Profile & Preferences

- **Profile Management** — Profile photo upload (with HEIC → JPEG conversion via Sharp), display name, and email management.
- **Travel Preferences** — Configure preferred travel styles, interests, default currency, and language.
- **Travel History** — JSONB-backed travel history tracking.
- **Google SSO** — Sign in with Google OAuth alongside traditional email/password authentication.

### 🌐 Community Feed

- **Social Posts** — Share trip stories with photos, destinations, and rich text content.
- **Engagement** — Like posts, view trip highlights, and discover destinations from other travelers.

### 📡 Shared Trips

- **Public Trip Sharing** — Generate shareable links for trips viewable without authentication.
- **Shared Trips Workspace** — View all collaborative trips you've been invited to in one place.
- **Trip Invite Response** — Accept or decline invitations directly from email links.

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | 19 | UI framework |
| [Vite](https://vitejs.dev/) | 8 | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animations & transitions |
| [Lucide React](https://lucide.dev/) | 1.26 | Icon library |
| [React Router DOM](https://reactrouter.com/) | 7 | Client-side routing |
| [Leaflet](https://leafletjs.com/) | Dynamic | Interactive maps (CDN-loaded for React 19 compatibility) |
| [Socket.io Client](https://socket.io/) | 4.8 | Real-time WebSocket communication |
| [Capacitor](https://capacitorjs.com/) | 8.5 | Native mobile builds (Android) |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) | ES Modules | API server |
| [PostgreSQL](https://www.postgresql.org/) | Native `pg` | Relational database |
| [Socket.io Server](https://socket.io/) | 4.8 | Real-time WebSocket server |
| [RabbitMQ](https://www.rabbitmq.com/) | `amqplib` | Message broker for group chat |
| [@google/generative-ai](https://ai.google.dev/) | 0.24 | Gemini AI SDK |
| [Nodemailer](https://nodemailer.com/) | 9.0 | SMTP email delivery |
| [Sharp](https://sharp.pixelplumbing.com/) | 0.35 | Image processing (HEIC conversion) |
| [Helmet](https://helmetjs.github.io/) | 8.3 | HTTP security headers |
| [BcryptJS](https://github.com/dcodeIO/bcrypt.js) | — | Password hashing |
| [JSON Web Tokens](https://jwt.io/) | — | Authentication |

### Desktop

| Technology | Purpose |
|---|---|
| [Electron](https://www.electronjs.org/) 43 | Desktop application wrapper |
| [electron-builder](https://www.electron.build/) | Windows NSIS installer packaging |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│  React 19 + Vite 8 + Tailwind CSS 4 + Framer Motion        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Dashboard │ │ Weather  │ │ Budgets  │ │ Collaborative │  │
│  │ + Wizard  │ │ + Radar  │ │ Tracker  │ │  Workspace    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Vault   │ │Community │ │ Profile  │ │  AI Chatbot   │  │
│  │  (Docs)  │ │  Feed    │ │ + Prefs  │ │  (Floating)   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│       │              │            │              │          │
│       └──────────────┴────────────┴──────────────┘          │
│                 REST API  +  WebSocket                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                       SERVER LAYER                          │
│                                                             │
│  Node.js + Express (ES Modules) + Socket.io Server          │
│                                                             │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│  │   Security  │ │   Services   │ │     AI Pipeline      │  │
│  │ ─────────── │ │ ──────────── │ │ ──────────────────── │  │
│  │ Helmet      │ │ Encryption   │ │ Gemini (Primary)     │  │
│  │ CORS        │ │ Email (SMTP) │ │ Ollama (Fallback)    │  │
│  │ Rate Limit  │ │ Storage      │ │ Groq  (Fallback)     │  │
│  │ SQL Sanitiz │ │ RabbitMQ     │ │ OpenRouter (Fallback)│  │
│  │ JWT + Bcrypt│ │ Google Travel│ │ RAG + pgvector       │  │
│  └─────────────┘ └──────────────┘ │ Tool Calling         │  │
│                                   └──────────────────────┘  │
│                          │                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                      DATA LAYER                             │
│                                                             │
│  PostgreSQL  +  pgvector  +  RabbitMQ                       │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Users  │ │ Trips  │ │ Expenses │ │ Itinerary        │   │
│  │ Posts  │ │ Docs   │ │ Messages │ │ Collaborators    │   │
│  │ Polls  │ │  Favs  │ │ Favorites│ │ Notifications    │   │
│  └────────┘ └────────┘ └──────────┘ │ Travel Knowledge │   │
│                                     └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```mermaid
erDiagram
    users ||--o{ trips : "creates"
    trips ||--o{ itinerary : "contains"
    trips ||--o{ expenses : "logs"
    users ||--o{ favorites : "marks"
    trips ||--o{ favorites : "links"
    users ||--o{ documents : "uploads"
    trips ||--o{ documents : "associates"
    users ||--o{ posts : "creates"
    trips ||--o{ trip_collaborators : "has"
    users ||--o{ trip_collaborators : "joins"
    trips ||--o{ trip_messages : "contains"
    users ||--o{ trip_messages : "sends"
    trips ||--o{ trip_polls : "has"
    trip_polls ||--o{ trip_poll_votes : "has"
    users ||--o{ trip_poll_votes : "votes"
    trips ||--o{ workspace_notifications : "has"
    users ||--o{ workspace_notifications : "receives"


    users {
        UUID id PK
        VARCHAR name
        VARCHAR email UK
        VARCHAR password
        VARCHAR google_id UK
        TEXT profile_photo
        JSONB preferences
        JSONB travel_history
        TIMESTAMP created_at
    }

    trips {
        UUID id PK
        UUID user_id FK
        VARCHAR destination
        DATE start_date
        DATE end_date
        DOUBLE_PRECISION budget
        INTEGER travelers
        VARCHAR travel_style
        TEXT_ARRAY interests
        JSONB packing_list
        TEXT notes
        BOOLEAN is_collaborative
        TIMESTAMP created_at
    }

    itinerary {
        UUID id PK
        UUID trip_id FK
        INTEGER day
        TEXT activity
        VARCHAR time
        VARCHAR location
        DOUBLE_PRECISION estimated_cost
    }

    expenses {
        UUID id PK
        UUID trip_id FK
        INTEGER day
        VARCHAR category
        VARCHAR item_name
        DOUBLE_PRECISION planned_amount
        DOUBLE_PRECISION actual_amount
        VARCHAR currency
        VARCHAR paid_by
        DATE date
        TEXT notes
        TIMESTAMP created_at
    }

    favorites {
        UUID id PK
        UUID user_id FK
        UUID trip_id FK
        VARCHAR name
        VARCHAR type
        TEXT description
        VARCHAR location
        VARCHAR category
        TEXT image_url
        VARCHAR destination
        JSONB metadata
        TIMESTAMP created_at
    }

    documents {
        UUID id PK
        UUID user_id FK
        UUID trip_id FK
        VARCHAR title
        VARCHAR type
        VARCHAR file_name
        TEXT encrypted_file_key
        TEXT iv
        TEXT auth_tag
        TIMESTAMP created_at
    }

    posts {
        UUID id PK
        UUID user_id FK
        VARCHAR username
        VARCHAR trip_destination
        VARCHAR title
        TEXT content
        TEXT photo_content
        INTEGER likes
        TEXT_ARRAY liked_by
        TIMESTAMP created_at
    }

    trip_collaborators {
        UUID id PK
        UUID trip_id FK
        UUID user_id FK
        VARCHAR status
        TIMESTAMP created_at
    }

    trip_messages {
        UUID id PK
        UUID trip_id FK
        UUID user_id FK
        VARCHAR sender_name
        TEXT message
        TIMESTAMP created_at
    }

    trip_polls {
        UUID id PK
        UUID trip_id FK
        TEXT question
        JSONB options
        TIMESTAMP created_at
    }

    trip_poll_votes {
        UUID id PK
        UUID poll_id FK
        UUID user_id FK
        INTEGER option_index
        TIMESTAMP created_at
    }

    workspace_notifications {
        UUID id PK
        UUID trip_id FK
        UUID user_id FK
        VARCHAR sender_name
        VARCHAR title
        TEXT message
        BOOLEAN is_read
        TIMESTAMP created_at
    }


```

---

## Repository Structure

```text
Xplorism/
├── xplorism-web/
│   ├── frontend/                      # Vite + React 19 Client
│   │   ├── public/                    # Static assets & logos
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── AIChatbot.jsx      # Floating AI travel assistant
│   │   │   │   ├── AuthModal.jsx      # Login/Register modal (Google SSO + Email)
│   │   │   │   ├── Footer.jsx         # Global footer
│   │   │   │   ├── Navbar.jsx         # Global navigation bar
│   │   │   │   └── TripWizard.jsx     # Multi-step trip creation wizard
│   │   │   ├── context/
│   │   │   │   ├── AuthContext.jsx     # Authentication state & JWT management
│   │   │   │   ├── LanguageContext.jsx # i18n translations (7 languages)
│   │   │   │   └── ThemeContext.jsx    # Light/Dark theme toggle
│   │   │   ├── contexts/
│   │   │   │   └── CurrencyContext.jsx # Global currency state
│   │   │   ├── pages/
│   │   │   │   ├── LandingPage.jsx          # Public landing & marketing page
│   │   │   │   ├── LoginPage.jsx            # Auth redirect handler
│   │   │   │   ├── RegisterPage.jsx         # Auth redirect handler
│   │   │   │   ├── DashboardStub.jsx        # Main trip dashboard & itinerary viewer
│   │   │   │   ├── WeatherPage.jsx          # Global weather forecasts
│   │   │   │   ├── TrackerPage.jsx          # Live aviation radar (Sky Radar)

│   │   │   │   ├── BudgetPage.jsx           # Per-trip budget tracker
│   │   │   │   ├── BudgetsListPage.jsx      # All budgets overview
│   │   │   │   ├── DocumentVaultPage.jsx    # Encrypted document vault
│   │   │   │   ├── CommunityFeedPage.jsx    # Social travel feed
│   │   │   │   ├── ProfilePage.jsx          # User profile & settings
│   │   │   │   ├── TravelPreferencesPage.jsx # Travel preferences editor
│   │   │   │   ├── CollaborativeTripPage.jsx # Real-time collaboration workspace
│   │   │   │   ├── SharedTripsWorkspace.jsx  # Shared trips overview
│   │   │   │   ├── SharedTripPage.jsx        # Public shared trip viewer
│   │   │   │   ├── TripInviteRespondPage.jsx # Email invite accept/decline
│   │   │   │   └── NotFoundPage.jsx          # 404 page
│   │   │   ├── services/              # Axios API client & itinerary generator
│   │   │   ├── App.jsx                # Router, protected routes, providers
│   │   │   ├── index.css              # Tailwind v4 directives & global styles
│   │   │   └── main.jsx               # ReactDOM root mount
│   │   ├── package.json
│   │   └── vite.config.js             # Dev proxy, port 3000
│   │
│   ├── backend/                       # Node.js + Express API
│   │   ├── config/
│   │   │   └── db.js                  # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js      # Register, login, Google SSO, profile
│   │   │   ├── tripController.js      # CRUD trips, itinerary management
│   │   │   ├── budgetController.js    # Budget computation & expense CRUD
│   │   │   ├── chatController.js      # AI chatbot conversations & tool execution

│   │   │   ├── favoriteController.js  # Favorites / wishlist management
│   │   │   ├── notificationController.js # Workspace notifications
│   │   │   ├── postController.js      # Community feed posts
│   │   │   ├── preferencesController.js # User travel preferences
│   │   │   └── tripCollaboratorController.js # Collaboration & invites
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT verification guard
│   │   │   ├── rateLimiter.js         # Express rate limiting
│   │   │   └── sqlInjectionSanitizer.js # Request body/query SQL injection detection
│   │   ├── routes/                    # Express route definitions
│   │   ├── services/
│   │   │   ├── geminiService.js       # Itinerary, nearby places AI
│   │   │   ├── encryptionService.js   # AES-256-GCM encrypt/decrypt with key wrapping
│   │   │   ├── emailService.js        # SMTP + Brevo API email delivery
│   │   │   ├── googleTravelService.js # Multi-provider travel search
│   │   │   ├── rabbitmqService.js     # RabbitMQ + in-memory fallback broker
│   │   │   ├── storageService.js      # File system storage for vault
│   │   │   ├── ai/
│   │   │   │   └── geminiService.js   # Chatbot AI (RAG, tool calling, embeddings)
│   │   │   ├── rag/
│   │   │   │   └── ragService.js      # pgvector knowledge base (add & search)
│   │   │   └── tools/
│   │   │       └── toolService.js     # Chatbot tool implementations
│   │   ├── schema.sql                 # Complete database schema
│   │   ├── .env.example               # Environment variable template
│   │   ├── index.js                   # App entrypoint, Socket.io, geocoding proxy
│   │   └── package.json
│   │
│   └── electron/                      # Electron desktop wrapper
│       ├── main.js                    # Electron main process
│       └── logo.ico                   # Windows application icon
│
├── API.md                             # REST API reference documentation
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

| Requirement | Minimum Version |
|---|---|
| **Node.js** | v18.0.0+ |
| **PostgreSQL** | 14+ (with `uuid-ossp` extension) |
| **Gemini API Key** | [Google AI Studio](https://aistudio.google.com/apikey) |

**Optional:**
- **RabbitMQ** — For production-grade group chat messaging (falls back to in-memory)
- **Ollama** — For local LLM fallback (`llama3`, `qwen2.5`)
- **Groq API Key** — For cloud LLM fallback
- **SMTP Credentials** — For email invitations (Gmail App Password or Brevo)

### 1. Database Setup

Create a PostgreSQL database and run the schema:

```bash
createdb xplorism
psql -U your_user -d xplorism -f xplorism-web/backend/schema.sql
```

> **Note:** The backend will also auto-initialize tables via `initDatabase()` on first startup.

### 2. Backend

```bash
cd xplorism-web/backend
cp .env.example .env    # Edit with your credentials
npm install
npm run dev             # Starts on http://localhost:5000
```

**Required `.env` variables:**

```env
PORT=5000
DATABASE_URL="postgresql://user:pass@localhost:5432/xplorism?sslmode=disable"
JWT_SECRET="your_secure_jwt_secret"
GEMINI_API_KEY="AIza..."
```

**Optional `.env` variables:**

```env
VAULT_MASTER_KEY="your_32_char_vault_key"
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5"
GROQ_API_KEY="gsk_..."
OPENROUTER_API_KEY="sk-or-..."
RABBITMQ_URL="amqp://localhost:5672"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@xplorism.com"
```

### 3. Frontend

```bash
cd xplorism-web/frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

Create a `.env` file if using Google Sign-In:

```env
VITE_GOOGLE_CLIENT_ID="your_google_client_id"
```

> **Proxy:** The Vite dev server proxies `/api/*` requests to `http://127.0.0.1:5000` automatically.

### 4. Desktop App (Optional)

```bash
cd xplorism-web
npm install
npm run electron        # Launch Electron desktop app
npm run dist            # Build Windows installer (NSIS)
```

---

## API Reference

For detailed documentation on all backend endpoints, request/response schemas, and authentication flows, see the **[API Reference Guide](API.md)**.

### Route Summary

| Prefix | Module | Description |
|---|---|---|
| `/auth` | Authentication | Register, login, Google SSO, profile management |
| `/trips` | Trips | CRUD operations, itinerary generation, packing lists |
| `/trips` | Budgets | Budget computation, expense tracking |
| `/chat` | AI Chatbot | Conversations, messages, RAG-enhanced responses |
| `/favorites` | Favorites | Save/unsave attractions & points of interest |
| `/documents` | Vault | Encrypted document upload, download, delete |
| `/posts` | Community | Social feed posts, likes |
| `/notifications` | Notifications | Workspace change notifications |
| `/preferences` | Preferences | Travel preferences CRUD |

| `/travel` | Travel Search | Destination search via AI providers |
| `/nearby` | Nearby Places | Gemini-powered POI discovery |
| `/overpass` | Map Proxy | CORS proxy for Overpass API queries |
| `/geocode` | Geocoding | Nominatim + Open-Meteo geocoding proxy |

---

## Security

Xplorism implements multiple layers of security:

| Layer | Implementation |
|---|---|
| **Authentication** | JWT tokens + BcryptJS password hashing |
| **Authorization** | Route-level middleware guards (ownership verification) |
| **HTTP Headers** | Helmet.js (XSS protection, HSTS, clickjacking prevention) |
| **Rate Limiting** | `express-rate-limit` on all routes + stricter auth limits |
| **SQL Injection** | Custom middleware scanning `req.body`, `req.query`, `req.params` against known injection patterns |
| **Encryption** | AES-256-GCM with per-file key wrapping for document vault |
| **CORS** | Whitelist-based origin validation |
| **Fingerprint Prevention** | `x-powered-by` header disabled |

---

## Data Sources & Integrations

| Service | Provider | Purpose |
|---|---|---|
| AI Generation | [Google Gemini](https://deepmind.google/technologies/gemini/) | Itinerary, budget insights, chatbot |
| AI Fallback | [Ollama](https://ollama.com/) (Local), [Groq](https://groq.com/), [OpenRouter](https://openrouter.ai/) | Multi-provider LLM redundancy |
| Weather | [Open-Meteo](https://open-meteo.com/) | Real-time weather & forecasts (no API key) |
| Geocoding | [Nominatim](https://nominatim.org/) + [Open-Meteo Geo](https://open-meteo.com/) | Location resolution & autocomplete |
| Attractions | [Overpass API](https://overpass-api.de/) (5 mirrors) | OpenStreetMap POI queries |
| POI Fallback | [Wikipedia Geosearch](https://www.mediawiki.org/wiki/API:Geosearch) | Backup point-of-interest data |
| Exchange Rates | [Open Exchange Rates API](https://open.er-api.com/) | Live currency conversion |
| Email | [Gmail SMTP](https://support.google.com/mail/answer/7126229) + [Brevo API](https://www.brevo.com/) | Trip invitation emails |

| Messaging | [RabbitMQ](https://www.rabbitmq.com/) | Group chat message broker |
| Embeddings | [Gemini text-embedding-004](https://ai.google.dev/) | RAG vector embeddings |

---

## Deployment

### Frontend — Vercel

| Setting | Value |
|---|---|
| Framework Preset | `Vite` |
| Root Directory | `xplorism-web/frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable | `VITE_API_URL` → your backend URL |

### Backend — Render / Azure / Railway

Deploy the `xplorism-web/backend` directory as a Node.js service with the environment variables from `.env.example`.

### Desktop — Electron

```bash
cd xplorism-web && npm run dist
```

Outputs a Windows NSIS installer to the `release/` directory.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/TanishMehta23">Tanish Mehta</a> & <a href="https://github.com/Vans30m">Vansh Thakur</a></sub>
</p>
