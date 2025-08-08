'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Hash, Clock, CheckCircle, XCircle, MoreHorizontal, Loader2 } from 'lucide-react'
import { getJobRoundTokens, expireToken, completeToken } from '@/lib/actions/token-actions'
import { useToast } from '@/hooks/use-toast'

interface RoundQueueProps {
  jobId: string
  jobTitle: string
  initialRound?: number
}

interface TokenData {
  id: string
  token_number: number
  round_number: number
  status: 'active' | 'expired' | 'completed'
  assigned_at: string
  expired_at?: string
  notes?: string
  profiles: {
    full_name: string
    email: string
    avatar_url?: string
  }
}

export function RoundQueue({ jobId, jobTitle, initialRound = 1 }: RoundQueueProps) {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [roundNumber, setRoundNumber] = useState(initialRound)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null)
  const [notes, setNotes] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'expire' | 'complete'>('expire')

  const { toast } = useToast()

  useEffect(() => {
    fetchTokens()
  }, [jobId, roundNumber])

  const fetchTokens = async () => {
    setLoading(true)
    try {
      const result = await getJobRoundTokens(jobId, roundNumber)
      if (result.success) {
        setTokens(result.data)
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tokens',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedToken) return

    setActionLoading(selectedToken.id)
    try {
      const result = actionType === 'expire' 
        ? await expireToken(selectedToken.id, notes)
        : await completeToken(selectedToken.id, notes)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        })
        fetchTokens()
        setDialogOpen(false)
        setNotes('')
        setSelectedToken(null)
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Action failed',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: Clock,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          label: 'Active'
        }
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          label: 'Completed'
        }
      case 'expired':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          label: 'Expired'
        }
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          label: 'Unknown'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openActionDialog = (token: TokenData, action: 'expire' | 'complete') => {
    setSelectedToken(token)
    setActionType(action)
    setDialogOpen(true)
    setNotes('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Round Queue - {jobTitle}
          </CardTitle>
          <CardDescription>
            Manage token queue for job application rounds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="round">Round Number</Label>
              <Input
                id="round"
                type="number"
                min="1"
                max="10"
                value={roundNumber}
                onChange={(e) => setRoundNumber(parseInt(e.target.value) || 1)}
                className="w-32"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchTokens} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Round {roundNumber} Queue</CardTitle>
          <CardDescription>
            {tokens.length} token{tokens.length !== 1 ? 's' : ''} in this round
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading tokens...</span>
            </div>
          ) : tokens.length === 0 ? (
            <Alert>
              <AlertDescription>
                No tokens assigned for Round {roundNumber} yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => {
                const config = getStatusConfig(token.status)
                const StatusIcon = config.icon
                
                return (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Token Number */}
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          #{token.token_number}
                        </span>
                      </div>

                      {/* Candidate Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={token.profiles.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {token.profiles.full_name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {token.profiles.full_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {token.profiles.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status */}
                      <div className="text-right">
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(token.assigned_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      {token.status === 'active' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(token, 'complete')}
                            disabled={actionLoading === token.id}
                          >
                            {actionLoading === token.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(token, 'expire')}
                            disabled={actionLoading === token.id}
                          >
                            {actionLoading === token.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'expire' ? 'Expire Token' : 'Complete Token'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'expire' 
                ? 'Mark this token as expired. The candidate will no longer be able to use it.'
                : 'Mark this token as completed. This indicates the candidate has finished their round.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedToken && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">
                  Token #{selectedToken.token_number} - {selectedToken.profiles.full_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedToken.profiles.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this action..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading === selectedToken?.id}
              variant={actionType === 'expire' ? 'destructive' : 'default'}
            >
              {actionLoading === selectedToken?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : actionType === 'expire' ? (
                <XCircle className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {actionType === 'expire' ? 'Expire Token' : 'Complete Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
