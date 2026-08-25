# <p align="center"><img src="./xplorism-web/frontend/public/logo-removebg.png" alt="Xplorism Logo" width="120"></p>

# <p align="center">Xplorism — Premium AI Trip Planner</p>

<p align="center">
  <strong>An all-in-one, next-generation travel companion engineered to remove the friction from travel planning.</strong>
</p>

---

## Overview

**Xplorism** is a modern, premium AI-powered Trip Planner web application. Designed to provide travelers with highly personalized, beautiful, and interactive itineraries, it utilizes Gemini AI (with a local Ollama fallback), OpenStreetMap geocoding, Leaflet destination mapping, and Overpass amenities search to deliver an exceptional travel companion experience.

Instead of wasting hours hopping across search engines, maps, and spreadsheets, Xplorism offers a central, premium hub that automates itinerary generation, maps local attractions, displays real-time weather forecasts, manages holiday budgets, and locates nearby premium stays.

### The Mission
To deliver a smooth, visually arresting, and fully interactive tool that guides travelers from their initial wanderlust to final booking checkouts. By harnessing the power of advanced artificial intelligence and dynamic maps, Xplorism helps users customize every detail of their trip based on personal interests, travel style, and budgets.

---

## Key Features

### Dual-Core AI Itinerary Generator
*   **Dual AI Engine**: Generates rich, structured travel itineraries by querying the **Gemini 3.5 Flash API**. Includes a fallback query runner to local or remote **Ollama (Llama 3)** servers if the primary Gemini service fails or goes offline.
*   **Smart Customization**: Tailors itineraries based on the number of travelers, budget, interests (e.g., historical sites, adventure, food), and travel style (e.g., budget, luxury, slow-paced).
*   **Structured Schedules**: Divides each day into **Morning**, **Afternoon**, and **Evening** blocks with detailed descriptions of activities and precise estimated costs.

### Interactive Destination Map
*   **Leaflet Integration**: High-fidelity vector maps with customized marker overlays, smooth panning, and responsive grid layouts.
*   **Live Geocoding**: Utilizes the OpenStreetMap Nominatim API to instantly resolve typed city queries into geographic coordinates.
*   **Dynamic Autocomplete**: Displays city suggestions and descriptive tags (e.g., `city`, `district`, `country`) dynamically as the user types.
*   **HTML5 Geolocation**: Detects local coordinates, reverse-geocodes the city name, and instantly centers the map.

### Attractions & Amenities Lookup (Overpass & Wikipedia)
*   **OSM Attractions Querying**: Fetches castles, temples, museums, parks, beaches, and historic monuments.
*   **Sequential Failover Mirrors**: Queries multiple public Overpass API mirrors (including main, French, and LZ4 mirrors) in a round-robin style if the primary server encounters timeouts or rate limits.
*   **Wikipedia Geosearch Fallback**: Automatically queries Wikipedia's Geosearch API if all Overpass servers fail, ensuring points of interest are always populated.
*   **Nearby Amenities Locator**: Clicking on any tourist attraction displays cafes, restaurants, bars, and parks within a 1km radius on a detailed sidebar.

### Global Weather Forecasts & Context Themes
*   **Open-Meteo Integration**: Fetches real-time weather conditions and a 5-day daily forecast (highs/lows, sunrise/sunset times, wind speed, relative humidity).
*   **Dynamic Theme Panels**: Automatically swaps background themes, icons (using Lucide-React), and badge styling to match the destination's current WMO weather code.

### Premium Hotel Search & Filters
*   **Gemini Hotel Proxy**: Searches live destination coordinates to fetch exactly **20 real-world hotels** dynamically from Gemini AI.
*   **Interactive Leaflet Markers**: Maps hotels with custom marker pins, custom popups, and click-to-scroll card highlights.
*   **Sidebar Filters**: Includes real-time filter cards for star ratings, maximum budgets, and specific amenities (WiFi, Pool, Gym, Spa, Breakfast, AC).

### Razorpay Demo Payments
*   **Dynamic Checkout Overlays**: Mounts the official Razorpay Checkout SDK dynamically.
*   **Simulated Transactions**: Features payment trigger overlays that return mock success screens and record official payment IDs on completion.

### Real-Time Collaborative Workspace
*   **Collaboration Sync**: Multi-user editing of trips powered by WebSockets (Socket.io). Instantly syncs itineraries, budgets, packing lists, notes, documents, and polls.
*   **Presence Tracking**: Displays active co-travelers and identifies which tab (Itinerary, Budget, Docs, etc.) they are currently working on in real-time.
*   **Kafka Group Chat**: Topic-based trip chat inside the workspace, utilizing an Apache Kafka message broker pipeline (with an in-memory event stream fallback) to broadcast real-time co-traveler messages.

### Secure Document Vault
*   **AES-256-GCM Encryption**: Securely uploads and stores sensitive travel documents (e.g., Visas, Passports, Tickets, Insurance). File contents are fully encrypted in memory on the backend before being written to storage.
*   **Granular Access Control**: Decryption and download endpoints verify ownership or approved collaborator status before returning document files.

### Expense Tracker & AI Budget Insights
*   **Actual vs Planned Budgeting**: Visualizes travel expenses by category, tracking planned costs directly against actual expenditures.
*   **AI Financial Insights**: Queries Gemini AI to analyze spending patterns and provide optimization recommendations or alerts.
*   **OCR Receipt Scanning**: Users can upload images of physical receipts; the backend scans and extracts payment items, categories, and totals automatically.

---

## Tech Stack

### Frontend
*   **Core Framework**: [React 19](https://react.dev/) (built with [Vite](https://vitejs.dev/) for fast builds)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Router**: [React Router DOM v7](https://reactrouter.com/)
*   **Mapping**: [Leaflet](https://leafletjs.com/) & React Leaflet
*   **Payments**: [Razorpay Checkout SDK](https://razorpay.com/)
*   **Real-Time Sync**: [Socket.io Client](https://socket.io/)

### Backend
*   **Framework**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) (ES Modules)
*   **Database**: [PostgreSQL](https://www.postgresql.org/) (Native `pg` client integration)
*   **WebSockets**: [Socket.io Server](https://socket.io/)
*   **Event Streaming**: [Apache Kafka](https://kafka.apache.org/) (`kafkajs` with in-memory fallback)
*   **Security & Encryption**: Node.js built-in `crypto` library
*   **Authentication**: JSON Web Tokens (JWT) & BcryptJS for password hashing

---

## Repository Structure

```text
Xplorism/
├── xplorism-web/
│   ├── frontend/                 # Vite + React Client App
│   │   ├── public/               # Static assets & icons
│   │   ├── src/
│   │   │   ├── assets/           # Client-specific stylesheets
│   │   │   ├── components/       # Reusable UI components
│   │   │   ├── context/          # React Context States (Auth, Theme, etc.)
│   │   │   ├── pages/            # Core Pages & Views
│   │   │   ├── services/         # Axios API connection endpoints
│   │   │   ├── App.jsx           # Main client router & state handlers
│   │   │   ├── index.css         # Tailwind v4 directives & typography
│   │   │   └── main.jsx          # DOM rendering mount point
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── backend/                  # Node.js + Express API Server
│       ├── config/               # Database connection wrappers
│       ├── controllers/          # Express Request handlers
│       ├── middleware/           # Route guards (auth, validation)
│       ├── routes/               # Express routing tables
│       ├── services/             # Third-party API wrappers (Gemini, etc.)
│       ├── prisma/               # Prisma schema definitions (PostgreSQL mapping)
│       ├── schema.sql            # Native SQL table definitions
│       ├── index.js              # Application entrypoint & geocoding proxy
│       └── package.json
├── .gitignore                    # Root level Git ignores
└── README.md                     # Project documentation
```

---

## Database Schema

The database model is structured to support users, trips, itineraries, expenses, collaborative workspaces, chat rooms, and secure documents.

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

## Installation & Quick Start

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **PostgreSQL** instance (local, Docker, or Neon DB cloud)
- **Gemini API Key** (from Google AI Studio)

---

### 1️. Database Setup
Create a PostgreSQL database named `xplorism`. Populate the tables by executing the SQL statements inside [schema.sql](file:///c:/Users/tanis/OneDrive/Desktop/Tanish/Xplorism/xplorism-web/backend/schema.sql):

```bash
psql -U your_postgres_user -d xplorism -f xplorism-web/backend/schema.sql
```
*(Alternatively, the backend server will automatically check and initialize the tables using `initDatabase()` on startup.)*

---

### 2️. Backend Configuration & Startup
1. Navigate to the backend directory:
   ```bash
   cd xplorism-web/backend
   ```
2. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Update the variables in your `.env`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/xplorism?sslmode=disable"
   JWT_SECRET="generate_a_secure_jwt_secret_token"
   GOOGLE_CLIENT_ID="optional_google_client_id_for_sso"
   GEMINI_API_KEY="your_actual_google_gemini_api_key"
   OLLAMA_BASE_URL="http://localhost:11434"
   OLLAMA_MODEL="llama3"
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the server in development mode:
   ```bash
   npm run dev
   ```
   *The backend will listen on `http://localhost:5000`.*

---

### 3️. Frontend Configuration & Startup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file:
   ```env
   VITE_GOOGLE_CLIENT_ID="your_google_client_id_here"
   ```
4. Run the frontend build server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser. Requests to the backend API are proxied through Vite configuration settings.*

---

## API Reference

For detailed documentation on the backend endpoints, request payloads, and security configurations, please refer to the [API Reference Guide](API.md).

---

## Data Sources & Integrations

Xplorism aggregates data from multiple open-access and premium providers to power its features:

*   **Weather Data**: Sourced from the [Open-Meteo API](https://open-meteo.com/). Provides real-time temperatures, relative humidity, wind speed, WMO weather codes, and 5-day daily forecasts without requiring API keys.
*   **Location Geocoding & Autocompletion**: Sourced from the [OpenStreetMap Nominatim API](https://nominatim.org/). Resolves search query strings into coordinates (latitude & longitude) and provides country tags and address hierarchies.
*   **Attractions**: Sourced from public [Overpass API](https://overpass-api.de/) mirrors (OpenStreetMap data) to query castles, monuments, temples, viewpoints, and museums within a regional bounding box.
*   **POI Fallback**: Sourced from the [Wikipedia Geosearch API](https://www.mediawiki.org/wiki/API:Geosearch) when Overpass servers are rate-limited or offline.
*   **AI Travel Models**: 
    *   **Primary Engine**: [Google Gemini 3.5 Flash](https://deepmind.google/technologies/gemini/) (via Google Generative Language API endpoints).
    *   **Fallback Local Engine**: Local or remote instances of [Ollama (Llama 3)](https://ollama.com/) running on port `11434`.

---

## Deployment & CI/CD

Xplorism is configured with an automated continuous integration and continuous deployment (CI/CD) pipeline using **GitHub Actions**:

### Backend Deployment (Azure Web Apps)
The backend service is hosted on Azure App Service under the application name `xplorism-api`. 
- **CI/CD Workflow**: The deployment is controlled by the GitHub Actions workflow at [.github/workflows/main_xplorism-api.yml](file:///c:/Users/tanis/OneDrive/Desktop/Tanish/Xplorism/.github/workflows/main_xplorism-api.yml).
- **Pipeline Steps**:
  1. Installs dependencies and runs test checks under Node.js `22.x` environment.
  2. Compresses the backend bundle into a deployment artifact.
  3. Uses `azure/webapps-deploy` to upload the package to the `xplorism-api` Production slot using your repository's `AZURE_PUBLISH_PROFILE` secret credential.

### Frontend Deployment (Vercel)
The client-side React app is hosted on **Vercel**:
- **Framework Preset**: `Vite`
- **Root Directory**: `xplorism-web/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Set this environment variable in the Vercel dashboard to point to your backend API URL deployed on Azure (e.g., `https://xplorism-api.azurewebsites.net`).

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
