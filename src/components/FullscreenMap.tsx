// src/components/FullscreenMap.tsx
// Hex map with a "Full Map View" button that opens the browser's native
// fullscreen (document.documentElement.requestFullscreen), so the overlay
// covers every pixel — no container clipping.
//
// Drop-in usage:
//   import FullscreenMap from '../components/FullscreenMap'
//   <FullscreenMap />

import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './FullscreenMap.module.css'

// ── Tile data ────────────────────────────────────────────────
type TileType = 'temple' | 'village' | 'river' | 'palace' | 'miracle' | 'desert' | 'battle' | 'locked'

interface TileDef {
  color: string
  border: string
  icon: string
  label: string
}

const TILE_DEFS: Record<TileType, TileDef> = {
  temple:  { color: '#221030', border: '#8040b4', icon: '⛩',  label: 'Temple'  },
  village: { color: '#2d1e5a', border: '#5a4aaa', icon: '🏘',  label: 'Village' },
  river:   { color: '#0c2030', border: '#247090', icon: '🌊',  label: 'River'   },
  palace:  { color: '#221208', border: '#b06020', icon: '🏯',  label: 'Palace'  },
  miracle: { color: '#140c34', border: '#b0a060', icon: '✨',  label: 'Miracle' },
  desert:  { color: '#241508', border: '#6a4a18', icon: '🏜',  label: 'Desert'  },
  battle:  { color: '#240808', border: '#b43030', icon: '⚔️',  label: 'Battle'  },
  locked:  { color: '#0c0a14', border: '#181428', icon: '🔒',  label: 'Locked'  },
}

interface Tile {
  type: TileType
  unlocked: boolean
  name: string
  xp: number
}

// Replace this array with a Supabase fetch later (see README)
const TILES: Tile[] = [
  { type:'temple',  unlocked:true,  name:'Goshen Settlement',  xp:80  },
  { type:'village', unlocked:true,  name:'Slave Quarters',     xp:60  },
  { type:'river',   unlocked:true,  name:'Nile Delta',         xp:90  },
  { type:'palace',  unlocked:true,  name:"Pharaoh's Court",    xp:120 },
  { type:'miracle', unlocked:true,  name:'Burning Bush',       xp:150 },
  { type:'desert',  unlocked:true,  name:'Sinai Foothills',    xp:70  },
  { type:'locked',  unlocked:false, name:'Red Sea Shore',      xp:0   },
  { type:'locked',  unlocked:false, name:'Sinai Pass',         xp:0   },
  { type:'locked',  unlocked:false, name:'Wilderness',         xp:0   },
  { type:'locked',  unlocked:false, name:'Manna Field',        xp:0   },
  { type:'locked',  unlocked:false, name:'Mt Sinai',           xp:0   },
  { type:'locked',  unlocked:false, name:'Jordan Valley',      xp:0   },
  { type:'locked',  unlocked:false, name:'Jericho Outpost',    xp:0   },
  { type:'village', unlocked:true,  name:'Hebrew Camp',        xp:55  },
  { type:'desert',  unlocked:true,  name:'Brick Works',        xp:65  },
  { type:'river',   unlocked:true,  name:'Nile River',         xp:100 },
  { type:'battle',  unlocked:true,  name:'Plague of Frogs',    xp:110 },
  { type:'temple',  unlocked:true,  name:'Altar of Moses',     xp:130 },
  { type:'village', unlocked:true,  name:"Shepherd's Field",   xp:75  },
  { type:'desert',  unlocked:true,  name:'Desert Trail',       xp:60  },
  { type:'locked',  unlocked:false, name:'Sea Crossing',       xp:0   },
  { type:'locked',  unlocked:false, name:'Bitter Waters',      xp:0   },
  { type:'locked',  unlocked:false, name:'Quail Camp',         xp:0   },
  { type:'locked',  unlocked:false, name:'Rock of Horeb',      xp:0   },
  { type:'locked',  unlocked:false, name:'Golden Calf',        xp:0   },
  { type:'locked',  unlocked:false, name:'Covenant Ridge',     xp:0   },
  { type:'palace',  unlocked:true,  name:'Rameses City',       xp:140 },
  { type:'battle',  unlocked:true,  name:'Plague of Locusts',  xp:125 },
  { type:'miracle', unlocked:true,  name:'Blood of the Nile',  xp:160 },
  { type:'temple',  unlocked:true,  name:'House of Levi',      xp:85  },
  { type:'village', unlocked:true,  name:'Goshen Gate',        xp:70  },
  { type:'river',   unlocked:true,  name:'Papyrus Marsh',      xp:80  },
  { type:'desert',  unlocked:true,  name:'Eastern Road',       xp:55  },
  { type:'locked',  unlocked:false, name:'Sea of Reeds',       xp:0   },
  { type:'locked',  unlocked:false, name:'Elim Oasis',         xp:0   },
  { type:'locked',  unlocked:false, name:'Dophkah',            xp:0   },
  { type:'locked',  unlocked:false, name:'Hazeroth',           xp:0   },
  { type:'locked',  unlocked:false, name:'Rithmah',            xp:0   },
  { type:'locked',  unlocked:false, name:'Kadesh Barnea',      xp:0   },
  { type:'desert',  unlocked:true,  name:'Dry Dunes',          xp:45  },
  { type:'village', unlocked:true,  name:'Midian Camp',        xp:60  },
  { type:'desert',  unlocked:true,  name:'Trade Route',        xp:65  },
  { type:'palace',  unlocked:true,  name:'Treasury Hall',      xp:130 },
  { type:'battle',  unlocked:true,  name:'Final Plague',       xp:145 },
  { type:'miracle', unlocked:true,  name:'Passover Night',     xp:170 },
  { type:'village', unlocked:true,  name:'Freedom Camp',       xp:100 },
  { type:'locked',  unlocked:false, name:'Marah Spring',       xp:0   },
  { type:'locked',  unlocked:false, name:'Sin Desert',         xp:0   },
  { type:'locked',  unlocked:false, name:'Rephidim',           xp:0   },
  { type:'locked',  unlocked:false, name:'Mt Sinai Base',      xp:0   },
  { type:'locked',  unlocked:false, name:'Tabernacle Site',    xp:0   },
  { type:'locked',  unlocked:false, name:'Promised Land',      xp:0   },
  { type:'locked',  unlocked:false, name:'Southern Waste',     xp:0   },
  { type:'river',   unlocked:true,  name:'Nile Crossing',      xp:75  },
  { type:'temple',  unlocked:true,  name:'Osiris Shrine',      xp:85  },
  { type:'village', unlocked:true,  name:'Hebrew Village',     xp:65  },
  { type:'desert',  unlocked:true,  name:'Sand Dunes',         xp:50  },
  { type:'village', unlocked:true,  name:'Exodus Gate',        xp:160 },
  { type:'locked',  unlocked:false, name:'Reed Coast',         xp:0   },
  { type:'locked',  unlocked:false, name:'Island Camp',        xp:0   },
  { type:'locked',  unlocked:false, name:'Etham',              xp:0   },
  { type:'locked',  unlocked:false, name:'Pi-hahiroth',        xp:0   },
  { type:'locked',  unlocked:false, name:'Baal-Zephon',        xp:0   },
  { type:'locked',  unlocked:false, name:'Migdol Watch',       xp:0   },
  { type:'locked',  unlocked:false, name:'Canaan Border',      xp:0   },
]

// Mock completion data — replace with Supabase query later
const COMPLETION = TILES.map(t => t.unlocked ? Math.floor(Math.random() * 10 + 14) : 0)

const COLS = 13
const SCROLL_SPEED = 6
const ZOOM_LEVELS = [1, 2, 3, 4, 5]

// ── Geometry ─────────────────────────────────────────────────
function hexSize(z: number) { return 28 * z }

function tileXY(col: number, row: number, z: number) {
  const sz = hexSize(z)
  const w = sz * Math.sqrt(3)
  const pad = 60 * z
  return {
    x: pad + col * w + (row % 2 === 1 ? w / 2 : 0),
    y: pad + row * sz * 2 * 0.75,
  }
}

function canvasDims(z: number) {
  const sz = hexSize(z)
  const w = sz * Math.sqrt(3)
  const pad = 60 * z
  return {
    w: Math.ceil(pad * 2 + (COLS - 1) * w + w),
    h: Math.ceil(pad * 2 + (Math.ceil(TILES.length / COLS) - 1) * sz * 2 * 0.75 + sz * 2),
  }
}

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    ctx.lineTo(cx + sz * Math.cos(a), cy + sz * Math.sin(a))
  }
  ctx.closePath()
}

// ── Drawing ───────────────────────────────────────────────────
function drawMap(
  canvas: HTMLCanvasElement,
  z: number,
  hovIdx: number | null,
) {
  const ctx = canvas.getContext('2d')!
  const { w, h } = canvasDims(z)
  canvas.width = w
  canvas.height = h

  ctx.fillStyle = '#060412'
  ctx.fillRect(0, 0, w, h)

  // dot grid
  ctx.fillStyle = 'rgba(60,50,100,0.1)'
  const step = 20 * z
  for (let ix = 0; ix < w; ix += step)
    for (let iy = 0; iy < h; iy += step) {
      ctx.beginPath(); ctx.arc(ix, iy, Math.max(0.5, z * 0.5), 0, Math.PI * 2); ctx.fill()
    }

  const sz = hexSize(z)

  TILES.forEach((tile, idx) => {
    const col = idx % COLS, row = Math.floor(idx / COLS)
    const { x, y } = tileXY(col, row, z)
    const def = TILE_DEFS[tile.unlocked ? tile.type : 'locked']
    const isH = idx === hovIdx
    const s = isH ? sz + z * 1.5 : sz

    hexPath(ctx, x, y, s - 1)
    ctx.fillStyle = def.color; ctx.fill()

    if (tile.unlocked && COMPLETION[idx] > 0) {
      hexPath(ctx, x, y, s - 3)
      ctx.fillStyle = `rgba(93,191,138,${(COMPLETION[idx] / 24) * 0.2})`
      ctx.fill()
    }

    hexPath(ctx, x, y, s - 1)
    ctx.strokeStyle = isH ? '#c9b87a' : (tile.unlocked ? def.border : def.border + '50')
    ctx.lineWidth = isH ? Math.max(1.5, z * 0.8) : Math.max(0.4, z * 0.4)
    ctx.stroke()

    if (tile.unlocked && tile.type === 'miracle') {
      hexPath(ctx, x, y, s - sz * 0.15)
      ctx.strokeStyle = '#c9b87a30'
      ctx.lineWidth = z * 1.5
      ctx.stroke()
    }

    const iconSz = Math.max(10, sz * 0.55)
    ctx.font = `${iconSz}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(tile.unlocked ? def.icon : '🔒', x, z >= 1.5 ? y - sz * 0.14 : y)

    if (z >= 1.5) {
      const fSz = Math.max(7, sz * 0.22)
      ctx.font = `500 ${fSz}px system-ui, sans-serif`
      ctx.fillStyle = tile.unlocked ? 'rgba(196,184,232,0.75)' : 'rgba(50,48,70,0.8)'
      ctx.fillText(
        tile.name.length > 13 ? tile.name.slice(0, 12) + '…' : tile.name,
        x, y + sz * 0.35
      )
    }

    if (isH && tile.unlocked && tile.xp > 0 && z >= 2) {
      const fSz = Math.max(8, sz * 0.2)
      ctx.font = `500 ${fSz}px system-ui`
      ctx.fillStyle = '#c9b87a'
      ctx.fillText(`+${tile.xp} XP`, x, y + sz * 0.56)
    }
  })
}

function drawMinimap(
  canvas: HTMLCanvasElement,
  scrollX: number,
  scrollY: number,
  vpW: number,
  vpH: number,
  fullW: number,
  fullH: number,
) {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0a0817'; ctx.fillRect(0, 0, W, H)

  const mSZ = 7, mW = mSZ * Math.sqrt(3), mH = mSZ * 2, mPX = 8, mPY = 7

  TILES.forEach((tile, idx) => {
    const col = idx % COLS, row = Math.floor(idx / COLS)
    const x = mPX + col * mW + (row % 2 === 1 ? mW / 2 : 0)
    const y = mPY + row * mH * 0.75
    const def = TILE_DEFS[tile.unlocked ? tile.type : 'locked']
    hexPath(ctx, x, y, mSZ - 0.5)
    ctx.fillStyle = def.color; ctx.fill()
    hexPath(ctx, x, y, mSZ - 0.5)
    ctx.strokeStyle = def.border + (tile.unlocked ? 'cc' : '30')
    ctx.lineWidth = 0.5; ctx.stroke()
  })

  const rx = (scrollX / fullW) * W
  const ry = (scrollY / fullH) * H
  const rw = Math.min(W, (vpW / fullW) * W)
  const rh = Math.min(H, (vpH / fullH) * H)
  ctx.strokeStyle = 'rgba(201,184,122,0.85)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(rx, ry, rw, rh)
  ctx.fillStyle = 'rgba(201,184,122,0.08)'
  ctx.fillRect(rx, ry, rw, rh)
}

function drawMini(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#040210'; ctx.fillRect(0, 0, W, H)
  const mSZ = 18, mW = mSZ * Math.sqrt(3), mH = mSZ * 2, mPX = 28, mPY = 24
  TILES.forEach((tile, idx) => {
    const col = idx % COLS, row = Math.floor(idx / COLS)
    const x = mPX + col * mW + (row % 2 === 1 ? mW / 2 : 0)
    const y = mPY + row * mH * 0.75
    const def = TILE_DEFS[tile.unlocked ? tile.type : 'locked']
    hexPath(ctx, x, y, mSZ - 1)
    ctx.fillStyle = def.color; ctx.fill()
    if (tile.unlocked && COMPLETION[idx] > 0) {
      hexPath(ctx, x, y, mSZ - 3)
      ctx.fillStyle = `rgba(93,191,138,${(COMPLETION[idx]/24)*0.18})`; ctx.fill()
    }
    hexPath(ctx, x, y, mSZ - 1)
    ctx.strokeStyle = def.border + (tile.unlocked ? 'cc' : '40')
    ctx.lineWidth = 0.6; ctx.stroke()
    ctx.font = `${Math.floor(mSZ * 0.5)}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(tile.unlocked ? def.icon : '🔒', x, y)
  })
}

// ── Component ─────────────────────────────────────────────────
export default function FullscreenMap() {
  const miniRef     = useRef<HTMLCanvasElement>(null)
  const fullRef     = useRef<HTMLCanvasElement>(null)
  const minimapRef  = useRef<HTMLCanvasElement>(null)
  const vpRef       = useRef<HTMLDivElement>(null)
  const overlayRef  = useRef<HTMLDivElement>(null)

  const [isOpen, setIsOpen]   = useState(false)
  const [zoom, setZoomState]  = useState(2)
  const [hovIdx, setHovIdx]   = useState<number | null>(null)

  const scrollX = useRef(0)
  const scrollY = useRef(0)
  const scrollDX = useRef(0)
  const scrollDY = useRef(0)
  const rafRef  = useRef<number | null>(null)
  const hovRef  = useRef<number | null>(null)
  const zoomRef = useRef(2)

  // ── Mini canvas init ────────────────────────────────────────
  useEffect(() => {
    if (miniRef.current) drawMini(miniRef.current)
  }, [])

  // ── Apply scroll position ───────────────────────────────────
  const applyScroll = useCallback(() => {
    const fc = fullRef.current
    const vp = vpRef.current
    const mm = minimapRef.current
    if (!fc || !vp) return

    const maxX = Math.max(0, fc.width  - vp.clientWidth)
    const maxY = Math.max(0, fc.height - vp.clientHeight)
    scrollX.current = Math.max(0, Math.min(scrollX.current, maxX))
    scrollY.current = Math.max(0, Math.min(scrollY.current, maxY))
    fc.style.transform = `translate(${-scrollX.current}px, ${-scrollY.current}px)`

    if (mm) drawMinimap(mm, scrollX.current, scrollY.current, vp.clientWidth, vp.clientHeight, fc.width, fc.height)
  }, [])

  // ── Scroll loop ─────────────────────────────────────────────
  const scrollLoop = useCallback(() => {
    if (scrollDX.current === 0 && scrollDY.current === 0) {
      rafRef.current = null; return
    }
    scrollX.current += scrollDX.current
    scrollY.current += scrollDY.current
    applyScroll()
    rafRef.current = requestAnimationFrame(scrollLoop)
  }, [applyScroll])

  const startScroll = useCallback((dx: number, dy: number) => {
    scrollDX.current = dx * SCROLL_SPEED
    scrollDY.current = dy * SCROLL_SPEED
    if (!rafRef.current) rafRef.current = requestAnimationFrame(scrollLoop)
  }, [scrollLoop])

  const stopScroll = useCallback(() => {
    scrollDX.current = 0; scrollDY.current = 0
  }, [])

  // ── Zoom ────────────────────────────────────────────────────
  const applyZoom = useCallback((z: number) => {
    const fc = fullRef.current
    const vp = vpRef.current
    const mm = minimapRef.current
    if (!fc || !vp) return

    // Anchor zoom to viewport centre
    const centerFracX = (scrollX.current + vp.clientWidth  / 2) / (fc.width  || 1)
    const centerFracY = (scrollY.current + vp.clientHeight / 2) / (fc.height || 1)

    zoomRef.current = z
    drawMap(fc, z, hovRef.current)

    scrollX.current = Math.max(0, centerFracX * fc.width  - vp.clientWidth  / 2)
    scrollY.current = Math.max(0, centerFracY * fc.height - vp.clientHeight / 2)
    applyScroll()
    if (mm) drawMinimap(mm, scrollX.current, scrollY.current, vp.clientWidth, vp.clientHeight, fc.width, fc.height)
  }, [applyScroll])

  const handleZoom = useCallback((z: number) => {
    setZoomState(z)
    applyZoom(z)
  }, [applyZoom])

  // ── Open / close ────────────────────────────────────────────
  const openMap = useCallback(() => {
    setIsOpen(true)
    // Request native fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  const closeMap = useCallback(() => {
    setIsOpen(false)
    stopScroll()
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [stopScroll])

  // Draw map after overlay becomes visible
  useEffect(() => {
    if (!isOpen) return
    const fc = fullRef.current
    const vp = vpRef.current
    const mm = minimapRef.current
    if (!fc || !vp) return

    drawMap(fc, zoomRef.current, null)

    // Centre the map in the viewport
    scrollX.current = Math.max(0, (fc.width  - vp.clientWidth)  / 2)
    scrollY.current = Math.max(0, (fc.height - vp.clientHeight) / 2)
    applyScroll()
    if (mm) drawMinimap(mm, scrollX.current, scrollY.current, vp.clientWidth, vp.clientHeight, fc.width, fc.height)
  }, [isOpen, applyScroll])

  // Sync if user presses Escape (browser exits fullscreen)
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsOpen(false)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── Keyboard ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') { closeMap(); return }
      if (e.key === '=' || e.key === '+') handleZoom(Math.min(5, zoomRef.current + 1))
      if (e.key === '-') handleZoom(Math.max(1, zoomRef.current - 1))
      const delta = 50
      if (e.key === 'ArrowUp')    { scrollY.current -= delta; applyScroll() }
      if (e.key === 'ArrowDown')  { scrollY.current += delta; applyScroll() }
      if (e.key === 'ArrowLeft')  { scrollX.current -= delta; applyScroll() }
      if (e.key === 'ArrowRight') { scrollX.current += delta; applyScroll() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeMap, handleZoom, applyScroll])

  // ── Mouse move on full canvas ────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const vp = vpRef.current
    const fc = fullRef.current
    if (!vp || !fc) return
    const rect = vp.getBoundingClientRect()
    const canvasX = (e.clientX - rect.left)  + scrollX.current
    const canvasY = (e.clientY - rect.top)   + scrollY.current
    const sz = hexSize(zoomRef.current)

    let best: number | null = null, bd = Infinity
    TILES.forEach((_, idx) => {
      const col = idx % COLS, row = Math.floor(idx / COLS)
      const { x, y } = tileXY(col, row, zoomRef.current)
      const d = Math.hypot(canvasX - x, canvasY - y)
      if (d < sz && d < bd) { bd = d; best = idx }
    })

    if (best !== hovRef.current) {
      hovRef.current = best
      setHovIdx(best)
      drawMap(fc, zoomRef.current, best)
      const mm = minimapRef.current
      const vpe = vpRef.current
      if (mm && vpe) drawMinimap(mm, scrollX.current, scrollY.current, vpe.clientWidth, vpe.clientHeight, fc.width, fc.height)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    hovRef.current = null
    setHovIdx(null)
    const fc = fullRef.current
    if (fc) drawMap(fc, zoomRef.current, null)
  }, [])

  // ── Tooltip content ──────────────────────────────────────────
  const hovTile = hovIdx !== null ? TILES[hovIdx] : null

  return (
    <>
      {/* ── Dashboard mini card ── */}
      <div className={styles.dashCard}>
        <div className={styles.dashHeader}>
          <span className={styles.dashTitle}>Campaign Map — Egypt</span>
          <button className={styles.expandBtn} onClick={openMap}>
            ⛶ Full Map View
          </button>
        </div>
        <canvas
          ref={miniRef}
          width={640}
          height={200}
          className={styles.miniCanvas}
          onClick={openMap}
        />
      </div>

      {/* ── Fullscreen overlay ── */}
      {isOpen && (
        <div ref={overlayRef} className={styles.overlay}>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <span className={styles.toolbarTitle}>Kingdom Map</span>
            <span className={styles.toolbarSub}>Egypt · Exodus Campaign · 24/32 tiles unlocked</span>

            <div className={styles.zoomGroup}>
              <span className={styles.zoomLabel}>Zoom:</span>
              {ZOOM_LEVELS.map(z => (
                <button
                  key={z}
                  className={`${styles.zoomBtn} ${zoom === z ? styles.zoomActive : ''}`}
                  onClick={() => handleZoom(z)}
                >{z}×</button>
              ))}
              <div className={styles.zoomDivider} />
              <button className={styles.zoomBtn} onClick={() => handleZoom(Math.min(5, zoom + 1))}>＋</button>
              <button className={styles.zoomBtn} onClick={() => handleZoom(Math.max(1, zoom - 1))}>－</button>
            </div>

            <button className={styles.closeBtn} onClick={closeMap}>✕ Exit Map</button>
          </div>

          {/* Viewport */}
          <div
            ref={vpRef}
            className={styles.viewport}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <canvas ref={fullRef} className={styles.fullCanvas} />

            {/* Edge scroll zones */}
            <div className={styles.edgeTop}    onMouseEnter={() => startScroll(0, -1)}  onMouseLeave={stopScroll} />
            <div className={styles.edgeBottom} onMouseEnter={() => startScroll(0, 1)}   onMouseLeave={stopScroll} />
            <div className={styles.edgeLeft}   onMouseEnter={() => startScroll(-1, 0)}  onMouseLeave={stopScroll} />
            <div className={styles.edgeRight}  onMouseEnter={() => startScroll(1, 0)}   onMouseLeave={stopScroll} />

            {/* Scroll arrows */}
            <div className={`${styles.scrollHint} ${styles.shTop}`}    style={{ opacity: scrollDY.current < 0 ? 0.9 : 0.25 }}>▲</div>
            <div className={`${styles.scrollHint} ${styles.shBottom}`} style={{ opacity: scrollDY.current > 0 ? 0.9 : 0.25 }}>▼</div>
            <div className={`${styles.scrollHint} ${styles.shLeft}`}   style={{ opacity: scrollDX.current < 0 ? 0.9 : 0.25 }}>◀</div>
            <div className={`${styles.scrollHint} ${styles.shRight}`}  style={{ opacity: scrollDX.current > 0 ? 0.9 : 0.25 }}>▶</div>

            {/* Tooltip */}
            {hovTile && (
              <div className={styles.tooltip} style={{ opacity: hovIdx !== null ? 1 : 0 }}>
                <div className={styles.ttType}>{TILE_DEFS[hovTile.unlocked ? hovTile.type : 'locked'].label}</div>
                <div className={styles.ttName}>{hovTile.unlocked ? hovTile.name : 'Unknown Territory'}</div>
                {hovTile.unlocked
                  ? <div className={styles.ttXp}>✦ {hovTile.xp} XP · {COMPLETION[hovIdx!]}/24 students</div>
                  : <div className={styles.ttLock}>🔒 Complete prior tiles to unlock</div>
                }
              </div>
            )}

            {/* Minimap */}
            <div className={styles.minimap}>
              <canvas ref={minimapRef} width={130} height={60} className={styles.minimapCanvas} />
              <div className={styles.minimapLabel}>Overview</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
