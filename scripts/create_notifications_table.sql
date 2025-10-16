-- Create notifications table for challenge rank changes
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES quiz_challenges(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'first_place_lost', 'rank_change', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Store additional data like previous_rank, new_rank, overtaken_by, etc.
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create index for faster queries by created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Server can insert notifications for any user (service role)
-- Note: This will be used by the backend API with service_role key
CREATE POLICY "Service role can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE notifications IS 'Stores user notifications for challenge rank changes and other events';
COMMENT ON COLUMN notifications.type IS 'Type of notification: first_place_lost, rank_change, new_high_score, etc.';
COMMENT ON COLUMN notifications.data IS 'JSONB object containing event-specific data like ranks, scores, usernames';
