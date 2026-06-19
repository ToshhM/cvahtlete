'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {})
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="app-wrap">
      <div className="app-card">
        <div className="app-head">
          <span className="tag">Compte</span>
          <h1>Mot de passe oublié</h1>
          <p>Entre ton adresse e-mail pour recevoir un lien de réinitialisation.</p>
        </div>

        {sent ? (
          <div className="alert ok" style={{ marginBottom: 20 }}>
            Si un compte existe pour cette adresse, un e-mail t&apos;a été envoyé.
            Vérifie ta boîte de réception et tes spams.
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <p className="app-alt">
          <Link href="/login">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
