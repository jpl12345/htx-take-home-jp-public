CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'regular',
    created_at TIMESTAMP DEFAULT NOW(),
    last_logged_in TIMESTAMP DEFAULT NULL,
    CHECK (account_type IN ('regular', 'superuser'))
);

CREATE TABLE IF NOT EXISTS audio_files (
    file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('Music', 'Podcast', 'Voice Note', 'Audiobook', 'Others')) NOT NULL,
    file_path TEXT NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT NOW(),
    processed_data JSONB DEFAULT NULL,
    ai_processing_types TEXT[] DEFAULT NULL,
    checksum VARCHAR(32) DEFAULT NULL,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'processing'
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT one_session_per_user UNIQUE (user_id)
 
);
