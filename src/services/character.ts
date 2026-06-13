// src/services/character.ts
// All reads/writes for characters, stats, guild membership.

import { supabase } from '../lib/supabase'
import type { Character, CharacterSheet, Stats } from '../types/database'

// ── Get full character sheet for a student ───────────────────
export async function getCharacterSheet(studentId: string): Promise<CharacterSheet> {
  // Character + stats in one query via join
  const { data: character, error: charError } = await supabase
    .from('characters')
    .select(`
      *,
      stats (*),
      profiles!characters_student_id_fkey (
        id, display_name, email, avatar_url
      )
    `)
    .eq('student_id', studentId)
    .single()

  if (charError) throw charError

  // Guild membership
  const { data: guildMember } = await supabase
    .from('guild_members')
    .select('guild_id, guilds (*)')
    .eq('student_id', studentId)
    .maybeSingle()

  return {
    character: {
      id: character.id,
      student_id: character.student_id,
      level: character.level,
      xp: character.xp,
      title: character.title,
    },
    stats: character.stats,
    profile: character.profiles,
    guild: guildMember?.guilds ?? null,
  }
}

// ── Get just the stats row (for stat bar displays) ────────────
export async function getStats(studentId: string): Promise<Stats> {
  const { data, error } = await supabase
    .from('stats')
    .select('*, characters!inner(student_id)')
    .eq('characters.student_id', studentId)
    .single()

  if (error) throw error
  return data
}

// ── XP thresholds for level display ──────────────────────────
export function xpForLevel(level: number): number {
  return Math.round(200 * Math.pow(level, 1.5))
}

export function xpForNextLevel(level: number): number {
  return xpForLevel(level + 1)
}

export function xpProgress(xp: number, level: number): number {
  const floor = xpForLevel(level)
  const ceiling = xpForNextLevel(level)
  return Math.min(100, Math.round(((xp - floor) / (ceiling - floor)) * 100))
}
