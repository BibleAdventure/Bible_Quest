// Auto-generated types for Kingdom Quest Supabase schema
// Re-generate with: npx supabase gen types typescript --local > src/types/database.ts

export type Role = 'teacher' | 'student'
export type CharacterTitle = 'Apprentice' | 'Explorer' | 'Pathfinder' | 'Ambassador' | 'Champion'
export type QuestStatus = 'not_started' | 'in_progress' | 'submitted' | 'completed'
export type StepStatus = 'not_started' | 'in_progress' | 'completed'
export type StepType = 'bible_reading' | 'reflection' | 'maths' | 'writing' | 'science' | 'art' | 'pe' | 'discussion'
export type Subject = 'Bible' | 'Maths' | 'Reading' | 'Writing' | 'Science' | 'Social Studies' | 'Te Reo' | 'Art' | 'PE'
export type TileType = 'village' | 'river' | 'mountain' | 'temple' | 'palace' | 'desert' | 'battle' | 'miracle'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary'
export type VerseMasteryStatus = 'read' | 'practiced' | 'memorized' | 'mastered'

// ── Core entities ─────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  role: Role
  display_name: string
  avatar_url: string | null
  school_id: string | null
  created_at: string
}

export interface Character {
  id: string
  student_id: string
  level: number
  xp: number
  title: CharacterTitle
}

export interface Stats {
  character_id: string
  faith: number
  wisdom: number
  knowledge: number
  communication: number
  discovery: number
  leadership: number
  service: number
  creativity: number
  fitness: number
}

export interface Guild {
  id: string
  class_id: string
  name: string
  banner: string | null
  colour: string
}

// ── Quests ───────────────────────────────────────────────────

export interface Quest {
  id: string
  tile_id: string | null
  title: string
  description: string | null
  subject: Subject
  difficulty: string
  xp_reward: number
  faith_reward: number
  wisdom_reward: number
  knowledge_reward: number
  communication_reward: number
  discovery_reward: number
  leadership_reward: number
  creativity_reward: number
  fitness_reward: number
}

export interface QuestStep {
  id: string
  quest_id: string
  sort_order: number
  title: string
  step_type: StepType
  bible_reference: string | null
  bible_text: string | null
  task_prompt: string | null
  task_body: string | null
  min_words: number | null
}

export interface QuestCompletion {
  id: string
  quest_id: string
  student_id: string
  status: QuestStatus
  started_at: string | null
  completed_at: string | null
}

export interface QuestStepCompletion {
  id: string
  step_id: string
  student_id: string
  status: StepStatus
  answer_text: string | null
  completed_at: string | null
}

// ── Map ──────────────────────────────────────────────────────

export interface HexTile {
  id: string
  region_id: string
  q: number
  r: number
  tile_type: TileType
  title: string
  description: string | null
  locked: boolean
}

// ── Items & Cards ─────────────────────────────────────────────

export interface Item {
  id: string
  name: string
  description: string | null
  icon: string | null
  rarity: Rarity
  set_id: string | null
}

export interface StudentItem {
  student_id: string
  item_id: string
  acquired_at: string
}

// ── Verses ───────────────────────────────────────────────────

export interface Verse {
  id: string
  reference: string
  text: string
  story: string | null
}

export interface VerseMastery {
  student_id: string
  verse_id: string
  status: VerseMasteryStatus
  updated_at: string
}

// ── Composite types (for UI) ──────────────────────────────────

/** Full character sheet — character + stats joined */
export interface CharacterSheet {
  character: Character
  stats: Stats
  profile: Profile
  guild: Guild | null
}

/** Quest with all its steps and the current student's completion state */
export interface QuestWithProgress {
  quest: Quest
  steps: (QuestStep & { completion: QuestStepCompletion | null })[]
  completion: QuestCompletion | null
  reward_item: Item | null
}
