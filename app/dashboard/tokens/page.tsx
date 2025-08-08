'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TokenStatus } from '@/components/token-status'
import { TokenCard } from '@/components/token-card'
import { MobileNav } from '@/components/mobile-nav'
import { Hash, ArrowLeft, Loader2 } from 'lucide-react'
import { getUserTokens } from '@/lib/actions/token-actions'
import { useAuth } from '@/components/auth-provider'

export default function TokensPage() {
  const [tokens, setTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/welcome')
        return
      }
      fetchUserTokens()
    }
  }, [user, authLoading, router])

  const fetchUserTokens = async () => {
    if (!user) return

    try {
      const result = await getUserTokens(user.id)
      if (result.success) {
        setTokens(result.data)
      }
    } catch (error) {
      console.error('Error fetching tokens:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading your tokens...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const activeTokens = tokens.filter(token => token.status === 'active')
  const completedTokens = tokens.filter(token => token.status === 'completed')
  const expiredTokens = tokens.filter(token => token.status === 'expired')

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tokens</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track your round tokens across all job applications
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{activeTokens.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Active Tokens</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedTokens.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{expiredTokens.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Expired</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Tokens */}
        {activeTokens.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Tokens</h2>
            <div className="grid gap-4">
              {activeTokens.map((token) => (
                <TokenStatus
                  key={token.id}
                  tokenNumber={token.token_number}
                  roundNumber={token.round_number}
                  status={token.status}
                  jobTitle={token.jobs.title}
                  company={token.jobs.company}
                  assignedAt={token.assigned_at}
                  expiredAt={token.expired_at}
                  notes={token.notes}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Tokens History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Token History</h2>
          {tokens.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Hash className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  No tokens assigned yet
                </p>
                <Button onClick={() => router.push('/jobs')}>
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => (
                <TokenCard
                  key={token.id}
                  tokenNumber={token.token_number}
                  roundNumber={token.round_number}
                  status={token.status}
                  candidateName="You"
                  candidateEmail={user.email || ''}
                  assignedAt={token.assigned_at}
                  expiredAt={token.expired_at}
                  notes={token.notes}
                  showCandidate={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  )
}
