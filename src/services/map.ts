// src/services/map.ts
// Hex tile map: fetching regions, tile unlock state, class progress.

import { supabase } from '../lib/supabase'
import type { HexTile } from '../types/database'

// ── Fetch all tiles for a region with class unlock state ─────
export async function getTilesForRegion(
  regionId: string,
  classId: string
): Promise<(HexTile & { class_unlocked: boolean; student_count: number })[]> {
  // All tiles in region
  const { data: tiles, error } = await supabase
    .from('hex_tiles')
    .select('*')
    .eq('region_id', regionId)
    .order('r')
    .order('q')
  if (error) throw error

  // Class map for this class
  const { data: worldMap } = await supabase
    .from('world_maps')
    .select('id')
    .eq('class_id', classId)
    .maybeSingle()

  if (!worldMap) {
    // No map yet — return all tiles as locked
    return tiles.map((t: HexTile) => ({
      ...t,
      class_unlocked: false,
      student_count: 0,
    }))
  }

  // Class unlock progress
  const { data: progress } = await supabase
    .from('class_map_progress')
    .select('tile_id, unlocked')
    .eq('map_id', worldMap.id)

  const unlockedSet = new Set(
    (progress ?? [])
      .filter((p: { unlocked: boolean }) => p.unlocked)
      .map((p: { tile_id: string }) => p.tile_id)
  )

  // Count how many students have completed quests linked to each tile
  const tileIds = tiles.map((t: HexTile) => t.id)
  const { data: questCounts } = await supabase
    .from('quest_completion')
    .select('quest_id, quests!inner(tile_id), student_id')
    .in('quests.tile_id', tileIds)
    .eq('status', 'completed')

  const tileStudentCount = new Map<string, Set<string>>()
  for (const row of questCounts ?? []) {
    const tileId = row.quests?.tile_id
    if (!tileId) continue
    if (!tileStudentCount.has(tileId)) tileStudentCount.set(tileId, new Set())
    tileStudentCount.get(tileId)!.add(row.student_id)
  }

  return tiles.map((t: HexTile) => ({
    ...t,
    class_unlocked: unlockedSet.has(t.id),
    student_count: tileStudentCount.get(t.id)?.size ?? 0,
  }))
}

// ── Unlock a tile (teacher action) ───────────────────────────
export async function unlockTile(
  tileId: string,
  classId: string
): Promise<void> {
  const { data: worldMap } = await supabase
    .from('world_maps')
    .select('id')
    .eq('class_id', classId)
    .single()

  if (!worldMap) throw new Error('No world map found for this class')

  const { error } = await supabase
    .from('class_map_progress')
    .upsert(
      {
        map_id: worldMap.id,
        tile_id: tileId,
        unlocked: true,
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: 'map_id,tile_id' }
    )
  if (error) throw error
}

// ── Fetch world map state for a class ────────────────────────
export async function getWorldMap(classId: string) {
  const { data, error } = await supabase
    .from('world_maps')
    .select(`
      *,
      campaigns (*),
      regions (*)
    `)
    .eq('class_id', classId)
    .single()

  if (error) throw error
  return data
}

// ── Realtime: subscribe to tile unlocks for a class ──────────
export function subscribeToMapProgress(
  classId: string,
  onUnlock: (tileId: string) => void
) {
  return supabase
    .channel(`map-progress-${classId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'class_map_progress',
        filter: `unlocked=eq.true`,
      },
      (payload) => {
        if (payload.new?.unlocked) {
          onUnlock(payload.new.tile_id)
        }
      }
    )
    .subscribe()
}
