# 🗺️ Xplorism — Premium AI Trip Planner

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-blue.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-v19.0.0-61dafb.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0.0-38bdf8.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/AI_Engine-Gemini_3.5_Flash-ff4b4b.svg?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

Xplorism is a modern, premium AI-powered Trip Planner web application. Designed to provide travelers with highly personalized, beautiful, and interactive itineraries, it utilizes Gemini AI (with a local Ollama fallback), OpenStreetMap geocoding, Leaflet destination mapping, and Overpass amenities search to deliver an exceptional travel companion experience.

---

## 🌟 Key Features

### 🧠 AI-Powered Itinerary Generator
- **Dual AI Core**: Generates rich, structured travel itineraries by querying the **Gemini 3.5 Flash API**. Includes a fallback query runner to local or remote **Ollama (Llama 3)** servers if the primary Gemini service fails or goes offline.
- **Smart Recommendations**: Customizes itineraries based on the number of travelers, budget, interests (e.g., historical sites, adventure, food), and travel style (e.g., budget, luxury, slow-paced).
- **Structured Outputs**: Divides each day into **Morning**, **Afternoon**, and **Evening** categories, with detailed descriptions of activities and precise estimated costs.

### 🗺️ Interactive Destination Map (Leaflet)
- **Rich Vector Maps**: Powered by Leaflet with customized marker overlays, smooth panning, and responsive grid layouts.
- **Live Location Geocoding**: Utilizes the OpenStreetMap Nominatim API to instantly resolve typed city queries into geographic coordinates.
- **Real-Time Autocomplete Suggestions**: Displays city suggestions and descriptive tags (e.g., `city`, `district`, `country`) dynamically as the user types.
- **GPS Centering**: Accesses the HTML5 Geolocation API to detect coordinates, reverse-geocode the city name, and focus the map.

### 🏛️ Attractions & Amenities Lookup (Overpass & Wikipedia)
- **High-Fidelity Attraction Querying**: Fetches castles, temples, museums, parks, beaches, and historic monuments.
- **Sequential Mirror Failovers**: Queries multiple public Overpass API mirror servers in a round-robin style if the primary server encounters timeouts or rate limits.
- **Wikipedia Geosearch Fallback**: Automatically queries Wikipedia's Geosearch API if all Overpass servers fail, ensuring points of interest are always populated.
- **Nearby Amenities Locator**: Clicking on any tourist attraction displays cafes, restaurants, bars, and parks within a 1km radius on a detailed sidebar.

### 🌦️ Global Weather Forecasts
- **Dynamic Climate Overview**: Integrates with the Open-Meteo API to fetch real-time weather conditions and a 5-day daily forecast (highs/lows, sunrise/sunset times, wind speed, relative humidity).
- **Dynamic Theme Panels**: Automatically swaps background themes, icons (using Lucide-React), and badge styling to match the destination's current weather code (WMO codes for clear sky, drizzle, rain, fog, snowfall, or thunderstorm).

### 🔐 Unified Authentication Modal & Interceptions
- **Framer Motion Transition Animations**: Single unified tabbed card handling Sign In and Sign Up.
- **Deep-Link Interceptions**: Requests to access `/login` or `/register` are intercepted, redirecting users to the home dashboard and launching the modal instantly.
- **Router State Clearing**: Prevents persistent modal reopening loops on manual page reloads or browser history modifications.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (using Vite for ultra-fast builds)
- **Styling**: Tailwind CSS v4 (native CSS configuration, custom color grids)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Router**: React Router DOM v7
- **Mapping**: Leaflet React & Vanilla Leaflet

### Backend
- **Framework**: Node.js & Express.js (ES Modules import syntax)
- **Database**: PostgreSQL (Prisma Client & native `pg` client integration)
- **Authentication**: JWT (JSON Web Tokens) & BcryptJS for password hashing
- **Hosting / DB Cloud**: Compatible with Neon Database, PostgreSQL, or local instances

---

## 📁 Repository Directory Structure

```text
Xplorism/
├── xplorism-web/
│   ├── frontend/                 # Vite + React Client App
│   │   ├── public/               # Static assets & icons
│   │   ├── src/
│   │   │   ├── assets/           # Client-specific stylesheets & assets
│   │   │   ├── components/       # Reusable components (AuthModal, Navbar, TripWizard)
│   │   │   ├── context/          # Context states (AuthContext)
│   │   │   ├── pages/            # Core views (LandingPage, DashboardStub, WeatherPage, etc.)
│   │   │   ├── services/         # Axios API connection endpoints
│   │   │   ├── App.jsx           # Main client router & state handlers
│   │   │   ├── index.css         # Tailwind v4 directives and typography definitions
│   │   │   └── main.jsx          # DOM rendering mount point
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── backend/                  # Node.js + Express API Server
│       ├── config/               # Database connection wrappers (db.js)
│       ├── controllers/          # Request handlers (authController, tripController)
│       ├── middleware/           # Route guards (authMiddleware)
│       ├── routes/               # Express routing tables (authRoutes, tripRoutes)
│       ├── services/             # Third-party wrappers (geminiService)
│       ├── prisma/               # Prisma schema definitions (PostgreSQL model mapping)
│       ├── schema.sql            # Native SQL table definitions
│       ├── index.js              # Application entrypoint & Nominatim geocoding proxy
│       └── package.json
│
├── .gitignore                    # Root level Git ignores
└── README.md                     # Project documentation
```

---

## 💾 Database Schema

Xplorism uses PostgreSQL to store user accounts, itineraries, and trip configurations.

```mermaid
erDiagram
    users ||--o{ trips : "creates"
    trips ||--o{ itinerary : "contains"

    users {
        UUID id PK
        VARCHAR name
        VARCHAR email UK
        VARCHAR password
        VARCHAR google_id UK
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
```

---

## 🚀 Installation & Quick Start

### 📋 Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **PostgreSQL** instance (local, Docker, or Neon DB cloud)
- **Gemini API Key** (from Google AI Studio)

---

### 1️⃣ Database Setup
Create a PostgreSQL database called `xplorism`. Populate the tables by executing the SQL statements inside [schema.sql](file:///c:/Users/tanis/OneDrive/Desktop/Tanish/Xplorism/xplorism-web/backend/schema.sql):

```bash
psql -U your_postgres_user -d xplorism -f xplorism-web/backend/schema.sql
```
*(Alternatively, the backend server will automatically check and initialize the tables using `initDatabase()` on startup.)*

---

### 2️⃣ Backend Configuration & Startup
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

### 3️⃣ Frontend Configuration & Startup
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

## 📡 API Documentation & Endpoints

### 🔐 Authentication Routes
| Method | Endpoint | Auth Required | Request Body | Description |
| :--- | :--- | :---: | :--- | :--- |
| **POST** | `/auth/register` | No | `{ "name", "email", "password" }` | Registers a new user account, returns JWT. |
| **POST** | `/auth/login` | No | `{ "email", "password" }` | Authenticates user credentials, returns JWT. |
| **POST** | `/auth/google` | No | `{ "token" }` | Authenticates Google Client credentials. |

### ✈️ Trip & Itinerary Routes
| Method | Endpoint | Auth Required | Request Body / Query Params | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/trips` | **Yes (JWT)** | *None* | Retrieves all saved trips and detailed itineraries for the authenticated user. |
| **POST** | `/trips` | **Yes (JWT)** | `{ "destination", "startDate", "endDate", "budget", "travelers", "travelStyle", "interests", "itinerary" }` | Saves a new trip and its daily itineraries in the database. |
| **PUT** | `/trips/:id` | **Yes (JWT)** | `{ "destination", "startDate", "endDate", "budget", "travelers", "travelStyle", "interests", "itinerary" }` | Updates details or overrides the itineraries of an existing trip. |
| **DELETE**| `/trips/:id` | **Yes (JWT)** | *None* | Deletes the specified trip and cascades deletions to related itineraries. |
| **POST** | `/trips/generate`| No | `{ "destination", "startDate", "endDate", "budget", "travelers", "travelStyle", "interests" }` | Direct AI model call. Returns structured JSON containing a customized itinerary. |

### 📍 Geocoding & Discovery Routes
| Method | Endpoint | Auth Required | Query Parameters | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/geocode` | No | `q=CityName` | Proxies searches to Nominatim with cache lookups and fallback keywords. |
| **GET** | `/nearby` | No | `destination=CityName` | Prompts Gemini/Ollama to recommend 8 nearby sites within 100km. |
| **GET** | `/health` | No | *None* | Simple API heartbeat indicator. |

---

## 📡 Data Sources & API Integrations

Xplorism aggregates data from multiple open-access and premium providers to power its features:

*   **🌦️ Real-Time & Forecasted Weather**: Sourced from the [Open-Meteo API](https://open-meteo.com/). Provides real-time temperatures, relative humidity, wind speed, WMO weather codes, and 5-day daily forecasts without requiring API keys.
*   **📍 Location Geocoding & Autocompletion**: Sourced from the [OpenStreetMap Nominatim API](https://nominatim.org/). Resolves search query strings into coordinates (latitude & longitude) and provides country tags and address hierarchies.
*   **🏛️ Nearby Attractions & Places of Interest**: Sourced from public [Overpass API](https://overpass-api.de/) mirrors (OpenStreetMap data) to query castles, monuments, temples, viewpoints, and museums within a regional bounding box.
*   **📖 Points of Interest Failover**: Sourced from the [Wikipedia Geosearch API](https://www.mediawiki.org/wiki/API:Geosearch) when Overpass servers are rate-limited or offline.
*   **🧠 AI Travel Models**: 
    *   **Primary Engine**: [Google Gemini 3.5 Flash](https://deepmind.google/technologies/gemini/) (via Google Generative Language API endpoints).
    *   **Fallback Local Engine**: Local or remote instances of [Ollama (Llama 3)](https://ollama.com/) running on port `11434`.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
