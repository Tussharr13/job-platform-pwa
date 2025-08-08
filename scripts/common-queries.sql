-- JobQueue Platform - Common SQL Queries
-- This file contains commonly used queries for the job platform PWA

-- ============================================================================
-- PROFILE QUERIES
-- ============================================================================

-- Get user profile with jobbie balance
SELECT 
    p.*,
    COALESCE(SUM(CASE WHEN jt.type = 'earn' THEN jt.amount ELSE 0 END), 0) as total_earned,
    COALESCE(SUM(CASE WHEN jt.type = 'spend' THEN jt.amount ELSE 0 END), 0) as total_spent
FROM profiles p
LEFT JOIN jobbie_transactions jt ON p.id = jt.user_id
WHERE p.id = $1
GROUP BY p.id;

-- Get recruiter profile with job stats
SELECT 
    p.*,
    COUNT(j.id) as total_jobs,
    COUNT(CASE WHEN j.is_active = true THEN 1 END) as active_jobs,
    SUM(j.application_count) as total_applications
FROM profiles p
LEFT JOIN jobs j ON p.id = j.recruiter_id
WHERE p.id = $1 AND p.role = 'recruiter'
GROUP BY p.id;

-- ============================================================================
-- JOB QUERIES
-- ============================================================================

-- Get all active jobs with recruiter info
SELECT 
    j.*,
    p.full_name as recruiter_name,
    p.company as recruiter_company,
    COUNT(a.id) as application_count
FROM jobs j
JOIN profiles p ON j.recruiter_id = p.id
LEFT JOIN applications a ON j.id = a.job_id
WHERE j.is_active = true
GROUP BY j.id, p.full_name, p.company
ORDER BY j.created_at DESC;

-- Get jobs by filters
SELECT 
    j.*,
    p.full_name as recruiter_name,
    p.company as recruiter_company
FROM jobs j
JOIN profiles p ON j.recruiter_id = p.id
WHERE j.is_active = true
    AND ($1::text[] IS NULL OR j.tags && $1)
    AND ($2::text IS NULL OR j.type = $2)
    AND ($3::text IS NULL OR j.location ILIKE '%' || $3 || '%')
    AND ($4::integer IS NULL OR j.salary_min >= $4)
    AND ($5::integer IS NULL OR j.salary_max <= $5)
ORDER BY 
    CASE WHEN j.featured = true THEN 0 ELSE 1 END,
    j.created_at DESC;

-- Get job details with application status for user
SELECT 
    j.*,
    p.full_name as recruiter_name,
    p.company as recruiter_company,
    a.status as application_status,
    a.queue_position,
    a.created_at as applied_at
FROM jobs j
JOIN profiles p ON j.recruiter_id = p.id
LEFT JOIN applications a ON j.id = a.job_id AND a.applicant_id = $1
WHERE j.id = $2;

-- ============================================================================
-- APPLICATION QUERIES
-- ============================================================================

-- Get user's applications with job details
SELECT 
    a.*,
    j.title,
    j.company,
    j.location,
    j.type,
    p.full_name as recruiter_name
FROM applications a
JOIN jobs j ON a.job_id = j.id
JOIN profiles p ON j.recruiter_id = p.id
WHERE a.applicant_id = $1
ORDER BY a.created_at DESC;

-- Get applications for a specific job (recruiter view)
SELECT 
    a.*,
    p.full_name,
    p.email,
    p.avatar_url,
    p.skills,
    p.experience_years
FROM applications a
JOIN profiles p ON a.applicant_id = p.id
WHERE a.job_id = $1
ORDER BY a.queue_position ASC, a.created_at ASC;

-- Get application queue for a job
SELECT 
    a.id,
    a.queue_position,
    a.status,
    a.created_at,
    p.full_name,
    p.email,
    rt.token_number,
    rt.round_number
FROM applications a
JOIN profiles p ON a.applicant_id = p.id
LEFT JOIN round_tokens rt ON a.applicant_id = rt.user_id AND a.job_id = rt.job_id
WHERE a.job_id = $1
ORDER BY a.queue_position ASC;

-- ============================================================================
-- JOBBY QUERIES
-- ============================================================================

-- Get user's jobbie transactions
SELECT 
    jt.*,
    CASE 
        WHEN jt.reference_type = 'job_application' THEN j.title
        WHEN jt.reference_type = 'profile_completion' THEN 'Profile Completion'
        ELSE jt.reason
    END as reference_title
FROM jobbie_transactions jt
LEFT JOIN jobs j ON jt.reference_id = j.id
WHERE jt.user_id = $1
ORDER BY jt.created_at DESC;

-- Get jobbie balance and history
SELECT 
    p.jobbies as current_balance,
    COALESCE(SUM(CASE WHEN jt.type = 'earn' THEN jt.amount ELSE 0 END), 0) as total_earned,
    COALESCE(SUM(CASE WHEN jt.type = 'spend' THEN jt.amount ELSE 0 END), 0) as total_spent,
    COUNT(jt.id) as transaction_count
FROM profiles p
LEFT JOIN jobbie_transactions jt ON p.id = jt.user_id
WHERE p.id = $1
GROUP BY p.jobbies;

-- ============================================================================
-- ROUND TOKEN QUERIES
-- ============================================================================

-- Get active tokens for a user
SELECT 
    rt.*,
    j.title as job_title,
    j.company
FROM round_tokens rt
JOIN jobs j ON rt.job_id = j.id
WHERE rt.user_id = $1 AND rt.status = 'active'
ORDER BY rt.assigned_at DESC;

-- Get next available token for a job round
SELECT 
    j.id as job_id,
    j.title,
    j.company,
    COALESCE(MAX(rt.token_number), 0) + 1 as next_token_number,
    COUNT(rt.id) as total_tokens_in_round
FROM jobs j
LEFT JOIN round_tokens rt ON j.id = rt.job_id AND rt.round_number = $1
WHERE j.id = $2
GROUP BY j.id, j.title, j.company;

-- ============================================================================
-- ANALYTICS QUERIES
-- ============================================================================

-- Get job view analytics
SELECT 
    j.id,
    j.title,
    COUNT(jv.id) as total_views,
    COUNT(DISTINCT jv.user_id) as unique_viewers,
    COUNT(DISTINCT jv.ip_address) as unique_ips,
    MAX(jv.created_at) as last_viewed
FROM jobs j
LEFT JOIN job_views jv ON j.id = jv.job_id
WHERE j.recruiter_id = $1
GROUP BY j.id, j.title
ORDER BY total_views DESC;

-- Get application statistics for a job
SELECT 
    j.id,
    j.title,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN a.status = 'reviewed' THEN 1 END) as reviewed,
    COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) as shortlisted,
    COUNT(CASE WHEN a.status = 'interview_scheduled' THEN 1 END) as interviews,
    COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as accepted,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected,
    AVG(a.queue_position) as avg_queue_position
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
WHERE j.recruiter_id = $1
GROUP BY j.id, j.title;

-- ============================================================================
-- NOTIFICATION QUERIES
-- ============================================================================

-- Get unread notifications for user
SELECT 
    n.*,
    CASE 
        WHEN n.reference_type = 'job_application' THEN j.title
        WHEN n.reference_type = 'job' THEN j.title
        ELSE NULL
    END as reference_title
FROM notifications n
LEFT JOIN jobs j ON n.reference_id = j.id
WHERE n.user_id = $1 AND n.is_read = false
ORDER BY n.created_at DESC;

-- Get notification count
SELECT COUNT(*) as unread_count
FROM notifications
WHERE user_id = $1 AND is_read = false;

-- ============================================================================
-- SEARCH QUERIES
-- ============================================================================

-- Search jobs by text
SELECT 
    j.*,
    p.full_name as recruiter_name,
    p.company as recruiter_company,
    ts_rank(to_tsvector('english', j.title || ' ' || j.description || ' ' || j.company), plainto_tsquery('english', $1)) as rank
FROM jobs j
JOIN profiles p ON j.recruiter_id = p.id
WHERE j.is_active = true
    AND to_tsvector('english', j.title || ' ' || j.description || ' ' || j.company) @@ plainto_tsquery('english', $1)
ORDER BY rank DESC, j.created_at DESC;

-- Search profiles by skills
SELECT 
    p.*,
    array_length(p.skills, 1) as skill_count
FROM profiles p
WHERE p.role = 'applicant'
    AND p.skills && $1::text[]
ORDER BY skill_count DESC, p.last_active DESC;

-- ============================================================================
-- DASHBOARD QUERIES
-- ============================================================================

-- Get recruiter dashboard stats
SELECT 
    COUNT(j.id) as total_jobs,
    COUNT(CASE WHEN j.is_active = true THEN 1 END) as active_jobs,
    SUM(j.application_count) as total_applications,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN a.status = 'interview_scheduled' THEN 1 END) as scheduled_interviews,
    COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as accepted_applications
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
WHERE j.recruiter_id = $1;

-- Get applicant dashboard stats
SELECT 
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN a.status = 'reviewed' THEN 1 END) as reviewed_applications,
    COUNT(CASE WHEN a.status = 'interview_scheduled' THEN 1 END) as scheduled_interviews,
    COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as accepted_applications,
    p.jobbies as current_jobbies
FROM applications a
JOIN profiles p ON a.applicant_id = p.id
WHERE a.applicant_id = $1
GROUP BY p.jobbies;

-- ============================================================================
-- ADMIN QUERIES
-- ============================================================================

-- Get platform statistics
SELECT 
    COUNT(CASE WHEN p.role = 'applicant' THEN 1 END) as total_applicants,
    COUNT(CASE WHEN p.role = 'recruiter' THEN 1 END) as total_recruiters,
    COUNT(j.id) as total_jobs,
    COUNT(CASE WHEN j.is_active = true THEN 1 END) as active_jobs,
    COUNT(a.id) as total_applications,
    SUM(p.jobbies) as total_jobbies_in_circulation
FROM profiles p
LEFT JOIN jobs j ON p.id = j.recruiter_id
LEFT JOIN applications a ON p.id = a.applicant_id;

-- Get recent activity
SELECT 
    'job_created' as activity_type,
    j.created_at as activity_date,
    j.title as title,
    p.full_name as user_name
FROM jobs j
JOIN profiles p ON j.recruiter_id = p.id
WHERE j.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'application_submitted' as activity_type,
    a.created_at as activity_date,
    j.title as title,
    p.full_name as user_name
FROM applications a
JOIN jobs j ON a.job_id = j.id
JOIN profiles p ON a.applicant_id = p.id
WHERE a.created_at > NOW() - INTERVAL '7 days'

ORDER BY activity_date DESC
LIMIT 50; 