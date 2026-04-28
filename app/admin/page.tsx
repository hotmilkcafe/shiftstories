'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const BG = '#f0ede6'
const INK = '#1a1a1a'

type Story = {
  id: number
  descriptor: string
  category: string
  tale: string
  venue: string
  created_at: string
  _table: 'stories' | 'doctor_stories'
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'stories' | 'doctor_stories'>('all')
  const [search, setSearch] = useState('')

  function handleLogin() {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true)
      setError('')
    } else {
      setError('Wrong password.')
    }
  }

  useEffect(() => {
    if (!authed) return
    loadAll()
  }, [authed])

  async function loadAll() {
    setLoading(true)
    const [{ data: hosp }, { data: doc }] = await Promise.all([
      supabase.from('stories').select('*').order('created_at', { ascending: false }),
      supabase.from('doctor_stories').select('*').order('created_at', { ascending: false }),
    ])
    const combined: Story[] = [
      ...(hosp || []).map((s: any) => ({ ...s, _table: 'stories' as const })),
      ...(doc || []).map((s: any) => ({ ...s, _table: 'doctor_stories' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setStories(combined)
    setLoading(false)
  }

  async function handleDelete(story: Story) {
    if (!confirm(`Delete this story?\n\n"${story.tale.substring(0, 100)}..."`)) return
    setDeleting(story.id)
    await supabase.from(story._table).delete().eq('id', story.id)
    setStories(prev => prev.filter(s => !(s.id === story.id && s._table === story._table)))
    setDeleting(null)
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const filtered = stories
    .filter(s => filter === 'all' || s._table === filter)
    .filter(s => !search || s.tale.toLowerCase().includes(search.toLowerCase()) || s.descriptor.toLowerCase().includes(search.toLowerCase()) || s.venue.toLowerCase().includes(search.toLowerCase()))

  const hospCount = stories.filter(s => s._table === 'stories').length
  const docCount = stories.filter(s => s._table === 'doctor_stories').length

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: BG, borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: `${INK}55`, marginBottom: '6px' }}>ShiftStories</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: INK, letterSpacing: '-0.4px' }}>Admin</div>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Password"
          style={{ border: `1.5px solid ${INK}20`, borderRadius: '4px', padding: '10px 14px', fontSize: '14px', color: INK, background: BG, outline: 'none', fontFamily: 'inherit' }}
          autoFocus
        />
        {error && <p style={{ fontSize: '12px', color: '#c0392b', margin: 0 }}>{error}</p>}
        <button onClick={handleLogin} style={{ background: INK, color: BG, border: 'none', borderRadius: '4px', padding: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Sign in
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f1', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: INK, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'rgba(240,237,230,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>ShiftStories · </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: BG }}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'rgba(240,237,230,0.5)' }}>
          <span>Hospitality: <strong style={{ color: BG }}>{hospCount}</strong></span>
          <span>Doctors: <strong style={{ color: BG }}>{docCount}</strong></span>
          <span>Total: <strong style={{ color: BG }}>{stories.length}</strong></span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid rgba(26,26,26,0.1)', background: '#fff', flexWrap: 'wrap' }}>
        {(['all', 'stories', 'doctor_stories'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, border: `1.5px solid ${filter === f ? INK : 'rgba(26,26,26,0.2)'}`, background: filter === f ? INK : 'transparent', color: filter === f ? BG : `${INK}88`, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'inherit' }}>
            {f === 'all' ? 'All' : f === 'stories' ? 'Hospitality' : 'Doctors'}
          </button>
        ))}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search stories..."
          style={{ marginLeft: 'auto', border: '1.5px solid rgba(26,26,26,0.15)', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', color: INK, background: BG, outline: 'none', fontFamily: 'inherit', width: '200px' }}
        />
        <button onClick={loadAll} style={{ background: 'transparent', color: `${INK}66`, border: '1.5px solid rgba(26,26,26,0.15)', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>↺ Refresh</button>
      </div>

      {/* Stories list */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '900px' }}>
        {loading && <p style={{ color: `${INK}55`, fontSize: '13px' }}>Loading...</p>}
        {!loading && filtered.length === 0 && <p style={{ color: `${INK}55`, fontSize: '13px' }}>No stories found.</p>}
        {filtered.map(story => (
          <div key={`${story._table}-${story.id}`} style={{ background: '#fff', borderRadius: '8px', padding: '14px 16px', border: '1px solid rgba(26,26,26,0.08)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

            {/* Source badge */}
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '3px', background: story._table === 'stories' ? '#f0ede6' : '#e8f4fb', color: story._table === 'stories' ? INK : '#005eb8', border: story._table === 'stories' ? '1px solid rgba(26,26,26,0.1)' : '1px solid rgba(0,94,184,0.15)' }}>
                {story._table === 'stories' ? 'Hosp' : 'Dr'}
              </span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontStyle: 'italic', color: `${INK}66` }}>{story.descriptor}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '1px 7px', border: '1px solid rgba(26,26,26,0.15)', color: `${INK}88`, borderRadius: '2px' }}>{story.category}</span>
                <span style={{ fontSize: '10px', color: `${INK}44`, marginLeft: 'auto' }}>{story.venue} · {timeAgo(story.created_at)}</span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.55, color: INK, margin: 0 }}>{story.tale}</p>
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDelete(story)}
              disabled={deleting === story.id}
              style={{ flexShrink: 0, background: 'transparent', color: deleting === story.id ? '#ccc' : '#c0392b', border: '1.5px solid', borderColor: deleting === story.id ? '#ccc' : '#c0392b', borderRadius: '4px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, cursor: deleting === story.id ? 'default' : 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em' }}
            >
              {deleting === story.id ? '...' : 'Delete'}
            </button>

          </div>
        ))}
      </div>

    </div>
  )
}
