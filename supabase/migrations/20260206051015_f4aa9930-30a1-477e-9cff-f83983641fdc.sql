-- Drop the composite unique constraint that's blocking imports
-- The 'id' column already serves as the primary key for uniqueness
DROP INDEX IF EXISTS cars_make_model_year_trans_drive_idx;