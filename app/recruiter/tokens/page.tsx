'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssignToken } from '@/components/assign-token'
import { RoundQueue } from '@/components/round-queue'
import { MobileNav } from '@/components/mobile-nav'
import { ArrowLeft, Hash, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'

export default function RecruiterTokensPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const jobId = searchParams.get('jobId')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/welcome')
        return
      }
      fetchRecruiterJobs()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (jobId && jobs.length > 0) {
      const job = jobs.find(j => j.id === jobId)
      if (job) {
        setSelectedJob(job)
      }
    }
  }, [jobId, jobs])

  const fetchRecruiterJobs = async () => {
    if (!user) return

    try {
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(jobsData || [])
      
      // If no job is selected and we have jobs, select the first one
      if (!selectedJob && jobsData && jobsData.length > 0) {
        setSelectedJob(jobsData[0])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading round token management...</p>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Round Token Management</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage round tokens for your job postings
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Hash className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                No active jobs found. Create a job posting to start managing round tokens.
              </p>
              <Button onClick={() => router.push('/recruiter/post-job')}>
                Post a Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Job Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Job</CardTitle>
                <CardDescription>
                  Choose a job to manage its round tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobSelect">Job</Label>
                    <select
                      id="jobSelect"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={selectedJob?.id || ''}
                      onChange={(e) => {
                        const job = jobs.find(j => j.id === e.target.value)
                        setSelectedJob(job)
                      }}
                    >
                      <option value="">Select a job...</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} - {job.company}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedJob && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {selectedJob.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedJob.company} • {selectedJob.location}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedJob && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assign Token */}
                <div className="lg:col-span-1">
                  <AssignToken
                    jobId={selectedJob.id}
                    jobTitle={selectedJob.title}
                    onTokenAssigned={() => {
                      // Refresh the queue when a new token is assigned
                      window.location.reload()
                    }}
                  />
                </div>

                {/* Round Queue */}
                <div className="lg:col-span-2">
                  <RoundQueue
                    jobId={selectedJob.id}
                    jobTitle={selectedJob.title}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  )
}
