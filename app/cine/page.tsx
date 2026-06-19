'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getCvBySlug } from '@/app/actions/cv'
import type { CvData } from '@/app/actions/cv'

const CineView = dynamic(() => import('@/components/CineView'), {
  ssr: false,
  loading: () => (
    <div className="cine-wrap">
      <div className="ci-locked"><p>Chargement de la scène…</p></div>
    </div>
  ),
})

// Slugs servis depuis /public/data (vitrine démo, pas d'utilisateur réel).
const DEMO_SLUGS = new Set(['dembele'])

interface RawDemo {
  first?: string; last?: string; sport?: string; location?: string; tagline?: string
  colors?: { a?: string; b?: string }
  stats?: unknown; palmares?: unknown; career?: unknown; links?: unknown
}

function demoToCv(raw: RawDemo, slug: string): CvData {
  return {
    slug,
    first: raw.first || '', last: raw.last || '',
    sport: raw.sport || '', location: raw.location,
    tagline: raw.tagline,
    colors: { a: raw.colors?.a, b: raw.colors?.b },
    stats: (raw.stats as unknown[]) ?? [],
    palmares: (raw.palmares as unknown[]) ?? [],
    career: (raw.career as unknown[]) ?? [],
    links: (raw.links as unknown[]) ?? [],
    visibility: 'public',
    cinematic: true, // démo : entitlement forcé pour la vitrine
  }
}

function CineContent() {
  const slug = useSearchParams().get('u') || ''
  const [cv, setCv] = useState<CvData | null>(null)
  const [tagline, setTagline] = useState('')
  const [cinematic, setCinematic] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.body.classList.add('cine-mode')
    return () => document.body.classList.remove('cine-mode')
  }, [])

  useEffect(() => {
    const id = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!id) { setError('Lien invalide'); return }

    let alive = true

    if (DEMO_SLUGS.has(id)) {
      // Démo vitrine : charge depuis le JSON statique
      fetch(`/data/${id}.json`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((raw: RawDemo) => {
          if (!alive) return
          setTagline(raw.tagline || '')
          setCv(demoToCv(raw, id))
          setCinematic(true)
        })
        .catch(() => alive && setError('CV introuvable'))
    } else {
      // Athlète réel : charge depuis Supabase (RLS gère la visibilité)
      getCvBySlug(id).then((data) => {
        if (!alive) return
        if (!data) { setError('CV introuvable ou accès refusé'); return }
        setTagline(data.tagline || '')
        setCv(data)
        setCinematic(!!(data.cinematic))
      })
    }

    return () => { alive = false }
  }, [slug])

  if (error) {
    return (
      <div className="cine-wrap">
        <div className="ci-locked">
          <h1>Lien invalide</h1>
          <p>{error}</p>
          <Link className="btn btn-ghost" href="/exemples" style={{ marginTop: 18 }}>← Voir l&apos;exemple</Link>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="cine-wrap">
        <div className="ci-locked"><p>Chargement…</p></div>
      </div>
    )
  }

  return <CineView cv={cv} cinematic={cinematic} tagline={tagline} />
}

export default function CinePage() {
  return <Suspense fallback={null}><CineContent /></Suspense>
}
