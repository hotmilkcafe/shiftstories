'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
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
