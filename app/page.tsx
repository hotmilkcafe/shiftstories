'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const CATEGORIES = ['All', 'Unhinged', 'Food crime', 'Wholesome', 'Legend', 'Language barrier', 'Twat']

const BG = '#f0ede6'
const INK = '#1a1a1a'

type Story = {
  id: number
  descriptor: string
  category: string
  tale: string
  venue: string
  ha_count: number
  created_at: string
}

export default function Home() {
  const [allStories, setAllStories] = useState<Story[]>([])
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<'new' | 'top'>('new')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sameCounts, setSameCounts] = useState<Record<number, number>>({})
  const [samed, setSamed] = useState<Record<number, boolean>>({})
  const [form, setForm] = useState({ descriptor: '', category: 'Unhinged', tale: '', venue: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchStories()
    const stored = localStorage.getItem('samed_stories')
    if (stored) setSamed(JSON.parse(stored))
  }, [])

  async function fetchStories() {
    setLoading(true)
    const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false })
    const stories = data || []
    setAllStories(stories)
    const counts: Record<number, number> = {}
    stories.forEach((s: Story) => { counts[s.id] = s.ha_count || 0 })
    setSameCounts(counts)
    setLoading(false)
  }

  async function handleSame(e: React.MouseEvent, story: Story) {
    e.preventDefault()
    if (samed[story.id]) return
    const newCount = (sameCounts[story.id] || 0) + 1
    setSameCounts(prev => ({ ...prev, [story.id]: newCount }))
    const newSamed = { ...samed, [story.id]: true }
    setSamed(newSamed)
    localStorage.setItem('samed_stories', JSON.stringify(newSamed))
    const { error } = await supabase.from('stories').update({ ha_count: newCount }).eq('id', story.id)
    if (error) {
      setSameCounts(prev => ({ ...prev, [story.id]: newCount - 1 }))
      const rolled = { ...newSamed }
      delete rolled[story.id]
      setSamed(rolled)
      localStorage.setItem('samed_stories', JSON.stringify(rolled))
    }
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
    await supabase.from('stories').insert([form])
    setSubmitting(false)
    setSubmitted(true)
    setForm({ descriptor: '', category: 'Unhinged', tale: '', venue: '' })
    setTimeout(async () => {
      setSubmitted(false)
      setShowForm(false)
      await fetchStories()
    }, 2000)
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const inputStyle = {
    border: `1.5px solid ${INK}20`,
    borderRadius: '4px',
    padding: '10px 14px',
    fontSize: '14px',
    color: INK,
    background: BG,
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* NAV */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1.5px solid ${INK}15`, background: BG, position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ background: INK, borderRadius: '6px', padding: '6px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', color: 'rgba(240,237,230,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, fontWeight: 500, display: 'block', marginBottom: '2px' }}>A Hospitality Confessional</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: BG, letterSpacing: '-0.3px', lineHeight: 1 }}>SHIFT STORIES</span>
          </div>
          <button onClick={() => setShowForm(true)} style={{ background: INK, color: BG, border: 'none', borderRadius: '4px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em', fontFamily: 'inherit' }}>
            + Share a tale
          </button>
        </div>

        {/* HERO */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1.5px solid ${INK}15` }}>
          <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: `${INK}55`, marginBottom: '6px' }}>Anonymous confessions</p>
          <p style={{ fontSize: '22px', fontWeight: 900, color: INK, lineHeight: 1.15, letterSpacing: '-0.5px' }}>From hospitality workers.</p>
        </div>

        {/* FILTERS */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap' as const, borderBottom: `1.5px solid ${INK}15`, background: BG }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '5px 12px',
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: 600,
              border: `1.5px solid ${category === c ? INK : INK + '25'}`,
              background: category === c ? INK : 'transparent',
              color: category === c ? BG : `${INK}66`,
              cursor: 'pointer',
              letterSpacing: '0.03em',
              fontFamily: 'inherit',
            }}>{c}</button>
          ))}
        </div>

        {/* SORT */}
        <div style={{ padding: '8px 20px 0', display: 'flex', gap: '16px', borderBottom: `1.5px solid ${INK}15`, background: BG }}>
          {(['new', 'top'] as const).map(tab => (
            <button key={tab} onClick={() => setSort(tab)} style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: sort === tab ? INK : `${INK}33`,
              paddingBottom: '8px',
              borderBottom: sort === tab ? `2px solid ${INK}` : '2px solid transparent',
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{tab}</button>
          ))}
        </div>

        {/* FEED */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px', background: `${INK}15` }}>
          {loading && <div style={{ background: BG, padding: '40px 20px', textAlign: 'center' as const, fontSize: '13px', color: `${INK}44` }}>Loading...</div>}
          {!loading && stories.length === 0 && <div style={{ background: BG, padding: '40px 20px', textAlign: 'center' as const, fontSize: '13px', color: `${INK}44` }}>No stories yet — be the first.</div>}
          {stories.map(story => (
            <div key={story.id} style={{ background: BG }}>
              <a href={`/stories/${story.id}`} style={{ display: 'block', padding: '14px 20px', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontStyle: 'italic', color: `${INK}55` }}>{story.descriptor}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: '2px', border: `1.5px solid ${INK}20`, color: `${INK}66`, whiteSpace: 'nowrap' as const, marginLeft: '8px' }}>{story.category}</span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.55, color: INK, marginBottom: '10px' }}>{story.tale}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: `${INK}33`, letterSpacing: '0.04em' }}>{story.venue} · {timeAgo(story.created_at)}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={(e) => handleSame(e, story)} style={{
                      fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
                      padding: '4px 10px', borderRadius: '3px',
                      border: `1.5px solid ${INK}25`,
                      background: samed[story.id] ? INK : 'transparent',
                      color: samed[story.id] ? BG : `${INK}55`,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      👊 same{sameCounts[story.id] > 0 ? ` ${sameCounts[story.id]}` : ''}
                    </button>
                    <button onClick={async (e) => {
                      e.preventDefault()
                      const url = `${window.location.origin}/stories/${story.id}`
                      if (navigator.share) await navigator.share({ title: 'Shift Stories', url })
                      else navigator.clipboard.writeText(url)
                    }} style={{
                      fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
                      padding: '4px 10px', borderRadius: '3px',
                      border: `1.5px solid ${INK}25`,
                      background: 'transparent', color: `${INK}55`,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>Share</button>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>

        {/* FORM */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.6)', zIndex: 20, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ background: BG, width: '100%', borderRadius: '12px 12px 0 0', padding: '24px 20px', display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: INK, letterSpacing: '-0.3px' }}>Confess your shift</span>
                <button onClick={() => setShowForm(false)} style={{ fontSize: '12px', color: `${INK}55`, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>cancel</button>
              </div>
              {submitted ? (
                <p style={{ textAlign: 'center' as const, fontSize: '14px', color: INK, padding: '16px 0', fontWeight: 600 }}>Confession received. The industry thanks you.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: `${INK}55` }}>Describe them (no names)</label>
                    <input value={form.descriptor} onChange={e => setForm({...form, descriptor: e.target.value})} placeholder="e.g. man, 50s, sensible fleece" style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: `${INK}55` }}>Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle}>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: `${INK}55` }}>The confession</label>
                    <textarea value={form.tale} onChange={e => setForm({...form, tale: e.target.value})} placeholder="What happened..." rows={4} style={{ ...inputStyle, resize: 'none' as const }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: `${INK}55` }}>Your venue (city is fine)</label>
                    <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} placeholder="e.g. Cafe, Bristol" style={inputStyle} />
                  </div>
                  <button onClick={handleSubmit} disabled={submitting} style={{ background: INK, color: BG, border: 'none', borderRadius: '4px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.5 : 1 }}>
                    {submitting ? 'Posting...' : 'Submit confession'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: 'center' as const, padding: '20px', borderTop: `1.5px solid ${INK}15` }}>
          <p style={{ fontSize: '11px', color: `${INK}33` }}>questions? <a href="mailto:shiftstoriesfyi@gmail.com" style={{ color: `${INK}55` }}>shiftstoriesfyi@gmail.com</a></p>
        </div>

      </div>
    </div>
  )
}
