'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from './supabase'

const CATEGORIES = ['All', 'Unhinged', 'Food crime', 'Wholesome', 'Legend', 'Language barrier', 'Chaos gremlin']

type Story = {
  id: number
  descriptor: string
  category: string
  tale: string
  venue: string
  stars: number
  ha_count: number
  same_count: number
  created_at: string
}

export default function Home() {
  const [stories, setStories] = useState<Story[]>([])
  const [category, setCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [haLiked, setHaLiked] = useState<number[]>([])
  const [sameLiked, setSameLiked] = useState<number[]>([])
  const isFetching = useRef(false)
  const skipFetchUntilMs = useRef(0)
  const [form, setForm] = useState({
    descriptor: '', category: 'Unhinged', tale: '', venue: '', stars: 3
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    function readIds(key: 'ha_liked' | 'same_liked') {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.map((v) => Number(v)).filter((v) => Number.isFinite(v))
      } catch {
        return []
      }
    }

    setHaLiked(readIds('ha_liked'))
    setSameLiked(readIds('same_liked'))
  }, [])

  useEffect(() => { fetchStories() }, [category])

  async function fetchStories() {
    if (isFetching.current) return
    if (Date.now() < skipFetchUntilMs.current) return

    setLoading(true)
    isFetching.current = true
    let query = supabase.from('stories').select('*').order('created_at', { ascending: false })
    if (category !== 'All') query = query.eq('category', category)
    try {
      const { data } = await query
      if (Date.now() < skipFetchUntilMs.current) return
      setStories(data || [])
    } finally {
      isFetching.current = false
      setLoading(false)
    }
  }

  async function handleReact(id: number, field: 'ha_count' | 'same_count', current: number) {
    skipFetchUntilMs.current = Date.now() + 1500

    const key = field === 'ha_count' ? 'ha_liked' : 'same_liked'
    const liked = field === 'ha_count' ? haLiked : sameLiked
    const setLiked = field === 'ha_count' ? setHaLiked : setSameLiked

    if (liked.includes(id)) return

    const nextLiked = [...liked, id]
    setLiked(nextLiked)
    localStorage.setItem(key, JSON.stringify(nextLiked))

    setStories(prev => prev.map(s => s.id === id ? { ...s, [field]: Number(s[field] || 0) + 1 } : s))

    const { error } = await supabase.from('stories').update({ [field]: current + 1 }).eq('id', id)
    if (error) {
      setStories(prev => prev.map(s => s.id === id ? { ...s, [field]: Math.max(0, Number(s[field] || 0) - 1) } : s))
      const rolledBack = nextLiked.filter(storyId => storyId !== id)
      setLiked(rolledBack)
      localStorage.setItem(key, JSON.stringify(rolledBack))
    }
  }

  async function handleSubmit() {
    if (!form.tale || !form.descriptor || !form.venue) return
    setSubmitting(true)
    await supabase.from('stories').insert([form])
    setSubmitting(false)
    setSubmitted(true)
    setForm({ descriptor: '', category: 'Unhinged', tale: '', venue: '', stars: 3 })
    setTimeout(() => { setSubmitted(false); setShowForm(false); fetchStories() }, 2000)
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const categoryColours: Record<string, string> = {
    'Unhinged': 'bg-pink-100 text-pink-800',
    'Food crime': 'bg-amber-100 text-amber-800',
    'Wholesome': 'bg-green-100 text-green-800',
    'Legend': 'bg-purple-100 text-purple-800',
    'Language barrier': 'bg-blue-100 text-blue-800',
    'Chaos gremlin': 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-lg mx-auto">

        {/* Nav */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-medium tracking-tight">shift<span className="text-orange-500">stories</span></span>
          <button onClick={() => setShowForm(true)} className="bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-full">
            + Share a tale
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-gray-100 bg-white">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${category === c ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-gray-500 border-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="px-4 py-4 flex flex-col gap-3">
          {loading && <p className="text-center text-gray-400 text-sm py-8">Loading stories...</p>}
          {!loading && stories.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No stories yet — be the first!</p>
          )}
          {stories.map(story => (
            <div key={story.id} className="relative bg-white rounded-2xl border border-gray-100 p-4">
              <Link
                href={`/stories/${story.id}`}
                aria-label={`Read story ${story.id}`}
                className="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              />

              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-400 italic flex-1 pr-2">{story.descriptor}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${categoryColours[story.category] || 'bg-gray-100 text-gray-600'}`}>
                  {story.category}
                </span>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3" viewBox="0 0 14 14" fill={i <= story.stars ? '#f97316' : 'none'} stroke="#f97316" strokeWidth="1.5">
                    <polygon points="7,1 8.8,5.2 13.4,5.6 10,8.6 11,13 7,10.5 3,13 4,8.6 0.6,5.6 5.2,5.2"/>
                  </svg>
                ))}
                <span className="text-xs text-gray-300 ml-1">staff experience</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed mb-3">{story.tale}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">{story.venue} · {timeAgo(story.created_at)}</span>
                <div className="relative z-10 flex gap-2">
                  <button onClick={() => handleReact(story.id, 'ha_count', Number(story.ha_count || 0))}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${haLiked.includes(story.id) ? 'bg-orange-50 text-orange-600 border-orange-200' : 'border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'}`}>
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden>❤️</span>
                      <span>{Number(story.ha_count || 0)}</span>
                    </span>
                  </button>
                  <button onClick={() => handleReact(story.id, 'same_count', Number(story.same_count || 0))}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${sameLiked.includes(story.id) ? 'bg-orange-50 text-orange-600 border-orange-200' : 'border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'}`}>
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden>🤣</span>
                      <span>{Number(story.same_count || 0)}</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-20 flex items-end">
            <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">Share a tale</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 text-sm">cancel</button>
              </div>
              {submitted ? (
                <p className="text-center text-green-600 text-sm py-4">Tale submitted — the industry thanks you.</p>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Describe them (no names)</label>
                    <input value={form.descriptor} onChange={e => setForm({...form, descriptor: e.target.value})}
                      placeholder="e.g. man, 50s, sensible fleece"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-300"/>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-300">
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">The tale</label>
                    <textarea value={form.tale} onChange={e => setForm({...form, tale: e.target.value})}
                      placeholder="What happened..."
                      rows={4}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-300 resize-none"/>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Your venue (city is fine)</label>
                    <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})}
                      placeholder="e.g. Cafe, Bristol"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-300"/>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Staff experience (1–5 stars)</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(i => (
                        <button key={i} onClick={() => setForm({...form, stars: i})}>
                          <svg className="w-6 h-6" viewBox="0 0 14 14" fill={i <= form.stars ? '#f97316' : 'none'} stroke="#f97316" strokeWidth="1.5">
                            <polygon points="7,1 8.8,5.2 13.4,5.6 10,8.6 11,13 7,10.5 3,13 4,8.6 0.6,5.6 5.2,5.2"/>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="bg-orange-500 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50">
                    {submitting ? 'Posting...' : 'Post your tale'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}