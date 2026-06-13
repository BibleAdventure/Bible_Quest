// src/hooks/index.ts
// Custom React hooks that wrap the service layer.
// Components import from here — never directly from services.

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getCharacterSheet, xpProgress } from '../services/character'
import {
  getQuestWithProgress,
  startQuest,
  saveStepAnswer,
  completeQuest,
} from '../services/quests'
import { getTilesForRegion, unlockTile } from '../services/map'
import type {
  CharacterSheet,
  QuestWithProgress,
  QuestStepCompletion,
  HexTile,
} from '../types/database'

// ── useCurrentUser ────────────────────────────────────────────
export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null)
      }
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  return { userId, loading }
}

// ── useCharacterSheet ─────────────────────────────────────────
export function useCharacterSheet(studentId: string | null) {
  const [sheet, setSheet] = useState<CharacterSheet | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!studentId) return
    setLoading(true)
    getCharacterSheet(studentId)
      .then(setSheet)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [studentId])

  // Realtime: re-fetch when character row changes (XP gained etc.)
  useEffect(() => {
    if (!studentId) return
    const channel = supabase
      .channel(`character-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          getCharacterSheet(studentId).then(setSheet).catch(setError)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [studentId])

  const xpPct = sheet
    ? xpProgress(sheet.character.xp, sheet.character.level)
    : 0

  return { sheet, loading, error, xpPct }
}

// ── useQuest ──────────────────────────────────────────────────
// Powers the full quest detail / mission screen.
export function useQuest(questId: string, studentId: string) {
  const [data, setData] = useState<QuestWithProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [completionVisible, setCompletionVisible] = useState(false)

  const load = useCallback(() => {
    if (!questId || !studentId) return
    setLoading(true)
    getQuestWithProgress(questId, studentId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [questId, studentId])

  useEffect(() => { load() }, [load])

  // Ensure a quest_completion row exists when screen first mounts
  useEffect(() => {
    if (!questId || !studentId || !data) return
    if (!data.completion) {
      startQuest(questId, studentId).then(load)
    }
  }, [questId, studentId, data, load])

  // Save a step answer (autosave-style, no completion yet)
  const saveStep = useCallback(
    async (stepId: string, answerText: string) => {
      await saveStepAnswer(stepId, studentId, answerText, false)
    },
    [studentId]
  )

  // Complete a step
  const finishStep = useCallback(
    async (stepId: string, answerText: string) => {
      setSubmitting(true)
      try {
        await saveStepAnswer(stepId, studentId, answerText, true)
        await load()
      } finally {
        setSubmitting(false)
      }
    },
    [studentId, load]
  )

  // Complete the entire quest
  const finishQuest = useCallback(async () => {
    setSubmitting(true)
    try {
      await completeQuest(questId, studentId)
      await load()
      setCompletionVisible(true)
    } catch (e) {
      setError(e as Error)
    } finally {
      setSubmitting(false)
    }
  }, [questId, studentId, load])

  // Derived: how many steps done
  const stepsCompleted = data?.steps.filter(
    (s) => s.completion?.status === 'completed'
  ).length ?? 0
  const totalSteps = data?.steps.length ?? 0
  const allStepsDone = totalSteps > 0 && stepsCompleted === totalSteps

  return {
    data,
    loading,
    error,
    submitting,
    completionVisible,
    setCompletionVisible,
    saveStep,
    finishStep,
    finishQuest,
    stepsCompleted,
    totalSteps,
    allStepsDone,
  }
}

// ── useMapTiles ───────────────────────────────────────────────
export function useMapTiles(regionId: string, classId: string) {
  type TileWithProgress = HexTile & {
    class_unlocked: boolean
    student_count: number
  }

  const [tiles, setTiles] = useState<TileWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    if (!regionId || !classId) return
    setLoading(true)
    getTilesForRegion(regionId, classId)
      .then(setTiles)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [regionId, classId])

  useEffect(() => { load() }, [load])

  // Realtime updates when teacher unlocks a tile
  useEffect(() => {
    const channel = supabase
      .channel(`map-tiles-${classId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_map_progress' },
        () => load()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [classId, load])

  const unlock = useCallback(
    async (tileId: string) => {
      await unlockTile(tileId, classId)
      await load()
    },
    [classId, load]
  )

  return { tiles, loading, error, unlock }
}

// ── useAutoSave ───────────────────────────────────────────────
// Debounced autosave for writing/reflection textareas
export function useAutoSave(
  stepId: string,
  studentId: string,
  value: string,
  delayMs = 1500
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!value.trim()) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSaving(true)
      await saveStepAnswer(stepId, studentId, value, false)
      setSaving(false)
    }, delayMs)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [value, stepId, studentId, delayMs])

  return { saving }
}
