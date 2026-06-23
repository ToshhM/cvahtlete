import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCvBySlug } from '@/app/actions/cv'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser, getAuthProfile } from '@/lib/auth'
import { deriveEntitlements } from '@/lib/entitlements'
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

  let isOwn = false
  let hasPro = false
  const user = await getAuthUser()
  if (user) {
    const supabase = createClient()
    const [profile, { data: mine }] = await Promise.all([
      getAuthProfile(),
      supabase.from('cvs').select('slug').eq('user_id', user.id).eq('slug', params.slug).maybeSingle(),
    ])
    isOwn = !!mine
    hasPro = deriveEntitlements(profile).cinematic
  }

  return <ProfileView cv={cv} isOwn={isOwn} hasPro={hasPro} />
}
