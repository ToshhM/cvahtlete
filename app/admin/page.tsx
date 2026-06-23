import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { requireOwner } from '@/lib/guards'
import AdminUsersDashboard, { type AdminUserRow } from '@/components/admin/AdminUsersDashboard'

export default async function AdminPage() {
  const { profile, entitlements } = await requireOwner('/admin')

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('profiles')
    .select('id, email, full_name, plan, account_status, is_owner, is_super_admin, created_at')
    .order('created_at', { ascending: false })

  const users = (rows ?? []) as AdminUserRow[]

  return (
    <div className="app-wrap wide">
      <div className="app-head" style={{ textAlign: 'left' }}>
        <span className="tag">Admin · Godpower{entitlements.isSuperAdmin ? ' · Super admin' : ''}</span>
        <h1>Espace propriétaire.</h1>
        <p>
          Connecté en {entitlements.isSuperAdmin ? 'super admin' : 'owner'} :
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
          {entitlements.isSuperAdmin && <li>✅ Super admin : droits maximaux sur l&apos;administration des comptes</li>}
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
