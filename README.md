# Kingdom Quest — Supabase Integration

## Stack
- **Frontend**: React + TypeScript + Vite (Netlify deploy)
- **Backend**: Supabase (Auth, Database, Realtime, Edge Functions later)
- **AI layer** (future): Quest Generator, Story Engine, Reflection Assistant

---

## Setup

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com), create a new project.

### 2. Run migrations
In the Supabase **SQL Editor**, run the migration files in order:

```
supabase/migrations/001_initial_schema.sql   ← tables + RLS policies + award_quest_xp function
supabase/migrations/002_seed.sql             ← Exodus campaign, Egypt region, Burning Bush quest
```

Or via the Supabase CLI:
```bash
npx supabase db push
```

### 3. Environment variables
Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in your Supabase project → **Settings → API**.

### 4. Install & run
```bash
npm install
npm run dev
```

---

## File structure

```
src/
├── lib/
│   └── supabase.ts          ← Supabase client singleton
├── types/
│   └── database.ts          ← All TypeScript types from schema
├── services/
│   ├── auth.ts              ← signIn, signUp, signOut, getCurrentProfile
│   ├── character.ts         ← getCharacterSheet, getStats, XP helpers
│   ├── quests.ts            ← getQuestWithProgress, saveStepAnswer, completeQuest
│   └── map.ts               ← getTilesForRegion, unlockTile, subscribeToMapProgress
└── hooks/
    └── index.ts             ← useCurrentUser, useCharacterSheet, useQuest, useMapTiles, useAutoSave
```

---

## Key patterns

### Fetching a quest in a component
```tsx
import { useQuest } from '../hooks'

function QuestScreen({ questId }: { questId: string }) {
  const { userId } = useCurrentUser()
  const {
    data,
    loading,
    finishStep,
    finishQuest,
    completionVisible,
    setCompletionVisible,
    allStepsDone,
  } = useQuest(questId, userId!)

  if (loading) return <LoadingScreen />
  if (!data) return null

  return (
    <>
      <QuestHeader quest={data.quest} />
      {data.steps.map(step => (
        <StepCard
          key={step.id}
          step={step}
          onComplete={(answer) => finishStep(step.id, answer)}
        />
      ))}
      {allStepsDone && (
        <button onClick={finishQuest}>Complete quest</button>
      )}
      {completionVisible && (
        <CompletionOverlay
          quest={data.quest}
          rewardItem={data.reward_item}
          onDismiss={() => setCompletionVisible(false)}
        />
      )}
    </>
  )
}
```

### Autosaving a textarea
```tsx
import { useAutoSave } from '../hooks'

function WritingStep({ step, studentId }) {
  const [answer, setAnswer] = useState(step.completion?.answer_text ?? '')
  const { saving } = useAutoSave(step.id, studentId, answer)

  return (
    <textarea value={answer} onChange={e => setAnswer(e.target.value)} />
    {saving && <span>Saving…</span>}
  )
}
```

### Completing a quest
The `completeQuest()` service function:
1. Verifies all steps are done
2. Upserts `quest_completion` to `completed`
3. Calls the `award_quest_xp` Postgres function which atomically adds XP and stat points

The `award_quest_xp` function runs as `security definer` so it can update any
student's character without the student needing direct UPDATE access to other rows.

---

## Row Level Security summary

| Table | Student can | Teacher can |
|---|---|---|
| profiles | Read/write own | Read own |
| characters | Read/write own | Read class students |
| stats | Read/write own | Read class students |
| quest_completion | Read/write own | Read class students |
| quest_step_completion | Read/write own | — |
| student_items | Read/write own | — |
| quests, quest_steps, hex_tiles, etc. | Read (public) | Read (public) |

---

## Realtime subscriptions

Two live channels are wired up:

- **`character-{studentId}`** — fires when the character row is updated (XP gained).
  The `useCharacterSheet` hook re-fetches and updates the XP bar live.

- **`map-tiles-{classId}`** — fires when the teacher unlocks a tile.
  The `useMapTiles` hook re-fetches so the map unlocks for all students simultaneously.

---

## Next steps

1. **Auth UI** — Login/signup page (the service is ready, just needs a form component)
2. **Quest step components** — wire `QuestScreen` up to real data using `useQuest`
3. **Teacher unlock flow** — call `unlockTile()` from the teacher dashboard
4. **Guild XP** — add a `guild_xp` column + trigger that awards guild points when a student completes a quest
5. **Edge Functions** — AI Quest Generator (`/functions/generate-quest`) calling Claude API
