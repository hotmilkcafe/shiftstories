'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'


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


export default function StoryClient({ id }: { id: string }) {
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)


  useEffect(() => {
    async function fetchStory() {
      const { data } = await supabase.from('stories').select('*').eq('id', parseInt(id)).single()
      setStory(data)
      setLoading(false)
    }
    fetchStory()
  }, [id])


  function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
