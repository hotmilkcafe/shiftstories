'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../supabase'

function getCookieVoted(): number[] {
  if (typeof document === 'undefined') return []
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const entry = cookies.find(c => c.startsWith('voted='))
  if (!entry) return []
  const raw = entry.slice('voted='.length)
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    if (!Array.isArray(parsed)) return []
    return parsed.map((v) => Number(v)).filter((v) => Number.isFinite(v))
  } catch {
    return []
  }
}

function setCookieVoted(ids: number[]) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
  const value = encodeURIComponent(JSON.stringify(ids))
  document.cookie = `voted=${value}; expires=${expires}; path=/; SameSite=Lax`
}

type Story = {
  id: number
  descriptor: string
  category: string
  tale: string
  venue: string
  stars: number
  ha_count: number
  created_at: string
}

const categoryColours: Record<string, string> = {
  'Unhinged': 'bg-pink-100 text-pink-800',
  'Food crime': 'bg-amber-100 text-amber-800',
  'Wholesome': 'bg-green-100 text-green-800',
  'Legend': 'bg-purple-100 text-purple-800',
  'Language barrier': 'bg-blue-100 text-blue-800',
  'Chaos gremlin': 'bg-orange-100 text-orange-800',
}

export default function StoryPage() {
  const { id } = useParams()
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState<number[]>([])
  const [shared, setShared] = useState(false)

  useEffect(() => {
    try {
      setVoted(getCookieVoted())
    } catch { }
    async function fetchStory() {
      const { data } = await supabase.from('stories').select('*').eq('id', id).single()
      setStory(data)
      setLoading(false)
    }
    fetchStory()
  }, [id])

  async function handleVote() {
    if (!story || voted.includes(story.id)) return
    const newVoted = [...voted, story.id]
    setVoted(newVoted)
    setCookieVoted(newVoted)
    const newCount = (story.ha_count || 0) + 1
    setStory({ ...story, ha_count: newCount })
    await supabase.from('stories').update({ ha_count: newCount }).eq('id', story.id)
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: `ShiftStories — ${story?.descriptor}`, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )

  if (!story) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Story not found</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-lg mx-auto">

        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-gray-400 text-sm">← back</button>
          <span className="text-lg font-medium tracking-tight">shift<span className="text-orange-500">stories</span></span>
          <div className="w-12"/>
        </div>

        <div className="px-4 py-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">

            <div className="flex flex-col items-center gap-1 pt-0.5">
              <button
                onClick={handleVote}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${voted.includes(story.id) ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-400'}`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <polygon points="5,1 9,9 1,9"/>
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-500">{story.ha_count || 0}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-gray-400 italic flex-1 pr-2">{story.descriptor}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${categoryColours[story.category] || 'bg-gray-100 text-gray-600'}`}>
                  {story.category}
                </span>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-4 h-4" viewBox="0 0 14 14" fill={i <= story.stars ? '#f97316' : 'none'} stroke="#f97316" strokeWidth="1.5">
                    <polygon points="7,1 8.8,5.2 13.4,5.6 10,8.6 11,13 7,10.5 3,13 4,8.6 0.6,5.6 5.2,5.2"/>
                  </svg>
                ))}
                <span className="text-xs text-gray-300 ml-1">staff experience</span>
              </div>
              <p className="text-base text-gray-800 leading-relaxed mb-4">{story.tale}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">{story.venue} · {timeAgo(story.created_at)}</span>
                <button onClick={handleShare}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-400 transition-colors">
                  {shared ? 'copied!' : 'share'}
                </button>
              </div>
            </div>

          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 mb-3">More tales from the industry</p>
            <button onClick={() => router.push('/')}
              className="bg-orange-500 text-white text-sm font-medium px-6 py-2.5 rounded-full">
              Read more stories
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}