'use client'

import { Coins } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface JobbieBalanceProps {
  jobbies: number
  onViewHistory?: () => void
}

export function JobbieBalance({ jobbies, onViewHistory }: JobbieBalanceProps) {
  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Jobbie Balance</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{jobbies}</p>
          </div>
        </div>
        {onViewHistory && (
          <Button variant="outline" size="sm" onClick={onViewHistory}>
            History
          </Button>
        )}
      </div>
    </Card>
  )
}
