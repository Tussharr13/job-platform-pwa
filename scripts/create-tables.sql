-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('applicant', 'recruiter')),
  full_name TEXT,
  avatar_url TEXT,
  tokens INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'internship', 'remote')),
  salary_min INTEGER,
  salary_max INTEGER,
  location TEXT NOT NULL,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resume_url TEXT NOT NULL,
  video_intro_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'interview', 'rejected', 'accepted')),
  queue_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Jobs: Everyone can read, only recruiters can create/update their own
CREATE POLICY "Anyone can view jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Recruiters can insert own jobs" ON jobs FOR INSERT WITH CHECK (
  auth.uid() = recruiter_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'recruiter')
);
CREATE POLICY "Recruiters can update own jobs" ON jobs FOR UPDATE USING (
  auth.uid() = recruiter_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'recruiter')
);

-- Applications: Users can view their own applications, recruiters can view applications for their jobs
CREATE POLICY "Applicants can view own applications" ON applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Recruiters can view applications for their jobs" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
);
CREATE POLICY "Applicants can insert own applications" ON applications FOR INSERT WITH CHECK (
  auth.uid() = applicant_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'applicant')
);
CREATE POLICY "Recruiters can update applications for their jobs" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
);

-- Token transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON token_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON token_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_queue_position ON applications(queue_position);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('applications', 'applications', false);

-- Create storage policies
CREATE POLICY "Users can upload their own files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'applications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT USING (
  bucket_id = 'applications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Recruiters can view application files" ON storage.objects FOR SELECT USING (
  bucket_id = 'applications' AND 
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.recruiter_id = auth.uid()
    AND (a.resume_url = name OR a.video_intro_url = name)
  )
);
