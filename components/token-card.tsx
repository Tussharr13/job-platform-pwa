'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, CheckCircle, XCircle, Hash, Calendar } from 'lucide-react'

interface TokenCardProps {
  tokenNumber: number
  roundNumber: number
  status: 'active' | 'expired' | 'completed'
  candidateName: string
  candidateEmail: string
  candidateAvatar?: string
  assignedAt: string
  expiredAt?: string
  notes?: string
  compact?: boolean
  showCandidate?: boolean
}

export function TokenCard({
  tokenNumber,
  roundNumber,
  status,
  candidateName,
  candidateEmail,
  candidateAvatar,
  assignedAt,
  expiredAt,
  notes,
  compact = false,
  showCandidate = true
}: TokenCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: Clock,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        }
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'expired':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800'
        }
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800'
        }
    }
  }

  const config = getStatusConfig(status)
  const StatusIcon = config.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (compact) {
    return (
      <div className={`flex items-center justify-between p-3 border rounded-lg ${config.borderColor} ${config.bgColor}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 rounded-full">
            <Hash className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Token #{tokenNumber}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Round {roundNumber}
            </p>
          </div>
        </div>
        <Badge className={config.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
    )
  }

  return (
    <Card className={`${config.bgColor} ${config.borderColor}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-full">
                <Hash className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Token #{tokenNumber}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Round {roundNumber}
                </p>
              </div>
            </div>
            <Badge className={config.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>

          {/* Candidate Info */}
          {showCandidate && (
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={candidateAvatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">
                  {candidateName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {candidateName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {candidateEmail}
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Assigned: {formatDate(assignedAt)}</span>
            </div>
            {expiredAt && status === 'expired' && (
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                <span>Expired: {formatDate(expiredAt)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {notes && (
            <div className="p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-gray-300 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Note:</span> {notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
