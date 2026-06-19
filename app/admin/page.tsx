import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

/**
 * Espace Admin — réservé au owner (godpower).
 * Double protection : middleware + vérification serveur ci-dessous.
 * La gestion fine des comptes (lister/éditer tous les users) sera branchée
 * via un client service_role dédié (incrément suivant) ; elle ne peut pas
 * passer par la clé anon sans casser la RLS.
 */
export default async function AdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/login')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, is_owner')
    .eq('id', user.id)
    .single()

  if (!profile?.is_owner) redirect('/dashboard')

  return (
    <div className="app-wrap wide">
      <div className="app-head" style={{ textAlign: 'left' }}>
        <span className="tag">Admin · Godpower</span>
        <h1>Espace propriétaire.</h1>
        <p>Connecté en owner : <strong style={{ color: 'var(--gold)' }}>{profile.email}</strong></p>
      </div>

      <div className="app-card">
        <div className="app-head" style={{ textAlign: 'left', marginBottom: 16 }}>
          <h1 style={{ fontSize: '1.4rem' }}>Privilèges actifs</h1>
        </div>
        <ul className="perks" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li>✅ Lecture &amp; écriture sur tous les CV (policies RLS owner)</li>
          <li>✅ Accès aux abonnements de tous les comptes</li>
          <li>✅ Modifications illimitées, mode cinématique débloqué</li>
          <li>✅ Rôle défini en base — impossible à auto-attribuer par un autre compte</li>
        </ul>
        <p style={{ color: 'var(--muted-2)', fontSize: '.86rem', marginTop: 20 }}>
          La console de gestion des comptes (lister / éditer / supprimer les utilisateurs)
          arrive à l&apos;incrément suivant via un client <code>service_role</code> sécurisé.
        </p>
        <Link href="/dashboard" className="btn btn-ghost" style={{ marginTop: 22 }}>← Mon compte</Link>
      </div>
    </div>
  )
}
