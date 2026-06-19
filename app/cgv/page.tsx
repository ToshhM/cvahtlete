import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — ATHLETE CV',
  robots: { index: false },
}

export default function CgvPage() {
  return (
    <div className="legal">
      <h1>Conditions Générales de Vente</h1>
      <p className="upd">Dernière mise à jour : <span className="todo">[date à compléter]</span></p>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales de vente (« CGV ») régissent les ventes de services proposés par{' '}
        <span className="todo">[Nom / Raison sociale à compléter]</span> (« le Vendeur ») via le site ATHLETE CV
        (« le Site ») à toute personne y effectuant un achat (« le Client »). Toute commande implique
        l&apos;acceptation pleine et entière des présentes CGV.
      </p>

      <h2>2. Services et offres</h2>
      <p>Le Site propose la création d&apos;un CV / profil d&apos;athlète en ligne accessible via un lien. Les offres et leurs caractéristiques :</p>
      <ul>
        <li><strong>Starter CV — 79 €</strong> : CV complet, lien à partager, <strong>3 modifications incluses</strong>, mises à jour par contact équipe.</li>
        <li><strong>Pro Athlète — 149 €</strong> : mises à jour illimitées pendant 1 an, mode cinématique débloqué, support prioritaire.</li>
        <li><strong>Club / Académie</strong> : sur devis.</li>
      </ul>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros. Le Vendeur se réserve le droit de modifier ses prix à tout moment ;
        les services sont facturés sur la base des tarifs en vigueur au moment de la validation de la commande.{' '}
        <span className="todo">[Mention TVA à compléter selon le statut : « TVA non applicable, art. 293 B du CGI » ou taux applicable.]</span>
      </p>

      <h2>4. Commande et paiement</h2>
      <p>
        La commande est validée après création d&apos;un compte et paiement en ligne. Le paiement s&apos;effectue
        par les moyens proposés sur le Site. La commande n&apos;est définitive qu&apos;après confirmation du paiement.
      </p>

      <h2>5. Modifications incluses</h2>
      <p>
        L&apos;offre Starter inclut trois (3) modifications du CV après sa création. Au-delà, des modifications
        supplémentaires pourront être proposées selon les conditions communiquées par le Vendeur. L&apos;offre Pro
        inclut des mises à jour illimitées pendant douze (12) mois.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-28 du Code de la consommation, le Client reconnaît que la fourniture
        d&apos;un contenu numérique commence dès la validation de la commande et renonce expressément à son droit
        de rétractation une fois l&apos;exécution du service commencée avec son accord.{' '}
        <span className="todo">[À adapter / valider juridiquement.]</span>
      </p>

      <h2>7. Disponibilité du service</h2>
      <p>
        Le Vendeur s&apos;efforce d&apos;assurer la disponibilité du Site mais ne saurait être tenu responsable
        des interruptions liées à la maintenance, à l&apos;hébergeur ou à des causes indépendantes de sa volonté.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        Le Client est seul responsable de l&apos;exactitude des informations qu&apos;il fournit pour son CV. Le
        Vendeur ne saurait être tenu responsable des conséquences d&apos;informations erronées fournies par le Client.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans les{' '}
        <Link href="/mentions-legales" style={{ color: 'var(--accent)' }}>mentions légales</Link>.
        Le Client dispose d&apos;un droit d&apos;accès, de rectification et de suppression de ses données.
      </p>

      <h2>10. Droit applicable et litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée
        avant toute action judiciaire. À défaut, les tribunaux compétents seront ceux du ressort du siège du Vendeur.{' '}
        <span className="todo">[Médiateur de la consommation à mentionner si applicable.]</span>
      </p>

      <p style={{ marginTop: 40 }}>
        <Link href="/" style={{ color: 'var(--accent)' }}>← Retour à l&apos;accueil</Link>
      </p>
    </div>
  )
}
