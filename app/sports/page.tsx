import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tous les sports — ATHLETE CV',
  description: 'Un seul moteur, tous les sports. Chaque répertoire s\'adapte à la discipline et à son univers.',
}

export default function SportsPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 'calc(var(--nav-h) + 90px)' }}>
        <div className="container">
          <div className="split">
            <div>
              <span className="tag reveal">Multi-sports</span>
              <h2 className="title reveal" data-delay="1">Un seul moteur,<br />tous les sports.</h2>
              <ul className="feature-list reveal" data-delay="2" style={{ marginTop: 34 }}>
                <li>
                  <span className="fi">🏅</span>
                  <span>
                    <strong>Chaque discipline a sa place</strong>
                    <span className="d">Football, basketball, volley, tennis, athlétisme : la terminologie et les stats s&apos;adaptent à ton sport.</span>
                  </span>
                </li>
                <li>
                  <span className="fi">📊</span>
                  <span>
                    <strong>Tes vraies stats, bien rangées</strong>
                    <span className="d">Buts, paniers, aces, records, médailles… chaque KPI trouve sa place au bon endroit, sans effort de ta part.</span>
                  </span>
                </li>
                <li>
                  <span className="fi">✨</span>
                  <span>
                    <strong>Un rendu d&apos;élite</strong>
                    <span className="d">Un template unifié, des couleurs à ton image et des animations soignées. Tu partages, ça impressionne.</span>
                  </span>
                </li>
              </ul>
              <div className="hero-actions reveal" data-delay="3" style={{ marginTop: 34 }}>
                <Link href="/exemples" className="btn btn-primary">Explorer les exemples</Link>
              </div>
            </div>
            <div className="split-visual reveal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/4.avif" alt="Athlète à l'entraînement" />
            </div>
          </div>
        </div>
      </section>

      <section className="section center">
        <div className="container reveal">
          <h2 className="title">Ton sport n&apos;est pas listé&nbsp;?</h2>
          <p className="lead-2">Le moteur s&apos;adapte à n&apos;importe quelle discipline. Crée ton répertoire, on calibre les stats avec toi.</p>
          <div className="hero-actions" style={{ marginTop: 34 }}>
            <Link href="/tarifs" className="btn btn-primary btn-lg">Créer mon répertoire</Link>
          </div>
        </div>
      </section>
    </>
  )
}
