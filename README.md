<p align="center">
  <img src="./xplorism-web/frontend/public/logo-removebg.png" alt="Xplorism Logo" width="130" />
</p>

<h1 align="center">Xplorism — AI-Powered Travel Planning Platform</h1>

<p align="center">
  <strong>Plan. Collaborate. Explore. — The all-in-one travel companion engineered for the modern explorer.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-Primary-8B5CF6?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-Real--Time-010101?style=for-the-badge&logo=socket.io" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

---

## Overview

**Xplorism** is a next-generation, AI-powered travel planning web and desktop application. It eliminates the tedious back-and-forth between search engines, maps, and spreadsheets by providing one premium, intelligent hub for every stage of a journey — from initial destination discovery to daily schedule execution.

Using a multi-model AI engine (Gemini + Groq + OpenRouter + Ollama), real-time geocoding, interactive Leaflet maps, live aviation radar, collaborative workspaces, encrypted document vaults, and global weather forecasts, Xplorism transforms travel planning into a seamless, delightful experience.

### The Mission
To deliver a visually stunning and fully interactive travel companion that guides explorers from initial wanderlust to daily schedule execution. Every feature is designed to save time, reduce anxiety, and make every trip unforgettable.

---

## Feature Showcase

### Multi-Model AI Itinerary Generator
- **Multi-Model AI Pipeline**: Generates rich, structured travel itineraries using **Google Gemini 1.5 Flash** as the primary engine, with **Groq** and **OpenRouter** (Llama 3.3 70B, Gemini 2.0 Flash) as secondary engines, and a fully offline **Ollama** (Qwen 2.5 / Llama 3) fallback for maximum reliability.
- **Smart Trip Wizard**: A multi-step, animated wizard (Framer Motion) gathers destination, travel dates or custom duration, budget, number of travelers, travel style (Adventure, Luxury, Budget, Cultural, Romantic, Relaxing), and interests (Food, Nature, Architecture, Nightlife, Art, History, Beaches, Shopping, Hiking).
- **Currency-Aware Budgeting**: Auto-detects the destination country from geocoding results and applies the correct currency (INR, USD, EUR, GBP, JPY, AUD, SGD, and more) with contextual budget presets (backpacker vs. comfort).
- **Structured Daily Schedules**: Each itinerary day is divided into **Morning**, **Afternoon**, and **Evening** blocks with rich activity descriptions, precise attraction names, and estimated costs. A strict no-repeat policy ensures completely unique attractions every day.
- **Pre-Planned Recommended Trips**: A curated selection of popular destination itineraries ready to be saved with one click.
- **Itinerary Geocoding**: Every saved itinerary activity is geocoded via a smart multi-strategy resolver (direct query → Open-Meteo fallback → Mandir↔Temple swap → phrase splitters) and pinned on an interactive Leaflet map.

### Interactive Destination Map & Attractions
- **Leaflet Maps with Custom Markers**: High-fidelity vector maps with animated marker overlays, smooth panning, and custom popups.
- **Live Geocoding Proxy**: Nominatim (OpenStreetMap) is proxied through the backend with server-side caching and a 2-stage fallback to the **Open-Meteo Geocoding API** to handle rate limits.
- **Dynamic City Autocomplete**: City suggestions appear in real-time as the user types, with address type tags (`city`, `district`, `country`).
- **HTML5 Geolocation**: Auto-detects device coordinates, reverse-geocodes to city name, and instantly centers the map.
- **OSM Attractions via Overpass API**: Fetches castles, temples, museums, parks, beaches, and historic monuments from OpenStreetMap via a backend proxy with round-robin failover across 4 public Overpass mirrors.
- **Wikipedia Geosearch Fallback**: Automatically queries Wikipedia's Geosearch API if all Overpass mirrors are unavailable.
- **Nearby Amenities Sidebar**: Clicking any tourist attraction shows cafes, restaurants, bars, and parks within a **1km radius** in a live detail sidebar.
- **Favorites & Wishlist**: Save any attraction or POI to a personal wishlist with one click.

### Live Aviation Radar (Sky Tracker)
- **Real-Time Flight Map**: Fetches up to 700 live aircraft positions from the **OpenSky Network ADS-B API** and renders them on an interactive Leaflet radar map with altitude-based color coding (Cruising, Transition, Approach).
- **Intelligent Fallback Grid**: Falls back to a deterministically generated pool of **450 simulated flights** spread globally across 10 major airlines when OpenSky is unavailable or rate-limited.
- **Enriched Flight Data**: Every aircraft state vector is enriched with airline name, aircraft type (Boeing 777-300ER, Airbus A350-900, etc.), and realistic departure/destination airport pairs resolved from heading vectors against a 12-airport database.
- **Gemini-Powered Flight Search**: Search by callsign or country — if the flight isn't in the live feed, Gemini AI resolves real route details dynamically and places an interpolated position track on the map.
- **Real-Time Auto-Refresh**: Automatically refreshes every 10 seconds with a visible countdown timer.

### Global Weather Forecasts
- **Open-Meteo Integration**: Real-time weather including temperature, feels-like, relative humidity, wind speed, and WMO weather code interpretation.
- **7-Day Extended Outlook**: Daily high/low temperatures with sunrise/sunset times for any city worldwide.
- **Dynamic Weather Themes**: Background panels, Lucide React icons, and badge styling automatically adapt to the current WMO weather code (clear, cloudy, rain, snow, thunderstorm, fog, drizzle).
- **No API Key Required**: Entirely powered by the free, open-access Open-Meteo API.

### AI Flight & Transit Search
- **Groq/OpenRouter/Gemini Flight Query**: Search one-way or round-trip flights by IATA airport code (e.g. DEL→BOM), departure date, and traveler count.
- **Train & Bus Transit Search**: Ground transport search between any two cities by route, date, and travel mode.
- **Airport & Station Autocomplete**: Powered by a local database of 3,000+ global airports and railway stations — instant suggestions with zero API rate limits.

### Real-Time Collaborative Workspace
- **WebSocket Sync via Socket.io**: Multi-user real-time editing of itineraries, budgets, packing lists, notes, documents, and polls — all changes broadcast instantly to every collaborator in the trip room.
- **Presence Tracking**: Displays which users are online and which workspace tab (Itinerary, Budget, Packing, Notes, Docs, Polls) each collaborator is currently viewing.
- **RabbitMQ Group Chat**: Topic-based trip chat powered by **RabbitMQ** (CloudAMQP), with a transparent in-memory `EventEmitter` fallback. Chat history is persisted in the `trip_messages` table.
- **Collaborator Invites**: Invite co-travelers by email; they receive a branded HTML email with an accept/decline link.
- **Trip Polls**: Democratic voting polls within the workspace — each collaborator can vote once; vote counts sync in real-time via Socket.io.
- **Workspace Offline Notifications**: Events (joins, edits, poll results) are persisted in `workspace_notifications` and delivered to offline users on their next login.
- **Shareable Public Link**: Every trip has a read-only public URL (`/shared-trip/:id`) requiring no login.

### Encrypted Document Vault
- **AES-256-GCM with Key Wrapping**: Travel documents (Passports, Visas, Tickets, Boarding Passes, Insurance) are encrypted at rest. A unique file key encrypts each file; the file key itself is encrypted by a master key derived from `VAULT_MASTER_KEY`.
- **Zero-Plaintext Storage**: Decryption happens entirely in memory at download time — plaintext never touches disk.
- **Ownership Access Control**: Download endpoints verify document ownership or approved collaborator status.
- **HEIC / HEIF Support**: Profile photos and uploaded HEIC images are auto-converted to JPEG via `heic-convert` + `sharp`.

### Expense Tracker & AI Budget Insights
- **Planned vs. Actual Tracking**: Log expenses per trip, per day, per category (Accommodation, Food, Activities, Transportation, Shopping, Misc) with both planned and actual amounts.
- **AI Financial Insights**: Gemini analyzes expense categories and spending patterns, returning personalized savings recommendations.
- **OCR Receipt Scanning**: Upload a receipt photo; Gemini Vision extracts line items, categories, and totals automatically.
- **Bill Splitting**: The `paid_by` field enables fair cost tracking across co-travelers.
- **Budget Utilization Charts**: Visual progress bar and category breakdown for at-a-glance budget health.

### Community Social Feed
- **Travel Posts & Stories**: Share trip narratives with up to 5 highlight photos (Base64, max 8MB each).
- **Hashtag System**: Tag posts with custom keywords for discovery.
- **Like / Unlike**: Toggle-like system with per-user idempotency tracking.
- **Post Search**: Real-time search by hashtags, username, or destination.
- **Edit & Delete**: Full CRUD for authors.
- **Destination Passport Stamps**: Each trip planned earns a visual destination stamp shown on the user's profile.

### Multi-Language & Theming
- **Full i18n**: `LanguageContext` provides complete UI translations for **English** and **Spanish**, covering all pages, toast notifications, error states, and dynamic labels (2,282-line translation file).
- **Dark / Light Mode**: System-wide theme toggle via `ThemeContext`, persisted across sessions.
- **Global Currency Preference**: `CurrencyContext` propagates a preferred currency through budget presets and expense forms.

### User Profile & Preferences
- **Rich Profile Dashboard**: Travel stats (trips, itinerary entries, spend, destinations, days), passport stamp gallery, and gamified travel milestones/badges.
- **OTP-Based Auth**: 6-digit OTP (10-minute TTL) sent via Nodemailer SMTP → Brevo API fallback → console log (dev).
- **Google OAuth 2.0**: Sign-in with Google — no password required for SSO users.
- **Password Reset**: Time-limited OTP via email for secure credential recovery.
- **JWT Authorization**: Bearer tokens (30-day TTL) on all protected API routes.

### Mobile & Desktop Apps
- **Android (Capacitor v8)**: Native Android APK build via `npx cap sync android` + Android Studio.
- **Desktop (Electron v43)**: Cross-platform desktop app with `electron-builder`. Windows NSIS installer via `npm run dist`.

### Security & Production Hardiness
- **Helmet.js**: XSS protection, HSTS, Clickjacking prevention, MIME sniffing protection applied globally.
- **Rate Limiting**: Global + auth-specific rate limits via `express-rate-limit`.
- **SQL Injection Sanitizer**: Custom middleware scrubs all request bodies and query strings.
- **Reverse Proxy Trust**: Correct client IP extraction behind Cloudflare/Nginx/Vercel.
- **Fingerprint Hiding**: `x-powered-by` disabled to prevent technology-specific exploits.
- **CORS Whitelist**: Strict origin control covering localhost, Vercel preview URLs, and production domains.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│   React 19 + Vite │ Tailwind CSS v4 │ Framer Motion │ Leaflet Maps      │
│   Socket.io Client │ Capacitor (Android) │ Electron (Desktop)           │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │  HTTP/REST + WebSocket (Socket.io)
┌──────────────────────────────▼──────────────────────────────────────────┐
│                          API GATEWAY (Express.js)                       │
│   Helmet │ CORS │ Rate Limiter │ SQL Sanitizer │ JWT Auth Middleware     │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  /auth/* │ │ /trips/* │ │ /docs/*  │ │ /posts/* │ │ /travel/*    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Proxy: /geocode │ /overpass │ /nearby │ /flights                │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
          ┌────────────────────┼──────────────────────┐
          │                    │                       │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌──────────▼──────────────────┐
│   AI Services     │ │  PostgreSQL     │ │  Message Broker             │
│  Gemini 1.5 Flash │ │  (Neon DB)      │ │  RabbitMQ (CloudAMQP)       │
│  Groq API         │ │  12 Tables      │ │  + In-Memory EventEmitter   │
│  OpenRouter       │ └────────────────┘ └─────────────────────────────┘
│  Ollama (local)   │
└───────────────────┘
          │
┌─────────▼─────────────────────────────────────────────────────────────┐
│  External APIs                                                         │
│  OpenSky (flights) │ Open-Meteo (weather) │ Nominatim (geocoding)      │
│  Overpass (OSM)    │ Wikipedia Geosearch                               │
│  Brevo (email)     │ RabbitMQ (chat)                                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```text
Xplorism/
├── xplorism-web/
│   ├── frontend/                         # Vite + React 19 Client App
│   │   ├── public/                       # Static assets, logo, icons
│   │   ├── android/                      # Capacitor Android project
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── AIChatbot.jsx         # Floating AI assistant panel
│   │   │   │   ├── AuthModal.jsx         # Login / Register modal (OTP)
│   │   │   │   ├── Navbar.jsx            # Navigation bar
│   │   │   │   ├── Footer.jsx            # Site footer
│   │   │   │   └── TripWizard.jsx        # Multi-step trip creation wizard
│   │   │   ├── context/
│   │   │   │   ├── AuthContext.jsx       # JWT auth state management
│   │   │   │   ├── LanguageContext.jsx   # i18n (English + Spanish)
│   │   │   │   └── ThemeContext.jsx      # Dark / Light mode
│   │   │   ├── contexts/
│   │   │   │   └── CurrencyContext.jsx   # Global currency preference
│   │   │   ├── pages/
│   │   │   │   ├── LandingPage.jsx       # Marketing homepage
│   │   │   │   ├── DashboardStub.jsx     # Main dashboard + map + wizard
│   │   │   │   ├── CollaborativeTripPage.jsx  # Real-time collab workspace
│   │   │   │   ├── WeatherPage.jsx       # 7-day weather + map
│   │   │   │   ├── TrackerPage.jsx       # Live aviation radar
│   │   │   │   ├── BudgetPage.jsx        # Per-trip expense tracker
│   │   │   │   ├── BudgetsListPage.jsx   # All-trips budget overview
│   │   │   │   ├── DocumentVaultPage.jsx # Encrypted document manager
│   │   │   │   ├── CommunityFeedPage.jsx # Social travel feed
│   │   │   │   ├── ProfilePage.jsx       # User profile, stats, badges
│   │   │   │   ├── TravelPreferencesPage.jsx  # Travel style preferences
│   │   │   │   ├── SharedTripPage.jsx    # Public read-only trip view
│   │   │   │   ├── SharedTripsWorkspace.jsx   # Collaborative workspace list
│   │   │   │   ├── TripInviteRespondPage.jsx  # Accept / decline invite
│   │   │   │   ├── LoginPage.jsx         # Auth redirect handler
│   │   │   │   ├── RegisterPage.jsx      # Auth redirect handler
│   │   │   │   └── NotFoundPage.jsx      # 404 fallback
│   │   │   ├── services/                 # Axios API client wrappers
│   │   │   ├── App.jsx                   # Root router + context providers
│   │   │   ├── index.css                 # Tailwind v4 + global styles
│   │   │   └── main.jsx                  # React DOM mount point
│   │   ├── capacitor.config.json         # Capacitor native config
│   │   ├── vercel.json                   # Vercel SPA routing rewrites
│   │   ├── vite.config.js                # Vite + /api proxy config
│   │   └── package.json
│   │
│   ├── backend/                          # Node.js + Express API (ESM)
│   │   ├── config/db.js                  # PostgreSQL pool connection
│   │   ├── controllers/
│   │   │   ├── authController.js         # Register, Login, OTP, Google SSO
│   │   │   ├── tripController.js         # CRUD, AI generate, share, packing
│   │   │   ├── tripCollaboratorController.js  # Invites, workspace, polls
│   │   │   ├── budgetController.js       # Expenses, AI insights, OCR
│   │   │   ├── chatController.js         # Trip chat via RabbitMQ
│   │   │   ├── favoriteController.js     # Wishlist CRUD
│   │   │   ├── notificationController.js # Workspace notifications
│   │   │   ├── postController.js         # Community feed + likes
│   │   │   ├── preferencesController.js  # Travel preferences
│   │   ├── middleware/
│   │   │   ├── auth.js                   # JWT verification
│   │   │   ├── rateLimiter.js            # Global + auth rate limits
│   │   │   └── sqlInjectionSanitizer.js  # Input sanitization guard
│   │   ├── routes/                       # Express routing tables (11 files)
│   │   ├── services/
│   │   │   ├── geminiService.js          # Gemini + Ollama (itinerary, flights)
│   │   │   ├── googleTravelService.js    # Groq + OpenRouter travel search
│   │   │   ├── emailService.js           # Nodemailer + Brevo dual-send
│   │   │   ├── encryptionService.js      # AES-256-GCM encrypt / decrypt
│   │   │   ├── rabbitmqService.js        # RabbitMQ + in-memory fallback
│   │   │   ├── storageService.js         # Local vault_storage manager
│   │   │   └── ai/geminiService.js       # Standalone Gemini helper
│   │   ├── data/
│   │   │   ├── airports.js               # 3,000+ global airport database
│   │   │   └── stations.js               # Global railway station database
│   │   ├── vault_storage/                # Encrypted document binary files
│   │   ├── schema.sql                    # PostgreSQL DDL (12 tables)
│   │   ├── index.js                      # Entrypoint, routes, Socket.io, proxies
│   │   └── package.json
│   │
│   └── electron/                         # Electron Desktop App
│       ├── main.js                       # BrowserWindow entrypoint
│       └── logo.ico                      # Desktop app icon
│
├── API.md                                # Full API reference
├── .gitignore
└── README.md
```

---

## Database Schema

Xplorism uses PostgreSQL with 12 relational tables:

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
        VARCHAR password "nullable for SSO"
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
        VARCHAR time "Morning/Afternoon/Evening"
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
        VARCHAR distance
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
        TEXT encrypted_file_key "AES-256-GCM wrapped key"
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
        TEXT photo_content "Base64 images"
        INTEGER likes
        TEXT_ARRAY liked_by
        TIMESTAMP created_at
    }

    trip_collaborators {
        UUID id PK
        UUID trip_id FK
        UUID user_id FK
        VARCHAR status "pending/accepted/declined"
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

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | 19 | UI Framework |
| [Vite](https://vitejs.dev/) | 8 | Build Tool & Dev Server |
| [Tailwind CSS](https://tailwindcss.com/) | v4 | Utility-First Styling |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animations & Transitions |
| [Lucide React](https://lucide.dev/) | 1.26 | Icon Library |
| [React Router DOM](https://reactrouter.com/) | v7 | Client-Side Routing |
| [Leaflet](https://leafletjs.com/) | — | Interactive Maps |
| [Socket.io Client](https://socket.io/) | 4.8 | Real-Time Collaboration |
| [Capacitor](https://capacitorjs.com/) | v8 | Android Native Wrapper |
| [Electron](https://www.electronjs.org/) | 43 | Desktop App Wrapper |
| oxlint | 1.71 | Fast JS Linter |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥18 | Runtime (ES Modules) |
| [Express.js](https://expressjs.com/) | 4.19 | HTTP API Framework |
| [PostgreSQL (pg)](https://www.postgresql.org/) | 8.22 | Primary Database |
| [Socket.io Server](https://socket.io/) | 4.8 | WebSocket Server |
| [amqplib](https://github.com/amqp-node/amqplib) | 0.10 | RabbitMQ AMQP Client |
| [@google/generative-ai](https://ai.google.dev/) | 0.24 | Gemini API Client |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 2.4 | Password Hashing |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9.0 | JWT Auth Tokens |
| [nodemailer](https://nodemailer.com/) | 9.0 | SMTP Email Sending |
| [helmet](https://helmetjs.github.io/) | 8.3 | HTTP Security Headers |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | 8.6 | Rate Limiting |
| [sharp](https://sharp.pixelplumbing.com/) | 0.35 | Image Processing / Optimization |
| [heic-convert](https://github.com/catdad-experiments/heic-convert) | 2.1 | HEIC to JPEG Conversion |
| [uuid](https://github.com/uuidjs/uuid) | 14 | UUID Generation |
| Node.js `crypto` | built-in | AES-256-GCM Encryption |
| nodemon | 3.1 | Dev Auto-Restart |

### AI Providers (Priority Order)
| Provider | Models Used | Role |
|---|---|---|
| Google Gemini | `gemini-1.5-flash` | Primary — itinerary, flights, chat, OCR |
| Groq | `openai/gpt-oss-20b`, `gpt-oss-120b` | Secondary — travel search |
| OpenRouter | `llama-3.3-70b-instruct:free`, `gemini-2.0-flash-exp:free` | Tertiary — travel search |
| Ollama (local) | `qwen2.5`, `llama3` | Offline fallback — itinerary generation |

### External APIs & Services
| Service | Purpose | API Key |
|---|---|---|
| OpenSky Network | Live ADS-B flight tracking | No |
| Open-Meteo | Weather forecasts + geocoding fallback | No |
| Nominatim (OSM) | City geocoding + autocomplete | No |
| Overpass API | OSM tourist attractions & POIs | No |
| Wikipedia Geosearch | POI fallback data | No |
| Brevo | Transactional email (cloud) | Optional |
| CloudAMQP / RabbitMQ | Chat message broker | Optional |

---

## Installation & Quick Start

### Prerequisites
- **Node.js** v18.0.0 or higher
- **PostgreSQL** (local, Docker, or [Neon DB](https://neon.tech/) cloud)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

---

### 1. Database Setup

The backend auto-initializes tables on startup via `initDatabase()`. For manual setup:

```bash
psql -U your_postgres_user -d xplorism -f xplorism-web/backend/schema.sql
```

Or use a cloud PostgreSQL URL (e.g., Neon) directly in your `.env`.

---

### 2. Backend Setup

```bash
cd xplorism-web/backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/xplorism?sslmode=disable"

JWT_SECRET="generate_a_long_secure_random_string"
VAULT_MASTER_KEY="generate_a_secure_64_char_hex_key_min_32_chars"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your_google_oauth_client_id"

# AI Providers
GEMINI_API_KEY="your_gemini_api_key"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5"
OLLAMA_API_KEY=""
GROQ_API_KEY="your_groq_api_key"
OPENROUTER_API_KEY="your_openrouter_api_key"

# Email (Optional — falls back to console)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM="noreply@xplorism.com"
BREVO_API_KEY="your_brevo_api_key"
SENDER_EMAIL="your-sender@gmail.com"

# Message Broker (Optional — falls back to in-memory)
RABBITMQ_URL="amqps://user:pass@host/vhost"

```

```bash
npm install
npm run dev
```

> Backend listens on `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd xplorism-web/frontend
```

Create `.env`:
```env
VITE_GOOGLE_CLIENT_ID="your_google_oauth_client_id"
```

```bash
npm install
npm run dev
```

> Frontend at `http://localhost:3000`. `vite.config.js` proxies all `/api/*` calls to `http://localhost:5000`.

---

### 4. (Optional) Electron Desktop App

```bash
cd xplorism-web
npm install
npm run electron         # Launch desktop window
npm run dist             # Build Windows NSIS installer → release/
```

### 5. (Optional) Android Build

```bash
cd xplorism-web/frontend
npm run build
npx cap sync android
npx cap open android     # Opens Android Studio
```

---

## Application Routes

| Route | Auth | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Redirects with auth modal (login) |
| `/register` | Public | Redirects with auth modal (register) |
| `/dashboard` | **Protected** | Main trips dashboard + AI trip wizard |
| `/weather` | **Protected** | Global weather forecasts |
| `/tracker` | **Protected** | Live aviation radar (Sky Tracker) |
| `/trips/:id/budget` | **Protected** | Expense tracker for a trip |
| `/budgets` | **Protected** | All-trips budget overview |
| `/profile` | **Protected** | User profile, stats, badges |
| `/preferences` | **Protected** | Travel style preferences |
| `/vault` | **Protected** | Encrypted document vault |
| `/community` | **Protected** | Social travel feed |
| `/shared-trips` | **Protected** | Collaborative workspace list |
| `/trips/:id/collaborate` | **Protected** | Real-time collaborative workspace |
| `/shared-trip/:id` | Public | Read-only shared trip view |
| `/trip-invite/respond` | Public | Accept/decline collaboration invite |

---

## API Quick Reference

See [**API.md**](API.md) for full documentation including request/response schemas.

| Category | Base Path | Methods |
|---|---|---|
| Auth & Profile | `/auth/*` | POST, GET, PUT |
| Trips & Itinerary | `/trips/*` | GET, POST, PUT, DELETE |
| Collaborative Workspace | `/trips/:id/collaborators`, `/trips/:id/polls` | GET, POST, PUT, DELETE |
| Budget & Expenses | `/trips/:id/budget`, `/trips/:id/expenses` | GET, POST, PUT, DELETE |
| Document Vault | `/documents/*` | GET, POST, PUT, DELETE |
| Community Feed | `/posts/*` | GET, POST, PUT, DELETE |
| Favorites | `/favorites/*` | GET, POST, DELETE |
| Notifications | `/notifications/*` | GET, PATCH |
| Flight Search | `/travel/flights` | GET |
| Transit Search | `/travel/transit` | GET |
| Airport Autocomplete | `/travel/airports` | GET |
| Station Autocomplete | `/travel/stations` | GET |
| Aviation Tracker | `/flights` | GET |
| Geocoding Proxy | `/geocode` | GET |
| Overpass Proxy | `/overpass` | GET |
| Nearby Places AI | `/nearby` | GET |
| Health Check | `/health` | GET |

---

## Real-Time WebSocket Events (Socket.io)

| Client → Server | Payload | Description |
|---|---|---|
| `join-user-room` | `{ userId }` | Subscribe to personal notification room |
| `join-trip-room` | `{ tripId, userName }` | Enter collaborative trip room |
| `itinerary-changed` | `{ tripId, action, data }` | Broadcast itinerary edit |
| `budget-changed` | `{ tripId, action, data }` | Broadcast budget/expense change |
| `packing-changed` | `{ tripId, action, data }` | Broadcast packing list update |
| `poll-changed` | `{ tripId, action, data }` | Broadcast poll create/vote |
| `notes-changed` | `{ tripId, data }` | Broadcast notes update |
| `documents-changed` | `{ tripId, action, data }` | Broadcast document change |
| `presence-changed` | `{ tripId, userName, activeTab }` | Broadcast current active tab |

| Server → Client | Description |
|---|---|
| `collaborators-list` | Full list of active users in the trip room |
| `collaborator-joined` | New collaborator connected |
| `collaborator-left` | Collaborator disconnected |
| `itinerary-updated` | Forwarded itinerary change |
| `budget-updated` | Forwarded budget/expense change |
| `packing-updated` | Forwarded packing list change |
| `poll-updated` | Forwarded poll change |
| `notes-updated` | Forwarded notes change |
| `documents-updated` | Forwarded document change |
| `presence-updated` | Co-traveler active tab update |
| `chat-message` | New chat message bridged from RabbitMQ |

---

## Security Details

### AES-256-GCM Document Encryption (Key Wrapping)

```
File Data ──► AES-256-GCM(fileKey, fileIv) ──► encryptedData + fileAuthTag
fileKey   ──► AES-256-GCM(masterKey, wrapperIv) ──► wrappedKey + keyAuthTag

Stored in DB: { wrappedKey, iv (fileIv), authTag (fileAuthTag) }
Stored on disk: { encryptedData binary }

Download: wrappedKey ──► Unwrap(masterKey) ──► fileKey
          encryptedData ──► Decrypt(fileKey, iv, authTag) ──► plaintext (in-memory only)
```

### OTP Authentication Flow

```
Registration / Login Request
    │
    ▼
Generate 6-digit OTP → store in-memory Map (TTL: 10 minutes)
    │
    ▼
Send via Nodemailer SMTP (primary)
    │── fail ──► Brevo REST API (cloud fallback)
    │                │── fail ──► Log to console (dev fallback)
    ▼
User submits OTP → Verify cache → Issue JWT (30-day TTL)
```

---

## Deployment

### Backend — Azure App Service (`xplorism-api`)

1. Add all `.env` values as **Application Settings** in Azure Portal.
2. Set `WEBSITE_NODE_DEFAULT_VERSION` → `~22`.
3. CI/CD via **GitHub Actions** (`.github/workflows/main_xplorism-api.yml`):
   - Node.js 22.x build environment
   - Artifact packaging
   - Deployment via `azure/webapps-deploy` action

### Frontend — Vercel

| Setting | Value |
|---|---|
| Framework Preset | `Vite` |
| Root Directory | `xplorism-web/frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| `VITE_API_URL` | `https://xplorism-api.azurewebsites.net` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |

The `vercel.json` at the frontend root configures SPA routing rewrites so all paths resolve to `index.html`.

---

## Data Sources & Integrations

| Source | Purpose | Auth Required |
|---|---|---|
| [Open-Meteo](https://open-meteo.com/) | Weather forecasts + geocoding fallback | No |
| [Nominatim (OSM)](https://nominatim.org/) | City geocoding + autocomplete proxy | No |
| [Overpass API](https://overpass-api.de/) | Tourist attractions (OSM data) | No |
| [Wikipedia Geosearch](https://www.mediawiki.org/wiki/API:Geosearch) | POI fallback | No |
| [OpenSky Network](https://opensky-network.org/) | Live ADS-B flight positions | No |
| [Google Gemini 1.5 Flash](https://ai.google.dev/) | Primary AI engine | Required |
| [Groq API](https://console.groq.com/) | Secondary AI + travel search | Optional |
| [OpenRouter](https://openrouter.ai/) | Tertiary AI + travel search | Optional |
| [Ollama](https://ollama.com/) | Offline AI fallback | No (Self-hosted) |
| [Brevo](https://www.brevo.com/) | Cloud transactional email | Optional |
| [CloudAMQP / RabbitMQ](https://www.cloudamqp.com/) | Chat message broker | Optional |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
