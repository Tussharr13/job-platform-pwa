'use client'

import { MapPin, Clock, Building2 } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface JobCardProps {
  job: {
    id: string
    title: string
    company: string
    location: string
    type: string
    tags: string[]
    salary_min?: number | null
    salary_max?: number | null
    created_at: string
  }
  onApply?: (jobId: string) => void
  showApplyButton?: boolean
}

export function JobCard({ job, onApply, showApplyButton = true }: JobCardProps) {
  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `From $${min.toLocaleString()}`
    if (max) return `Up to $${max.toLocaleString()}`
    return null
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const posted = new Date(date)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const salary = formatSalary(job.salary_min, job.salary_max)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{job.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">{job.company}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{timeAgo(job.created_at)}</span>
            </div>
          </div>

          {salary && (
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {salary}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {job.type}
            </Badge>
            {job.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{job.tags.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {showApplyButton && (
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            onClick={() => onApply?.(job.id)}
          >
            Apply Now
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
