// src/services/quests.ts
// Everything related to quests: fetching, progress tracking, step submission,
// and the final completion flow (XP award via DB function).

import { supabase } from '../lib/supabase'
import type {
  Quest,
  QuestStep,
  QuestCompletion,
  QuestStepCompletion,
  QuestWithProgress,
} from '../types/database'

// ── Fetch a single quest with all steps + student progress ───
export async function getQuestWithProgress(
  questId: string,
  studentId: string
): Promise<QuestWithProgress> {
  // Quest row
  const { data: quest, error: questError } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .single()
  if (questError) throw questError

  // All steps for the quest
  const { data: steps, error: stepsError } = await supabase
    .from('quest_steps')
    .select('*')
    .eq('quest_id', questId)
    .order('sort_order')
  if (stepsError) throw stepsError

  // Student's completion records for each step
  const stepIds = steps.map((s: QuestStep) => s.id)
  const { data: stepCompletions, error: scError } = await supabase
    .from('quest_step_completion')
    .select('*')
    .eq('student_id', studentId)
    .in('step_id', stepIds)
  if (scError) throw scError

  // Overall quest completion record
  const { data: completion } = await supabase
    .from('quest_completion')
    .select('*')
    .eq('quest_id', questId)
    .eq('student_id', studentId)
    .maybeSingle()

  // Reward item (first item linked to the tile, if any)
  let rewardItem = null
  if (quest.tile_id) {
    const { data: tileReq } = await supabase
      .from('tile_requirements')
      .select('key, items!inner(*)')
      .eq('tile_id', quest.tile_id)
      .eq('type', 'item')
      .maybeSingle()
    rewardItem = tileReq?.items ?? null
  }

  // Merge step completions into steps
  const completionMap = new Map(
    (stepCompletions ?? []).map((sc: QuestStepCompletion) => [sc.step_id, sc])
  )

  return {
    quest,
    steps: steps.map((step: QuestStep) => ({
      ...step,
      completion: completionMap.get(step.id) ?? null,
    })),
    completion: completion ?? null,
    reward_item: rewardItem,
  }
}

// ── Fetch all quests visible to a student (their class) ──────
export async function getStudentQuests(
  studentId: string
): Promise<(Quest & { completion: QuestCompletion | null })[]> {
  // Get all quests for tiles in the student's class map
  const { data: quests, error } = await supabase
    .from('quests')
    .select('*')
    .order('subject')
  if (error) throw error

  const questIds = quests.map((q: Quest) => q.id)
  const { data: completions } = await supabase
    .from('quest_completion')
    .select('*')
    .eq('student_id', studentId)
    .in('quest_id', questIds)

  const completionMap = new Map(
    (completions ?? []).map((c: QuestCompletion) => [c.quest_id, c])
  )

  return quests.map((q: Quest) => ({
    ...q,
    completion: completionMap.get(q.id) ?? null,
  }))
}

// ── Ensure a quest_completion row exists, set to in_progress ─
export async function startQuest(
  questId: string,
  studentId: string
): Promise<QuestCompletion> {
  const { data, error } = await supabase
    .from('quest_completion')
    .upsert(
      {
        quest_id: questId,
        student_id: studentId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      },
      { onConflict: 'quest_id,student_id', ignoreDuplicates: true }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Save / complete a single step ────────────────────────────
export async function saveStepAnswer(
  stepId: string,
  studentId: string,
  answerText: string,
  complete = false
): Promise<QuestStepCompletion> {
  const { data, error } = await supabase
    .from('quest_step_completion')
    .upsert(
      {
        step_id: stepId,
        student_id: studentId,
        status: complete ? 'completed' : 'in_progress',
        answer_text: answerText,
        completed_at: complete ? new Date().toISOString() : null,
      },
      { onConflict: 'step_id,student_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Complete the entire quest ─────────────────────────────────
// 1. Mark quest_completion as 'completed'
// 2. Call the award_quest_xp DB function to apply XP + stat gains
export async function completeQuest(
  questId: string,
  studentId: string
): Promise<void> {
  // Check all steps are completed first
  const { data: quest } = await supabase
    .from('quests')
    .select('id')
    .eq('id', questId)
    .single()
  if (!quest) throw new Error('Quest not found')

  const { data: steps } = await supabase
    .from('quest_steps')
    .select('id')
    .eq('quest_id', questId)

  const stepIds = (steps ?? []).map((s: { id: string }) => s.id)
  const { data: completions } = await supabase
    .from('quest_step_completion')
    .select('status')
    .eq('student_id', studentId)
    .in('step_id', stepIds)

  const allDone = completions?.every((c: { status: string }) => c.status === 'completed')
  if (!allDone) throw new Error('Not all steps are completed yet.')

  // Mark quest completed
  const { error: qcError } = await supabase
    .from('quest_completion')
    .upsert(
      {
        quest_id: questId,
        student_id: studentId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'quest_id,student_id' }
    )
  if (qcError) throw qcError

  // Award XP + stats via DB function
  const { error: xpError } = await supabase.rpc('award_quest_xp', {
    p_student_id: studentId,
    p_quest_id: questId,
  })
  if (xpError) throw xpError
}

// ── Realtime subscription: watch step completions for a quest ─
// Useful for teacher dashboard to see student progress live
export function subscribeToQuestProgress(
  questId: string,
  onUpdate: (payload: QuestStepCompletion) => void
) {
  return supabase
    .channel(`quest-progress-${questId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quest_step_completion',
        filter: `step_id=in.(${questId})`,  // refined in real usage
      },
      (payload) => onUpdate(payload.new as QuestStepCompletion)
    )
    .subscribe()
}
