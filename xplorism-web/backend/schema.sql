-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist
DROP TABLE IF EXISTS itinerary;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trips Table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DOUBLE PRECISION NOT NULL,
    travelers INTEGER NOT NULL,
    travel_style VARCHAR(255) NOT NULL,
    interests TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Itinerary Table
CREATE TABLE itinerary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    activity TEXT NOT NULL,
    time VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    estimated_cost DOUBLE PRECISION NOT NULL DEFAULT 0.0
);
