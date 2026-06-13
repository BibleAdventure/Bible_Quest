// src/services/auth.ts
// All authentication logic. Supabase Auth + profile creation.

import { supabase } from '../lib/supabase'
import type { Profile, Role } from '../types/database'

// ── Sign in ───────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ── Sign up (creates auth user + profile row) ─────────────────
export async function signUp(
  email: string,
  password: string,
  display_name: string,
  role: Role
) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  if (!data.user) throw new Error('No user returned from signUp')

  // Create the profile row
  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    role,
    display_name,
  })
  if (profileError) throw profileError

  // If student, also create their character + stats rows
  if (role === 'student') {
    const { data: char, error: charError } = await supabase
      .from('characters')
      .insert({ student_id: data.user.id })
      .select()
      .single()
    if (charError) throw charError

    const { error: statsError } = await supabase
      .from('stats')
      .insert({ character_id: char.id })
    if (statsError) throw statsError
  }

  return data
}

// ── Sign out ──────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ── Get current profile ───────────────────────────────────────
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

// ── Listen for auth state changes ────────────────────────────
export function onAuthStateChange(
  callback: (userId: string | null) => void
) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user?.id ?? null)
  })
}
