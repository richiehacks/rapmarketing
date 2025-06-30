/*
  # Create tables for data upload functionality

  1. New Tables
    - `datasets`
      - `id` (uuid, primary key)
      - `name` (text, file name)
      - `type` (text, campaign type)
      - `upload_date` (date, when uploaded)
      - `row_count` (integer, number of rows)
      - `tags` (text array, categorization tags)
      - `file_path` (text, storage path)
      - `user_id` (text, uploader reference)
      - `created_at` (timestamp)

    - `linkedin_contacts`
      - `id` (uuid, primary key)
      - `name` (text, contact name)
      - `company` (text, company name)
      - `title` (text, job title)
      - `date_sent` (date, when request sent)
      - `status` (text, acceptance status)
      - `campaign_id` (text, campaign reference)
      - `dataset_id` (uuid, foreign key to datasets)
      - `created_at` (timestamp)

    - `email_contacts`
      - `id` (uuid, primary key)
      - `name` (text, contact name)
      - `email` (text, email address)
      - `company` (text, company name)
      - `campaign_name` (text, campaign name)
      - `date_sent` (date, when email sent)
      - `opened` (boolean, email opened)
      - `replied` (boolean, email replied)
      - `dataset_id` (uuid, foreign key to datasets)
      - `created_at` (timestamp)

    - `webinar_attendees`
      - `id` (uuid, primary key)
      - `name` (text, attendee name)
      - `email` (text, email address)
      - `company` (text, company name)
      - `industry` (text, industry sector)
      - `invited_date` (date, invitation date)
      - `rsvp_status` (text, RSVP status)
      - `webinar_id` (text, webinar reference)
      - `dataset_id` (uuid, foreign key to datasets)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access where appropriate

  3. Storage
    - Create storage bucket for uploaded files
*/

-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  upload_date date DEFAULT CURRENT_DATE,
  row_count integer NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  file_path text NOT NULL,
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create linkedin_contacts table
CREATE TABLE IF NOT EXISTS linkedin_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  date_sent date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('accepted', 'pending', 'declined')),
  campaign_id text NOT NULL DEFAULT '',
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create email_contacts table
CREATE TABLE IF NOT EXISTS email_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  campaign_name text NOT NULL DEFAULT '',
  date_sent date NOT NULL DEFAULT CURRENT_DATE,
  opened boolean DEFAULT false,
  replied boolean DEFAULT false,
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create webinar_attendees table
CREATE TABLE IF NOT EXISTS webinar_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT 'Other',
  invited_date date NOT NULL DEFAULT CURRENT_DATE,
  rsvp_status text NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('confirmed', 'pending', 'declined')),
  webinar_id text NOT NULL DEFAULT '',
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_attendees ENABLE ROW LEVEL SECURITY;

-- Create policies for datasets
CREATE POLICY "Users can read own datasets"
  ON datasets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own datasets"
  ON datasets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own datasets"
  ON datasets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own datasets"
  ON datasets
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Create policies for linkedin_contacts
CREATE POLICY "Users can read linkedin contacts from own datasets"
  ON linkedin_contacts
  FOR SELECT
  TO authenticated
  USING (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert linkedin contacts to own datasets"
  ON linkedin_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()::text
    )
  );

-- Create policies for email_contacts
CREATE POLICY "Users can read email contacts from own datasets"
  ON email_contacts
  FOR SELECT
  TO authenticated
  USING (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert email contacts to own datasets"
  ON email_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()::text
    )
  );

-- Create policies for webinar_attendees
CREATE POLICY "Users can read webinar attendees from own datasets"
  ON webinar_attendees
  FOR SELECT
  TO authenticated
  USING (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert webinar attendees to own datasets"
  ON webinar_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()::text
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_type ON datasets(type);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets(created_at);

CREATE INDEX IF NOT EXISTS idx_linkedin_contacts_dataset_id ON linkedin_contacts(dataset_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_contacts_status ON linkedin_contacts(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_contacts_date_sent ON linkedin_contacts(date_sent);

CREATE INDEX IF NOT EXISTS idx_email_contacts_dataset_id ON email_contacts(dataset_id);
CREATE INDEX IF NOT EXISTS idx_email_contacts_opened ON email_contacts(opened);
CREATE INDEX IF NOT EXISTS idx_email_contacts_replied ON email_contacts(replied);

CREATE INDEX IF NOT EXISTS idx_webinar_attendees_dataset_id ON webinar_attendees(dataset_id);
CREATE INDEX IF NOT EXISTS idx_webinar_attendees_rsvp_status ON webinar_attendees(rsvp_status);

-- Create storage bucket for datasets (if it doesn't exist)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('datasets', 'datasets', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create storage policies
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'datasets');

CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'datasets');

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'datasets');