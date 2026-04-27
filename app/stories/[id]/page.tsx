import StoryClient from './StoryClient'

async function getStory(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/stories?id=eq.${id}&select=tale,category,descriptor`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60 },
      }
    )
    const data = await res.json()
    return data?.[0] || null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const story = await getStory(params.id)
  if (!story) return { title: 'ShiftStories' }
  const snippet = story.tale.length > 120 ? story.tale.substring(0, 120) + '...' : story.tale
  const title = `${story.descriptor} (${story.category}) | ShiftStories`
  return {
    title,
    description: snippet,
    openGraph: {
      title,
      description: snippet,
      url: `https://www.shiftstories.fyi/stories/${params.id}`,
      siteName: 'ShiftStories',
      images: [{ url: 'https://www.shiftstories.fyi/og-default.png', width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: snippet,
      images: ['https://www.shiftstories.fyi/og-default.png'],
    },
  }
}

export default function StoryPage() {
  return <StoryClient />
}
