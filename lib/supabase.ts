import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'applicant' | 'recruiter'
          full_name: string | null
          avatar_url: string | null
          tokens: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'applicant' | 'recruiter'
          full_name?: string | null
          avatar_url?: string | null
          tokens?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'applicant' | 'recruiter'
          full_name?: string | null
          avatar_url?: string | null
          tokens?: number
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          company: string
          description: string
          requirements: string[]
          tags: string[]
          type: 'full-time' | 'part-time' | 'internship' | 'remote'
          salary_min: number | null
          salary_max: number | null
          location: string
          recruiter_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          company: string
          description: string
          requirements?: string[]
          tags?: string[]
          type: 'full-time' | 'part-time' | 'internship' | 'remote'
          salary_min?: number | null
          salary_max?: number | null
          location: string
          recruiter_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          company?: string
          description?: string
          requirements?: string[]
          tags?: string[]
          type?: 'full-time' | 'part-time' | 'internship' | 'remote'
          salary_min?: number | null
          salary_max?: number | null
          location?: string
          recruiter_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          applicant_id: string
          resume_url: string
          video_intro_url: string | null
          status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'accepted'
          queue_position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          applicant_id: string
          resume_url: string
          video_intro_url?: string | null
          status?: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'accepted'
          queue_position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          applicant_id?: string
          resume_url?: string
          video_intro_url?: string | null
          status?: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'accepted'
          queue_position?: number
          created_at?: string
          updated_at?: string
        }
      }
      token_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'earn' | 'spend'
          amount: number
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'earn' | 'spend'
          amount: number
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'earn' | 'spend'
          amount?: number
          reason?: string
          created_at?: string
        }
      }
    }
  }
}
