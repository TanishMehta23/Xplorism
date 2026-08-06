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

-- Expenses Table (for budget tracking)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day INTEGER,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    planned_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    actual_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Favorites / Wishlist Table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'attraction',
    description TEXT DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    distance VARCHAR(50) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    image_url TEXT DEFAULT '',
    destination VARCHAR(255) DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alter trips table to support custom packing checklist JSON
ALTER TABLE trips ADD COLUMN IF NOT EXISTS packing_list JSONB;

-- Ensure users table password column is nullable (for Google Sign-In support)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Documents Table for Vault Storage
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'passport', 'visa', 'ticket', 'hotel', 'insurance', 'other'
    file_name VARCHAR(255),
    file_content TEXT, -- Base64 encoded file content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alter expenses table to support paid_by (for co-traveler bill splitting)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_by VARCHAR(255) DEFAULT 'Me';

-- Posts Table for Community / Social Feed
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(150) NOT NULL,
    trip_destination VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    photo_content TEXT, -- Base64 encoded image
    likes INTEGER NOT NULL DEFAULT 0,
    liked_by TEXT[] DEFAULT '{}', -- Array of user IDs who liked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

<<<<<<< Updated upstream
-- Alter documents table for Secure Vault support
ALTER TABLE documents ADD COLUMN IF NOT EXISTS encrypted_file_key TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS iv TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS auth_tag TEXT;
ALTER TABLE documents ALTER COLUMN file_content DROP NOT NULL;
=======
-- Alter users table to support profile_photo, preferences, and travel_history
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS travel_history JSONB DEFAULT '[]';
>>>>>>> Stashed changes

