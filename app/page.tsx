'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Loader2, Briefcase } from 'lucide-react'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/home')
      } else {
        router.replace('/welcome')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
          <Briefcase className="h-8 w-8 text-white" />
        </div>
        <div className="space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading JobQueue...</p>
        </div>
      </div>
    </div>
  )
}
