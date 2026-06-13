-- ============================================================
-- Kingdom Quest — Initial Schema
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  role         text not null check (role in ('teacher', 'student')),
  display_name text not null,
  avatar_url   text,
  school_id    uuid,
  created_at   timestamptz not null default now()
);

-- ── Schools ──────────────────────────────────────────────────
create table public.schools (
  id      uuid primary key default uuid_generate_v4(),
  name    text not null,
  country text not null default 'NZ'
);

-- ── Classes ──────────────────────────────────────────────────
create table public.classes (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid references public.schools(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  name       text not null,
  year_level int  not null
);

-- ── Class members ────────────────────────────────────────────
create table public.class_members (
  class_id   uuid references public.classes(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  primary key (class_id, student_id)
);

-- ── Guilds ───────────────────────────────────────────────────
create table public.guilds (
  id       uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id) on delete cascade,
  name     text not null,   -- e.g. 'Judah'
  banner   text,
  colour   text not null default '#6a5acd'
);

create table public.guild_members (
  guild_id   uuid references public.guilds(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  primary key (guild_id, student_id)
);

-- ── Characters ───────────────────────────────────────────────
create table public.characters (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid unique references public.profiles(id) on delete cascade,
  level      int  not null default 1,
  xp         int  not null default 0,
  title      text not null default 'Apprentice'
    check (title in ('Apprentice','Explorer','Pathfinder','Ambassador','Champion'))
);

create table public.stats (
  character_id   uuid primary key references public.characters(id) on delete cascade,
  faith          int not null default 0,
  wisdom         int not null default 0,
  knowledge      int not null default 0,
  communication  int not null default 0,
  discovery      int not null default 0,
  leadership     int not null default 0,
  service        int not null default 0,
  creativity     int not null default 0,
  fitness        int not null default 0
);

-- ── Campaigns & Regions ──────────────────────────────────────
create table public.campaigns (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,  -- e.g. 'Exodus'
  description text,
  sort_order  int  not null default 0
);

create table public.regions (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  name        text not null,  -- e.g. 'Egypt'
  description text,
  sort_order  int  not null default 0
);

-- ── Hex tiles ────────────────────────────────────────────────
create table public.hex_tiles (
  id          uuid primary key default uuid_generate_v4(),
  region_id   uuid references public.regions(id) on delete cascade,
  q           int  not null,
  r           int  not null,
  tile_type   text not null check (tile_type in (
    'village','river','mountain','temple','palace','desert','battle','miracle'
  )),
  title       text not null,
  description text,
  locked      boolean not null default true,
  unique (region_id, q, r)
);

create table public.tile_requirements (
  id       uuid primary key default uuid_generate_v4(),
  tile_id  uuid references public.hex_tiles(id) on delete cascade,
  type     text not null check (type in ('item','stat','quest')),
  key      text not null,  -- e.g. 'faith', item id, quest id
  value    int  not null default 1
);

-- ── Quests ───────────────────────────────────────────────────
create table public.quests (
  id          uuid primary key default uuid_generate_v4(),
  tile_id     uuid references public.hex_tiles(id) on delete set null,
  title       text not null,
  description text,
  subject     text not null check (subject in (
    'Bible','Maths','Reading','Writing','Science',
    'Social Studies','Te Reo','Art','PE'
  )),
  difficulty  text not null default 'Year 5'
    check (difficulty in ('Year 3','Year 4','Year 5','Year 6','Year 7','Year 8')),
  xp_reward   int  not null default 100,
  -- Stat rewards (null = no gain)
  faith_reward         int default 0,
  wisdom_reward        int default 0,
  knowledge_reward     int default 0,
  communication_reward int default 0,
  discovery_reward     int default 0,
  leadership_reward    int default 0,
  creativity_reward    int default 0,
  fitness_reward       int default 0
);

create table public.quest_steps (
  id          uuid primary key default uuid_generate_v4(),
  quest_id    uuid references public.quests(id) on delete cascade,
  sort_order  int  not null default 0,
  title       text not null,
  step_type   text not null check (step_type in (
    'bible_reading','reflection','maths','writing','science','art','pe','discussion'
  )),
  -- Content fields (flexible — use whichever apply)
  bible_reference text,   -- e.g. 'Exodus 3:1-6'
  bible_text      text,
  task_prompt     text,
  task_body       text,
  min_words       int     -- for writing steps
);

-- ── Quest completion ─────────────────────────────────────────
create table public.quest_completion (
  id          uuid primary key default uuid_generate_v4(),
  quest_id    uuid references public.quests(id) on delete cascade,
  student_id  uuid references public.profiles(id) on delete cascade,
  status      text not null default 'in_progress'
    check (status in ('not_started','in_progress','submitted','completed')),
  started_at  timestamptz,
  completed_at timestamptz,
  unique (quest_id, student_id)
);

create table public.quest_step_completion (
  id             uuid primary key default uuid_generate_v4(),
  step_id        uuid references public.quest_steps(id) on delete cascade,
  student_id     uuid references public.profiles(id) on delete cascade,
  status         text not null default 'not_started'
    check (status in ('not_started','in_progress','completed')),
  answer_text    text,
  completed_at   timestamptz,
  unique (step_id, student_id)
);

-- ── Items & Inventory ────────────────────────────────────────
create table public.items (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  icon        text,         -- emoji or image url
  rarity      text not null default 'common'
    check (rarity in ('common','uncommon','rare','legendary')),
  set_id      uuid          -- FK added after artifact_sets created
);

create table public.artifact_sets (
  id    uuid primary key default uuid_generate_v4(),
  name  text not null   -- e.g. 'Moses Staff'
);

create table public.artifact_components (
  set_id  uuid references public.artifact_sets(id) on delete cascade,
  item_id uuid references public.items(id) on delete cascade,
  primary key (set_id, item_id)
);

alter table public.items
  add constraint fk_items_set
  foreign key (set_id) references public.artifact_sets(id) on delete set null;

create table public.student_items (
  student_id  uuid references public.profiles(id) on delete cascade,
  item_id     uuid references public.items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (student_id, item_id)
);

-- ── Collectible cards ────────────────────────────────────────
create table public.cards (
  id       uuid primary key default uuid_generate_v4(),
  name     text not null,
  rarity   text not null check (rarity in ('common','uncommon','rare','legendary')),
  category text not null check (category in (
    'Bible Hero','Artifact','Virtue','Miracle','Location'
  )),
  icon     text,
  flavour  text
);

create table public.student_cards (
  student_id  uuid references public.profiles(id) on delete cascade,
  card_id     uuid references public.cards(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (student_id, card_id)
);

-- ── Bible verses ─────────────────────────────────────────────
create table public.verses (
  id        uuid primary key default uuid_generate_v4(),
  reference text not null,  -- e.g. 'Exodus 14:14'
  text      text not null,
  story     text            -- campaign/story context
);

create table public.verse_mastery (
  student_id uuid references public.profiles(id) on delete cascade,
  verse_id   uuid references public.verses(id) on delete cascade,
  status     text not null default 'read'
    check (status in ('read','practiced','memorized','mastered')),
  updated_at timestamptz not null default now(),
  primary key (student_id, verse_id)
);

-- ── Class map progress ───────────────────────────────────────
create table public.world_maps (
  id          uuid primary key default uuid_generate_v4(),
  class_id    uuid unique references public.classes(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  region_id   uuid references public.regions(id) on delete set null,
  story_week  int not null default 1
);

create table public.class_map_progress (
  id         uuid primary key default uuid_generate_v4(),
  map_id     uuid references public.world_maps(id) on delete cascade,
  tile_id    uuid references public.hex_tiles(id) on delete cascade,
  unlocked   boolean not null default false,
  unlocked_at timestamptz,
  unique (map_id, tile_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.characters        enable row level security;
alter table public.stats             enable row level security;
alter table public.quest_completion  enable row level security;
alter table public.quest_step_completion enable row level security;
alter table public.student_items     enable row level security;
alter table public.student_cards     enable row level security;
alter table public.verse_mastery     enable row level security;

-- Profiles: users see their own; teachers see their class
create policy "Own profile" on public.profiles
  for all using (auth.uid() = id);

-- Characters: students own their character; teachers can read class chars
create policy "Own character" on public.characters
  for all using (auth.uid() = student_id);

create policy "Teacher reads class characters" on public.characters
  for select using (
    exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = characters.student_id
        and c.teacher_id = auth.uid()
    )
  );

-- Stats: same pattern as characters
create policy "Own stats" on public.stats
  for all using (
    exists (
      select 1 from public.characters ch
      where ch.id = stats.character_id
        and ch.student_id = auth.uid()
    )
  );

-- Quest completion: students own their rows; teachers read class rows
create policy "Own quest completion" on public.quest_completion
  for all using (auth.uid() = student_id);

create policy "Teacher reads quest completion" on public.quest_completion
  for select using (
    exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = quest_completion.student_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "Own step completion" on public.quest_step_completion
  for all using (auth.uid() = student_id);

-- Items / cards / verses: own rows only
create policy "Own items"  on public.student_items  for all using (auth.uid() = student_id);
create policy "Own cards"  on public.student_cards  for all using (auth.uid() = student_id);
create policy "Own verses" on public.verse_mastery  for all using (auth.uid() = student_id);

-- Public read on reference tables (quests, items, cards, verses, etc.)
create policy "Public read quests"       on public.quests       for select using (true);
create policy "Public read quest_steps"  on public.quest_steps  for select using (true);
create policy "Public read hex_tiles"    on public.hex_tiles    for select using (true);
create policy "Public read regions"      on public.regions      for select using (true);
create policy "Public read campaigns"    on public.campaigns    for select using (true);
create policy "Public read items"        on public.items        for select using (true);
create policy "Public read cards"        on public.cards        for select using (true);
create policy "Public read verses"       on public.verses       for select using (true);
create policy "Public read guilds"       on public.guilds       for select using (true);
create policy "Public read guild_members" on public.guild_members for select using (true);
create policy "Public read artifact_sets" on public.artifact_sets for select using (true);
create policy "Public read artifact_components" on public.artifact_components for select using (true);
create policy "Public read class_map_progress" on public.class_map_progress for select using (true);
create policy "Public read world_maps"   on public.world_maps   for select using (true);

-- ============================================================
-- Helper function: award XP + auto-level character
-- Called after quest completion
-- ============================================================
create or replace function public.award_quest_xp(
  p_student_id uuid,
  p_quest_id   uuid
) returns void language plpgsql security definer as $$
declare
  v_quest        public.quests%rowtype;
  v_char_id      uuid;
  v_new_xp       int;
  v_new_level    int;
  v_new_title    text;
begin
  select * into v_quest from public.quests where id = p_quest_id;
  select id into v_char_id from public.characters where student_id = p_student_id;

  -- Add XP
  update public.characters
  set xp = xp + v_quest.xp_reward
  where id = v_char_id
  returning xp into v_new_xp;

  -- Simple level thresholds: 200 * level^1.5
  v_new_level := greatest(1, floor(power(v_new_xp / 200.0, 1.0/1.5))::int + 1);
  v_new_title := case
    when v_new_level >= 20 then 'Champion'
    when v_new_level >= 15 then 'Ambassador'
    when v_new_level >= 10 then 'Pathfinder'
    when v_new_level >= 5  then 'Explorer'
    else 'Apprentice'
  end;

  update public.characters
  set level = v_new_level, title = v_new_title
  where id = v_char_id;

  -- Apply stat rewards
  update public.stats set
    faith         = faith         + coalesce(v_quest.faith_reward, 0),
    wisdom        = wisdom        + coalesce(v_quest.wisdom_reward, 0),
    knowledge     = knowledge     + coalesce(v_quest.knowledge_reward, 0),
    communication = communication + coalesce(v_quest.communication_reward, 0),
    discovery     = discovery     + coalesce(v_quest.discovery_reward, 0),
    leadership    = leadership    + coalesce(v_quest.leadership_reward, 0),
    creativity    = creativity    + coalesce(v_quest.creativity_reward, 0),
    fitness       = fitness       + coalesce(v_quest.fitness_reward, 0)
  where character_id = v_char_id;
end;
$$;
