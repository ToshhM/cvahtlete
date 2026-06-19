'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Pack { name: string; perks: string[]; price?: number; quote?: boolean }

function CheckoutContent() {
  const router = useRouter()
  const params = useSearchParams()
  const packId = params.get('pack') || 'starter'

  const [pack, setPack] = useState<Pack | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [rUser, rPacks] = await Promise.all([
        fetch('/api/me').then((r) => r.json()),
        fetch('/api/packs').then((r) => r.json()),
      ])
      if (!rUser.user) {
        router.push('/signup?next=' + encodeURIComponent('/checkout?pack=' + packId))
        return
      }
      const p = rPacks.packs?.[packId]
      if (!p) {
        setError('unknown')
      } else {
        setPack(p)
      }
      setLoading(false)
    }
    load()
  }, [packId, router])

  async function pay() {
    setPaying(true)
    setError('')
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: packId }),
      })
      const j = await r.json()
      if (!r.ok) { setError(j.error || 'Paiement impossible.'); setPaying(false); return }
      router.push('/builder?welcome=1')
    } catch {
      setError('Paiement impossible.')
      setPaying(false)
    }
  }

  if (loading) {
    return <div className="app-wrap"><div className="app-head"><h1>Chargement…</h1></div></div>
  }

  if (error === 'unknown' || !pack) {
    return (
      <div className="app-wrap">
        <div className="app-card">
          <div className="app-head">
            <h1>Offre inconnue</h1>
          </div>
          <Link className="btn btn-ghost btn-block" href="/tarifs">← Retour aux offres</Link>
        </div>
      </div>
    )
  }

  if (pack.quote) {
    return (
      <div className="app-wrap">
        <div className="app-card">
          <div className="app-head">
            <span className="tag">{pack.name}</span>
            <h1>Sur devis</h1>
            <p>Cette offre est personnalisée. Écris-nous pour un accompagnement dédié.</p>
          </div>
          <a
            className="btn btn-primary btn-block"
            href="mailto:contact@athletecv.app?subject=Offre%20Club%20%2F%20Acad%C3%A9mie"
          >
            Nous contacter
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="app-wrap">
      <div className="app-card">
        <div className="app-head" style={{ textAlign: 'left' }}>
          <span className="tag">Paiement</span>
          <h1>{pack.name}</h1>
          <p>Paiement unique, sans abonnement.</p>
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, margin: '0 0 22px' }}>
          {pack.perks.map((p, i) => (
            <li key={i} style={{ color: 'var(--muted)', display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--gold)' }}>—</span>{p}
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 22 }}>
          <span style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', fontSize: '.78rem' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '2rem' }}>{pack.price} €</span>
        </div>

        {error && <div className="alert err" style={{ marginBottom: 14 }}>{error}</div>}

        <button className="btn btn-primary btn-block btn-lg" onClick={pay} disabled={paying}>
          {paying ? 'Traitement…' : `Payer ${pack.price} €`}
        </button>

        <p className="app-alt" style={{ marginTop: 16 }}>
          🔒 Paiement de démonstration — Stripe sera branché prochainement.
        </p>
        <p className="app-alt">
          <Link href="/tarifs">← Changer d&apos;offre</Link>
        </p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return <Suspense fallback={null}><CheckoutContent /></Suspense>
}
