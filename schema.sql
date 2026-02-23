-- DataDetox PostgreSQL Schema

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File Metadata Table
CREATE TABLE files_metadata (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    size BIGINT NOT NULL,
    hash VARCHAR(64),
    file_type VARCHAR(50),
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cleanup Recommendations
CREATE TABLE cleanup_recommendations (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files_metadata(id),
    confidence_score DECIMAL(5,2),
    risk_level VARCHAR(20),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Decisions History
CREATE TABLE user_decisions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    recommendation_id INTEGER REFERENCES cleanup_recommendations(id),
    decision VARCHAR(20), -- 'approve', 'reject', 'override'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Storage Trend Logs
CREATE TABLE storage_trends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_used_size BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Duplicate Clusters
CREATE TABLE duplicate_clusters (
    id SERIAL PRIMARY KEY,
    hash VARCHAR(64) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    file_count INTEGER,
    total_wasted_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forecast Results
CREATE TABLE forecast_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    forecast_date DATE NOT NULL,
    predicted_size BIGINT NOT NULL,
    confidence_interval_low BIGINT,
    confidence_interval_high BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
