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
