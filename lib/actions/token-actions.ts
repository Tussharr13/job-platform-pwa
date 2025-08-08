'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function assignToken(userId: string, jobId: string, roundNumber: number) {
  try {
    const supabase = await createClient()
    
    // Check if user already has a token for this job and round
    const { data: existingToken } = await supabase
      .from('round_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .eq('round_number', roundNumber)
      .single()

    if (existingToken) {
      return {
        success: false,
        error: 'User already has a token for this round',
        data: existingToken
      }
    }

    // Get next token number using the database function
    const { data: nextTokenData, error: tokenError } = await supabase
      .rpc('get_next_token_number', {
        p_job_id: jobId,
        p_round_number: roundNumber
      })

    if (tokenError) {
      throw tokenError
    }

    const nextTokenNumber = nextTokenData as number

    // Insert new token
    const { data: newToken, error: insertError } = await supabase
      .from('round_tokens')
      .insert({
        user_id: userId,
        job_id: jobId,
        round_number: roundNumber,
        token_number: nextTokenNumber,
        status: 'active'
      })
      .select(`
        *,
        profiles!inner(full_name, email),
        jobs!inner(title, company)
      `)
      .single()

    if (insertError) {
      throw insertError
    }

    revalidatePath('/dashboard')
    revalidatePath('/recruiter')

    return {
      success: true,
      data: newToken,
      message: `Token #${nextTokenNumber} assigned for Round ${roundNumber}`
    }

  } catch (error: any) {
    console.error('Error assigning token:', error)
    return {
      success: false,
      error: error.message || 'Failed to assign token'
    }
  }
}

export async function expireToken(tokenId: string, notes?: string) {
  try {
    const supabase = await createClient()

    const { data: updatedToken, error } = await supabase
      .from('round_tokens')
      .update({
        status: 'expired',
        expired_at: new Date().toISOString(),
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)
      .select(`
        *,
        profiles!inner(full_name, email),
        jobs!inner(title, company)
      `)
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/recruiter')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedToken,
      message: 'Token expired successfully'
    }

  } catch (error: any) {
    console.error('Error expiring token:', error)
    return {
      success: false,
      error: error.message || 'Failed to expire token'
    }
  }
}

export async function completeToken(tokenId: string, notes?: string) {
  try {
    const supabase = await createClient()

    const { data: updatedToken, error } = await supabase
      .from('round_tokens')
      .update({
        status: 'completed',
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)
      .select(`
        *,
        profiles!inner(full_name, email),
        jobs!inner(title, company)
      `)
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/recruiter')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedToken,
      message: 'Token marked as completed'
    }

  } catch (error: any) {
    console.error('Error completing token:', error)
    return {
      success: false,
      error: error.message || 'Failed to complete token'
    }
  }
}

export async function getUserTokens(userId: string) {
  try {
    const supabase = await createClient()

    const { data: tokens, error } = await supabase
      .from('round_tokens')
      .select(`
        *,
        jobs!inner(title, company, recruiter_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return {
      success: true,
      data: tokens || []
    }

  } catch (error: any) {
    console.error('Error fetching user tokens:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch tokens',
      data: []
    }
  }
}

export async function getJobRoundTokens(jobId: string, roundNumber: number) {
  try {
    const supabase = await createClient()

    const { data: tokens, error } = await supabase
      .from('round_tokens')
      .select(`
        *,
        profiles!inner(full_name, email, avatar_url)
      `)
      .eq('job_id', jobId)
      .eq('round_number', roundNumber)
      .order('token_number', { ascending: true })

    if (error) {
      throw error
    }

    return {
      success: true,
      data: tokens || []
    }

  } catch (error: any) {
    console.error('Error fetching job round tokens:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch round tokens',
      data: []
    }
  }
}
