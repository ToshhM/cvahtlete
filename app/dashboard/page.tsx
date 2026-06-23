import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { requireAuth } from '@/lib/guards'
import { signOut } from '@/app/actions/auth'

const PLAN_LABEL: Record<string, string> = {
  free: 'Aucune offre',
  starter: 'Starter',
  pro: 'Pro',
  club: 'Club',
}

export default async function DashboardPage() {
  const { user, profile, entitlements } = await requireAuth('/dashboard')
  const { plan, hasPlan, isOwner, isSuperAdmin, cinematic } = entitlements

  const supabase = createClient()
  const { data: cv } = await supabase
    .from('cvs').select('slug, visibility').eq('user_id', user.id).maybeSingle()

  const firstName = (profile.full_name || '').split(' ')[0] || 'athlète'

  return (
    <div className="app-wrap wide">
      <div className="app-head" style={{ textAlign: 'left' }}>
        <span className="tag">Mon compte</span>
        <h1>Bonjour, {firstName}.</h1>
        <p>
          {profile.email}
          {isSuperAdmin ? (
            <> · <strong style={{ color: 'var(--gold)' }}>Super admin · Godpower</strong></>
          ) : isOwner ? (
            <> · <strong style={{ color: 'var(--gold)' }}>Owner · Godpower</strong></>
          ) : null}
        </p>
      </div>

      <div className="dash-grid">
        <div className="dash-plan">
          <span className={`pill${hasPlan || isOwner ? '' : ' none'}`}>
            {isOwner ? 'Accès illimité' : PLAN_LABEL[plan]}
          </span>
          <h2>{isOwner ? 'Club · Godpower' : PLAN_LABEL[plan]}</h2>
          {hasPlan || isOwner ? (
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginTop: 12 }}>
              Modifications : <strong>{isOwner ? 'illimitées' : 'selon ton offre'}</strong>
              {isOwner && ' · tous les privilèges débloqués'}
            </p>
          ) : (
            <>
              <p style={{ color: 'var(--muted)', margin: '14px 0 22px' }}>
                Tu n&apos;as pas encore d&apos;offre. Choisis un pack pour débloquer ton répertoire.
              </p>
              <Link href="/tarifs" className="btn btn-primary">Voir les offres</Link>
            </>
          )}
        </div>

        <div className="dash-aside">
          <Link href={hasPlan || isOwner ? '/builder' : '/tarifs'} className={`dash-link${hasPlan || isOwner ? '' : ' lock'}`}>
            <span>
              <span className="t">{hasPlan || isOwner ? 'Mon répertoire' : 'Créer mon répertoire'}</span>
              <span className="d">{hasPlan || isOwner ? 'Construis et mets à jour ta page' : "Disponible après l'achat d'une offre"}</span>
            </span>
            <span className="arrow">{hasPlan || isOwner ? '→' : '🔒'}</span>
          </Link>

          {cv?.slug && (
            <Link href={`/profil?me=1`} target="_blank" className="dash-link">
              <span>
                <span className="t">Voir ma page</span>
                <span className="d">Aperçu public de ton CV</span>
              </span>
              <span className="arrow">↗</span>
            </Link>
          )}

          {cv?.slug && cinematic && (
            <Link href={`/cine?u=${cv.slug}`} target="_blank" className="dash-link">
              <span>
                <span className="t">🎬 Mode cinématique</span>
                <span className="d">Ton CV en version immersive (Pro)</span>
              </span>
              <span className="arrow">↗</span>
            </Link>
          )}

          {isOwner && (
            <Link href="/admin" className="dash-link">
              <span>
                <span className="t">Espace Admin</span>
                <span className="d">Gérer les comptes & offres</span>
              </span>
              <span className="arrow">→</span>
            </Link>
          )}

          <form action={signOut}>
            <button
              type="submit"
              className="dash-link"
              style={{ width: '100%', background: 'none', border: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              <span>
                <span className="t">Déconnexion</span>
                <span className="d">Fermer la session</span>
              </span>
              <span className="arrow">⎋</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
