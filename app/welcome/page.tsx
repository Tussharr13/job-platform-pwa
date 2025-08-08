import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Users, Zap } from 'lucide-react'
import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-8">
          {/* Logo and Hero */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">JobQueue</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Connect talent with opportunities through our smart queue system
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Smart Queue System</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Fair and transparent application process</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Jobbie Economy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Earn jobbies, skip queues, get noticed</p>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white">Choose your path</h2>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 dark:border-gray-700">
              <Link href="/auth?role=applicant">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900 dark:text-white">I'm a Job Seeker</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Find your dream job and join application queues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 dark:border-gray-700">
              <Link href="/auth?role=recruiter">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900 dark:text-white">I'm a Recruiter</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Post jobs and manage candidate queues efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">Get Started</Button>
                </CardContent>
              </Link>
            </Card>
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link href="/auth" className="text-blue-600 dark:text-blue-400 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
