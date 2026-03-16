-- ===========================================================
-- Database Roles & Permissions
-- Following the principle of least privilege, we create specific roles
-- for different application components to ensure secure access control.    
-- ===========================================================

-- Application Role (for API server)
CREATE ROLE school_app WITH LOGIN PASSWORD 'AppUser@2025!';

-- Read-Only Role (for reporting and analytics)
CREATE ROLE school_readonly WITH LOGIN PASSWORD 'ReadOnly@2025!';

-- Grant necessary privileges to application role
GRANT CONNECT ON DATABASE school_management_db TO school_app;
GRANT CONNECT ON DATABASE school_management_db TO school_readonly;

-- Grant usage on schemas to application role
GRANT USAGE ON SCHEMA school_core TO school_app, school_readonly;
GRANT USAGE ON SCHEMA school_academics TO school_app, school_readonly;
GRANT USAGE ON SCHEMA school_infrastructure TO school_app, school_readonly;
GRANT USAGE ON SCHEMA school_assessment TO school_app, school_readonly;

--App role privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA school_core TO school_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA school_academics TO school_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA school_infrastructure TO school_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA school_assessment TO school_app;

-- Read-only role privileges
GRANT SELECT ON ALL TABLES IN SCHEMA school_core TO school_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA school_academics TO school_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA school_infrastructure TO school_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA school_assessment TO school_readonly;

-- Ensure future tables inherit the same privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA school_core GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA school_core GRANT SELECT ON TABLES TO school_readonly;

DO $$
BEGIN
    RAISE NOTICE 'Database roles and permissions created successfully.';
END $$;