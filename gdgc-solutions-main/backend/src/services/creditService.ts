import { supabase } from '../config/supabase'

export async function deductCredits(userId: string, cost: number, action: string, metadata?: object): Promise<{ success: boolean; newBalance: number }> {
  // Fetch current balance
  const { data: user, error } = await supabase.from('users').select('credits').eq('id', userId).single()
  if (error || !user) return { success: false, newBalance: 0 }
  if (user.credits < cost) return { success: false, newBalance: user.credits }

  const newBalance = user.credits - cost

  const [updateResult] = await Promise.all([
    supabase.from('users').update({ credits: newBalance }).eq('id', userId),
    supabase.from('credit_ledger').insert({ user_id: userId, action, delta: -cost, balance: newBalance, metadata }),
  ])

  if (updateResult.error) return { success: false, newBalance: user.credits }
  return { success: true, newBalance }
}

export async function getCredits(userId: string): Promise<number> {
  const { data } = await supabase.from('users').select('credits').eq('id', userId).single()
  return data?.credits ?? 0
}

export async function getCreditHistory(userId: string, limit = 20) {
  const { data } = await supabase
    .from('credit_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
