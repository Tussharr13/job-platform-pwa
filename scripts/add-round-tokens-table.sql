-- Create round_tokens table for managing token numbers in job application rounds
CREATE TABLE IF NOT EXISTS round_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  token_number INTEGER NOT NULL CHECK (token_number > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expired_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, round_number, token_number),
  UNIQUE(user_id, job_id, round_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_round_tokens_user_id ON round_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_round_tokens_job_id ON round_tokens(job_id);
CREATE INDEX IF NOT EXISTS idx_round_tokens_round_number ON round_tokens(round_number);
CREATE INDEX IF NOT EXISTS idx_round_tokens_status ON round_tokens(status);
CREATE INDEX IF NOT EXISTS idx_round_tokens_job_round ON round_tokens(job_id, round_number);

-- Enable RLS
ALTER TABLE round_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tokens" ON round_tokens FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "Recruiters can view tokens for their jobs" ON round_tokens FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
);

CREATE POLICY "Recruiters can insert tokens for their jobs" ON round_tokens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
);

CREATE POLICY "Recruiters can update tokens for their jobs" ON round_tokens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_round_tokens_updated_at 
  BEFORE UPDATE ON round_tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get next token number for a job and round
CREATE OR REPLACE FUNCTION get_next_token_number(p_job_id UUID, p_round_number INTEGER)
RETURNS INTEGER AS $$
DECLARE
  next_token INTEGER;
BEGIN
  SELECT COALESCE(MAX(token_number), 0) + 1
  INTO next_token
  FROM round_tokens
  WHERE job_id = p_job_id AND round_number = p_round_number;
  
  RETURN next_token;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
INSERT INTO round_tokens (user_id, job_id, round_number, token_number, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 1, 1, 'completed'),
  ('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 2, 1, 'active');
