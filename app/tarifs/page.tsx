import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs — ATHLETE CV',
  description: 'Paiement unique. Crée ton CV d\'athlète à partir de 79 €.',
}

export default function TarifsPage() {
  return (
    <section className="section center" style={{ paddingTop: 'calc(var(--nav-h) + 90px)' }}>
      <div className="container">
        <span className="tag reveal">Tarifs</span>
        <h2 className="title reveal" data-delay="1">
          Paiement unique.<br />Pas d&apos;abonnement.
        </h2>
        <p className="lead-2 reveal" data-delay="2">
          Tu paies une fois, ton répertoire est à toi. Choisis l&apos;offre qui te ressemble.
        </p>

        <div className="grid cols-3">
          <div className="price-card reveal" data-delay="1">
            <div className="plan">Starter CV</div>
            <div className="amount">79 €</div>
            <ul className="feat">
              <li>Répertoire complet, un lien à partager</li>
              <li>3 modifications incluses</li>
              <li>Mises à jour par contact équipe (formulaire / email)</li>
            </ul>
            <Link href="/checkout?pack=starter" className="btn btn-ghost">Choisir Starter</Link>
          </div>

          <div className="price-card featured reveal" data-delay="2">
            <span className="price-badge">Populaire</span>
            <div className="plan">Pro Athlète</div>
            <div className="amount">149 €</div>
            <ul className="feat">
              <li>Tout le Starter, sans la limite</li>
              <li>Mises à jour illimitées pendant 1 an</li>
              <li>Support prioritaire + onboarding vidéo</li>
            </ul>
            <Link href="/checkout?pack=pro" className="btn btn-primary">Choisir Pro</Link>
          </div>

          <div className="price-card reveal" data-delay="3">
            <div className="plan">Club / Académie</div>
            <div className="amount">Sur devis</div>
            <ul className="feat">
              <li>Gestion d&apos;une flotte de répertoires</li>
              <li>Espace dédié multi-sport</li>
              <li>Accompagnement personnalisé</li>
            </ul>
            <Link href="/checkout?pack=club" className="btn btn-ghost">Nous contacter</Link>
          </div>
        </div>

        <p className="price-note reveal">
          Les offres Pro et Club incluent un accompagnement dédié pour faire évoluer ta page tout
          au long de la saison.
        </p>
      </div>
    </section>
  )
}
