import Link from 'next/link'
import Logo from './Logo'

const PAGES = [
  { href: '/', label: 'Accueil' },
  { href: '/exemples', label: 'Exemples' },
  { href: '/sports', label: 'Tous les sports' },
  { href: '/tarifs', label: 'Tarifs' },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <Link href="/" className="brand">
          <span className="mark">
            <Logo />
          </span>
          ATHLETE&nbsp;CV
        </Link>
        <div className="footer-links">
          {PAGES.map((p) => (
            <Link key={p.href} href={p.href}>
              {p.label}
            </Link>
          ))}
          <Link href="/cgv">CGV</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
        </div>
        <p className="copy">© 2026 ATHLETE CV — Ton CV d&apos;athlète, en un lien.</p>
      </div>
    </footer>
  )
}
