import { useEffect, useRef, useState } from 'react'
import styles from './TeacherDashboard.module.css'
import FullscreenMap from '../components/FullscreenMap'

// ── Mock data ────────────────────────────────────────────────
const GUILDS = [
  { name: 'Judah',    icon: '🦁', colour: '#c9b87a', xp: 820, delta: +45, rank: 1, members: 6 },
  { name: 'Levi',     icon: '⚖️', colour: '#9d9ac4', xp: 790, delta: -12, rank: 2, members: 6 },
  { name: 'Benjamin', icon: '🐺', colour: '#b08070', xp: 760, delta: +30, rank: 3, members: 6 },
  { name: 'Issachar', icon: '🌟', colour: '#5aaccf', xp: 710, delta: +58, rank: 4, members: 6 },
]

const QUESTS = [
  { subject: 'Bible',   name: 'The Burning Bush',    done: 18, total: 24, due: 'Fri 14 Jun',  status: 'active',  overdue: false },
  { subject: 'Maths',   name: 'Brick Builders',      done: 12, total: 24, due: 'Tue 11 Jun',  status: 'review',  overdue: true  },
  { subject: 'Writing', name: 'Letter to Pharaoh',   done: 8,  total: 24, due: 'Mon 17 Jun',  status: 'active',  overdue: false },
  { subject: 'Science', name: 'Plague of the Nile',  done: 0,  total: 24, due: 'Wed 19 Jun',  status: 'draft',   overdue: false },
  { subject: 'PE',      name: 'Wilderness Training', done: 21, total: 24, due: 'Thu 12 Jun',  status: 'active',  overdue: false },
  { subject: 'Art',     name: 'Egyptian Murals',     done: 14, total: 24, due: 'Fri 21 Jun',  status: 'active',  overdue: false },
]

const STUDENTS = [
  { initials: 'LY', name: 'Lyndon Y.',  level: 12, title: 'Pathfinder',  guild: 'Judah',    online: 'online'  },
  { initials: 'AM', name: 'Amara M.',   level: 14, title: 'Ambassador',  guild: 'Levi',     online: 'online'  },
  { initials: 'JT', name: 'James T.',   level: 10, title: 'Explorer',    guild: 'Judah',    online: 'today'   },
  { initials: 'SK', name: 'Sophie K.',  level: 13, title: 'Pathfinder',  guild: 'Issachar', online: 'online'  },
  { initials: 'ER', name: 'Ethan R.',   level: 9,  title: 'Apprentice',  guild: 'Benjamin', online: 'away'    },
  { initials: 'NW', name: 'Nina W.',    level: 15, title: 'Champion',    guild: 'Levi',     online: 'online'  },
  { initials: 'BH', name: 'Ben H.',     level: 11, title: 'Explorer',    guild: 'Benjamin', online: 'today'   },
  { initials: 'CP', name: 'Chloe P.',   level: 12, title: 'Pathfinder',  guild: 'Judah',    online: 'online'  },
  { initials: 'TF', name: 'Tom F.',     level: 8,  title: 'Apprentice',  guild: 'Issachar', online: 'away'    },
]

const TILE_DEFS: Record<string, { color: string; border: string; icon: string; label: string }> = {
  temple:   { color: '#221030', border: '#8040b4', icon: '⛩',  label: 'Temple'   },
  village:  { color: '#2d1e5a', border: '#5a4aaa', icon: '🏘',  label: 'Village'  },
  river:    { color: '#0c2030', border: '#247090', icon: '🌊',  label: 'River'    },
  palace:   { color: '#221208', border: '#b06020', icon: '🏯',  label: 'Palace'   },
  miracle:  { color: '#140c34', border: '#b0a060', icon: '✨',  label: 'Miracle'  },
  desert:   { color: '#241508', border: '#6a4a18', icon: '🏜',  label: 'Desert'   },
  battle:   { color: '#240808', border: '#b43030', icon: '⚔️',  label: 'Battle'   },
  locked:   { color: '#0c0a14', border: '#181428', icon: '🔒',  label: 'Locked'   },
}

const TILES: [string, boolean, string][] = [
  ['temple',true,'Goshen Settlement'],['village',true,'Slave Quarters'],['river',true,'Nile Delta'],
  ['palace',true,"Pharaoh's Court"],['miracle',true,'Burning Bush'],['desert',true,'Sinai Foothills'],
  ['locked',false,'Red Sea Shore'],['locked',false,'Sinai Pass'],['locked',false,'Wilderness'],
  ['locked',false,'Manna Field'],['locked',false,'Mt Sinai'],['locked',false,'Jordan Valley'],['locked',false,'Jericho'],
  ['village',true,'Hebrew Camp'],['desert',true,'Brick Works'],['river',true,'Nile River'],
  ['battle',true,'Plague of Frogs'],['temple',true,'Altar of Moses'],['village',true,"Shepherd's Field"],
  ['desert',true,'Desert Trail'],['locked',false,'Sea Crossing'],['locked',false,'Bitter Waters'],
  ['locked',false,'Quail Camp'],['locked',false,'Rock of Horeb'],['locked',false,'Golden Calf'],['locked',false,'Covenant Ridge'],
  ['palace',true,'Rameses City'],['battle',true,'Plague of Locusts'],['miracle',true,'Blood of the Nile'],
  ['temple',true,'House of Levi'],['village',true,'Goshen Gate'],['river',true,'Papyrus Marsh'],
  ['desert',true,'Eastern Road'],['locked',false,'Sea of Reeds'],['locked',false,'Elim Oasis'],
  ['locked',false,'Dophkah'],['locked',false,'Hazeroth'],['locked',false,'Rithmah'],['locked',false,'Kadesh Barnea'],
  ['desert',true,'Dry Dunes'],['village',true,'Midian Camp'],['desert',true,'Trade Route'],
  ['palace',true,'Treasury Hall'],['battle',true,'Final Plague'],['miracle',true,'Passover Night'],
  ['village',true,'Freedom Camp'],['locked',false,'Marah Spring'],['locked',false,'Sin Desert'],
  ['locked',false,'Rephidim'],['locked',false,'Mt Sinai Base'],['locked',false,'Tabernacle Site'],['locked',false,'Promised Land'],
  ['locked',false,'Southern Waste'],['river',true,'Nile Crossing'],['temple',true,'Osiris Shrine'],
  ['village',true,'Hebrew Village'],['desert',true,'Sand Dunes'],['village',true,'Exodus Gate'],
  ['locked',false,'Reed Coast'],['locked',false,'Island Camp'],['locked',false,'Etham'],
  ['locked',false,'Pi-hahiroth'],['locked',false,'Baal-Zephon'],['locked',false,'Migdol Watch'],['locked',false,'Canaan Border'],
]

const SUBJECT_STYLES: Record<string, { bg: string; color: string }> = {
  Bible:   { bg: '#1e1830', color: '#a094d8' },
  Maths:   { bg: '#0f2318', color: '#5dbf8a' },
  Writing: { bg: '#2a1a0a', color: '#d4924a' },
  Science: { bg: '#0f1e2a', color: '#5aaccf' },
  PE:      { bg: '#1e2a0f', color: '#82c45a' },
  Art:     { bg: '#2a1040', color: '#c07ad4' },
}

// ── Hex map canvas component ─────────────────────────────────
function HexMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hov, setHov] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string; sub: string } | null>(null)
  const hovRef = useRef<number | null>(null)

  const SZ = 22, COLS = 13, PX = 32, PY = 28
  const completion = TILES.map(([, u]) => u ? Math.floor(Math.random() * 10 + 14) : 0)

  function tileXY(col: number, row: number) {
    const w = SZ * Math.sqrt(3)
    return { x: PX + col * w + (row % 2 === 1 ? w / 2 : 0), y: PY + row * SZ * 1.5 }
  }

  function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number) {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30)
      const px = cx + sz * Math.cos(a), py = cy + sz * Math.sin(a)
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath()
  }

  function draw(hovIdx: number | null) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#040210'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    TILES.forEach(([type, unlocked], idx) => {
      const col = idx % COLS, row = Math.floor(idx / COLS)
      const { x, y } = tileXY(col, row)
      const def = TILE_DEFS[unlocked ? type : 'locked']
      const isH = hovIdx === idx
      const sz = isH ? SZ + 2 : SZ

      hexPath(ctx, x, y, sz - 0.5)
      ctx.fillStyle = def.color
      ctx.fill()
      hexPath(ctx, x, y, sz - 0.5)
      ctx.strokeStyle = isH ? '#c9b87a' : def.border
      ctx.lineWidth = isH ? 1.5 : 0.7
      ctx.stroke()

      if (unlocked && completion[idx] > 0) {
        hexPath(ctx, x, y, sz - 3)
        ctx.fillStyle = `rgba(93,191,138,${(completion[idx] / 24) * 0.18})`
        ctx.fill()
      }

      ctx.font = `${Math.floor(sz * 0.5)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(unlocked ? def.icon : '🔒', x, y)
    })
  }

  useEffect(() => { draw(null) }, [])

  function getIdx(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const r = canvas.getBoundingClientRect()
    const sx = canvas.width / r.width, sy = canvas.height / r.height
    const mx = (e.clientX - r.left) * sx, my = (e.clientY - r.top) * sy
    let best: number | null = null, bd = Infinity
    TILES.forEach((_, idx) => {
      const col = idx % COLS, row = Math.floor(idx / COLS)
      const { x, y } = tileXY(col, row)
      const d = Math.hypot(mx - x, my - y)
      if (d < SZ * 0.95 && d < bd) { bd = d; best = idx }
    })
    return { best, mx, my, r }
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const { best, r } = getIdx(e)
    if (best !== hovRef.current) {
      hovRef.current = best
      setHov(best)
      draw(best)
    }
    if (best !== null) {
      const [type, unlocked, name] = TILES[best]
      const tx = e.clientX - r.left, ty = e.clientY - r.top
      setTooltip({
        x: Math.min(tx + 14, r.width - 160),
        y: Math.max(ty - 52, 4),
        text: unlocked ? name : 'Locked Territory',
        sub: unlocked ? `${completion[best]}/24 students · ${TILE_DEFS[type].label}` : 'Complete prior tiles to unlock',
      })
    } else {
      setTooltip(null)
    }
  }

  function onMouseLeave() {
    hovRef.current = null
    setHov(null)
    setTooltip(null)
    draw(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={230}
        style={{ width: '100%', borderRadius: 8, background: '#040210', display: 'block', cursor: 'pointer' }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      />
      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x, top: tooltip.y,
          background: '#1a1628', border: '1px solid #2e2850', borderRadius: 8,
          padding: '8px 12px', fontSize: 12, color: '#c4b8e8', pointerEvents: 'none',
          minWidth: 140, zIndex: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e4d9', marginBottom: 3 }}>{tooltip.text}</div>
          <div style={{ color: '#c9b87a', fontSize: 11 }}>{tooltip.sub}</div>
        </div>
      )}
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────
export default function TeacherDashboard() {
  const [notifVisible, setNotifVisible] = useState(true)
  const [unlockedTile, setUnlockedTile] = useState(false)
  const [activeNav, setActiveNav] = useState('map')

  const totalXP = GUILDS.reduce((a, g) => a + g.xp, 0)

  return (
    <div className={styles.app}>

      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.logo}>Kingdom<span>Quest</span>
          <span className={styles.logoSub}>Teacher View</span>
        </div>
        <div className={styles.campaignBadge}>Campaign: <b>Exodus</b></div>
        <div className={styles.campaignBadge} style={{ marginLeft: 8 }}>Class: <b>Room 7 — Year 5</b></div>
        <div className={styles.tbRight}>
          <button className={styles.iconBtn}>📢</button>
          <button className={styles.iconBtn}>⚙️</button>
          <div className={styles.avatarT}>MR</div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sbTeacher}>
          <div className={styles.sbName}>Miss Rawlings</div>
          <div className={styles.sbRole}>Class Teacher · Linwood School</div>
          <div className={styles.classSwitcher}>Room 7 — Year 5 <span>▾</span></div>
        </div>

        <nav className={styles.navSection}>
          <div className={styles.sectionLabel}>Dashboard</div>
          {[
            { id: 'map',     icon: '🗺',  label: 'Campaign Map'    },
            { id: 'quests',  icon: '⚔️',  label: 'Quest Manager', badge: '12' },
            { id: 'students',icon: '👥',  label: 'Students'        },
            { id: 'guilds',  icon: '🏰',  label: 'Guilds'          },
            { id: 'verses',  icon: '📖',  label: 'Verse Tracker'   },
            { id: 'cards',   icon: '🃏',  label: 'Cards & Items'   },
          ].map(n => (
            <div
              key={n.id}
              className={`${styles.navItem} ${activeNav === n.id ? styles.navActive : ''}`}
              onClick={() => setActiveNav(n.id)}
            >
              <span className={styles.navIcon}>{n.icon}</span>
              {n.label}
              {n.badge && <span className={styles.navBadge}>{n.badge}</span>}
            </div>
          ))}

          <div className={styles.sectionLabel} style={{ marginTop: 8 }}>Tools</div>
          {[
            { id: 'assign',  icon: '📋', label: 'Assign Quests'  },
            { id: 'unlock',  icon: '🔓', label: 'Unlock Tiles'   },
            { id: 'print',   icon: '📄', label: 'Print Map',  extra: 'PDF' },
            { id: 'reports', icon: '📊', label: 'Reports'         },
          ].map(n => (
            <div key={n.id} className={styles.navItem} onClick={() => setActiveNav(n.id)}>
              <span className={styles.navIcon}>{n.icon}</span>
              {n.label}
              {n.extra && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#5dbf8a' }}>{n.extra}</span>}
            </div>
          ))}
        </nav>

        <div className={styles.quickActions}>
          <div className={styles.sectionLabel}>Quick actions</div>
          <button className={`${styles.qaBtn} ${styles.qaBtnPrimary}`}>✦ Advance Story Week</button>
          <button className={styles.qaBtn} onClick={() => setUnlockedTile(true)}>🔓 Unlock Next Tile</button>
          <button className={styles.qaBtn}>➕ Assign New Quest</button>
          <button className={styles.qaBtn}>🎖 Award Guild XP</button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.mainInner}>

          {/* Notification */}
          {notifVisible && (
            <div className={styles.notifBar}>
              <span>🔔</span>
              <span><b style={{ color: '#c9b87a' }}>3 students</b> completed The Burning Bush — ready to unlock the Red Sea Shore tile.</span>
              <button className={styles.notifDismiss} onClick={() => setNotifVisible(false)}>✕</button>
            </div>
          )}

          {/* Stat cards */}
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Students</div>
              <div className={styles.statVal}>24</div>
              <div className={styles.statSub} style={{ color: '#5dbf8a' }}>🟢 18 active today</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Map progress</div>
              <div className={styles.statVal}>78%</div>
              <div className={styles.statSub}>24 of 32 tiles unlocked</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Quests this week</div>
              <div className={styles.statVal}>47</div>
              <div className={styles.statSub} style={{ color: '#e8a23a' }}>⚠ 8 overdue</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Verses mastered</div>
              <div className={styles.statVal}>312</div>
              <div className={styles.statSub}>+28 this week</div>
            </div>
          </div>

          {/* Campaign row */}
         <FullscreenMap />

            <div className={styles.card}>
              <div className={styles.cardTitle}>Campaign Status</div>
              <div className={styles.campInfo}>
                {[
                  ['Campaign', 'Exodus', true],
                  ['Current region', 'Egypt', false],
                  ['Story week', 'Week 6', false],
                  ['Next region', 'Red Sea (locked)', false],
                ].map(([label, val, gold]) => (
                  <div key={label as string} className={styles.campRow}>
                    <span className={styles.campLabel}>{label}</span>
                    <span className={styles.campVal} style={gold ? { color: '#c9b87a' } : {}}>{val}</span>
                  </div>
                ))}

                <div className={styles.progWrap}>
                  <div className={styles.progLabels}><span>Region progress</span><span>78%</span></div>
                  <div className={styles.progBg}><div className={styles.progFill} style={{ width: '78%', background: 'linear-gradient(90deg,#6a5acd,#9b7fd4)' }} /></div>
                </div>
                <div className={styles.progWrap}>
                  <div className={styles.progLabels}><span>Campaign completion</span><span>24%</span></div>
                  <div className={styles.progBg}><div className={styles.progFill} style={{ width: '24%', background: 'linear-gradient(90deg,#7a5a20,#c9b87a)' }} /></div>
                </div>

                <div className={styles.nextTile}>
                  <span style={{ fontSize: 20 }}>🌊</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b6488' }}>Next tile to unlock</div>
                    <div style={{ fontSize: 13, color: '#c9b87a', fontWeight: 500 }}>Red Sea Shore</div>
                  </div>
                  <button
                    className={styles.unlockBtn}
                    onClick={() => setUnlockedTile(true)}
                    disabled={unlockedTile}
                  >
                    {unlockedTile ? '✓ Unlocked!' : 'Unlock →'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Guild rankings */}
          <div>
            <div className={styles.sectionHeading}>🏰 Guild Rankings</div>
            <div className={styles.guildGrid}>
              {GUILDS.map(g => (
                <div key={g.name} className={`${styles.guildCard} ${g.rank === 1 ? styles.guildTop : ''}`}>
                  <div className={styles.guildRankBadge} style={
                    g.rank === 1 ? { background: '#2a1f06', color: '#c9b87a', border: '1px solid #4a3a1a' } :
                    g.rank === 2 ? { background: '#1a1a28', color: '#9d9ac4', border: '1px solid #2e2c50' } :
                    g.rank === 3 ? { background: '#1e1210', color: '#b08070', border: '1px solid #3a2820' } :
                                   { background: '#1a1728', color: '#6b6488', border: '1px solid #2a2445' }
                  }>
                    {g.rank === 1 ? '🥇 #1' : `#${g.rank}`}
                  </div>
                  <div className={styles.guildHeader}>
                    <div className={styles.guildCrest}>{g.icon}</div>
                    <div>
                      <div className={styles.guildName}>{g.name}</div>
                      <div className={styles.guildMembers}>{g.members} members</div>
                    </div>
                  </div>
                  <div className={styles.guildXpRow}>
                    <span className={styles.guildXp}>{g.xp}</span>
                    <span className={styles.guildXpLabel}>XP</span>
                  </div>
                  <div className={styles.guildBarBg}>
                    <div className={styles.guildBarFill} style={{
                      width: `${(g.xp / 820) * 100}%`,
                      background: `linear-gradient(90deg, ${g.colour}88, ${g.colour})`,
                    }} />
                  </div>
                  <div style={{ fontSize: 11, marginTop: 6, color: g.delta > 0 ? '#5dbf8a' : '#e8a23a' }}>
                    {g.delta > 0 ? '▲' : '▼'} {g.delta > 0 ? '+' : ''}{g.delta} XP this week
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quest table */}
          <div>
            <div className={styles.sectionHeading} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              ⚔️ Active Quests
              <button className={styles.qaBtn} style={{ margin: 0, padding: '5px 12px' }}>➕ New quest</button>
            </div>
            <div className={styles.questTable}>
              <div className={styles.questTableHeader}>
                <div>Quest</div><div>Class progress</div><div>Due</div><div>Status</div><div>Actions</div>
              </div>
              {QUESTS.map(q => {
                const subj = SUBJECT_STYLES[q.subject] || SUBJECT_STYLES.Bible
                return (
                  <div key={q.name} className={styles.questRow}>
                    <div className={styles.questName}>
                      <span className={styles.subjTag} style={{ background: subj.bg, color: subj.color }}>{q.subject}</span>
                      {q.name}
                    </div>
                    <div className={styles.questProgress}>
                      <div className={styles.questBarBg}>
                        <div className={styles.questBarFill} style={{ width: `${(q.done / q.total) * 100}%` }} />
                      </div>
                      <span className={styles.questPct}>{q.done}/{q.total}</span>
                    </div>
                    <div className={styles.questDue} style={q.overdue ? { color: '#e86a6a' } : {}}>
                      {q.due}{q.overdue ? ' ⚠' : ''}
                    </div>
                    <div>
                      <span className={styles.statusBadge} style={
                        q.status === 'active' ? { background: '#0f2318', color: '#5dbf8a' } :
                        q.status === 'review' ? { background: '#2a1800', color: '#e8a23a' } :
                                                { background: '#1e1a30', color: '#6b6488' }
                      }>
                        {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                      </span>
                    </div>
                    <div className={styles.questActions}>
                      <button className={styles.actBtn}>View</button>
                      <button className={styles.actBtn}>{q.status === 'draft' ? 'Publish' : 'Edit'}</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Students */}
          <div>
            <div className={styles.sectionHeading} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              👥 Students
              <span style={{ fontSize: 11, color: '#6b6488', fontWeight: 400 }}>🟢 online &nbsp;🟡 today &nbsp;⚫ away</span>
            </div>
            <div className={styles.studentGrid}>
              {STUDENTS.map(s => (
                <div key={s.name} className={styles.studentCard}>
                  <div className={styles.studentAvatar}>{s.initials}</div>
                  <div className={styles.studentInfo}>
                    <div className={styles.studentName}>{s.name}</div>
                    <div className={styles.studentLevel}>Lv {s.level} · {s.title} · {s.guild}</div>
                  </div>
                  <div className={styles.actDot} style={{
                    background: s.online === 'online' ? '#5dbf8a' : s.online === 'today' ? '#e8a23a' : '#3a3455'
                  }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#4d465f', cursor: 'pointer' }}>
              View all 24 students →
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
