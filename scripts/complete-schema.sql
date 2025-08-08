-- JobQueue Platform - Complete Database Schema
-- This script creates all tables, indexes, RLS policies, and storage buckets

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS token_transactions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop storage buckets if they exist
DELETE FROM storage.buckets WHERE id = 'applications';

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('applicant', 'recruiter')),
  full_name TEXT,
  avatar_url TEXT,
  tokens INTEGER DEFAULT 10 CHECK (tokens >= 0),
  phone TEXT,
  location TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  linkedin_url TEXT,
  portfolio_url TEXT,
  company TEXT, -- For recruiters
  company_size TEXT, -- For recruiters
  is_verified BOOLEAN DEFAULT FALSE,
  profile_completed BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  responsibilities TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'internship', 'contract', 'remote')),
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  salary_min INTEGER CHECK (salary_min >= 0),
  salary_max INTEGER CHECK (salary_max >= salary_min),
  salary_currency TEXT DEFAULT 'USD',
  location TEXT NOT NULL,
  remote_allowed BOOLEAN DEFAULT FALSE,
  application_deadline TIMESTAMP WITH TIME ZONE,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resume_url TEXT NOT NULL,
  video_intro_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'interview_completed', 'rejected', 'accepted', 'withdrawn')),
  queue_position INTEGER NOT NULL,
  priority_score INTEGER DEFAULT 0,
  recruiter_notes TEXT,
  interview_date TIMESTAMP WITH TIME ZONE,
  interview_type TEXT CHECK (interview_type IN ('phone', 'video', 'in_person', 'technical')),
  interview_feedback TEXT,
  rejection_reason TEXT,
  salary_expectation INTEGER,
  availability_date DATE,
  referral_source TEXT,
  viewed_by_recruiter BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

-- Create token_transactions table
CREATE TABLE token_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'refund', 'bonus')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  reference_id UUID, -- Can reference job_id, application_id, etc.
  reference_type TEXT, -- 'job_application', 'profile_completion', 'referral', etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_views table for analytics
CREATE TABLE job_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_jobs table
CREATE TABLE saved_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('application_update', 'job_match', 'token_earned', 'interview_scheduled', 'system')),
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_email TEXT NOT NULL,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  tokens_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create assessments table
CREATE TABLE assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'technical', 'personality', 'cognitive'
  questions JSONB NOT NULL DEFAULT '[]',
  duration_minutes INTEGER DEFAULT 30,
  passing_score INTEGER DEFAULT 70,
  tokens_reward INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_assessments table
CREATE TABLE user_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, assessment_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_tokens ON profiles(tokens);
CREATE INDEX idx_profiles_last_active ON profiles(last_active);

CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_featured ON jobs(featured);
CREATE INDEX idx_jobs_tags ON jobs USING GIN(tags);
CREATE INDEX idx_jobs_salary_range ON jobs(salary_min, salary_max);

CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_queue_position ON applications(queue_position);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_applications_interview_date ON applications(interview_date);

CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX idx_token_transactions_type ON token_transactions(type);
CREATE INDEX idx_token_transactions_reference ON token_transactions(reference_id, reference_type);

CREATE INDEX idx_job_views_job_id ON job_views(job_id);
CREATE INDEX idx_job_views_user_id ON job_views(user_id);
CREATE INDEX idx_job_views_created_at ON job_views(created_at DESC);

CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job_id ON saved_jobs(job_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE INDEX idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX idx_user_assessments_assessment_id ON user_assessments(assessment_id);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles viewable by authenticated users" ON profiles FOR SELECT USING (
  auth.role() = 'authenticated' AND (full_name IS NOT NULL OR role = 'recruiter')
);

-- RLS Policies for jobs
CREATE POLICY "Anyone can view active jobs" ON jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Recruiters can view own jobs" ON jobs FOR SELECT USING (
  auth.uid() = recruiter_id
);
CREATE POLICY "Recruiters can insert own jobs" ON jobs FOR INSERT WITH CHECK (
  auth.uid() = recruiter_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'recruiter')
);
CREATE POLICY "Recruiters can update own jobs" ON jobs FOR UPDATE USING (
  auth.uid() = recruiter_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'recruiter')
);
CREATE POLICY "Recruiters can delete own jobs" ON jobs FOR DELETE USING (
  auth.uid() = recruiter_id
);

-- RLS Policies for applications
CREATE POLICY "Applicants can view own applications" ON applications FOR SELECT USING (
  auth.uid() = applicant_id
);
CREATE POLICY "Recruiters can view applications for their jobs" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
);
CREATE POLICY "Applicants can insert own applications" ON applications FOR INSERT WITH CHECK (
  auth.uid() = applicant_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'applicant')
);
CREATE POLICY "Applicants can update own applications" ON applications FOR UPDATE USING (
  auth.uid() = applicant_id
);
CREATE POLICY "Recruiters can update applications for their jobs" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
);

-- RLS Policies for token_transactions
CREATE POLICY "Users can view own transactions" ON token_transactions FOR SELECT USING (
  auth.uid() = user_id
);
CREATE POLICY "Users can insert own transactions" ON token_transactions FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- RLS Policies for job_views
CREATE POLICY "Users can insert job views" ON job_views FOR INSERT WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);
CREATE POLICY "Job owners can view their job analytics" ON job_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
);

-- RLS Policies for saved_jobs
CREATE POLICY "Users can manage own saved jobs" ON saved_jobs FOR ALL USING (
  auth.uid() = user_id
);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  auth.uid() = user_id
);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
  auth.uid() = user_id
);

-- RLS Policies for referrals
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (
  auth.uid() = referrer_id OR auth.uid() = referred_user_id
);
CREATE POLICY "Users can insert own referrals" ON referrals FOR INSERT WITH CHECK (
  auth.uid() = referrer_id
);

-- RLS Policies for assessments
CREATE POLICY "Anyone can view active assessments" ON assessments FOR SELECT USING (
  is_active = true
);

-- RLS Policies for user_assessments
CREATE POLICY "Users can manage own assessment results" ON user_assessments FOR ALL USING (
  auth.uid() = user_id
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('applications', 'applications', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('videos', 'videos', false, 104857600, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Storage policies for applications bucket
CREATE POLICY "Users can upload their own application files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'applications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own application files" ON storage.objects FOR SELECT USING (
  bucket_id = 'applications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Recruiters can view application files for their jobs" ON storage.objects FOR SELECT USING (
  bucket_id = 'applications' AND 
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.recruiter_id = auth.uid()
    AND (a.resume_url = name OR a.video_intro_url = name)
  )
);

-- Storage policies for videos bucket
CREATE POLICY "Users can upload their own video files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own video files" ON storage.objects FOR SELECT USING (
  bucket_id = 'videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Recruiters can view video files for their job applications" ON storage.objects FOR SELECT USING (
  bucket_id = 'videos' AND 
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.recruiter_id = auth.uid()
    AND a.video_intro_url = name
  )
);

-- Storage policies for avatars bucket (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update job application count
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs SET application_count = application_count + 1 WHERE id = NEW.job_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs SET application_count = application_count - 1 WHERE id = OLD.job_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for job application count
CREATE TRIGGER update_job_application_count_trigger
    AFTER INSERT OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_job_application_count();

-- Function to update user tokens
CREATE OR REPLACE FUNCTION update_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'earn' THEN
        UPDATE profiles SET tokens = tokens + NEW.amount WHERE id = NEW.user_id;
    ELSIF NEW.type = 'spend' THEN
        UPDATE profiles SET tokens = tokens - NEW.amount WHERE id = NEW.user_id;
    ELSIF NEW.type = 'refund' THEN
        UPDATE profiles SET tokens = tokens + NEW.amount WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for token updates
CREATE TRIGGER update_user_tokens_trigger
    AFTER INSERT ON token_transactions
    FOR EACH ROW EXECUTE FUNCTION update_user_tokens();

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for referral code generation
CREATE TRIGGER generate_referral_code_trigger
    BEFORE INSERT ON referrals
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- Insert sample assessments
INSERT INTO assessments (title, description, category, questions, duration_minutes, passing_score, tokens_reward) VALUES
(
    'JavaScript Fundamentals',
    'Test your knowledge of JavaScript basics including variables, functions, and ES6 features.',
    'technical',
    '[
        {
            "question": "What is the difference between let and var?",
            "type": "multiple_choice",
            "options": ["Block scope vs function scope", "No difference", "let is faster", "var is deprecated"],
            "correct": 0
        },
        {
            "question": "What does the spread operator do?",
            "type": "multiple_choice", 
            "options": ["Spreads arrays/objects", "Creates functions", "Loops through data", "Handles errors"],
            "correct": 0
        }
    ]'::jsonb,
    15,
    70,
    5
),
(
    'Communication Skills',
    'Assess your professional communication and teamwork abilities.',
    'personality',
    '[
        {
            "question": "How do you handle disagreements with team members?",
            "type": "multiple_choice",
            "options": ["Listen and find common ground", "Avoid the conflict", "Assert your position strongly", "Ask manager to decide"],
            "correct": 0
        }
    ]'::jsonb,
    20,
    60,
    3
);

-- Create views for common queries
CREATE VIEW job_stats AS
SELECT 
    j.*,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN a.status = 'interview_scheduled' THEN 1 END) as interviews_scheduled,
    AVG(CASE WHEN a.created_at > NOW() - INTERVAL '7 days' THEN 1.0 ELSE 0.0 END) as recent_activity_score
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
GROUP BY j.id;

CREATE VIEW user_stats AS
SELECT 
    p.*,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as accepted_applications,
    COUNT(CASE WHEN a.status = 'interview_scheduled' THEN 1 END) as scheduled_interviews,
    SUM(CASE WHEN tt.type = 'earn' THEN tt.amount ELSE 0 END) as total_tokens_earned,
    SUM(CASE WHEN tt.type = 'spend' THEN tt.amount ELSE 0 END) as total_tokens_spent
FROM profiles p
LEFT JOIN applications a ON p.id = a.applicant_id
LEFT JOIN token_transactions tt ON p.id = tt.user_id
WHERE p.role = 'applicant'
GROUP BY p.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'JobQueue database schema created successfully!';
    RAISE NOTICE 'Tables created: profiles, jobs, applications, token_transactions, job_views, saved_jobs, notifications, referrals, assessments, user_assessments';
    RAISE NOTICE 'Storage buckets created: applications, videos, avatars';
    RAISE NOTICE 'RLS policies and triggers configured';
    RAISE NOTICE 'Sample assessments inserted';
END $$;
