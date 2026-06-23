import type { Metadata } from 'next'
import { Sora, Jost } from 'next/font/google'
import './globals.css'
import Navbar, { type NavUser } from '@/components/Navbar'
import Footer from '@/components/Footer'
import BgFx from '@/components/BgFx'
import CookieBanner from '@/components/CookieBanner'
import SiteEffects from '@/components/SiteEffects'
import { getAuthUser, getAuthProfile } from '@/lib/auth'
import { deriveEntitlements } from '@/lib/entitlements'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ATHLETE CV — Ton CV d\'athlète, en un lien',
  description:
    'Un CV d\'élite qui rassemble tout ton parcours d\'athlète. Un seul lien à mettre en bio ou à envoyer aux sponsors.',
}

async function getNavUser(): Promise<NavUser> {
  try {
    const user = await getAuthUser()
    if (!user) return null
    const profile = await getAuthProfile()
    const ent = deriveEntitlements(profile)
    if (!ent.isActive) return null
    return {
      email: user.email ?? '',
      isOwner: ent.isOwner,
      hasPlan: ent.hasPlan,
    }
  } catch {
    return null
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const navUser = await getNavUser()

  return (
    <html lang="fr" className={`${sora.variable} ${jost.variable}`}>
      <body>
        <BgFx />
        <Navbar user={navUser} />
        <main>{children}</main>
        <Footer />
        <CookieBanner />
        <SiteEffects />
      </body>
    </html>
  )
}
