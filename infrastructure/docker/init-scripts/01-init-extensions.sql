-- ===============================================
-- PostgreSQL Extensions Initialization Script
-- Run on database startup to enable necessary extensions
-- ===============================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search extension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom schemas
CREATE SCHEMA IF NOT EXISTS school_core;
CREATE SCHEMA IF NOT EXISTS school_academics;
CREATE SCHEMA IF NOT EXISTS school_infrastructure;
CREATE SCHEMA IF NOT EXISTS school_assessment;

-- Set search path to include custom schemas
ALTER DATABASE school_management_db SET search_path TO
    school_core, 
    school_academics, 
    school_infrastructure, 
    school_assessment, 
    public;

-- Crete audit log function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log message
DO $$
BEGIN
   RAISE NOTICE 'PostgreSQL extensions and schemas initialized successfully.';
END $$;
