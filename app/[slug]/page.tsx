import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCvBySlug } from '@/app/actions/cv'
import { createClient } from '@/utils/supabase/server'
import ProfileView from '@/components/ProfileView'

interface Params { params: { slug: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const cv = await getCvBySlug(params.slug)
  if (!cv) return { title: 'Profil introuvable — ATHLETE CV' }
  const name = `${cv.first} ${cv.last}`
  return {
    title: `${name} — ${cv.sport} · ATHLETE CV`,
    description: cv.tagline || `Profil d'athlète de ${name}.`,
    openGraph: {
      title: name,
      description: cv.tagline || '',
      images: cv.avatar ? [{ url: cv.avatar }] : [],
    },
  }
}

export default async function SlugPage({ params }: Params) {
  const cv = await getCvBySlug(params.slug)
  if (!cv) notFound()

  // Déterminer si le visiteur connecté est propriétaire du CV (CTA adaptatif).
  let isOwn = false
  let hasPro = false
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const [{ data: profile }, { data: mine }] = await Promise.all([
        supabase.from('profiles').select('is_owner, plan').eq('id', user.id).single(),
        supabase.from('cvs').select('slug').eq('user_id', user.id).eq('slug', params.slug).maybeSingle(),
      ])
      isOwn = !!mine
      hasPro = !!(profile?.is_owner || profile?.plan === 'pro' || profile?.plan === 'club')
    }
  }

  return <ProfileView cv={cv} isOwn={isOwn} hasPro={hasPro} />
}
