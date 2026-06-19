'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getMyCv } from '@/app/actions/cv'
import ProfileView from '@/components/ProfileView'
import type { CvData } from '@/app/actions/cv'

// ─── Adaptateur preview ──────────────────────────────────────────────────────
// Le builder envoie son état camelCase via postMessage.
// On le mappe vers CvData (même convention) — aucune conversion de noms.
interface BuilderMsg {
  first?: string; last?: string; sport?: string; emoji?: string
  discipline?: string; tagline?: string; bio?: string; location?: string
  colors?: { a: string; b: string }
  avatar?: string; photoPosX?: number; photoPosY?: number; cropZoomAvatar?: number
  cineBg?: string; verified?: boolean
  stats?: unknown[]; palmares?: unknown[]; career?: unknown[]; links?: unknown[]
  visibility?: string; slug?: string
}

function previewToCv(b: BuilderMsg): CvData {
  return {
    slug: b.slug || '_preview',
    first: b.first || '', last: b.last || '',
    sport: b.sport || '', emoji: b.emoji,
    discipline: b.discipline, tagline: b.tagline, bio: b.bio, location: b.location,
    verified: b.verified,
    colors: b.colors ?? { a: '#8bb6ff', b: '#79e0cf' },
    avatar: b.avatar,
    photoPosX: b.photoPosX, photoPosY: b.photoPosY, cropZoomAvatar: b.cropZoomAvatar,
    stats: b.stats ?? [], palmares: b.palmares ?? [],
    career: b.career ?? [], links: b.links ?? [],
    visibility: b.visibility,
  }
}

// ─── Composant principal ─────────────────────────────────────────────────────

function ProfilContent() {
  const params = useSearchParams()
  const isPreview = params.has('preview')
  const meParam = params.has('me')
  const demoId = params.get('a') // ex: ?a=dembele (JSON de démo)

  const [cv, setCv] = useState<CvData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Masque nav/footer dans l'iframe du builder
  useEffect(() => {
    if (!isPreview) return
    document.body.classList.add('preview-mode')
    return () => document.body.classList.remove('preview-mode')
  }, [isPreview])

  // Preview : attend le postMessage du builder
  useEffect(() => {
    if (!isPreview) return
    function onMsg(e: MessageEvent) {
      if (e.data?.type === 'acv-cv' && e.data.cv) {
        try { setCv(previewToCv(e.data.cv as BuilderMsg)) } catch {}
      }
    }
    window.addEventListener('message', onMsg)
    window.parent?.postMessage({ type: 'acv-preview-ready' }, '*')
    return () => window.removeEventListener('message', onMsg)
  }, [isPreview])

  // Mon profil
  useEffect(() => {
    if (!meParam) return
    getMyCv().then((data) => {
      if (data) setCv(data)
      else setError('Aucun répertoire trouvé. Crée ton profil dans le builder.')
    })
  }, [meParam])

  // Profil démo JSON (exemples vitrine)
  useEffect(() => {
    if (!demoId || meParam || isPreview) return
    const id = demoId.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    fetch(`/data/${id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((raw) => setCv(raw as CvData))
      .catch(() => setError('Profil de démonstration introuvable.'))
  }, [demoId, meParam, isPreview])

  if (isPreview && !cv) {
    return (
      <div id="profileRoot" className="profile-wrap">
        <div className="p-loading">Aperçu en attente…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div id="profileRoot" className="profile-wrap">
        <div className="p-error">
          <h2 style={{ fontFamily: 'var(--font-display)' }}>{error}</h2>
          <p style={{ marginTop: 10 }}>Ce répertoire n&apos;existe pas encore.</p>
          <Link className="btn btn-ghost" style={{ marginTop: 20 }} href="/exemples">← Voir les exemples</Link>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div id="profileRoot" className="profile-wrap">
        <div className="p-loading">Chargement…</div>
      </div>
    )
  }

  return <ProfileView cv={cv} isPreview={isPreview} isOwn={meParam} />
}

export default function ProfilPage() {
  return <Suspense fallback={null}><ProfilContent /></Suspense>
}
