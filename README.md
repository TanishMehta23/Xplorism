# Xplorism

<div align="center">

### AI-Powered Travel Planning & Real-Time Exploration Platform

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-AMQP-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://rabbitmq.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android_v8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![Electron](https://img.shields.io/badge/Electron-43.x-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![Tests](https://img.shields.io/badge/Tests-39%20Passed%20(100%25)-success?style=for-the-badge&logo=node.js&logoColor=white)](#automated-testing--qa-architecture)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Xplorism** is a full-stack, AI-driven travel planning and exploration platform. It unifies multi-model AI itinerary generation, real-time interactive mapping, live aviation radar tracking, multi-user collaborative workspaces, an AES-256-GCM zero-knowledge document vault, and expense tracking into a unified web, desktop (Electron), and mobile (Android) application.

[Live Application](https://xplorism.vercel.app) · [Backend API](https://xplorism-api.azurewebsites.net) · [Report a Bug](https://github.com/TanishMehta23/Xplorism/issues)

</div>

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [AI / ML Workflows](#ai--ml-workflows)
- [Authentication & Security Flow](#authentication--security-flow)
- [Environment Configuration](#environment-configuration)
- [Local Development Setup](#local-development-setup)
- [Desktop App Build (Electron)](#desktop-app-build-electron)
- [Mobile App Build (Capacitor Android)](#mobile-app-build-capacitor-android)
- [Deployment](#deployment)
- [Automated Testing & QA Architecture](#automated-testing--qa-architecture)
- [Security Architecture](#security-architecture)
- [License](#license)

---

## System Overview

**Problem Solved:** Planning journeys typically demands juggling dozens of browser tabs across search engines, booking aggregators, spreadsheets, note-taking apps, and messaging groups. Travelers experience fragmented itineraries, lack of real-time collaborative synchronization, scattered booking documents, and tedious budgeting calculations.

**Core Mission:** Provide a single intelligent travel operating system that takes travelers from initial destination discovery and AI-powered schedule synthesis to real-time group collaboration, live aviation tracking, and encrypted travel document storage.

**Key Audience:** Independent backpackers, group trip organizers, international travelers requiring multi-currency budgeting, and digital nomads seeking automated itineraries and live transit awareness.

**Architecture Paradigm:** Monorepo with dedicated client, server, and platform runtime layers:
- `xplorism-web/frontend/` &rarr; React 19 SPA (Vite + Tailwind CSS v4 + Framer Motion + Leaflet)
- `xplorism-web/backend/` &rarr; Express.js REST & WebSocket API (Node.js ESM + PostgreSQL pg driver + Socket.io + RabbitMQ)
- `electron/` &rarr; Cross-platform desktop runtime powered by Electron 43

---

## Architecture

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|                                                                                 |
|   +----------------------------+   +--------------------+   +---------------+   |
|   |   React 19 SPA (Vite)      |   |  Electron Desktop  |   |   Capacitor   |   |
|   |   - React Router DOM v7    |   |  (Cross-Platform)  |   |  Android v8   |   |
|   |   - Tailwind CSS v4        |   +---------+----------+   +-------+-------+   |
|   |   - Framer Motion & Leaflet|             |                      |           |
|   |   - Socket.io Client       |<------------+----------------------+           |
|   +-------------+--------------+                                                |
+-----------------+---------------------------------------------------------------+
                  |  HTTPS REST / WSS WebSocket (JWT Bearer Token)
                  v
+---------------------------------------------------------------------------------+
|                           API GATEWAY (Express.js)                              |
|                                                                                 |
|  +----------+ +----------+ +----------+ +----------+ +----------+ +----------+  |
|  |  /auth   | |  /trips  | | /budget  | |  /docs   | |  /posts  | | /travel  |  |
|  +----------+ +----------+ +----------+ +----------+ +----------+ +----------+  |
|  +----------+ +----------+ +----------+ +----------+ +----------+               |
|  |/favorites| |  /chat   | |/bookings | |/notif'ns | |/pref'ces |               |
|  +----------+ +----------+ +----------+ +----------+ +----------+               |
|                                                                                 |
|  Middleware Pipeline:                                                           |
|  [Helmet] -> [CORS] -> [sqlInjectionSanitizer] -> [globalLimiter / authLimiter]  |
|  -> [authMiddleware (JWT Verification)] -> Controller Logic                     |
+--------+---------------------------------------------------------------+--------+
         |                                                               |
         | WebSocket / Message Bus                                       | Database Driver
         v                                                               v
+---------------------------------+             +---------------------------------+
|   REAL-TIME & MESSAGE BUS       |             |         DATABASE TIER           |
|  - Socket.io (Trip Rooms)       |             |  - PostgreSQL (NeonDB / Local)  |
|  - RabbitMQ (CloudAMQP)         |             |  - 13 Relational Tables         |
|  - In-Memory EventEmitter Fallbk|             |  - AES-256-GCM Vault Metadata   |
+---------------------------------+             +---------------------------------+
         |
         v
+---------------------------------------------------------------------------------+
|                             INTEGRATION TIER                                    |
|                                                                                 |
|  +--------------------+  +--------------------+  +--------------------------+   |
|  | Google Gemini AI   |  | Groq API Engine    |  | OpenRouter / Ollama      |   |
|  | 1.5 Flash (Primary)|  | (Fast Fallback)    |  | (Local Offline LLM)      |   |
|  +--------------------+  +--------------------+  +--------------------------+   |
|  +--------------------+  +--------------------+  +--------------------------+   |
|  | OpenSky Network    |  | Open-Meteo         |  | Nominatim & Overpass     |   |
|  | (Live ADS-B Radar) |  | (Weather & Geo)    |  | (OSM Points of Interest) |   |
|  +--------------------+  +--------------------+  +--------------------------+   |
|  +--------------------+  +--------------------+  +--------------------------+   |
|  | Nodemailer / SMTP  |  | Brevo REST API     |  | Wikipedia Geosearch      |   |
|  | (OTP Dispatch)     |  | (Email Fallback)   |  | (POI Fallback Mirror)    |   |
|  +--------------------+  +--------------------+  +--------------------------+   |
+---------------------------------------------------------------------------------+
```

---

## Tech Stack

### Frontend Client

| Technology | Version | Purpose |
|---|---|---|
| React | `^19.2.7` | Core reactive user interface framework |
| Vite | `^8.1.1` | Next-generation frontend tooling and bundler |
| React Router DOM | `^7.18.1` | Declarative client-side routing and view transitions |
| Tailwind CSS | `^4.3.3` | Utility-first styling framework with CSS variables |
| Framer Motion | `^12.42.2` | Fluid animations, drag physics, and step wizard transitions |
| Leaflet | `^1.9.4` | Interactive vector maps, tile rendering, and custom markers |
| Socket.io Client | `^4.8.3` | Low-latency bi-directional workspace collaboration |
| Lucide React | `^1.26.0` | Crisp UI iconography |
| Capacitor Core & Android | `^8.5.1` | Native Android mobile runtime and bridge |
| Capacitor Google Auth | `^3.4.0-rc.4`| Native Google SSO plugin for Android |
| Oxlint | `^1.71.0` | High-speed JavaScript and JSX code quality analysis |

### Backend API Server

| Technology | Version | Purpose |
|---|---|---|
| Node.js | `22.x` / `>=18` | Asynchronous JavaScript runtime (ES Modules) |
| Express.js | `^4.19.2` | RESTful API routing, middleware, and request handling |
| Socket.io | `^4.8.3` | Real-time WebSocket hub for collaborative trip editing |
| PostgreSQL (`pg`) | `^8.22.0` | Connection pool client for PostgreSQL / NeonDB |
| `@google/generative-ai` | `^0.24.1` | Official SDK for Google Gemini 1.5 Flash models |
| `amqplib` | `^0.10.4` | AMQP 0-9-1 client for RabbitMQ message broker |
| `jsonwebtoken` | `^9.0.2` | Cryptographic JWT token signing and verification |
| `bcryptjs` | `^2.4.3` | Salted password hashing (10 rounds) |
| `helmet` | `^8.3.0` | Security headers (HSTS, XSS filter, clickjacking defense) |
| `express-rate-limit` | `^8.6.2` | IP-based request throttling on general and auth routes |
| `nodemailer` | `^9.0.3` | SMTP transport for OTP verification and invitations |
| `sharp` | `^0.35.3` | High-performance image transformation and optimization |
| `heic-convert` | `^2.1.0` | Conversion of Apple HEIC photos to web-standard JPEG |
| Node.js `crypto` | built-in | AES-256-GCM authenticated encryption for Document Vault |

### Desktop Runtime (Electron)

| Technology | Version | Purpose |
|---|---|---|
| Electron | `^43.3.0` | Chromium and Node.js desktop shell |
| `electron-builder` | `^26.15.3` | Windows NSIS installer and package generator |

---

## Directory Structure

```
Xplorism/
+-- LICENSE                              # MIT License terms
+-- README.md                            # Comprehensive system documentation
+-- .github/workflows/ci.yml             # GitHub Actions CI workflow
+-- electron/                            # Cross-platform desktop runtime
+|   +-- main.js                          # Desktop BrowserWindow entrypoint
+|   +-- logo.ico                         # Desktop application icon
+|   +-- package.json                     # Desktop app scripts & electron-builder spec
+|
+-- xplorism-web/
    +-- backend/                         # Express.js REST & Real-time Server
    |   +-- schema.sql                   # PostgreSQL schema definition (13 tables)
    |   +-- index.js                     # Server bootstrap, middleware, routes, Socket.io
    |   +-- package.json
    |   +-- config/
    |   |   +-- db.js                    # PostgreSQL connection pool configuration
    |   +-- controllers/
    |   |   +-- authController.js        # User auth, 6-digit OTP, Google SSO
    |   |   +-- tripController.js        # Trip CRUD, AI synthesis, packing lists
    |   |   +-- tripCollaboratorController.js # Workspace invites, co-travelers, polls
    |   |   +-- budgetController.js      # Expense logging, Gemini budget insights, OCR
    |   |   +-- chatController.js        # RabbitMQ trip workspace message handling
    |   |   +-- documentController.js    # Vault upload, AES-256-GCM encryption/decryption
    |   |   +-- postController.js        # Community feed posts and toggle likes
    |   |   +-- favoriteController.js    # User attractions wishlist
    |   |   +-- preferencesController.js # Travel style and pacing settings
    |   |   +-- notificationController.js# Offline workspace activity notifications
    |   +-- middleware/
    |   |   +-- auth.js                  # Bearer token verification middleware
    |   |   +-- rateLimiter.js           # Global & auth endpoint rate limiters
    |   |   +-- sqlInjectionSanitizer.js # Request payload SQL injection detector
    |   +-- routes/
    |   |   +-- authRoutes.js            # Registration, login, OTP, profile
    |   |   +-- tripRoutes.js            # Trip management & itinerary routes
    |   |   +-- budgetRoutes.js          # Expense tracking & OCR receipts
    |   |   +-- documentRoutes.js        # Encrypted vault file streams
    |   |   +-- travelRoutes.js          # Flights, transit, airport autocomplete
    |   |   +-- chatRoutes.js            # Workspace chat history
    |   |   +-- postRoutes.js            # Community social feed
    |   |   +-- favoriteRoutes.js        # Saved destinations and POIs
    |   |   +-- notificationRoutes.js    # In-app notification center
    |   |   +-- preferencesRoutes.js     # User travel preference persistence
    |   |   +-- bookingRoutes.js         # Hotel reservation persistence
    |   +-- services/
    |   |   +-- geminiService.js         # Gemini 1.5 Flash & Ollama integration
    |   |   +-- googleTravelService.js   # Groq & OpenRouter travel transit search
    |   |   +-- encryptionService.js     # AES-256-GCM file & key wrapping logic
    |   |   +-- storageService.js        # Local vault storage file system manager
    |   |   +-- rabbitmqService.js       # RabbitMQ publisher/subscriber & mock broker
    |   |   +-- emailService.js          # Nodemailer SMTP + Brevo REST fallback
    |   +-- data/
    |   |   +-- airports.js              # 3,000+ indexed international airport codes
    |   |   +-- stations.js              # Global railway and transit stations
    |   +-- vault_storage/               # Local encrypted file repository
    |
    +-- frontend/                        # React 19 Client SPA
        +-- index.html                   # HTML5 shell
        +-- vite.config.js               # Bundler settings & backend proxy
        +-- vercel.json                  # Single-page application route rewrites
        +-- capacitor.config.json        # Capacitor Android native configuration
        +-- android/                     # Gradle Android native project
        +-- src/
            +-- main.jsx                 # Client entry point
            +-- App.jsx                  # Route definitions and context tree
            +-- index.css                # Tailwind CSS v4 directives
            +-- context/
            |   +-- AuthContext.jsx      # JWT credentials and user state
            |   +-- LanguageContext.jsx  # i18n localization (English & Spanish)
            |   +-- ThemeContext.jsx     # Dark & Light UI theme toggle
            +-- contexts/
            |   +-- CurrencyContext.jsx  # Active multi-currency preferences
            +-- components/
            |   +-- Navbar.jsx           # Global top navigation bar
            |   +-- Footer.jsx           # Global application footer
            |   +-- TripWizard.jsx       # Multi-step animated itinerary builder
            |   +-- AIChatbot.jsx        # Floating contextual travel assistant
            |   +-- AuthModal.jsx        # Authentication & OTP verification modal
            +-- pages/
                +-- LandingPage.jsx      # Product presentation & feature showcase
                +-- DashboardStub.jsx    # User dashboard, trips grid, interactive map
                +-- CollaborativeTripPage.jsx # Multi-user real-time workspace
                +-- SharedTripPage.jsx   # Public read-only trip viewer
                +-- SharedTripsWorkspace.jsx  # Workspace roster and invitations
                +-- TripInviteRespondPage.jsx # Invitation acceptance interface
                +-- TrackerPage.jsx      # Real-time ADS-B Sky Tracker radar
                +-- WeatherPage.jsx      # 7-day forecast & meteorological alerts
                +-- BudgetPage.jsx       # Per-trip expense manager & OCR scanner
                +-- BudgetsListPage.jsx  # Portfolio of all trip finances
                +-- DocumentVaultPage.jsx# Encrypted travel document manager
                +-- CommunityFeedPage.jsx# Global travel community feed
                +-- ProfilePage.jsx      # Explorer statistics, stamps, and badges
                +-- TravelPreferencesPage.jsx # AI personalization options
```

---

## Database Schema

Xplorism utilizes **PostgreSQL** (hosted on NeonDB or local instances), structured into 13 relational tables:

```mermaid
erDiagram
    users ||--o{ trips : "creates"
    users ||--o{ favorites : "saves"
    users ||--o{ documents : "uploads"
    users ||--o{ posts : "authors"
    users ||--o{ trip_collaborators : "participates"
    users ||--o{ trip_messages : "dispatches"
    users ||--o{ trip_poll_votes : "casts"
    users ||--o{ workspace_notifications : "receives"
    users ||--o{ bookings : "reserves"

    trips ||--o{ itinerary : "structures"
    trips ||--o{ expenses : "tracks"
    trips ||--o{ favorites : "contains"
    trips ||--o{ documents : "attaches"
    trips ||--o{ trip_collaborators : "shares"
    trips ||--o{ trip_messages : "hosts"
    trips ||--o{ trip_polls : "organizes"
    trips ||--o{ workspace_notifications : "triggers"
    trips ||--o{ bookings : "schedules"

    trip_polls ||--o{ trip_poll_votes : "tallies"

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
        VARCHAR time
        VARCHAR location
        TEXT activity
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
```

---

## API Reference

API routes are mounted on the backend service (default local port: `http://localhost:5000`).

> **Protected Endpoint Requirement:** `Authorization: Bearer <jwt_token>`

### Authentication & Profile (`/auth`)

| Method | Endpoint | Auth | Request Payload | Description |
|---|---|:---:|---|---|
| `POST` | `/auth/register` | No | `{ name, email, password }` | Registers user account and dispatches verification OTP |
| `POST` | `/auth/verify-otp` | No | `{ email, otp }` | Verifies registration OTP and returns signed 30-day JWT |
| `POST` | `/auth/login` | No | `{ email, password }` | Authenticates credentials and returns JWT session |
| `POST` | `/auth/google` | No | `{ token }` | Validates Google OAuth token and provisions user |
| `POST` | `/auth/forgot-password`| No | `{ email }` | Generates and sends a 6-digit password recovery code |
| `POST` | `/auth/reset-password` | No | `{ email, otp, newPassword }` | Resets user password upon successful OTP match |
| `GET` | `/auth/profile` | **Yes** | None | Returns user profile, travel statistics, and badges |
| `PUT` | `/auth/profile` | **Yes** | `{ name, profile_photo, preferences }` | Updates profile metadata and preferences |

### Trips & Itineraries (`/trips`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/trips` | **Yes** | Fetches all trips created by or shared with the authenticated user |
| `POST` | `/trips` | **Yes** | Saves a structured trip and associates daily itinerary items |
| `PUT` | `/trips/:id` | **Yes** | Updates trip parameters, notes, or packing checklists |
| `DELETE` | `/trips/:id` | **Yes** | Cascades deletion to itineraries, expenses, and collaborators |
| `POST` | `/trips/generate` | No | AI pipeline generation of custom multi-day itinerary JSON |
| `GET` | `/trips/share/:id` | No | Public read-only viewer for shared trip URLs |
| `GET` | `/trips/:id/packing` | **Yes** | Retrieves interactive packing checklist items |
| `PUT` | `/trips/:id/packing` | **Yes** | Updates and toggles packing list check states |
| `GET` | `/trips/:id/events` | **Yes** | Retrieves localized attractions and destination events |

### Real-Time Collaborative Workspace

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/trips/shared-workspace` | **Yes** | Lists all collaborative workspaces the user belongs to |
| `GET` | `/trips/:id/collaborators`| **Yes** | Returns active and invited collaborators for a trip |
| `POST` | `/trips/:id/collaborators`| **Yes** | Invites a co-traveler via email with an invitation link |
| `DELETE` | `/trips/:id/collaborators/:userId` | **Yes** | Revokes collaborator access from a shared workspace |
| `POST` | `/trips/:id/join` | **Yes** | Joins an active workspace room via trip identifier |
| `POST` | `/trips/:id/collaborators/respond` | **Yes** | Accepts or declines a workspace invitation |
| `GET` | `/trips/:id/messages` | **Yes** | Fetches historical workspace group chat messages |
| `POST` | `/trips/:id/messages` | **Yes** | Dispatches a chat message through the RabbitMQ broker |
| `GET` | `/trips/:id/polls` | **Yes** | Lists all democratic decision polls in the workspace |
| `POST` | `/trips/:id/polls` | **Yes** | Creates a new voting poll with customizable options |
| `POST` | `/trips/:id/polls/:pollId/vote` | **Yes** | Records or toggles a collaborator vote on a poll option |
| `DELETE` | `/trips/:id/polls/:pollId` | **Yes** | Removes a poll from the workspace |

### Document Vault (`/documents`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/documents` | **Yes** | Lists unlinked/general vault document metadata |
| `GET` | `/documents/trip/:tripId` | **Yes** | Lists metadata of documents associated with a trip |
| `POST` | `/documents` | **Yes** | Encrypts (AES-256-GCM + key wrapping) and stores document |
| `GET` | `/documents/:id/download` | **Yes** | Unwraps key, decrypts stream in memory, and serves binary |
| `PUT` | `/documents/:id` | **Yes** | Updates document title, category, or re-encrypts payload |
| `DELETE` | `/documents/:id` | **Yes** | Securely purges document record and disk binary |

### Budget & Financial Insights (`/trips`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/trips/:id/budget` | **Yes** | Summarizes planned vs. actual expenditures by category |
| `POST` | `/trips/:id/budget/insights` | **Yes** | Generates Gemini AI budget recommendations and savings tips |
| `POST` | `/trips/:id/budget/scan-receipt` | **Yes** | Extracts receipt line items via Gemini Vision OCR |
| `POST` | `/trips/:id/expenses` | **Yes** | Records a new expense entry with payer attribution |
| `PUT` | `/trips/:id/expenses/:expenseId` | **Yes** | Updates an existing expense item |
| `DELETE` | `/trips/:id/expenses/:expenseId` | **Yes** | Removes an expense item from the trip ledger |

### Aviation, Weather & Travel Discovery

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/flights` | No | Fetches live ADS-B vectors from OpenSky with smart fallback |
| `GET` | `/travel/flights` | No | Queries flight routes across global airport pairs |
| `GET` | `/travel/transit` | No | Ground transport search (buses, trains) between cities |
| `GET` | `/travel/airports` | No | Autocomplete lookup against 3,000+ indexed airports |
| `GET` | `/travel/stations` | No | Autocomplete lookup for global railway stations |
| `GET` | `/geocode` | No | Nominatim OSM geocoding proxy with Open-Meteo fallback |
| `GET` | `/overpass` | No | Overpass API proxy for tourist attractions with failover |
| `GET` | `/nearby` | No | Gemini-powered discovery of attractions within 100km |
| `GET` | `/health` | No | Service health and heartbeat indicator |

---

## AI / ML Workflows

### Multi-Tiered AI Generation Engine

Itinerary synthesis and contextual intelligence leverage a redundant multi-model orchestration chain:

```
Request Itinerary / Travel Query
              |
              v
[Tier 1] Google Gemini 1.5 Flash
         Direct API integration with temperature 0.3 for structured itinerary JSON.
         Applies strict uniqueness constraints to ensure no repeated attractions.
              | (Fails or rate-limited)
              v
[Tier 2] Groq API Engine
         High-throughput LLM execution (`openai/gpt-oss-20b`, `gpt-oss-120b`).
         Ultra-low latency schema generation for transit and search.
              | (Fails or rate-limited)
              v
[Tier 3] OpenRouter API
         Multi-provider router invoking `llama-3.3-70b-instruct` or `gemini-2.0-flash`.
              | (Fails or offline)
              v
[Tier 4] Local Ollama Runtime
         Local execution via `qwen2.5` or `llama3` on `http://localhost:11434`.
         Guarantees zero-dependency, private offline itinerary generation.
```

### Vision OCR & Receipt Processing

- **Receipt Processing Pipeline**: Expense receipts uploaded in JPG, PNG, or HEIC formats are processed via Gemini Vision.
- **Data Extraction**: Automatically parses merchant name, transaction date, line items, and total amount, mapping them directly into trip expense categories (Food, Accommodation, Transport, Activities, Shopping).

---

## Authentication & Security Flow

```
                      REGISTRATION & LOGIN WORKFLOW
                      
 User Registration                     Email Dispatch Pipeline
+--------------------+                 +---------------------+
| POST /auth/register|                 | Nodemailer (SMTP)   |
| (Name, Email, Pass)|                 +----------+----------+
+---------+----------+                            | (if SMTP fails)
          |                                       v
          v                            +---------------------+
+--------------------+                 | Brevo API (Cloud)   |
| Generate 6-Digit   |                 +----------+----------+
| OTP (10-min TTL)   |---------->                 | (in dev mode)
+--------------------+                            v
                                       +---------------------+
 User Verification                     | Console Output Log  |
+--------------------+                 +---------------------+
| POST /auth/verify  |
| - Verify OTP token |
| - bcrypt(pass, 10) |
| - Issue 30-Day JWT |
+--------------------+
```

### Zero-Knowledge Document Vault Architecture

Travel documents (passports, flight passes, visas) are protected by a two-tier key wrapping encryption mechanism:

```
1. Encryption:
   Plaintext File Buffer
            |
            v
   AES-256-GCM (Random 32-byte File Key + 12-byte IV)  -->  Encrypted File Binary
            |                                               (Written to disk storage)
            |
            v
   Wrap File Key with Master Key
   AES-256-GCM (Master Key derived from VAULT_MASTER_KEY)
            |
            v
   Wrapped Key String (wrapperIv:keyAuthTag:encryptedKey)
   Stored in PostgreSQL database along with file IV and Auth Tag.

2. Decryption (Dynamic In-Memory Stream):
   Read Wrapped Key from DB  -->  Unwrap with Master Key  -->  File Key
   Read Encrypted Binary    -->  AES-256-GCM Decrypt     -->  Plaintext Buffer
   (Plaintext never touches persistent disk storage during decryption)
```

---

## Environment Configuration

### Backend Environment (`xplorism-web/backend/.env`)

| Variable | Required | Description | Example |
|---|:---:|---|---|
| `PORT` | Optional | Port for Express HTTP & WebSocket server | `5000` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@ep-xyz.neon.tech/xplorism?sslmode=require` |
| `JWT_SECRET` | **Yes** | Cryptographic secret for signing JWT sessions | Any 32+ character random string |
| `VAULT_MASTER_KEY` | **Yes** | Master key for Document Vault key wrapping | 64-character hexadecimal string |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key for itinerary & OCR | `AIzaSy...` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 client identifier | `<id>.apps.googleusercontent.com` |
| `GROQ_API_KEY` | Optional | Groq API key for fast transit search | `gsk_...` |
| `OPENROUTER_API_KEY`| Optional | OpenRouter API key for tertiary failover | `sk-or-...` |
| `OLLAMA_BASE_URL` | Optional | Local Ollama endpoint for offline LLM | `http://localhost:11434` |
| `OLLAMA_MODEL` | Optional | Local Ollama model identifier | `qwen2.5` |
| `RABBITMQ_URL` | Optional | CloudAMQP or RabbitMQ connection string | `amqps://user:pass@host/vhost` |
| `SMTP_HOST` | Optional | Primary SMTP relay hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Optional | Primary SMTP relay port | `587` |
| `SMTP_USER` | Optional | SMTP authentication username | `your-email@gmail.com` |
| `SMTP_PASS` | Optional | SMTP authentication password / app password | `xxxx xxxx xxxx xxxx` |
| `BREVO_API_KEY` | Optional | Brevo API key for transactional email fallback | `xkeysib-...` |

### Frontend Environment (`xplorism-web/frontend/.env`)

| Variable | Required | Description | Example |
|---|:---:|---|---|
| `VITE_API_URL` | Optional | Production backend base URL (omit for local dev proxy) | `https://xplorism-api.azurewebsites.net` |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID for web sign-in | `<id>.apps.googleusercontent.com` |

---

## Local Development Setup

### Prerequisites

- **Node.js** `v18.0.0` or higher (Node 22 recommended)
- **npm** `9.x` or higher
- **PostgreSQL** (local instance, Docker container, or [NeonDB](https://neon.tech))
- **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com)

### 1. Clone Repository

```bash
git clone https://github.com/TanishMehta23/Xplorism.git
cd Xplorism
```

### 2. Database Initialization

The backend automatically creates tables on startup if they do not exist. Alternatively, run the DDL schema manually:

```bash
psql -U postgres -d xplorism -f xplorism-web/backend/schema.sql
```

### 3. Backend Setup

```bash
cd xplorism-web/backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, VAULT_MASTER_KEY, and GEMINI_API_KEY

npm install
npm run dev
# Backend server runs on http://localhost:5000
```

### 4. Frontend Setup

Open a new terminal session:

```bash
cd xplorism-web/frontend
npm install
npm run dev
# Frontend dev server runs on http://localhost:3000
```

### 5. Verify Local Stack

- Access the frontend at `http://localhost:3000`
- Confirm backend health check:
  ```bash
  curl http://localhost:5000/health
  # -> {"status":"ok","timestamp":"..."}
  ```

---

## Desktop App Build (Electron)

The Electron desktop wrapper loads the configured client application inside a native Chromium frame:

```bash
cd electron

# Install Electron dependencies
npm install

# Run desktop app in development mode
npm run electron

# Package production Windows NSIS installer
npm run dist
# Installer will be generated in electron/release/
```

---

## Mobile App Build (Capacitor Android)

Xplorism packages as a native Android application using Capacitor:

```bash
cd xplorism-web/frontend

# Build production assets
npm run build

# Synchronize web assets with the native Android project
npx cap sync android

# Open Android Studio to build APK or debug on device
npx cap open android
```

---

## Deployment

### Backend Deployment (Azure App Service / Render)

- **Platform**: Azure App Service (`xplorism-api`) or Render Web Service
- **Runtime**: Node.js 22.x
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- Configure all environment variables from `.env.example` in the host dashboard.

### Frontend Deployment (Vercel)

- **Framework Preset**: Vite
- **Root Directory**: `xplorism-web/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- The bundled `vercel.json` ensures all route requests rewrite to `/index.html` for client-side routing.

---

## Automated Testing & QA Architecture

Xplorism features an enterprise-grade, zero-dependency automated unit, integration, and security test suite powered by Node.js's native test runner (`node --test`). The test suite guarantees complete offline determinism via in-memory ephemeral mocks and mathematical models, ensuring tests execute at lightning speed without mutating production databases or consuming external API quotas.

### Running the Test Suite

```bash
# Navigate to the backend directory
cd xplorism-web/backend

# Execute the complete automated test suite
npm test
```

### Test Coverage & Suite Breakdown

| Suite / Test File | Focus Areas & Security Controls | Scenarios | Status |
|---|---|:---:|:---:|
| [`tests/auth.test.js`](xplorism-web/backend/tests/auth.test.js) | JWT signature verification, secret tampering defense, cryptographic expiration (`TokenExpiredError`), 10-round bcrypt password hashing, salt uniqueness, 6-digit OTP lifecycle (10-min TTL), refresh token family rotation with reuse detection, and multi-device FIFO session revocation | 9 | **100% Pass** |
| [`tests/rbac.test.js`](xplorism-web/backend/tests/rbac.test.js) | Role-Based Access Control, administrative endpoint defense (HTTP 403 Forbidden), multi-tenant trip workspace boundary isolation, Document Vault uploader exclusivity, privilege escalation defense (stripping immutable fields), and voting permission guards | 5 | **100% Pass** |
| [`tests/business_logic.test.js`](xplorism-web/backend/tests/business_logic.test.js) | Date validation constraints (`endDate >= startDate`), composite planned vs. actual budget calculations, compound index uniqueness (`trip_id, user_id`), unique poll votes, strict itinerary attraction uniqueness across all days, and post toggle-like idempotency state machines | 6 | **100% Pass** |
| [`tests/security_audit.test.js`](xplorism-web/backend/tests/security_audit.test.js) | OWASP defense: SQL injection prevention (`UNION SELECT`, tautology payloads like `OR 1=1`), legitimate text false-positive avoidance, Insecure Direct Object References (IDOR) on documents, AES-256-GCM encryption with key wrapping, auth tag tampering rejection, Anti-Formula Injection (CWE-1236) in CSV/Excel cells, and PII redaction | 8 | **100% Pass** |
| [`tests/api_health.test.js`](xplorism-web/backend/tests/api_health.test.js) | Heartbeat health verification (`GET /health`), clean JSON 404 responses for unknown routes, upstream third-party failure resilience (OpenSky timeout fallback to mock pool, Nominatim $\rightarrow$ Open-Meteo geocoding failover), async non-blocking email dispatch, and global 500 error boundary | 6 | **100% Pass** |
| **TOTAL** | **Enterprise Test Suite (Unit, Integration & Security)** | **34 Tests (39 Assertions)** | **100% Pass** |

- **Execution Runtime:** ~700 ms
- **External Dependencies:** Zero external test runners required (native `node:test` + `node:assert/strict`)

---

## Security Architecture

| Security Domain | Implementation | Protection Profile |
|---|---|---|
| **SQL Injection Defense** | Custom regex sanitizer middleware + parameterized SQL queries | Blocks UNION SELECT, WAITFOR, BENCHMARK, comment escapes, and tautology payloads (`1=1`, `a=a`) across query, body, and params. |
| **Document Cryptography** | AES-256-GCM authenticated cipher with dynamic key wrapping | Protects files at rest with unique file keys; zero-plaintext disk footprint during downloads. |
| **HTTP Security Headers** | Helmet.js middleware suite | Enforces HSTS, clickjacking prevention (frameguard), MIME type sniffing defense, and XSS filtering. |
| **Rate Throttling** | `express-rate-limit` | Global rate limit of 2,000 requests / 15 minutes; strict limit of 60 requests / 5 minutes on auth routes. |
| **Credential Storage** | `bcryptjs` | Irreversible salted password hashing using 10 rounds of computation. |
| **Session Control** | `jsonwebtoken` (JWT) | Signed 30-day bearer tokens validated on all sensitive API paths. |
| **Fingerprint Masking** | `app.disable('x-powered-by')` | Hides underlying framework metadata from automated vulnerability scanners. |
| **CORS Policy** | Whitelist origin policy | Restricts cross-origin requests to trusted production and development origins. |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.

---

<div align="center">

Crafted with care by the **Xplorism** Team · [Explore the App](https://xplorism.vercel.app)

</div>
