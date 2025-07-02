/*
  # Add campaign summary to datasets table

  1. Changes
    - Add `campaign_summary` column to datasets table to store campaign details
    - Add `updated_at` column for tracking changes
    
  2. Security
    - No changes to existing RLS policies needed
*/

-- Add campaign summary column to datasets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datasets' AND column_name = 'campaign_summary'
  ) THEN
    ALTER TABLE datasets ADD COLUMN campaign_summary jsonb;
  END IF;
END $$;

-- Add updated_at column to datasets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datasets' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE datasets ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for campaign summary queries
CREATE INDEX IF NOT EXISTS idx_datasets_campaign_summary ON datasets USING gin (campaign_summary);