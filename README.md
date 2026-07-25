# Xplorism - AI Trip Planner

Xplorism is a modern, premium AI-powered Trip Planner application built with React, Tailwind CSS, Express, and PostgreSQL.

## Folder Structure

```text
Xplorism/
├── xplorism-web/           # Main application code
│   ├── frontend/           # Vite + React + Tailwind v4 + Framer Motion
│   └── backend/            # Express.js + JWT + bcrypt + Prisma (PostgreSQL)
│
├── .gitignore              # Main gitignore
└── README.md               # Project documentation
```

## Running the Application

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd xplorism-web/backend
   ```
2. Set up your `.env` configuration file based on `.env.example`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd xplorism-web/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The client will proxy backend requests to `http://localhost:5000`.

## Features Implemented

### 🔐 Unified Authentication Modal
- **Tabbed Login & Register**: Single modal card handling both Sign In and Sign Up flows with Framer Motion animations.
- **Seamless Deep-Link Interception**: Direct accesses to `/login` and `/register` are intercepted, redirecting users to the home dashboard and launching the modal instantly.
- **Router State Clearing**: Prevents persistent modal reopening loops on manual page reloads.

### 🗺️ Interactive Destination Map (Leaflet)
- **Leaflet Integration**: Renders map canvas dynamically with custom marker overlays, responsive layout grids, and equal-height stretched columns.
- **Live Location Geocoding**: Resolves typed cities to coordinates using OpenStreetMap Nominatim.
- **Real-Time Autocomplete suggestions**: Shows matching cities in a dropdown with tags (e.g. `city`, `district`) as you type.
- **GPS Centering**: Accesses the HTML5 Geolocation API to find the user's coordinates, reverse-geocodes their city name, and pans the map.

### 🏛️ Attractions & Amenities Lookup (Overpass & Wikipedia)
- **Comprehensive Sights Query**: Fetches historical monuments, castles, temples, waterfalls, beaches, and parks.
- **Robust Failover Architecture**:
  - **Sequential Mirrors**: Falls back to multiple public Overpass API servers if one is down.
  - **Request Timeouts**: Aborts queries taking > 6 seconds to prevent hanging.
  - **Wikipedia Fallback**: Automatically queries Wikipedia's Geosearch API if all Overpass servers fail, ensuring sights are always loaded.
- **Nearby Amenities List**: Clicking any sight pulls restaurants, cafes, bars, and parks within a 1km radius, allowing users to discover facilities nearby.
