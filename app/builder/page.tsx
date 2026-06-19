'use client'

import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getMyProfile } from '@/app/actions/auth'
import { getMyCv, upsertCv } from '@/app/actions/cv'
import { uploadImage } from '@/app/actions/upload'

const PLAN_LABEL: Record<string, string> = {
  free: 'Aucune offre', starter: 'Starter', pro: 'Pro', club: 'Club',
}

const SPORTS: Record<string, { emoji: string; a: string; b: string }> = {
  Football:     { emoji: '⚽', a: '#c6f932', b: '#5cf0c0' },
  Basketball:   { emoji: '🏀', a: '#ff7a45', b: '#ffb347' },
  Tennis:       { emoji: '🎾', a: '#ff9f45', b: '#ffd23f' },
  Volley:       { emoji: '🏐', a: '#38d8ff', b: '#7c5cff' },
  'Athlétisme': { emoji: '⚡', a: '#ffd23f', b: '#34d399' },
  Rugby:        { emoji: '🏉', a: '#8b5cff', b: '#38d8ff' },
  Autre:        { emoji: '🏅', a: '#b08d57', b: '#d8b87a' },
}

interface Row { [k: string]: string }
interface User {
  plan?: string | null; planName?: string
  modificationsLeft?: number
  entitlements?: { cinematic?: boolean }
  cv?: { slug?: string } | null
}

const ROWDEF: Record<string, [string, string][]> = {
  stats:    [['label', 'Libellé'], ['value', 'Valeur'], ['unit', 'Unité']],
  palmares: [['icon', '🏆'], ['name', 'Titre'], ['count', '×']],
  career:   [['year', 'Année'], ['club', 'Étape'], ['detail', 'Détail']],
}

function cropTf(x = 50, y = 50, z = 1.4) {
  const m = (z - 1) / 2 * 100
  return `translate(${(m * (1 - x / 50)).toFixed(2)}%,${(m * (1 - y / 50)).toFixed(2)}%) scale(${z})`
}

type RowSection = 'stats' | 'palmares' | 'career'

function DynRows({ kind, rows, onChange }: { kind: RowSection; rows: Row[]; onChange: (rows: Row[]) => void }) {
  function update(i: number, k: string, v: string) {
    onChange(rows.map((r, j) => j === i ? { ...r, [k]: v } : r))
  }
  function remove(i: number) { onChange(rows.filter((_, j) => j !== i)) }
  function add() { const e: Row = {}; ROWDEF[kind].forEach(([k]) => e[k] = ''); onChange([...rows, e]) }

  return (
    <>
      <div className="stat-rows">
        {rows.map((row, i) => (
          <div key={i} className="stat-row">
            {ROWDEF[kind].map(([k, ph]) => (
              <input key={k} className="mini" placeholder={ph} value={row[k] || ''}
                onChange={(e) => update(i, k, e.target.value)}
                style={k === 'icon' || k === 'unit' || k === 'count' ? { maxWidth: 90 } : undefined}
              />
            ))}
            <button type="button" className="icon-btn" title="Supprimer" onClick={() => remove(i)}>✕</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost" onClick={add} style={{ padding: '8px 16px', marginTop: 8 }}>
        + Ajouter
      </button>
    </>
  )
}

function CropBox({
  label, hint, src, posX, posY, zoom, circle,
  onPosChange, onZoomChange, onFile,
}: {
  label: string; hint: string
  src: string; posX: number; posY: number; zoom: number; circle?: boolean
  onPosChange: (x: number, y: number) => void
  onZoomChange: (z: number) => void
  onFile: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setUploadErr('')
    const fd = new FormData(); fd.append('image', file)
    const result = await uploadImage(fd)
    setUploading(false)
    if ('error' in result) { setUploadErr(result.error); return }
    onFile(result.url)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!src) return
    drag.current = { x: e.clientX, y: e.clientY, sx: posX, sy: posY }
    boxRef.current?.setPointerCapture(e.pointerId)
    boxRef.current?.classList.add('dragging')
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !boxRef.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    const vx = Math.max(0, Math.min(100, Math.round(drag.current.sx - dx / boxRef.current.offsetWidth * 250)))
    const vy = Math.max(0, Math.min(100, Math.round(drag.current.sy - dy / boxRef.current.offsetHeight * 250)))
    onPosChange(vx, vy)
  }
  function onPointerUp() { drag.current = null; boxRef.current?.classList.remove('dragging') }
  function adjustZoom(d: number) {
    onZoomChange(Math.max(1.0, Math.min(2.0, parseFloat((zoom + d).toFixed(2)))))
  }

  return (
    <div className="field">
      <label>{label}</label>
      <input ref={fileRef} type="file" accept="image/*" className="file-input" onChange={handleFile} />
      <div ref={boxRef} className={`crop-box${circle ? ' circle' : ' wide'}`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      >
        {uploading && <div className="ph">Envoi…</div>}
        {!uploading && src && (
          <>
            <img src={src} style={{ transform: cropTf(posX, posY, zoom), transformOrigin: 'center' }} alt="" />
            <span className="grip">✛ glisse</span>
          </>
        )}
        {!uploading && !src && <div className="ph">{hint}</div>}
      </div>
      {uploadErr && <p style={{ color: 'var(--error, #ff6b6b)', fontSize: '.8rem', marginTop: 4 }}>{uploadErr}</p>}
      <div className="crop-zoom-ctrl">
        <button type="button" className="crop-zoom-btn" onClick={() => adjustZoom(-0.1)}>−</button>
        <span className="crop-zoom-val">{zoom.toFixed(2)}×</span>
        <button type="button" className="crop-zoom-btn" onClick={() => adjustZoom(0.1)}>+</button>
      </div>
      <div className="crop-hint">✛ Glisse l&apos;image pour cadrer</div>
    </div>
  )
}

function BuilderContent() {
  const router = useRouter()
  const params = useSearchParams()
  const welcome = params.has('welcome')

  const [user, setUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [alertMsg, setAlertMsg] = useState<{ msg: string; ok: boolean; link?: string; slug?: string } | null>(null)
  const [previewReady, setPreviewReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [sport, setSport] = useState('Football')
  const [discipline, setDiscipline] = useState('')
  const [bio, setBio] = useState('')
  const [tagline, setTagline] = useState('')
  const [location, setLocation] = useState('')
  const [colorA, setColorA] = useState('#c6f932')
  const [colorB, setColorB] = useState('#5cf0c0')
  const [instagram, setInstagram] = useState('')
  const [xUrl, setXUrl] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [avatar, setAvatar] = useState('')
  const [photoPosX, setPhotoPosX] = useState(50)
  const [photoPosY, setPhotoPosY] = useState(50)
  const [cropZoomAvatar, setCropZoomAvatar] = useState(1.4)
  const [cineBg, setCineBg] = useState('')
  const [cineBgPosX, setCineBgPosX] = useState(50)
  const [cineBgPosY, setCineBgPosY] = useState(50)
  const [cropZoomCineBg, setCropZoomCineBg] = useState(1.25)
  const [stats, setStats] = useState<Row[]>([{ label: '', value: '', unit: '' }])
  const [palmares, setPalmares] = useState<Row[]>([{ icon: '🏆', name: '', count: '' }])
  const [career, setCareer] = useState<Row[]>([{ year: '', club: '', detail: '' }])

  function buildMsg() {
    return {
      first, last, sport,
      emoji: SPORTS[sport]?.emoji || '🏅',
      discipline, tagline, bio, location,
      avatar: avatar || undefined,
      photoPosX, photoPosY, cropZoomAvatar,
      cineBg: cineBg || undefined,
      cineBgPosX, cineBgPosY, cropZoomCineBg,
      colors: { a: colorA, b: colorB },
      verified: true,
      stats: stats.filter((r) => Object.values(r).some((v) => v?.trim())),
      palmares: palmares.filter((r) => Object.values(r).some((v) => v?.trim())),
      career: career.filter((r) => Object.values(r).some((v) => v?.trim())),
      links: [
        instagram && { label: 'Instagram', icon: 'instagram', url: instagram },
        xUrl && { label: 'X', icon: 'x', url: xUrl },
      ].filter(Boolean),
      visibility, slug: user?.cv?.slug,
    }
  }

  const syncPreview = useCallback(() => {
    if (!previewReady || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'acv-cv', cv: buildMsg() }, '*')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewReady, first, last, sport, discipline, bio, tagline, location, colorA, colorB,
      avatar, photoPosX, photoPosY, cropZoomAvatar, cineBg, cineBgPosX, cineBgPosY, cropZoomCineBg,
      stats, palmares, career, instagram, xUrl, visibility])

  useEffect(() => { syncPreview() }, [syncPreview])

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === 'acv-preview-ready') setPreviewReady(true)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  // Auth + pré-remplissage depuis la DB
  useEffect(() => {
    getMyProfile().then((p) => {
      if (!p) { router.push('/login?next=/builder'); return }
      if (p.plan === 'free' && !p.isOwner) { router.push('/tarifs'); return }
      setUser({
        plan: p.plan, planName: PLAN_LABEL[p.plan],
        modificationsLeft: p.isOwner ? -1 : 0,
        entitlements: { cinematic: p.cinematic },
        cv: null,
      })
    })
    getMyCv().then((cv) => {
      if (!cv) return
      setUser((u) => u ? { ...u, cv: { slug: cv.slug } } : u)
      setFirst(cv.first || '')
      setLast(cv.last || '')
      setSport(cv.sport || 'Football')
      setDiscipline(cv.discipline || '')
      setBio(cv.bio || '')
      setTagline(cv.tagline || '')
      setLocation(cv.location || '')
      setColorA(cv.colors?.a || SPORTS[cv.sport]?.a || '#c6f932')
      setColorB(cv.colors?.b || SPORTS[cv.sport]?.b || '#5cf0c0')
      setAvatar(cv.avatar || '')
      setPhotoPosX(cv.photoPosX ?? 50)
      setPhotoPosY(cv.photoPosY ?? 50)
      setCropZoomAvatar(cv.cropZoomAvatar ?? 1.4)
      setCineBg(cv.cineBg || '')
      setCineBgPosX(cv.cineBgPosX ?? 50)
      setCineBgPosY(cv.cineBgPosY ?? 50)
      setCropZoomCineBg(cv.cropZoomCineBg ?? 1.25)
      if ((cv.stats as Row[])?.length) setStats(cv.stats as Row[])
      if ((cv.palmares as Row[])?.length) setPalmares(cv.palmares as Row[])
      if ((cv.career as Row[])?.length) setCareer(cv.career as Row[])
      const lks = (cv.links as Array<{ label: string; icon: string; url: string }> | undefined) ?? []
      setInstagram(lks.find((l) => l.icon === 'instagram')?.url || '')
      setXUrl(lks.find((l) => l.icon === 'x')?.url || '')
      setVisibility(cv.visibility || 'private')
    })
  }, [router])

  async function save() {
    if (!first || !last) {
      setAlertMsg({ msg: 'Renseigne au moins ton prénom et ton nom.', ok: false })
      return
    }
    setSaving(true)
    const result = await upsertCv({
      first, last, sport, discipline: discipline || undefined,
      tagline: tagline || undefined, bio: bio || undefined, location: location || undefined,
      colors: { a: colorA, b: colorB },
      avatar: avatar || undefined, photoPosX, photoPosY, cropZoomAvatar,
      cineBg: cineBg || undefined, cineBgPosX, cineBgPosY, cropZoomCineBg,
      stats: stats.filter((r) => Object.values(r).some((v) => v?.trim())),
      palmares: palmares.filter((r) => Object.values(r).some((v) => v?.trim())),
      career: career.filter((r) => Object.values(r).some((v) => v?.trim())),
      links: [
        instagram && { label: 'Instagram', icon: 'instagram', url: instagram },
        xUrl && { label: 'X', icon: 'x', url: xUrl },
      ].filter(Boolean) as unknown[],
      visibility: visibility as 'private' | 'public',
    })
    setSaving(false)
    if (result.error) { setAlertMsg({ msg: result.error, ok: false }); return }
    const slug = result.slug!
    const link = `${window.location.origin}/${slug}`
    setUser((u) => u ? { ...u, cv: { slug } } : u)
    setAlertMsg({ msg: 'Répertoire enregistré !', ok: true, link, slug })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) {
    return <div className="app-wrap"><div className="app-head"><h1>Chargement…</h1></div></div>
  }

  const modsTxt = user.modificationsLeft === -1 ? 'illimitées' : (user.modificationsLeft ?? 0) + ' modifications restantes'
  const hasCine = user.entitlements?.cinematic
  const cvSlug = user.cv?.slug

  function onSportChange(s: string) {
    setSport(s)
    const def = SPORTS[s] || SPORTS.Autre
    setColorA(def.a); setColorB(def.b)
  }

  return (
    <div className="app-wrap wide">
      <div className="app-head" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <span className="tag">Mon répertoire</span>
          <h1>Construis ta page.</h1>
          <p>{user.planName || ''} · <strong>{modsTxt}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 4, padding: '12px 14px', fontFamily: 'var(--font-body)' }}>
            <option value="private">🔒 Privé (lien seulement)</option>
            <option value="public">🌐 Public (visible en recherche)</option>
          </select>
          {hasCine && cvSlug && (
            <Link className="btn btn-ghost" href={`/cine?u=${cvSlug}`} target="_blank">🎬 Cinématique</Link>
          )}
          <Link className="btn btn-ghost" href={cvSlug ? `/${cvSlug}` : '/profil?me=1'} target="_blank">Voir ma page ↗</Link>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {welcome && !alertMsg && (
        <div className="alert ok" style={{ marginBottom: 14 }}>
          Bienvenue ! Construis ton répertoire ci-dessous puis clique sur &laquo; Enregistrer &raquo;.
        </div>
      )}

      {alertMsg && (
        <div className={`alert ${alertMsg.ok ? 'ok' : 'err'}`} style={{ marginBottom: 14 }}>
          {alertMsg.msg}
          {alertMsg.link && (
            <>
              {' '}Ton lien :{' '}
              <a href={alertMsg.link} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                {alertMsg.link}
              </a>
              {' '}
              <button className="mini-btn" type="button" onClick={() => navigator.clipboard.writeText(alertMsg.link!)}>
                Copier
              </button>
              {hasCine && alertMsg.slug && (
                <>{' · '}<a href={`/cine?u=${alertMsg.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>🎬 Cinématique</a></>
              )}
            </>
          )}
        </div>
      )}

      <div className="builder-grid">
        <div>
          {/* Identité */}
          <div className="app-card" style={{ padding: 30 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 16 }}>Identité</h3>
            <div className="row2">
              <div className="field"><label>Prénom</label><input value={first} onChange={(e) => setFirst(e.target.value)} /></div>
              <div className="field"><label>Nom</label><input value={last} onChange={(e) => setLast(e.target.value)} /></div>
            </div>
            <div className="row2">
              <div className="field">
                <label>Sport</label>
                <select value={sport} onChange={(e) => onSportChange(e.target.value)}>
                  {Object.keys(SPORTS).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Discipline / poste</label>
                <input value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Ailier, Sprint…" />
              </div>
            </div>
            <div className="field">
              <label>Accroche</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Une phrase qui te définit" />
            </div>
            <div className="field">
              <label>Biographie</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Quelques lignes sur ton parcours, ta vision…"
                rows={4} style={{ width: '100%', resize: 'vertical', background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 6, padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '.9rem' }} />
            </div>
            <div className="row2">
              <div className="field">
                <label>Localisation</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Paris, France" />
              </div>
              <CropBox label="Photo de profil" hint="Aucune photo" circle
                src={avatar} posX={photoPosX} posY={photoPosY} zoom={cropZoomAvatar}
                onPosChange={(x, y) => { setPhotoPosX(x); setPhotoPosY(y) }}
                onZoomChange={setCropZoomAvatar} onFile={setAvatar}
              />
            </div>
            <div className="row2">
              <div className="field">
                <label>Couleur 1</label>
                <input type="color" value={colorA} onChange={(e) => setColorA(e.target.value)} style={{ height: 46, padding: 4 }} />
              </div>
              <div className="field">
                <label>Couleur 2</label>
                <input type="color" value={colorB} onChange={(e) => setColorB(e.target.value)} style={{ height: 46, padding: 4 }} />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="app-card" style={{ padding: 30, marginTop: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 14 }}>Statistiques</h3>
            <DynRows kind="stats" rows={stats} onChange={setStats} />
          </div>

          {/* Palmares */}
          <div className="app-card" style={{ padding: 30, marginTop: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 14 }}>Palmarès</h3>
            <DynRows kind="palmares" rows={palmares} onChange={setPalmares} />
          </div>

          {/* Career */}
          <div className="app-card" style={{ padding: 30, marginTop: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 14 }}>Parcours</h3>
            <DynRows kind="career" rows={career} onChange={setCareer} />
          </div>

          {/* Réseaux */}
          <div className="app-card" style={{ padding: 30, marginTop: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 16 }}>Réseaux</h3>
            <div className="field">
              <label>Instagram (URL)</label>
              <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" />
            </div>
            <div className="field">
              <label>X (URL)</label>
              <input value={xUrl} onChange={(e) => setXUrl(e.target.value)} placeholder="https://x.com/…" />
            </div>
          </div>

          {/* Cinématique (Pro/Club) */}
          {hasCine && (
            <div className="app-card" style={{ padding: 30, marginTop: 18, borderColor: 'rgba(139,182,255,0.4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 6 }}>
                🎬 Mode cinématique{' '}
                <span style={{ fontSize: '.65rem', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 3, padding: '2px 7px', verticalAlign: 'middle' }}>PRO</span>
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '.86rem', marginBottom: 16 }}>
                Personnalise ton écran immersif. Laisse vide pour réutiliser ta photo de profil.
              </p>
              <CropBox label="Image de fond plein écran" hint="Réutilise la photo de profil si vide"
                src={cineBg} posX={cineBgPosX} posY={cineBgPosY} zoom={cropZoomCineBg}
                onPosChange={(x, y) => { setCineBgPosX(x); setCineBgPosY(y) }}
                onZoomChange={setCropZoomCineBg} onFile={setCineBg}
              />
              {cvSlug ? (
                <Link className="btn btn-ghost" href={`/cine?u=${cvSlug}`} target="_blank" style={{ marginTop: 4 }}>
                  Ouvrir mon cinématique ↗
                </Link>
              ) : (
                <p style={{ color: 'var(--muted-2)', fontSize: '.82rem' }}>
                  Enregistre une première fois pour obtenir ton lien cinématique.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="preview-box">
          <div className="pb-head">
            <span>Aperçu en direct</span>
            <div className="pb-sizes">
              <button type="button" className="active" title="Vue mobile"
                onClick={(e) => { if (iframeRef.current) iframeRef.current.style.width = '390px'; document.querySelectorAll('.pb-sizes button').forEach((b) => b.classList.toggle('active', b === e.currentTarget)) }}>📱</button>
              <button type="button" title="Vue large"
                onClick={(e) => { if (iframeRef.current) iframeRef.current.style.width = '100%'; document.querySelectorAll('.pb-sizes button').forEach((b) => b.classList.toggle('active', b === e.currentTarget)) }}>🖥️</button>
            </div>
          </div>
          <div className="pb-frame">
            <iframe ref={iframeRef} id="preview" src="/profil?preview=1" style={{ width: 390 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuilderPage() {
  return <Suspense fallback={null}><BuilderContent /></Suspense>
}
