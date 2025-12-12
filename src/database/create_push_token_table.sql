-- Create table for storing Expo push tokens
CREATE TABLE IF NOT EXISTS user_push_token (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES useraccount(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    platform VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_user_push_token_user_id ON user_push_token(user_id);
