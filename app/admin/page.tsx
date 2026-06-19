import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import AdminUsersDashboard, { type AdminUserRow } from '@/components/admin/AdminUsersDashboard'

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
    .select('email, is_owner, is_super_admin, account_status')
    .eq('id', user.id)
    .single()

  if (profile?.account_status && profile.account_status !== 'active') redirect('/login?error=inactive')
  if (!profile?.is_owner && !profile?.is_super_admin) redirect('/dashboard')

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('profiles')
    .select('id, email, full_name, plan, account_status, is_owner, is_super_admin, created_at')
    .order('created_at', { ascending: false })

  const users = (rows ?? []) as AdminUserRow[]

  return (
    <div className="app-wrap wide">
      <div className="app-head" style={{ textAlign: 'left' }}>
        <span className="tag">Admin · Godpower{profile?.is_super_admin ? ' · Super admin' : ''}</span>
        <h1>Espace propriétaire.</h1>
        <p>
          Connecté en {profile?.is_super_admin ? 'super admin' : 'owner'} :
          <strong style={{ color: 'var(--gold)' }}> {profile.email}</strong>
        </p>
      </div>

      <div className="app-card" style={{ display: 'grid', gap: 18 }}>
        <div className="app-head" style={{ textAlign: 'left', marginBottom: 4 }}>
          <h1 style={{ fontSize: '1.4rem' }}>Privilèges actifs</h1>
        </div>
        <ul className="perks" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li>✅ Lecture &amp; écriture sur tous les CV (policies RLS owner)</li>
          <li>✅ Accès aux abonnements de tous les comptes</li>
          <li>✅ Modifications illimitées, mode cinématique débloqué</li>
          <li>✅ Rôle défini en base — impossible à auto-attribuer par un autre compte</li>
          {profile?.is_super_admin && <li>✅ Super admin : droits maximaux sur l’administration des comptes</li>}
        </ul>
        <p style={{ color: 'var(--muted-2)', fontSize: '.86rem' }}>
          La console ci-dessous permet de suspendre, révoquer ou réactiver un compte.
          Les effets sont immédiats : les routes privées sont bloquées par middleware et les pages serveur.
        </p>
      </div>

      <AdminUsersDashboard currentEmail={profile.email} rows={users} />

      <div className="app-card">
        <p style={{ color: 'var(--muted-2)', fontSize: '.82rem' }}>
          Suspendu : accès temporairement bloqué. Révoqué : accès coupé de manière définitive côté application.
        </p>
        <Link href="/dashboard" className="btn btn-ghost" style={{ marginTop: 22 }}>← Mon compte</Link>
      </div>
    </div>
  )
}
