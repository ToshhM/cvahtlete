'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('acv_cookie_consent')) setVisible(true)
    } catch {}
  }, [])

  function dismiss(choice: string) {
    try { localStorage.setItem('acv_cookie_consent', choice) } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={`cookie-banner show`}>
      <p>
        🍪 On utilise uniquement un cookie strictement nécessaire à ta connexion. Aucun traçage
        publicitaire.{' '}
        <Link href="/mentions-legales">En savoir plus</Link>
      </p>
      <div className="cookie-actions">
        <button className="btn btn-ghost" onClick={() => dismiss('refused')}>
          Refuser
        </button>
        <button className="btn btn-primary" onClick={() => dismiss('accepted')}>
          Accepter
        </button>
      </div>
    </div>
  )
}
