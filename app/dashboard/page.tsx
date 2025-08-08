'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { JobbieBalance } from '@/components/jobbie-balance'
import { MobileNav } from '@/components/mobile-nav'
import { Clock, MapPin, Building2, TrendingUp, Coins, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'

export default function DashboardPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('applications')

  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push('/welcome')
      return
    }
    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      // Fetch applications with job details
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            company,
            location,
            type,
            tags
          )
        `)
        .eq('applicant_id', user!.id)
        .order('created_at', { ascending: false })

      // Fetch jobbie transactions
      const { data: transactionsData } = await supabase
        .from('jobbie_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setProfile(profileData)
      setApplications(applicationsData || [])
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'reviewed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'interview': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getQueueProgress = (position: number) => {
    // Simulate queue progress (in real app, this would be calculated based on actual queue movement)
    const maxPosition = 50 // Assume max queue size
    return Math.max(0, ((maxPosition - position) / maxPosition) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-nav">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <JobbieBalance 
            jobbies={profile?.jobbies || 0} 
            onViewHistory={() => setActiveTab('tokens')}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="queue">Queue Status</TabsTrigger>
            <TabsTrigger value="tokens">Jobbies</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">No applications yet</p>
                  <Button onClick={() => router.push('/jobs')}>
                    Browse Jobs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{application.jobs.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{application.jobs.company}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{application.jobs.location}</span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Queue Position: #{application.queue_position}
                          </span>
                          <span className="text-muted-foreground">
                            Applied {new Date(application.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {application.status === 'pending' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>Queue Progress</span>
                              <span>{Math.round(getQueueProgress(application.queue_position))}%</span>
                            </div>
                            <Progress value={getQueueProgress(application.queue_position)} />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/jobs/${application.job_id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Job
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Queue Status Tab */}
          <TabsContent value="queue" className="space-y-4">
            <div className="grid gap-4">
              {applications.filter(app => app.status === 'pending').map((application) => (
                <Card key={application.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{application.jobs.title}</CardTitle>
                    <CardDescription>{application.jobs.company}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Queue Position</span>
                      <Badge variant="outline">#{application.queue_position}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Estimated Progress</span>
                        <span>{Math.round(getQueueProgress(application.queue_position))}%</span>
                      </div>
                      <Progress value={getQueueProgress(application.queue_position)} />
                      <p className="text-xs text-muted-foreground">
                        Based on typical review times
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {applications.filter(app => app.status === 'pending').length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No pending applications in queue</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Token History</CardTitle>
                <CardDescription>
                  Track your token earnings and spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'earn' 
                              ? 'bg-green-100 dark:bg-green-900' 
                              : 'bg-red-100 dark:bg-red-900'
                          }`}>
                            <Coins className={`h-4 w-4 ${
                              transaction.type === 'earn'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.reason}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === 'earn'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ways to Earn Tokens */}
            <Card>
              <CardHeader>
                <CardTitle>Earn More Tokens</CardTitle>
                <CardDescription>
                  Complete these actions to earn tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Complete Profile</p>
                    <p className="text-sm text-muted-foreground">Add photo and skills</p>
                  </div>
                  <Badge variant="outline">+5 tokens</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Refer a Friend</p>
                    <p className="text-sm text-muted-foreground">Share your referral code</p>
                  </div>
                  <Badge variant="outline">+10 tokens</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Complete Assessment</p>
                    <p className="text-sm text-muted-foreground">Take skill assessments</p>
                  </div>
                  <Badge variant="outline">+3 tokens</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <MobileNav />
    </div>
  )
}
