-- ============================================================
-- Kingdom Quest — Seed Data
-- Exodus campaign · Egypt region · The Burning Bush quest
-- Run after 001_initial_schema.sql
-- ============================================================

-- ── School ────────────────────────────────────────────────────
insert into public.schools (id, name, country) values
  ('00000000-0000-0000-0000-000000000001', 'Linwood School', 'NZ');

-- ── Campaign: Exodus ──────────────────────────────────────────
insert into public.campaigns (id, name, description, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'Exodus',
   'The story of Moses leading the Israelites out of slavery in Egypt', 1);

-- ── Region: Egypt ─────────────────────────────────────────────
insert into public.regions (id, campaign_id, name, description, sort_order) values
  ('20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'Egypt', 'The Land of Bondage — where Israel cried out for freedom', 1);

-- ── Hex tiles (Egypt, partial — rows 0-4, cols 0-12) ─────────
insert into public.hex_tiles (id, region_id, q, r, tile_type, title, description, locked) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 0, 0, 'temple',  'Goshen Settlement',   'Where the Israelites lived in Egypt',     false),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 1, 0, 'village', 'Slave Quarters',       'The bitter dwellings of the Hebrew slaves', false),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 2, 0, 'river',   'Nile Delta',           'Where the great river meets the sea',     false),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 3, 0, 'palace',  'Pharaoh''s Court',     'The seat of Egyptian power',              false),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 4, 0, 'miracle', 'Burning Bush',         'God speaks to Moses through a miraculous flame', false),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 5, 0, 'desert',  'Sinai Foothills',      'The edge of the great desert',            false),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', 6, 0, 'river',   'Red Sea Shore',        'The shores of freedom',                   true),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', 1, 1, 'battle',  'Plague of Frogs',      'The second plague of Egypt',              false),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001', 2, 1, 'river',   'Nile River',           'The lifeblood of Egypt, turned to blood', false),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', 3, 1, 'palace',  'Rameses City',         'Built by Hebrew slave labour',            false);

-- ── Artifact set: Moses Staff ─────────────────────────────────
insert into public.artifact_sets (id, name) values
  ('40000000-0000-0000-0000-000000000001', 'Moses Staff');

insert into public.items (id, name, description, icon, rarity, set_id) values
  ('50000000-0000-0000-0000-000000000001', 'Moses Staff Fragment',
   'A piece of the legendary staff Moses carried into Egypt', '🪄', 'rare',
   '40000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000002', 'Staff Shaft',
   'The long wooden body of Moses'' staff', '🌿', 'rare',
   '40000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000003', 'Staff of Power',
   'The completed staff that parted the Red Sea', '⚡', 'legendary',
   '40000000-0000-0000-0000-000000000001');

insert into public.artifact_components (set_id, item_id) values
  ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003');

-- ── Tile requirement: Burning Bush tile needs Staff Fragment ──
insert into public.tile_requirements (tile_id, type, key, value) values
  ('30000000-0000-0000-0000-000000000005',
   'item', '50000000-0000-0000-0000-000000000001', 1);

-- ── Quest: The Burning Bush ───────────────────────────────────
insert into public.quests (
  id, tile_id, title, description, subject, difficulty, xp_reward,
  faith_reward, wisdom_reward, knowledge_reward, communication_reward
) values (
  '60000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000005',
  'The Burning Bush',
  'A bush burns but is not consumed. God calls Moses to lead his people out of slavery.',
  'Bible', 'Year 5', 150,
  20, 15, 10, 12
);

-- ── Quest steps ───────────────────────────────────────────────
insert into public.quest_steps (
  id, quest_id, sort_order, title, step_type,
  bible_reference, bible_text, task_prompt, task_body, min_words
) values

-- Step 1: Bible reading + reflection
(
  '70000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000001',
  0,
  'Read Exodus 3 — The Call of Moses',
  'bible_reading',
  'Exodus 3:1-6',
  'Now Moses was tending the flock of Jethro his father-in-law, the priest of Midian, '
  'and he led the flock to the far side of the wilderness and came to Horeb, the mountain of God. '
  'There the angel of the Lord appeared to him in flames of fire from within a bush. '
  'Moses saw that though the bush was on fire it did not burn up. '
  '"Do not come any closer," God said. '
  '"Take off your sandals, for the place where you are standing is holy ground."',
  'Why do you think God asked Moses to remove his sandals?',
  null,
  20
),

-- Step 2: Science
(
  '70000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000001',
  1,
  'Science — Fire that doesn''t burn',
  'science',
  null,
  null,
  'How can fire exist without burning? Investigate combustion.',
  'The burning bush is one of history''s most famous miracles. '
  'Scientists study combustion — the chemical reaction between fuel and oxygen that produces heat and light. '
  'In a normal fire, the fuel is consumed as it reacts. '
  'Your challenge: Research the conditions needed for combustion and explain why '
  'a normal fire always burns its fuel.',
  30
),

-- Step 3: Writing
(
  '70000000-0000-0000-0000-000000000003',
  '60000000-0000-0000-0000-000000000001',
  2,
  'Writing — Moses'' Response',
  'writing',
  null,
  null,
  'Write a first-person diary entry as Moses after encountering the burning bush.',
  'Imagine you are Moses. You have just seen a bush burning without being destroyed, '
  'and heard the voice of God calling you to lead the Israelites out of Egypt. '
  'Write a diary entry describing what you saw, how you felt, and what you plan to do next. '
  'Your entry should include: what the burning bush looked, sounded and felt like; '
  'your emotions when God spoke to you; your fears or doubts about the task ahead; '
  'and at least one Bible verse reference.',
  100
);

-- ── Bible verse ───────────────────────────────────────────────
insert into public.verses (id, reference, text, story) values
  ('80000000-0000-0000-0000-000000000001',
   'Exodus 14:14',
   'The Lord will fight for you; you need only to be still.',
   'Exodus');

-- ── Guilds (example class) ────────────────────────────────────
-- Note: replace class_id with real class after creating a class
-- insert into public.guilds (class_id, name, colour) values
--   ('<class-id>', 'Judah',    '#c9b87a'),
--   ('<class-id>', 'Levi',     '#9d9ac4'),
--   ('<class-id>', 'Benjamin', '#b08070'),
--   ('<class-id>', 'Issachar', '#5aaccf');
