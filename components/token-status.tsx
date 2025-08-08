'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, CheckCircle, XCircle, Hash } from 'lucide-react'

interface TokenStatusProps {
  tokenNumber: number
  roundNumber: number
  status: 'active' | 'expired' | 'completed'
  jobTitle?: string
  company?: string
  assignedAt?: string
  expiredAt?: string
  notes?: string
  className?: string
}

export function TokenStatus({
  tokenNumber,
  roundNumber,
  status,
  jobTitle,
  company,
  assignedAt,
  expiredAt,
  notes,
  className = ''
}: TokenStatusProps) {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white dark:bg-gray-800 rounded-full">
                <Hash className="h-4 w-4 text-gray-600 dark:text-gray-300" />
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

          {/* Job Info */}
          {(jobTitle || company) && (
            <div className="space-y-1">
              {jobTitle && (
                <p className="font-medium text-gray-900 dark:text-white">
                  {jobTitle}
                </p>
              )}
              {company && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {company}
                </p>
              )}
            </div>
          )}

          {/* Status Message */}
          <div className="text-center py-2">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              You are Token #{tokenNumber} in Round {roundNumber}
            </p>
            {status === 'active' && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Please wait for your turn
              </p>
            )}
            {status === 'completed' && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Round completed successfully
              </p>
            )}
            {status === 'expired' && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Token has expired
              </p>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            {assignedAt && (
              <span>Assigned: {formatDate(assignedAt)}</span>
            )}
            {expiredAt && status === 'expired' && (
              <span>Expired: {formatDate(expiredAt)}</span>
            )}
          </div>

          {/* Notes */}
          {notes && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
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
