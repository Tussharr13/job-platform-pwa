'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Hash, Plus } from 'lucide-react'
import { assignToken } from '@/lib/actions/token-actions'
import { useToast } from '@/hooks/use-toast'

interface AssignTokenProps {
  jobId: string
  jobTitle: string
  onTokenAssigned?: (token: any) => void
}

export function AssignToken({ jobId, jobTitle, onTokenAssigned }: AssignTokenProps) {
  const [userId, setUserId] = useState('')
  const [roundNumber, setRoundNumber] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await assignToken(userId, jobId, roundNumber)

      if (result.success) {
        setSuccess(result.message || 'Token assigned successfully')
        setUserId('')
        onTokenAssigned?.(result.data)
        toast({
          title: 'Token Assigned',
          description: result.message,
        })
      } else {
        setError(result.error || 'Failed to assign token')
        toast({
          title: 'Assignment Failed',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Assign Token
        </CardTitle>
        <CardDescription>
          Assign a new token number to a candidate for {jobTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Candidate User ID</Label>
            <Input
              id="userId"
              type="text"
              placeholder="Enter candidate's user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              You can find the user ID in the applications list
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roundNumber">Round Number</Label>
            <Input
              id="roundNumber"
              type="number"
              min="1"
              max="10"
              value={roundNumber}
              onChange={(e) => setRoundNumber(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription className="text-green-600 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning Token...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Assign Token
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
