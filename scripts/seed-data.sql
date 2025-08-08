-- Insert sample recruiter profiles
INSERT INTO profiles (id, email, role, full_name, jobbies) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'recruiter1@techcorp.com', 'recruiter', 'Sarah Johnson', 50),
  ('550e8400-e29b-41d4-a716-446655440002', 'recruiter2@startup.io', 'recruiter', 'Mike Chen', 50);

-- Insert sample jobs
INSERT INTO jobs (id, title, company, description, requirements, tags, type, salary_min, salary_max, location, recruiter_id) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Senior Frontend Developer',
    'TechCorp Inc.',
    'We are looking for a Senior Frontend Developer to join our growing team. You will be responsible for building user-facing features using React and TypeScript.',
    ARRAY['5+ years React experience', 'TypeScript proficiency', 'Experience with modern build tools', 'Strong CSS skills'],
    ARRAY['React', 'TypeScript', 'CSS', 'JavaScript', 'Frontend'],
    'full-time',
    90000,
    120000,
    'San Francisco, CA',
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Full Stack Engineer',
    'StartupXYZ',
    'Join our fast-paced startup as a Full Stack Engineer. Work with cutting-edge technologies and help shape the future of our product.',
    ARRAY['3+ years full-stack experience', 'Node.js and React', 'Database design experience', 'AWS knowledge preferred'],
    ARRAY['React', 'Node.js', 'AWS', 'PostgreSQL', 'Full-Stack'],
    'full-time',
    80000,
    110000,
    'Remote',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'Product Designer',
    'TechCorp Inc.',
    'We are seeking a talented Product Designer to create intuitive and beautiful user experiences for our web and mobile applications.',
    ARRAY['3+ years product design experience', 'Figma proficiency', 'User research experience', 'Mobile design experience'],
    ARRAY['Design', 'Figma', 'UX', 'UI', 'Mobile'],
    'full-time',
    75000,
    95000,
    'New York, NY',
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'Marketing Intern',
    'StartupXYZ',
    'Great opportunity for a marketing student to gain hands-on experience in digital marketing, content creation, and social media management.',
    ARRAY['Currently enrolled in marketing program', 'Social media experience', 'Content writing skills', 'Analytics tools knowledge'],
    ARRAY['Marketing', 'Social Media', 'Content', 'Analytics'],
    'internship',
    NULL,
    NULL,
    'Austin, TX',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440005',
    'DevOps Engineer',
    'TechCorp Inc.',
    'Looking for a DevOps Engineer to help scale our infrastructure and improve our deployment processes.',
    ARRAY['Docker and Kubernetes experience', 'CI/CD pipeline setup', 'AWS or GCP experience', 'Infrastructure as Code'],
    ARRAY['DevOps', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    'full-time',
    95000,
    130000,
    'Seattle, WA',
    '550e8400-e29b-41d4-a716-446655440001'
  );

-- Insert sample applicant profile
INSERT INTO profiles (id, email, role, full_name, jobbies) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'applicant@example.com', 'applicant', 'John Doe', 15);

-- Insert sample applications
INSERT INTO applications (job_id, applicant_id, resume_url, status, queue_position) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'resumes/sample-resume.pdf', 'pending', 1),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'resumes/sample-resume.pdf', 'reviewed', 3);

-- Insert sample jobbie transactions
INSERT INTO jobbie_transactions (user_id, type, amount, reason) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'earn', 10, 'Welcome bonus'),
  ('550e8400-e29b-41d4-a716-446655440003', 'earn', 5, 'Profile completion'),
  ('550e8400-e29b-41d4-a716-446655440003', 'spend', 1, 'Applied to Senior Frontend Developer at TechCorp Inc.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'spend', 1, 'Applied to Full Stack Engineer at StartupXYZ');
