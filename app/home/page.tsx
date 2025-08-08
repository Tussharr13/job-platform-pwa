'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { JobbieBalance } from '@/components/jobbie-balance'
import { MobileNav } from '@/components/mobile-nav'
import { Briefcase, Search, TrendingUp, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'

export default function HomePage() {
  const [profile, setProfile] = useState<any>(null)
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/welcome')
        return
      }
      fetchHomeData()
    }
  }, [user, authLoading, router])

  const fetchHomeData = async () => {
    if (!user) return

    try {
      // Get user profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            role: 'applicant',
            full_name: user.user_metadata?.full_name || '',
            jobbies: 10,
          })
          .select()
          .single()
        
        if (!createError) {
          profileData = newProfile
          // Add welcome jobbie transaction
          await supabase
            .from('jobbie_transactions')
            .insert({
              user_id: user.id,
              type: 'earn',
              amount: 10,
              reason: 'Welcome bonus',
            })
        }
      }

      setProfile(profileData)

      // Get recent jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3)

      setRecentJobs(jobsData || [])

      // Get user's applications if applicant
      if (profileData?.role === 'applicant') {
        const { data: appsData } = await supabase
          .from('applications')
          .select(`
            *,
            jobs (title, company)
          `)
          .eq('applicant_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)
        
        setApplications(appsData || [])
      }
    } catch (error) {
      console.error('Error fetching home data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {profile?.role === 'recruiter' 
                ? 'Manage your job postings and candidate queues'
                : 'Discover new opportunities and track your applications'
              }
            </p>
          </div>

          {/* Jobbie Balance */}
          <JobbieBalance jobbies={profile?.jobbies || 0} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/jobs">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 text-center">
                <Search className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium text-gray-900 dark:text-white">Browse Jobs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Find opportunities</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={profile?.role === 'recruiter' ? '/recruiter/post-job' : '/dashboard'}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 text-center">
                {profile?.role === 'recruiter' ? (
                  <>
                    <Briefcase className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Post Job</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Find candidates</p>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium text-gray-900 dark:text-white">My Dashboard</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Track progress</p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        {profile?.role === 'applicant' && applications && applications.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h2>
            <div className="space-y-3">
              {applications.map((app: any) => (
                <Card key={app.id} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{app.jobs?.title || 'Job Title'}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{app.jobs?.company || 'Company'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium capitalize text-gray-900 dark:text-white">{app.status}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Queue #{app.queue_position}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                View All Applications
              </Button>
            </Link>
          </div>
        )}

        {/* Recent Jobs */}
        {recentJobs && recentJobs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Opportunities</h2>
            <div className="space-y-3">
              {recentJobs.map((job: any) => (
                <Card key={job.id} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{job.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{job.company}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                          {job.type}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {job.location}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Link href="/jobs">
              <Button variant="outline" className="w-full">
                View All Jobs
              </Button>
            </Link>
          </div>
        )}

        {/* Stats for Recruiters */}
        {profile?.role === 'recruiter' && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 text-center">
                <Briefcase className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Active Jobs</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Applicants</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  )
}
