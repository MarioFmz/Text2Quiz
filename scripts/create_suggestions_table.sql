-- Create suggestions table for user feedback/suggestions
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: can be anonymous
  email VARCHAR(255), -- Optional: for anonymous users or contact
  category VARCHAR(50) NOT NULL, -- 'feature', 'bug', 'improvement', 'other'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'in_progress', 'completed', 'rejected'
  admin_notes TEXT, -- Notes from admin/developer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by status
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);

-- Create index for faster queries by category
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);

-- Create index for faster queries by created_at
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at DESC);

-- Create index for user's suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);

-- Enable Row Level Security
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert suggestions (even anonymous)
CREATE POLICY "Anyone can submit suggestions"
  ON suggestions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
  ON suggestions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Service role can view all suggestions (for admin panel)
-- Note: This will be used by the backend API with service_role key
CREATE POLICY "Service role can view all suggestions"
  ON suggestions
  FOR SELECT
  USING (true);

-- Policy: Service role can update suggestions (for status changes and admin notes)
CREATE POLICY "Service role can update suggestions"
  ON suggestions
  FOR UPDATE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_suggestions_timestamp
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_suggestions_updated_at();

COMMENT ON TABLE suggestions IS 'Stores user suggestions and feedback for the application';
COMMENT ON COLUMN suggestions.category IS 'Category: feature, bug, improvement, other';
COMMENT ON COLUMN suggestions.status IS 'Status: pending, reviewed, in_progress, completed, rejected';
COMMENT ON COLUMN suggestions.admin_notes IS 'Internal notes from admin/developer for tracking';
