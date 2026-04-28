'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../supabase'

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

export default function DoctorStoryClient() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    if (!id) return
    async function fetchStory() {
      const { data } = await supabase.from('doctor_stories').select('*').eq('id', parseInt(id)).single()
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
    if (!story) return
    const url = window.location.href
    const snippet = story.tale.length > 140 ? story.tale.substring(0, 140) + '...' : story.tale
    const text = `"${snippet}" — This Is Gonna Hurt`
    if (navigator.share) {
      await navigator.share({ title: 'This Is Gonna Hurt', text, url })
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ fontSize: '13px', color: `${BLUE}66` }}>Loading...</p>
    </div>
  )

  if (!story) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ fontSize: '13px', color: `${BLUE}66` }}>Case not found.</p>
      <button onClick={() => router.push('/doctors')} style={{ fontSize: '13px', fontWeight: 700, color: INK, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to ward</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1.5px solid ${BLUE}20`, background: BG, position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => router.push('/doctors')} style={{ fontSize: '12px', fontWeight: 700, color: `${BLUE}66`, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em' }}>← back</button>
          <div style={{ background: BLUE, borderRadius: '6px', padding: '6px 12px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, fontWeight: 500, display: 'block', marginBottom: '2px' }}>A Medical Confessional</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1 }}>THIS IS GONNA HURT</span>
          </div>
          <div style={{ width: '60px' }} />
        </div>

        <div style={{ padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontStyle: 'italic', color: `${BLUE}88` }}>{story.descriptor}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '2px', border: `1.5px solid ${BLUE}30`, color: BLUE, whiteSpace: 'nowrap' as const, marginLeft: '12px' }}>{story.category}</span>
          </div>
          <p style={{ fontSize: '16px', lineHeight: 1.65, color: INK, marginBottom: '28px' }}>{story.tale}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: `1.5px solid ${BLUE}20` }}>
            <span style={{ fontSize: '11px', color: `${BLUE}55`, letterSpacing: '0.04em' }}>{story.venue} · {timeAgo(story.created_at)}</span>
            <button onClick={handleShare} style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', padding: '6px 14px', borderRadius: '3px', border: `1.5px solid ${BLUE}30`, background: 'transparent', color: BLUE, cursor: 'pointer', fontFamily: 'inherit' }}>
              {shared ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        <div style={{ padding: '8px 20px 32px', textAlign: 'center' as const }}>
          <button onClick={() => router.push('/doctors')} style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: `${BLUE}55`, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' as const }}>← Read more cases</button>
        </div>

        <div style={{ textAlign: 'center' as const, padding: '20px', borderTop: `1.5px solid ${BLUE}20` }}>
          <p style={{ fontSize: '11px', color: `${BLUE}55` }}>questions? <a href="mailto:shiftstoriesfyi@gmail.com" style={{ color: BLUE }}>shiftstoriesfyi@gmail.com</a></p>
        </div>

      </div>
    </div>
  )
}
