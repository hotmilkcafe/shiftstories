'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../supabase'

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
  const [copied, setCopied] = useState(false)
  const [haLiked, setHaLiked] = useState<number[]>([])
  const [sameLiked, setSameLiked] = useState<number[]>([])

  useEffect(() => {
    async function fetchStory() {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single()
      setStory(data)
      setLoading(false)
    }
    fetchStory()
  }, [id])

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

  async function handleReact(field: 'ha_count' | 'same_count', current: number) {
    if (!story) return

    const key = field === 'ha_count' ? 'ha_liked' : 'same_liked'
    const liked = field === 'ha_count' ? haLiked : sameLiked
    const setLiked = field === 'ha_count' ? setHaLiked : setSameLiked

    if (liked.includes(story.id)) return

    await supabase.from('stories').update({ [field]: current + 1 }).eq('id', story.id)

    const nextLiked = [...liked, story.id]
    setLiked(nextLiked)
    localStorage.setItem(key, JSON.stringify(nextLiked))

    setStory({ ...story, [field]: current + 1 })
  }

  async function handleShare() {
    const url = window.location.href
    const title = story?.descriptor || 'shiftstories'

    if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: title, url })
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <button onClick={() => router.push('/')} className="text-gray-400 text-sm">
            back
          </button>
          <span className="text-lg font-medium tracking-tight">shift<span className="text-orange-500">stories</span></span>
          <div className="w-12"/>
        </div>
        <div className="px-4 py-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
            <p className="text-xs text-gray-300 mb-4">{story.venue} · {timeAgo(story.created_at)}</p>
            <div className="flex gap-2">
              <button onClick={() => handleReact('ha_count', Number(story.ha_count || 0))}
                className={`text-sm px-4 py-2 rounded-full border transition-colors ${haLiked.includes(story.id) ? 'bg-orange-50 text-orange-600 border-orange-200' : 'border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'}`}>
                ha {story.ha_count}
              </button>
              <button onClick={() => handleReact('same_count', Number(story.same_count || 0))}
                className={`text-sm px-4 py-2 rounded-full border transition-colors ${sameLiked.includes(story.id) ? 'bg-orange-50 text-orange-600 border-orange-200' : 'border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'}`}>
                same {story.same_count}
              </button>
              <button onClick={handleShare}
                className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors ml-auto">
                {copied ? 'copied!' : 'share'}
              </button>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 mb-2">More tales from the industry</p>
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
