'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const CATEGORIES = ['All', 'Hypochondriac', 'Non-compliant', 'Frequent flyer', 'Googled it', 'Refused meds', 'Legend', 'Unhinged']
const BG = '#e8f4fb'
const INK = '#003d70'
const BLUE = '#005eb8'

type Story = {
  id: number
  descriptor: string
  category: string
  tale: string
  venue: string
  ha_count: number
  created_at: string
}

export default function DoctorsPage() {
  const [allStories, setAllStories] = useState<Story[]>([])
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<'new' | 'top'>('new')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sameCounts, setSameCounts] = useState<Record<number, number>>({})
  const [samed, setSamed] = useState<Record<number, boolean>>({})
  const [form, setForm] = useState({ descriptor: '', category: 'Hypochondriac', tale: '', venue: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchStories()
    const stored = localStorage.getItem('samed_doctor_stories')
    if (stored) setSamed(JSON.parse(stored))
  }, [])

  async function fetchStories() {
    setLoading(true)
    const { data } = await supabase.from('doctor_stories').select('*').order('created_at', { ascending: false })
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
          <button onClick={() => setShowForm(true)} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: '4px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em', fontFamily: 'inherit' }}>
            + Share a case
          </button>
          <a href="/" style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em', textDecoration: 'none', textTransform: 'uppercase' as const }}>← Hospitality</a>
        </div>

        <div style={{ padding: '20px 20px 16px', borderBottom: `1.5px solid ${BLUE}20` }}>
          <p style={{ fontSize: '20px', fontWeight: 900, color: INK, lineHeight: 1.2, letterSpacing: '-0.4px' }}>What happened in your last shift?</p>
        </div>

        <div style={{ padding: '12px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap' as const, borderBottom: `1.5px solid ${BLUE}20` }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: '5px 12px', borderRadius: '3px', fontSize: '11px', fontWeight: 600, border: `1.5px solid ${category === c ? BLUE : BLUE + '30'}`, background: category === c ? BLUE : 'transparent', color: category === c ? '#fff' : BLUE, cursor: 'pointer', letterSpacing: '0.03em', fontFamily: 'inherit' }}>{c}</button>
          ))}
        </div>

        <div style={{ padding: '8px 20px 0', display: 'flex', gap: '16px', borderBottom: `1.5px solid ${BLUE}20` }}>
          {(['new', 'top'] as const).map(tab => (
            <button key={tab} onClick={() => setSort(tab)} style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: sort === tab ? INK : `${BLUE}55`, paddingBottom: '8px', borderBottom: sort === tab ? `2px solid ${INK}` : '2px solid transparent', border: 'none', borderRadius: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>{tab}</button>
          ))}
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
                    <button onClick={async (e) => {
                      e.preventDefault()
                      const url = `${window.location.origin}/doctors/${story.id}`
                      if (navigator.share) await navigator.share({ title: 'This Is Gonna Hurt', url })
                      else navigator.clipboard.writeText(url)
                    }} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '3px', border: `1.5px solid ${BLUE}30`, background: 'transparent', color: BLUE, cursor: 'pointer', fontFamily: 'inherit' }}>Share</button>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>

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
