'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const CATEGORIES = ['All', 'Hypochondriac', 'Non-compliant', 'Frequent flyer', 'Googled it', 'Refused meds', 'Legend', 'Unhinged']
const BG = '#e8f4fb'
const INK = '#003d70'
const BLUE = '#005eb8'
const PAGE_SIZE = 20

const STAR_RATINGS: Record<string, number> = {
  'Non-compliant': 1, 'Hypochondriac': 1, 'Frequent flyer': 2, 'Googled it': 2, 'Refused meds': 1, 'Legend': 5, 'Unhinged': 1,
}

type Story = {
  id: number
  descriptor: string
  category: string
  tale: string
  venue: string
  ha_count: number
  created_at: string
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word }
    else line = test
  }
  if (line) lines.push(line)
  return lines
}

function drawCard(story: Story): string {
  const W = 1080
  const H = 1920
  const pad = 72
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  const logoX = pad
  const logoY = 100
  const logoW = W - pad * 2
  const logoH = 160
  roundRect(ctx, logoX, logoY, logoW, logoH, 16)
  ctx.fillStyle = BLUE
  ctx.fill()
  ctx.font = '500 28px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.letterSpacing = '5px'
  ctx.textAlign = 'left'
  ctx.fillText('A MEDICAL CONFESSIONAL', logoX + 36, logoY + 54)
  ctx.letterSpacing = '0px'
  ctx.font = '900 60px system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('THIS IS GONNA HURT', logoX + 36, logoY + 130)
  const cardX = pad
  const cardY = logoY + logoH + 60
  const cardW = W - pad * 2
  const cardH = H - cardY - 260
  ctx.fillStyle = '#f0f8ff'
  roundRect(ctx, cardX, cardY, cardW, cardH, 12)
  ctx.fill()
  ctx.strokeStyle = `rgba(0,94,184,0.12)`
  ctx.lineWidth = 2
  roundRect(ctx, cardX, cardY, cardW, cardH, 12)
  ctx.stroke()
  const cPad = 56
  let y = cardY + cPad
  ctx.font = '500 24px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(0,61,112,0.3)'
  ctx.letterSpacing = '3px'
  ctx.textAlign = 'left'
  ctx.fillText('SHIFTSTORIES.FYI/DOCTORS  ·  PATIENT REVIEW', cardX + cPad, y)
  ctx.letterSpacing = '0px'
  y += 44
  ctx.fillStyle = 'rgba(0,94,184,0.1)'
  ctx.fillRect(cardX + cPad, y, cardW - cPad * 2, 1.5)
  y += 40
  ctx.font = 'bold 38px system-ui, sans-serif'
  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  let displayName = story.descriptor.toUpperCase()
  while (ctx.measureText(displayName).width > cardW - cPad * 2 - 220 && displayName.length > 0) { displayName = displayName.slice(0, -1) }
  ctx.fillText(displayName, cardX + cPad, y)
  ctx.font = 'bold 22px system-ui, sans-serif'
  ctx.fillStyle = INK
  const badgeText = 'Verified Review'
  const badgeW = ctx.measureText(badgeText).width + 28
  const badgeX = cardX + cardW - cPad - badgeW
  const badgeY = y - 30
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.strokeRect(badgeX, badgeY, badgeW, 40)
  ctx.fillText(badgeText, badgeX + 14, y - 6)
  y += 52
  const stars = STAR_RATINGS[story.category] ?? 3
  const starS = 44
  const starG = 10
  for (let i = 0; i < 5; i++) {
    const sx = cardX + cPad + i * (starS + starG) + starS / 2
    const sy = y + starS / 2
    const filled = i < stars
    ctx.fillStyle = filled ? '#e8a020' : 'rgba(232,160,32,0.18)'
    ctx.strokeStyle = filled ? '#e8a020' : 'rgba(232,160,32,0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let p = 0; p < 5; p++) {
      const outerA = (p * 4 * Math.PI) / 5 - Math.PI / 2
      const innerA = outerA + (2 * Math.PI) / 10
      const ox = sx + (starS / 2) * Math.cos(outerA)
      const oy = sy + (starS / 2) * Math.sin(outerA)
      const ix = sx + (starS / 4) * Math.cos(innerA)
      const iy = sy + (starS / 4) * Math.sin(innerA)
      p === 0 ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy)
      ctx.lineTo(ix, iy)
    }
    ctx.closePath()
    if (filled) ctx.fill(); else ctx.stroke()
  }
  y += starS + 44
  ctx.fillStyle = 'rgba(0,94,184,0.08)'
  ctx.fillRect(cardX + cPad, y, cardW - cPad * 2, 1.5)
  y += 36
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(0,61,112,0.45)'
  ctx.letterSpacing = '3px'
  ctx.fillText(story.category.toUpperCase() + '  ·', cardX + cPad, y)
  ctx.letterSpacing = '0px'
  y += 48
  ctx.font = 'italic 40px Georgia, serif'
  ctx.fillStyle = INK
  const taleLines = wrapText(ctx, `"${story.tale}"`, cardW - cPad * 2)
  const lineH = 62
  const maxLines = Math.floor((cardY + cardH - y - cPad - 80) / lineH)
  const displayLines = taleLines.slice(0, maxLines)
  if (taleLines.length > maxLines) displayLines[maxLines - 1] = displayLines[maxLines - 1].replace(/"$/, '') + '\u2026"'
  for (const l of displayLines) { ctx.fillText(l, cardX + cPad, y); y += lineH }
  const cardFootY = cardY + cardH - 60
  ctx.fillStyle = 'rgba(0,94,184,0.08)'
  ctx.fillRect(cardX + cPad, cardFootY, cardW - cPad * 2, 1.5)
  ctx.font = '26px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(0,61,112,0.35)'
  ctx.textAlign = 'left'
  ctx.fillText(story.venue, cardX + cPad, cardFootY + 40)
  const footY = cardY + cardH + 50
  ctx.textAlign = 'center'
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(0,61,112,0.5)'
  ctx.letterSpacing = '1px'
  ctx.fillText('Share your own case', W / 2, footY + 36)
  ctx.letterSpacing = '0px'
  ctx.font = '500 30px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(0,61,112,0.35)'
  ctx.fillText('shiftstories.fyi/doctors', W / 2, footY + 78)
  return canvas.toDataURL('image/png')
}

function StarRating({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= count ? '#e8a020' : 'none'} stroke="#e8a020" strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  )
}

function StoryCardPreview({ story }: { story: Story }) {
  const stars = STAR_RATINGS[story.category] ?? 3
  return (
    <div style={{ width: '270px', height: '480px', background: BG, display: 'flex', flexDirection: 'column', padding: '18px 20px', boxSizing: 'border-box', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ background: BLUE, borderRadius: '5px', padding: '5px 10px', marginBottom: '12px', display: 'flex', flexDirection: 'column' as const }}>
        <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontFamily: 'system-ui', marginBottom: '2px' }}>A Medical Confessional</span>
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', fontFamily: 'system-ui', lineHeight: 1 }}>THIS IS GONNA HURT</span>
      </div>
      <div style={{ background: '#f0f8ff', border: `1px solid rgba(0,94,184,0.12)`, borderRadius: '6px', padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
        <div style={{ fontSize: '7px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,61,112,0.3)', marginBottom: '8px', fontFamily: 'system-ui' }}>shiftstories.fyi/doctors · Patient Review</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: INK, fontFamily: 'system-ui', textTransform: 'uppercase' as const, flex: 1, paddingRight: '6px', lineHeight: 1.2 }}>{story.descriptor.toUpperCase()}</span>
          <span style={{ fontSize: '7px', fontWeight: 700, border: `1px solid ${INK}`, padding: '1px 4px', color: INK, whiteSpace: 'nowrap', fontFamily: 'system-ui' }}>Verified Review</span>
        </div>
        <StarRating count={stars} />
        <div style={{ height: '1px', background: 'rgba(0,94,184,0.1)', margin: '8px 0' }} />
        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(0,61,112,0.45)', marginBottom: '6px', fontFamily: 'system-ui' }}>{story.category} ·</div>
        <div style={{ fontSize: '10px', lineHeight: 1.6, color: INK, fontStyle: 'italic', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' as const }}>"{story.tale}"</div>
        <div style={{ borderTop: '1px solid rgba(0,94,184,0.08)', paddingTop: '6px', marginTop: '6px', fontSize: '8px', color: 'rgba(0,61,112,0.35)', fontFamily: 'system-ui' }}>{story.venue}</div>
      </div>
      <div style={{ textAlign: 'center' as const, paddingTop: '10px' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(0,61,112,0.45)', fontFamily: 'system-ui' }}>Share your own case</div>
        <div style={{ fontSize: '8px', color: 'rgba(0,61,112,0.3)', fontFamily: 'system-ui' }}>shiftstories.fyi/doctors</div>
      </div>
    </div>
  )
}

export default function DoctorsPage() {
  const [allStories, setAllStories] = useState<Story[]>([])
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<'new' | 'top'>('new')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [sameCounts, setSameCounts] = useState<Record<number, number>>({})
  const [samed, setSamed] = useState<Record<number, boolean>>({})
  const [cardStory, setCardStory] = useState<Story | null>(null)
  const [form, setForm] = useState({ descriptor: '', category: 'Hypochondriac', tale: '', venue: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetchStories(0)
    supabase.from('doctor_stories').select('*', { count: 'exact', head: true }).then(({ count: c }) => setCount(c))
    const stored = localStorage.getItem('samed_doctor_stories')
    if (stored) setSamed(JSON.parse(stored))
  }, [])

  async function fetchStories(pageIndex: number) {
    if (pageIndex === 0) setLoading(true)
    else setLoadingMore(true)
    const from = pageIndex * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data } = await supabase.from('doctor_stories').select('*').order('created_at', { ascending: false }).range(from, to)
    const fetched = data || []
    if (pageIndex === 0) setAllStories(fetched)
    else setAllStories(prev => [...prev, ...fetched])
    const counts: Record<number, number> = {}
    fetched.forEach((s: Story) => { counts[s.id] = s.ha_count || 0 })
    setSameCounts(prev => ({ ...prev, ...counts }))
    setHasMore(fetched.length === PAGE_SIZE)
    setPage(pageIndex)
    if (pageIndex === 0) setLoading(false)
    else setLoadingMore(false)
  }

  async function loadMore() { await fetchStories(page + 1) }

  async function handleSame(e: React.MouseEvent, story: Story) {
    e.preventDefault()
    if (samed[story.id]) return
    const newCount = (sameCounts[story.id] || 0) + 1
    setSameCounts(prev => ({ ...prev, [story.id]: newCount }))
    const newSamed = { ...samed, [story.id]: true }
    setSamed(newSamed)
    localStorage.setItem('samed_doctor_stories', JSON.stringify(newSamed))
    const { error } = await supabase.from('doctor_stories').update({ ha_count: newCount }).eq('id', story.id)
    if (error) {
      setSameCounts(prev => ({ ...prev, [story.id]: newCount - 1 }))
      const rolled = { ...newSamed }
      delete rolled[story.id]
      setSamed(rolled)
      localStorage.setItem('samed_doctor_stories', JSON.stringify(rolled))
    }
  }

  function handleDownloadCard(story: Story) {
    const dataUrl = drawCard(story)
    const link = document.createElement('a')
    link.download = `thisgonnahurt-${story.id}.png`
    link.href = dataUrl
    link.click()
  }

  function getSorted(stories: Story[]) {
    if (sort === 'top') return [...stories].sort((a, b) => (sameCounts[b.id] || 0) - (sameCounts[a.id] || 0))
    return stories
  }

  const filtered = category === 'All' ? allStories : allStories.filter(s => s.category === category)
  const stories = getSorted(filtered)

  async function handleSubmit() {
    if (!form.tale || !form.descriptor || !form.venue) return
    setSubmitting(true)
    await supabase.from('doctor_stories').insert([form])
    setSubmitting(false)
    setSubmitted(true)
    setForm({ descriptor: '', category: 'Hypochondriac', tale: '', venue: '' })
    setTimeout(async () => { setSubmitted(false); setShowForm(false); await fetchStories(0) }, 2000)
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const inp = { border: `1.5px solid ${BLUE}30`, borderRadius: '4px', padding: '10px 14px', fontSize: '14px', color: INK, background: BG, width: '100%', outline: 'none', fontFamily: 'inherit' }

  const Logo = () => (
    <div style={{ background: BLUE, borderRadius: '8px', padding: '8px 14px', display: 'inline-flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.16em', textTransform: 'uppercase' as const, fontWeight: 500, display: 'block', marginBottom: '3px' }}>A Medical Confessional</span>
      <span style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', lineHeight: 1 }}>THIS IS GONNA HURT</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1.5px solid ${BLUE}20`, background: BG, position: 'sticky', top: 0, zIndex: 10 }}>
          <Logo />
          <button onClick={() => setShowForm(true)} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: '4px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em', fontFamily: 'inherit' }}>+ Share a case</button>
        </div>

        <div style={{ padding: '20px 20px 16px', borderBottom: `1.5px solid ${BLUE}20` }}>
          <p style={{ fontSize: '20px', fontWeight: 900, color: INK, lineHeight: 1.2, letterSpacing: '-0.4px' }}>What happened in your last shift?</p>
          {count !== null && <p style={{ fontSize: '11px', color: `${BLUE}88`, marginTop: '6px', letterSpacing: '0.04em' }}>{count.toLocaleString()} cases filed</p>}
        </div>

        <div style={{ padding: '12px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap' as const, borderBottom: `1.5px solid ${BLUE}20` }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: '5px 12px', borderRadius: '3px', fontSize: '11px', fontWeight: 600, border: `1.5px solid ${category === c ? BLUE : BLUE + '30'}`, background: category === c ? BLUE : 'transparent', color: category === c ? '#fff' : BLUE, cursor: 'pointer', letterSpacing: '0.03em', fontFamily: 'inherit' }}>{c}</button>
          ))}
        </div>

        <div style={{ padding: '8px 20px 0', display: 'flex', gap: '16px', alignItems: 'center', borderBottom: `1.5px solid ${BLUE}20` }}>
          {(['new', 'top'] as const).map(tab => (
            <button key={tab} onClick={() => setSort(tab)} style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: sort === tab ? INK : `${BLUE}55`, paddingBottom: '8px', borderBottom: sort === tab ? `2px solid ${INK}` : '2px solid transparent', border: 'none', borderRadius: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>{tab}</button>
          ))}
          <a href="/" style={{ fontSize: '11px', fontWeight: 700, color: '#7ec8e3', letterSpacing: '0.06em', textDecoration: 'none', textTransform: 'uppercase' as const, marginLeft: 'auto', paddingBottom: '8px' }}>← Hospitality</a>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px', background: `${BLUE}20` }}>
          {loading && <div style={{ background: BG, padding: '40px 20px', textAlign: 'center' as const, fontSize: '13px', color: `${BLUE}66` }}>Loading...</div>}
          {!loading && stories.length === 0 && <div style={{ background: BG, padding: '40px 20px', textAlign: 'center' as const, fontSize: '13px', color: `${BLUE}66` }}>No cases yet — be the first to confess.</div>}
          {stories.map(story => (
            <div key={story.id} style={{ background: BG }}>
              <a href={`/doctors/${story.id}`} style={{ display: 'block', padding: '14px 20px', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontStyle: 'italic', color: `${BLUE}88` }}>{story.descriptor}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: '2px', border: `1.5px solid ${BLUE}30`, color: BLUE, whiteSpace: 'nowrap' as const, marginLeft: '8px' }}>{story.category}</span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.55, color: INK, marginBottom: '10px' }}>{story.tale}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: `${BLUE}55`, letterSpacing: '0.04em' }}>{story.venue} · {timeAgo(story.created_at)}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={(e) => handleSame(e, story)} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '3px', border: `1.5px solid ${BLUE}30`, background: samed[story.id] ? BLUE : 'transparent', color: samed[story.id] ? '#fff' : BLUE, cursor: 'pointer', fontFamily: 'inherit' }}>
                      👊 same{sameCounts[story.id] > 0 ? ` ${sameCounts[story.id]}` : ''}
                    </button>
                    <button onClick={(e) => { e.preventDefault(); setCardStory(story) }} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '3px', border: `1.5px solid ${BLUE}30`, background: 'transparent', color: BLUE, cursor: 'pointer', fontFamily: 'inherit' }}>📸</button>
                    <button onClick={async (e) => { e.preventDefault(); const url = `${window.location.origin}/doctors/${story.id}`; if (navigator.share) await navigator.share({ title: 'This Is Gonna Hurt', url }); else navigator.clipboard.writeText(url) }} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '3px', border: `1.5px solid ${BLUE}30`, background: 'transparent', color: BLUE, cursor: 'pointer', fontFamily: 'inherit' }}>Share</button>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>

        {!loading && hasMore && (
          <div style={{ padding: '20px', textAlign: 'center' as const, borderTop: `1.5px solid ${BLUE}20` }}>
            <button onClick={loadMore} disabled={loadingMore} style={{ background: 'transparent', color: BLUE, border: `1.5px solid ${BLUE}40`, borderRadius: '4px', padding: '10px 28px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em', fontFamily: 'inherit', opacity: loadingMore ? 0.5 : 1 }}>
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}

        {cardStory && (
          <div onClick={() => setCardStory(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,61,112,0.82)', zIndex: 30, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '20px' }}>
            <div onClick={e => e.stopPropagation()}>
              <StoryCardPreview story={cardStory} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={(e) => { e.stopPropagation(); handleDownloadCard(cardStory) }} style={{ background: '#fff', color: BLUE, border: 'none', borderRadius: '4px', padding: '11px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ⬇ Download for Instagram
              </button>
              <button onClick={() => setCardStory(null)} style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '4px', padding: '11px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'system-ui, sans-serif' }}>1080×1920px · ready for Stories</p>
          </div>
        )}

        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,61,112,0.5)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: BG, width: '100%', maxWidth: '520px', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column' as const, gap: '16px', boxShadow: '0 8px 40px rgba(0,61,112,0.2)', maxHeight: '90vh', overflowY: 'auto' as const }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: INK, letterSpacing: '-0.3px' }}>Confess your case</span>
                <button onClick={() => setShowForm(false)} style={{ fontSize: '12px', color: `${BLUE}66`, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>cancel</button>
              </div>
              {submitted ? (
                <p style={{ textAlign: 'center' as const, fontSize: '14px', color: INK, padding: '16px 0', fontWeight: 600 }}>Case filed. The ward thanks you.</p>
              ) : (
                <>
                  {[{ label: 'Describe them (no names)', field: 'descriptor', placeholder: 'e.g. man, 40s, WebMD open on phone' }, { label: 'Your ward / dept (hospital or city is fine)', field: 'venue', placeholder: 'e.g. A&E, Manchester' }].map(({ label, field, placeholder }) => (
                    <div key={field} style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: `${BLUE}88` }}>{label}</label>
                      <input value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} placeholder={placeholder} style={inp} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: `${BLUE}88` }}>Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: `${BLUE}88` }}>The case</label>
                    <textarea value={form.tale} onChange={e => setForm({ ...form, tale: e.target.value })} placeholder="What happened..." rows={4} style={{ ...inp, resize: 'none' as const }} />
                  </div>
                  <button onClick={handleSubmit} disabled={submitting} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: '4px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.5 : 1 }}>
                    {submitting ? 'Filing...' : 'File your case'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center' as const, padding: '20px', borderTop: `1.5px solid ${BLUE}20` }}>
          <p style={{ fontSize: '11px', color: `${BLUE}55` }}>questions? <a href="mailto:shiftstoriesfyi@gmail.com" style={{ color: BLUE }}>shiftstoriesfyi@gmail.com</a></p>
        </div>

      </div>
    </div>
  )
                  }
