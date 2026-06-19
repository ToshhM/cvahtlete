import type { Metadata } from 'next'
import { Sora, Jost } from 'next/font/google'
import './globals.css'
import Navbar, { type NavUser } from '@/components/Navbar'
import Footer from '@/components/Footer'
import BgFx from '@/components/BgFx'
import CookieBanner from '@/components/CookieBanner'
import SiteEffects from '@/components/SiteEffects'
import { createClient } from '@/utils/supabase/server'

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

/** Lit l'utilisateur côté serveur (cookies httpOnly). Ne casse pas si Supabase
 *  n'est pas encore configuré (.env.local absent). */
async function getNavUser(): Promise<NavUser> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_owner, plan')
      .eq('id', user.id)
      .single()
    return {
      email: user.email ?? '',
      isOwner: !!profile?.is_owner,
      hasPlan: !!profile && profile.plan !== 'free',
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
