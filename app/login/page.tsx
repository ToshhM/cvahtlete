'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn(new FormData(e.currentTarget))
    // En cas de succès la Server Action redirige (le code ci-dessous ne s'exécute pas).
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="app-wrap">
      <div className="app-card">
        <div className="app-head">
          <span className="tag">Connexion</span>
          <h1>Bon retour.</h1>
          <p>Accède à ton répertoire et à ton compte.</p>
        </div>
        {error && <div className="alert err">{error}</div>}
        <form onSubmit={onSubmit}>
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <div className="pw-wrap">
              <input
                id="password" name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password" required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}>
                {showPw ? 'Cacher' : 'Voir'}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Link href="/mot-de-passe-oublie" style={{ color: 'var(--accent)', fontSize: '0.82rem', textDecoration: 'none' }}>
                Mot de passe oublié&nbsp;?
              </Link>
            </div>
          </div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="app-alt">
          Pas encore de compte&nbsp;?{' '}
          <Link href={`/signup${next !== '/dashboard' ? '?next=' + encodeURIComponent(next) : ''}`}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>
}
