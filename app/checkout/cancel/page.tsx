import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="app-wrap">
      <div className="app-card">
        <div className="app-head" style={{ textAlign: "left" }}>
          <span className="tag">Paiement annule</span>
          <h1>Le paiement n&apos;a pas ete termine.</h1>
          <p>Tu peux reprendre ton achat quand tu veux.</p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <Link className="btn btn-primary btn-block" href="/tarifs">
            Revenir aux offres
          </Link>
          <Link className="btn btn-ghost btn-block" href="/dashboard">
            Retour dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
