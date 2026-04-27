'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'

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

export default function StoryClient({ id }: { id: string }) {
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    async function fetchStory() {
      const { data } = await supabase.from('stories').select('*').eq('id', id).single()
      setStory(data)
      setLoading(false)
    }
    fetchStory()
  }, [id])

  function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: 'ShiftStories', url })
    } else {
      navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f0' }}>
        <p className="text-sm" style={{ color: '#1a1a2e44' }}>Loading...</p>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#f5f5f0' }}>
        <p className="text-sm" style={{ color: '#1a1a2e44' }}>Story not found.</p>
        <button onClick={() => router.push('/')} className="text-sm font-bold" style={{ color: '#FF6B6B' }}>← Back home</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f5f5f0' }}>
      <div className="max-w-lg mx-auto">

        <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between" style={{ background: '#1a1a2e' }}>
          <button onClick={() => router.push('/')} className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            ← back
          </button>
          <span className="text-lg font-black tracking-tight text-white" style={{ letterSpacing: '-0.5px' }}>
            shift<span style={{ color: '#FF6B6B' }}>stories</span>
          </span>
          <div style={{ width: 48 }} />
        </div>

        <div style={{ background: '#1a1a2e', borderBottom: '3px solid #FF6B6B', height: 4 }} />

        <div className="px-4 py-6">
          <div className="bg-white p-6" style={{ borderRadius: '24px', border: '1.5px solid #1a1a2e08', boxShadow: '0 1px 3px rgba(26,26,46,0.05)' }}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm italic" style={{ color: '#1a1a2e55' }}>{story.descriptor}</span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ml-2 ${categoryColours[story.category] || 'bg-gray-100 text-gray-600'}`}>
                {story.category}
              </span>
            </div>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#1a1a2e' }}>
              {story.tale}
            </p>
            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #1a1a2e08' }}>
              <span className="text-xs" style={{ color: '#1a1a2e33' }}>
                {story.venue} · {timeAgo(story.created_at)}
              </span>
              <button
                onClick={handleShare}
                className="text-xs font-semibold px-4 py-2 transition-all active:scale-95"
                style={{ borderRadius: '999px', border: '1.5px solid #FF6B6B44', color: '#FF6B6B', background: '#FF6B6B0d' }}
              >
                {shared ? 'link copied!' : 'share'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pb-8 text-center">
          <button onClick={() => router.push('/')} className="text-sm font-bold" style={{ color: '#1a1a2e55' }}>
            ← Read more tales
          </button>
        </div>

        <div className="text-center py-6" style={{ borderTop: '1px solid #1a1a2e0d' }}>
          <p className="text-xs" style={{ color: '#1a1a2e33' }}>
            questions or feedback?{' '}
            <a href="mailto:shiftstoriesfyi@gmail.com" style={{ color: '#FF6B6B' }}>
              shiftstoriesfyi@gmail.com
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}
