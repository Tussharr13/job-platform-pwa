'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, Video, Coins, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'

export default function ApplyPage() {
  const [job, setJob] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const jobId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push('/welcome')
      return
    }
    fetchJobAndProfile()
  }, [user, jobId, router])

  const fetchJobAndProfile = async () => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError) throw jobError

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (profileError) throw profileError

      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user!.id)
        .single()

      if (existingApplication) {
        setSubmitted(true)
      }

      setJob(jobData)
      setProfile(profileData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resumeFile) {
      toast({
        title: 'Resume Required',
        description: 'Please upload your resume to continue',
        variant: 'destructive',
      })
      return
    }

    if (profile.tokens < 1) {
      toast({
        title: 'Insufficient Tokens',
        description: 'You need at least 1 token to apply for a job',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    setUploadProgress(0)

    try {
      // Upload resume
      setUploadProgress(25)
      const resumePath = `resumes/${user!.id}/${Date.now()}_${resumeFile.name}`
      await uploadFile(resumeFile, 'applications', resumePath)

      // Upload video if provided
      let videoPath = null
      if (videoFile) {
        setUploadProgress(50)
        videoPath = `videos/${user!.id}/${Date.now()}_${videoFile.name}`
        await uploadFile(videoFile, 'applications', videoPath)
      }

      setUploadProgress(75)

      // Get current queue position
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId)

      const queuePosition = (count || 0) + 1

      // Create application
      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          applicant_id: user!.id,
          resume_url: resumePath,
          video_intro_url: videoPath,
          queue_position: queuePosition,
          status: 'pending'
        })

      if (applicationError) throw applicationError

      // Deduct token
      const { error: tokenError } = await supabase
        .from('profiles')
        .update({ tokens: profile.tokens - 1 })
        .eq('id', user!.id)

      if (tokenError) throw tokenError

      // Add token transaction
      await supabase
        .from('token_transactions')
        .insert({
          user_id: user!.id,
          type: 'spend',
          amount: 1,
          reason: `Applied to ${job.title} at ${job.company}`
        })

      setUploadProgress(100)
      setSubmitted(true)

      toast({
        title: 'Application Submitted!',
        description: `You're #${queuePosition} in the queue`,
      })

    } catch (error: any) {
      console.error('Error submitting application:', error)
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">You've Joined the Queue!</h2>
              <p className="text-muted-foreground mt-2">
                Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been submitted successfully.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                View My Applications
              </Button>
              <Button onClick={() => router.push('/jobs')} variant="outline" className="w-full">
                Browse More Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => router.back()}>
            ← Back to Jobs
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-lg text-muted-foreground">{job.company}</p>
            <p className="text-sm text-muted-foreground">{job.location}</p>
          </div>
        </div>

        {/* Token Warning */}
        {profile.tokens < 1 && (
          <Alert variant="destructive">
            <Coins className="h-4 w-4" />
            <AlertDescription>
              You need at least 1 token to apply for jobs. Complete your profile or refer friends to earn tokens.
            </AlertDescription>
          </Alert>
        )}

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Application</CardTitle>
            <CardDescription>
              Upload your resume and optionally add a video introduction to stand out.
              This will cost 1 token.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Resume Upload */}
              <div className="space-y-2">
                <Label htmlFor="resume">Resume (Required)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">
                      {resumeFile ? resumeFile.name : 'Click to upload your resume'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, or DOCX (max 5MB)
                    </p>
                  </label>
                </div>
              </div>

              {/* Video Upload */}
              <div className="space-y-2">
                <Label htmlFor="video">Video Introduction (Optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="video" className="cursor-pointer">
                    <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">
                      {videoFile ? videoFile.name : 'Click to upload a video introduction'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, MOV, or AVI (max 50MB, 2 minutes)
                    </p>
                  </label>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Tell us why you're interested in this position..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Progress Bar */}
              {submitting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Cost: 1 token</span>
                </div>
                <Button 
                  type="submit" 
                  disabled={submitting || profile.tokens < 1}
                  className="min-w-32"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>About This Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{job.description}</p>
            </div>
            
            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {job.requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.salary_min || job.salary_max ? (
              <div>
                <h4 className="font-medium mb-2">Salary Range</h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {job.salary_min && job.salary_max 
                    ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                    : job.salary_min 
                    ? `From $${job.salary_min.toLocaleString()}`
                    : `Up to $${job.salary_max.toLocaleString()}`
                  }
                </p>
              </div>
            ) : null}

            {job.tags && job.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Skills & Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
