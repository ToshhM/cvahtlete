import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exemple de profil — ATHLETE CV',
  description: 'Découvre un profil d\'athlète ATHLETE CV en conditions réelles.',
}

export default function ExemplesPage() {
  return (
    <>
      <section className="section center" style={{ paddingTop: 'calc(var(--nav-h) + 90px)' }}>
        <div className="container">
          <span className="tag reveal">Exemple · En conditions réelles</span>
          <h2 className="title reveal" data-delay="1">
            Un profil,<br />toute une carrière.
          </h2>
          <p className="lead-2 reveal" data-delay="2">
            Voilà ce que reçoit un club, un agent ou un sponsor quand tu partages ton lien.
            Clique pour explorer le profil complet.
          </p>

          <Link className="showcase reveal" data-delay="1" href="/profil?a=dembele">
            <div className="showcase-media">
              <img src="/images/4.avif" alt="Profil d'Ousmane Dembélé sur ATHLETE CV" loading="lazy" />
              <span className="showcase-emoji">⚽</span>
            </div>
            <div className="showcase-body">
              <span className="showcase-badge">🏅 Ballon d&apos;Or 2025</span>
              <div className="showcase-name">Ousmane Dembélé</div>
              <div className="showcase-sport">⚽ Football · Ailier · Paris SG</div>
              <div className="showcase-stats">
                <div><div className="v count" data-to="57">57</div><div className="l">Sélections 🇫🇷</div></div>
                <div><div className="v">100M€</div><div className="l">Valeur</div></div>
              </div>
              <span className="showcase-link">Explorer le profil →</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="section center">
        <div className="container reveal">
          <span className="tag">Version premium</span>
          <h2 className="title">Envie de spectaculaire&nbsp;?</h2>
          <p className="lead-2">
            La version cinématique interactive — image plein écran, scène animée et révélation
            au survol. Une expérience qui marque les esprits.
          </p>
          <div className="hero-actions" style={{ marginTop: 34 }}>
            <a href="/cine?u=dembele" className="btn btn-primary">Voir le mode cinématique ⚽</a>
          </div>
        </div>
      </section>
    </>
  )
}
