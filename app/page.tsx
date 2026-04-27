'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const CATEGORIES = ['All', 'Unhinged', 'Food crime', 'Wholesome', 'Legend', 'Language barrier', 'Twat']

type Story = {
  id: number
  descriptor: string
  category: string
  tale: string
  venue: string
  ha_count: number
  created_at: string
}

const categoryColours: Record<string, string> = {
  'Unhinged':         'bg-pink-100 text-pink-700',
  'Food crime':       'bg-amber-100 text-amber-700',
  'Wholesome':        'bg-green-100 text-green-700',
  'Legend':           'bg-purple-100 text-purple-700',
  'Language barrier': 'bg-blue-100 text-blue-700',
  'Twat':             'bg-red-100 text-red-600',
}

export default function Home() {
  const [allStories, setAllStories] = useState<Story[]>([])
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<'new' | 'top'>('new')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sameCounts, setSameCounts] = useState<Record<number, number>>({})
  const [samed, setSamed] = useState<Record<number, boolean>>({})
  const [form, setForm] = useState({
    descriptor: '', category: 'Unhinged', tale: '', venue: ''
  })
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

    // Optimistically update UI immediately
    setSameCounts(prev => ({ ...prev, [story.id]: newCount }))
    const newSamed = { ...samed, [story.id]: true }
    setSamed(newSamed)
    localStorage.setItem('samed_stories', JSON.stringify(newSamed))

    // Direct update to Supabase
    const { error } = await supabase
      .from('stories')
      .update({ ha_count: newCount })
      .eq('id', story.id)

    if (error) {
      // Rollback on failure
      setSameCounts(prev => ({ ...prev, [story.id]: newCount - 1 }))
      const rolledBack = { ...newSamed }
      delete rolledBack[story.id]
      setSamed(rolledBack)
      localStorage.setItem('samed_stories', JSON.stringify(rolledBack))
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

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f5f5f0' }}>
      <div className="max-w-lg mx-auto">

        <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between" style={{ background: '#1a1a2e' }}>
          <span className="text-xl font-black tracking-tight text-white" style={{ letterSpacing: '-0.5px' }}>
            shift<span style={{ color: '#FF6B6B' }}>stories</span>
          </span>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-bold px-5 py-2 transition-transform active:scale-95"
            style={{ background: '#FF6B6B', color: '#1a1a2e', borderRadius: '999px' }}
          >
            + Share a tale
          </button>
        </div>

        <div className="px-4 py-8 text-center" style={{ background: '#1a1a2e', borderBottom: '3px solid #FF6B6B' }}>
          <p className="font-black text-2xl text-white" style={{ letterSpacing: '-0.5px' }}>
            Customer <span style={{ color: '#FF6B6B' }}>reviews.</span>
          </p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Written by the staff, not the other way round.
          </p>
        </div>

        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide" style={{ background: '#f5f5f0' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
              style={{
                padding: '7px 14px',
                borderRadius: '999px',
                border: category === c ? 'none' : '1.5px solid #1a1a2e22',
                background: category === c ? '#1a1a2e' : '#fff',
                color: category === c ? '#fff' : '#1a1a2e99',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-4 px-4 pb-0 pt-1" style={{ borderBottom: '1.5px solid #1a1a2e11', background: '#f5f5f0' }}>
          {(['new', 'top'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSort(tab)}
              className="text-xs font-bold pb-2 capitalize transition-colors"
              style={{
                borderBottom: sort === tab ? '2.5px solid #FF6B6B' : '2.5px solid transparent',
                color: sort === tab ? '#FF6B6B' : '#1a1a2e55',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-4 py-4 flex flex-col gap-3">
          {loading && <p className="text-center text-sm py-8" style={{ color: '#1a1a2e44' }}>Loading stories...</p>}
          {!loading && stories.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: '#1a1a2e44' }}>No stories yet — be the first!</p>
          )}
          {stories.map(story => (
            <div
              key={story.id}
              className="bg-white p-4"
              style={{ borderRadius: '20px', border: '1.5px solid #1a1a2e08', boxShadow: '0 1px 3px rgba(26,26,46,0.05)' }}
            >
              <a href={`/stories/${story.id}`} className="block">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs italic flex-1 pr-2" style={{ color: '#1a1a2e55' }}>{story.descriptor}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${categoryColours[story.category] || 'bg-gray-100 text-gray-600'}`}>
                    {story.category}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#1a1a2e' }}>{story.tale}</p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => handleSame(e, story)}
                    className="text-xs font-bold px-3 py-1.5 transition-all active:scale-95 flex items-center gap-1.5"
                    style={{
                      borderRadius: '999px',
                      border: samed[story.id] ? 'none' : '1.5px solid #1a1a2e15',
                      background: samed[story.id] ? '#1a1a2e' : '#fff',
                      color: samed[story.id] ? '#fff' : '#1a1a2e55',
                    }}
                  >
                    👊 same{sameCounts[story.id] > 0 ? ` · ${sameCounts[story.id]}` : ''}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#1a1a2e33' }}>{story.venue} · {timeAgo(story.created_at)}</span>
                    <button
                      onClick={async (e) => {
                        e.preventDefault()
                        const url = `${window.location.origin}/stories/${story.id}`
                        if (navigator.share) {
                          await navigator.share({ title: 'ShiftStories', url })
                        } else {
                          navigator.clipboard.writeText(url)
                        }
                      }}
                      className="text-xs font-semibold px-3 py-1.5 transition-all active:scale-95"
                      style={{ borderRadius: '999px', border: '1.5px solid #FF6B6B44', color: '#FF6B6B', background: '#FF6B6B0d' }}
                    >
                      share
                    </button>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-20 flex items-end" style={{ background: 'rgba(26,26,46,0.6)' }}>
            <div className="w-full p-6 flex flex-col gap-4" style={{ background: '#fff', borderRadius: '28px 28px 0 0' }}>
              <div className="flex items-center justify-between">
                <h2 className="font-black text-base" style={{ color: '#1a1a2e', letterSpacing: '-0.3px' }}>Share a tale</h2>
                <button onClick={() => setShowForm(false)} className="text-sm" style={{ color: '#1a1a2e55' }}>cancel</button>
              </div>
              {submitted ? (
                <p className="text-center text-sm py-4" style={{ color: '#06D6A0', fontWeight: 600 }}>
                  Tale submitted — the industry thanks you. 🙌
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: '#1a1a2e66' }}>Describe them (no names)</label>
                    <input value={form.descriptor} onChange={e => setForm({...form, descriptor: e.target.value})}
                      placeholder="e.g. man, 50s, sensible fleece"
                      className="text-sm focus:outline-none"
                      style={{ border: '1.5px solid #1a1a2e15', borderRadius: '14px', padding: '10px 14px', color: '#1a1a2e', background: '#f5f5f0' }}/>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: '#1a1a2e66' }}>Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                      className="text-sm focus:outline-none"
                      style={{ border: '1.5px solid #1a1a2e15', borderRadius: '14px', padding: '10px 14px', color: '#1a1a2e', background: '#f5f5f0' }}>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: '#1a1a2e66' }}>The tale</label>
                    <textarea value={form.tale} onChange={e => setForm({...form, tale: e.target.value})}
                      placeholder="What happened..."
                      rows={4}
                      className="text-sm focus:outline-none resize-none"
                      style={{ border: '1.5px solid #1a1a2e15', borderRadius: '14px', padding: '10px 14px', color: '#1a1a2e', background: '#f5f5f0' }}/>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: '#1a1a2e66' }}>Your venue (city is fine)</label>
                    <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})}
                      placeholder="e.g. Cafe, Bristol"
                      className="text-sm focus:outline-none"
                      style={{ border: '1.5px solid #1a1a2e15', borderRadius: '14px', padding: '10px 14px', color: '#1a1a2e', background: '#f5f5f0' }}/>
                  </div>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="font-black text-sm py-3 transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: '#FF6B6B', color: '#1a1a2e', borderRadius: '14px' }}>
                    {submitting ? 'Posting...' : 'Post your tale 🍽️'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="text-center py-6" style={{ borderTop: '1px solid #1a1a2e0d' }}>
          <p className="text-xs" style={{ color: '#1a1a2e33' }}>
            questions or feedback? <a href="mailto:shiftstoriesfyi@gmail.com" style={{ color: '#FF6B6B' }}>shiftstoriesfyi@gmail.com</a>
          </p>
        </div>

      </div>
    </div>
  )
}
