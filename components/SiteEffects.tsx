'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Effets globaux du site — règle d'or PERFORMANCE :
 * aucun travail au repos. Tout est événementiel (scroll, survol, entrée
 * dans le viewport) ou one-shot (entrée de page). Zéro boucle infinie.
 */
export default function SiteEffects() {
  const pathname = usePathname()

  // Machines modestes : décor allégé via la classe perf-lite (CSS).
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number }
    if ((nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4) {
      document.documentElement.classList.add('perf-lite')
    }
  }, [])

  // Re-câblé à CHAQUE navigation (l'ancienne version ne tournait qu'au premier
  // chargement : les .reveal des pages suivantes restaient invisibles).
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ac = new AbortController()
    const { signal } = ac

    // --- Entrée de page : one-shot WAAPI, aucun coût après 400 ms ----------
    const main = document.querySelector('main')
    if (main && !prefersReduced) {
      main.animate(
        [
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 400, easing: 'cubic-bezier(.22,.61,.36,1)' }
      )
    }

    // --- Reveal on scroll + compteurs ---------------------------------------
    // Révèle un élément : pose .in (déclenche la transition CSS), lance les
    // compteurs, cesse de l'observer.
    const reveal = (el: Element) => {
      if (el.classList.contains('in')) return
      el.classList.add('in')
      el.querySelectorAll<HTMLElement>('.count').forEach(animateCount)
      io?.unobserve(el)
    }

    // Filet de sécurité « tourne de partout » : si IntersectionObserver est
    // absent ou ne se déclenche pas (vieux mobiles, webviews, onglet en
    // arrière-plan), le contenu ne doit JAMAIS rester invisible. On révèle
    // tout ce qui entre dans le viewport — à l'init ET à chaque frame de scroll.
    const revealVisible = () => {
      const vh = window.innerHeight * 0.92
      document.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((el) => {
        if (el.getBoundingClientRect().top < vh) reveal(el)
      })
    }

    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) reveal(e.target) }),
            { threshold: 0.14, rootMargin: '0px 0px -50px 0px' }
          )
        : null
    if (io) document.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((el) => io.observe(el))
    else document.querySelectorAll<HTMLElement>('.reveal').forEach(reveal)

    // --- Hero hors écran => toutes ses animations en pause (CSS .offstage) --
    const hero = document.querySelector<HTMLElement>('.hero')
    let heroIo: IntersectionObserver | null = null
    if (hero) {
      heroIo = new IntersectionObserver(
        ([e]) => hero.classList.toggle('offstage', !e.isIntersecting),
        { threshold: 0 }
      )
      heroIo.observe(hero)
    }

    // --- Barre de progression (transform = composité, pas de layout) --------
    const bar = document.createElement('div')
    bar.className = 'scroll-progress'
    document.body.appendChild(bar)

    // --- UN SEUL rAF par frame de scroll pour tout : progression, parallaxe
    //     hero, parallaxe des anneaux (--scrolly). S'arrête dès que le scroll
    //     s'arrête : c'est ça qui laisse le GPU au repos. -----------------------
    const heroCont = document.querySelector<HTMLElement>('.hero > .container')
    const cue = document.querySelector<HTMLElement>('.scroll-cue')
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const h = document.documentElement.scrollHeight - window.innerHeight
        bar.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`
        document.documentElement.style.setProperty('--scrolly', String(y))
        if (cue) {
          cue.style.opacity = String(Math.max(0, 1 - y / 90))
          cue.style.pointerEvents = y > 20 ? 'none' : ''
        }
        if (heroCont && !prefersReduced && y < window.innerHeight) {
          const p = y / window.innerHeight
          heroCont.style.transform = `translateY(${y * 0.28}px) scale(${1 - p * 0.06})`
          heroCont.style.opacity = String(1 - p * 1.05)
        }
        revealVisible() // garantit l'apparition même si l'IO ne se déclenche pas
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true, signal })
    window.addEventListener('resize', onScroll, { signal })
    onScroll()

    // --- Tilt 3D des cartes : ne coûte que sous le curseur ------------------
    if (!prefersReduced && !window.matchMedia('(pointer: coarse)').matches) {
      document
        .querySelectorAll<HTMLElement>('.card, .athlete-card, .price-card, .dash-link')
        .forEach((card) => {
          card.classList.add('tilt')
          card.addEventListener(
            'pointermove',
            (e) => {
              const r = card.getBoundingClientRect()
              const px = (e.clientX - r.left) / r.width - 0.5
              const py = (e.clientY - r.top) / r.height - 0.5
              card.style.transform = `perspective(900px) rotateX(${-py * 6}deg) rotateY(${px * 6}deg) translateY(-5px)`
            },
            { signal }
          )
          card.addEventListener('pointerleave', () => { card.style.transform = '' }, { signal })
        })
    }

    return () => {
      ac.abort() // retire TOUS les listeners d'un coup (l'ancienne version fuyait)
      io?.disconnect()
      heroIo?.disconnect()
      bar.remove()
    }
  }, [pathname])

  return null
}

function animateCount(el: HTMLElement) {
  if (el.dataset.counted) return
  const raw = (el.dataset.to || el.textContent || '').trim()
  const m = raw.match(/^(\d+(?:[.,]\d+)?)/)
  if (!m) return
  el.dataset.counted = '1'
  const numStr = m[1]
  const end = parseFloat(numStr.replace(',', '.'))
  const decimals = (numStr.split(/[.,]/)[1] || '').length
  const suffix = raw.slice(m[0].length)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = numStr + suffix
    return
  }
  const dur = 1200
  const t0 = performance.now()
  el.classList.add('counting')
  function tick(t: number) {
    const p = Math.min(1, (t - t0) / dur)
    const eased = 1 - Math.pow(1 - p, 3)
    const val = (end * eased).toFixed(decimals).replace('.', ',')
    el.textContent = val + suffix
    if (p < 1) requestAnimationFrame(tick)
    else { el.textContent = numStr + suffix; el.classList.remove('counting') }
  }
  requestAnimationFrame(tick)
}
