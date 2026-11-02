-- Enable the btree_gist extension required for PostgreSQL GiST Exclusion Constraints on scalar types
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Verification log
DO $$
BEGIN
    RAISE NOTICE 'LeaveDesk PostgreSQL database initialized with btree_gist extension enabled.';
END $$;
