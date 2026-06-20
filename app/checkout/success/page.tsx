import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="app-wrap">
      <div className="app-card">
        <div className="app-head" style={{ textAlign: "left" }}>
          <span className="tag">Paiement confirme</span>
          <h1>Merci, ton paiement est valide.</h1>
          <p>
            Si tout est bien synchronise, ton plan est active en quelques secondes.
          </p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <Link className="btn btn-primary btn-block" href="/dashboard">
            Aller au dashboard
          </Link>
          <Link className="btn btn-ghost btn-block" href="/builder">
            Ouvrir le builder
          </Link>
        </div>

        <p className="app-alt" style={{ marginTop: 14 }}>
          En mode test Stripe, utilise une carte de test comme 4242 4242 4242 4242.
        </p>
      </div>
    </div>
  );
}
