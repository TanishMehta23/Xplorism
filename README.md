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
