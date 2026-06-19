import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ATHLETE CV — Ton CV d\'athlète, en un lien',
  description:
    'Le profil qui te fait signer. Stats, palmarès et moments forts réunis sur une page que tu envoies aux clubs, agents et sponsors. Un seul lien.',
}

/* Catégories repositionnées : sorties du milieu de page, remontées juste sous
   le hero comme première preuve de valeur. Données pilotées par un tableau —
   layout cohérent, copy orientée résultat. */
const AUDIENCES = [
  {
    ic: '🤝',
    t: 'Aux sponsors',
    d: 'Une vitrine qui chiffre ta valeur. Tu inspires confiance avant même le premier rendez-vous.',
  },
  {
    ic: '🏟️',
    t: 'Aux clubs & agents',
    d: 'Tout ton dossier sportif à jour, prêt à convaincre. Fini les PDF lourds qui finissent ignorés.',
  },
  {
    ic: '🔗',
    t: 'En bio Instagram',
    d: 'Un lien propre dans ta bio. Recruteurs et fans accèdent à tout ton profil en un seul tap.',
  },
]

const STEPS = [
  { n: '01', t: 'Crée ton profil', d: 'Stats, palmarès, parcours, vidéos. Notre builder te guide section par section.' },
  { n: '02', t: 'Personnalise', d: 'Photo, couleurs, ordre des blocs. Ton univers, ta discipline, ton identité.' },
  { n: '03', t: 'Partage le lien', d: 'Un seul lien à envoyer ou mettre en bio. À jour en permanence, jamais périmé.' },
]

export default function HomePage() {
  return (
    <>
      {/* ============================ HERO ============================ */}
      <header className="hero">
        {/* Une seule image statique : le crossfade de 3 calques plein écran
            en mix-blend-mode coûtait une recomposition GPU permanente */}
        <div className="hero-montage" aria-hidden="true">
          <img src="/images/4.avif" alt="" />
        </div>
        <div className="hero-glyphs" aria-hidden="true">
          <span style={{ left: '8%', top: '24%', animationDuration: '13s' }}>⚽</span>
          <span style={{ left: '84%', top: '18%', animationDuration: '15s', animationDelay: '1s' }}>🎾</span>
          <span style={{ left: '16%', top: '70%', animationDuration: '14s', animationDelay: '.6s' }}>🏀</span>
          <span style={{ left: '78%', top: '66%', animationDuration: '16s', animationDelay: '1.4s' }}>⚡</span>
          <span style={{ left: '90%', top: '44%', animationDuration: '15.5s', animationDelay: '.9s' }}>🏆</span>
        </div>
        <div className="container">
          <div className="eyebrow reveal">
            <span className="dot" />
            Le CV des athlètes
          </div>
          <h1 className="display reveal" data-delay="1">
            Le profil qui<br />
            <span className="grad">te fait signer.</span>
          </h1>
          <p className="lead reveal" data-delay="2">
            Stats, palmarès et moments forts réunis sur une page d&apos;élite. À envoyer aux clubs,
            aux agents, aux sponsors. Un seul lien — toujours à jour.
          </p>
          <div className="hero-actions reveal" data-delay="3">
            <Link href="/tarifs" className="btn btn-primary btn-lg">Créer mon profil</Link>
            <Link href="/exemples" className="btn btn-ghost btn-lg">Voir un exemple</Link>
          </div>
        </div>
        <div className="scroll-cue">
          Découvrir
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </header>

      {/* ===================== BANDE DE MÉTRIQUES =====================
          Preuve de valeur immédiate sous le hero. Compteurs animés (.count)
          déclenchés par l'IntersectionObserver de SiteEffects. */}
      <section className="metrics-band">
        <div className="container">
          <div className="metrics reveal">
            <div className="metric">
              <div className="v"><span className="count" data-to="1">1</span> lien</div>
              <div className="l">Tout ton profil, zéro dossier</div>
            </div>
            <div className="metric">
              <div className="v"><span className="count" data-to="40">40</span> sec</div>
              <div className="l">Pour le partager où ça compte</div>
            </div>
            <div className="metric">
              <div className="v"><span className="count" data-to="100">100</span>% à jour</div>
              <div className="l">Modifie une fois, partout corrigé</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CATÉGORIES (repositionnées) ===================== */}
      <section className="section center" style={{ paddingTop: '90px' }}>
        <div className="container">
          <span className="tag reveal">Fait pour être partagé</span>
          <h2 className="title reveal" data-delay="1">Là où ça change tout.</h2>
          <p className="lead-2 reveal" data-delay="2">
            Un même profil, trois portes d&apos;entrée vers ta carrière.
          </p>
          <div className="grid cols-3">
            {AUDIENCES.map((a, i) => (
              <div className="card audience-card reveal" data-delay={i + 1} key={a.t}>
                <span className="audience-idx">{String(i + 1).padStart(2, '0')}</span>
                <div className="ic">{a.ic}</div>
                <h3>{a.t}</h3>
                <p>{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PROBLÈME → SOLUTION ===================== */}
      <section className="section center">
        <div className="container">
          <span className="tag reveal">Une page. Tout toi.</span>
          <h2 className="title reveal" data-delay="1">
            Fini les PDF dépassés<br />et les DM brouillons.
          </h2>
          <p className="lead-2 reveal" data-delay="2">
            Ton talent mérite mieux qu&apos;un fichier oublié dans une boîte mail. ATHLETE CV
            transforme ton parcours en une vitrine vivante : stats, palmarès, vidéos et contact,
            réunis et toujours actuels.
          </p>
        </div>
      </section>

      {/* ===================== COMMENT ÇA MARCHE ===================== */}
      <section className="section center">
        <div className="container">
          <span className="tag reveal">En 3 étapes</span>
          <h2 className="title reveal" data-delay="1">Prêt en quelques minutes.</h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step reveal" data-delay={i + 1} key={s.n}>
                <span className="step-n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SHOWCASE (exemple réel) ===================== */}
      <section className="section center">
        <div className="container">
          <span className="tag reveal">Vu en vrai</span>
          <h2 className="title reveal" data-delay="1">À quoi ça ressemble.</h2>
          <Link className="showcase reveal" data-delay="2" href="/profil?a=dembele">
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

      {/* ===================== CTA FINAL ===================== */}
      <section className="section center">
        <div className="container reveal">
          <h2 className="title">Ton prochain contrat<br />commence par un lien.</h2>
          <p className="lead-2">Crée ton profil aujourd&apos;hui. Partage-le avant ton prochain match.</p>
          <div className="hero-actions" style={{ marginTop: 36 }}>
            <Link href="/tarifs" className="btn btn-primary btn-lg">Créer mon profil</Link>
            <Link href="/exemples" className="btn btn-ghost btn-lg">Voir l&apos;exemple</Link>
          </div>
        </div>
      </section>
    </>
  )
}
