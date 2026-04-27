import { createClient } from '@supabase/supabase-js'
import StoryClient from './StoryClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: story } = await supabase
    .from('stories')
    .select('tale, category, descriptor')
    .eq('id', params.id)
    .single()

  if (!story) return { title: 'ShiftStories' }

  const snippet = story.tale.length > 120
    ? story.tale.substring(0, 120) + '...'
    : story.tale

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

export default function StoryPage({ params }: { params: { id: string } }) {
  return <StoryClient id={params.id} />
}
