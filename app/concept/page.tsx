import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pourquoi ATHLETE CV',
  description: 'Un répertoire qui te ressemble, à jour, et qui te suit toute ta carrière.',
}

export default function ConceptPage() {
  return (
    <>
      <section className="section center" style={{ paddingTop: 'calc(var(--nav-h) + 90px)' }}>
        <div className="container">
          <span className="tag reveal">Pourquoi</span>
          <h2 className="title reveal" data-delay="1">Fait pour<br />te mettre en avant.</h2>
          <p className="lead-2 reveal" data-delay="2">
            Ton sport, tes chiffres, ton histoire — réunis sur une page qui t&apos;appartient et que tu partages d&apos;un seul lien.
          </p>

          <div className="grid cols-3">
            <div className="card reveal" data-delay="1">
              <div className="ic">🔄</div>
              <h3>Toujours à jour</h3>
              <p>Tu écris ce que tu veux changer, on s&apos;occupe du reste. Ton répertoire reflète ta saison en temps réel, sans éditeur compliqué.</p>
            </div>
            <div className="card reveal" data-delay="2">
              <div className="ic">🎨</div>
              <h3>Il te ressemble</h3>
              <p>Tes couleurs, ton sport, tes moments forts. Une vitrine à ton image — pas un profil standardisé parmi des milliers d&apos;autres.</p>
            </div>
            <div className="card reveal" data-delay="3">
              <div className="ic">🔗</div>
              <h3>Un seul lien, partout</h3>
              <p>En bio Instagram, en signature, sur un dossier sponsor. Une adresse unique qui te suit toute ta carrière.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section center">
        <div className="container reveal">
          <h2 className="title">Tu paies une fois.<br />C&apos;est à toi.</h2>
          <p className="lead-2">Pas d&apos;abonnement, pas de mauvaise surprise. Ton répertoire t&apos;appartient et grandit avec toi.</p>
          <div className="hero-actions" style={{ marginTop: 34 }}>
            <Link href="/exemples" className="btn btn-primary btn-lg">Voir des exemples</Link>
            <Link href="/tarifs" className="btn btn-ghost btn-lg">Les offres</Link>
          </div>
        </div>
      </section>
    </>
  )
}
