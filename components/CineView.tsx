"use client";

/**
 * CineView — Mode cinématique 3D immersif (offre Pro/Club).
 *
 * Fichier UNIQUE : scène Three.js (fiber/drei) + overlays Framer Motion.
 *
 * INTÉGRATION (le Canvas WebGL ne doit jamais être rendu côté serveur) :
 *   const CineView = dynamic(() => import("@/components/CineView"), { ssr: false });
 *   <CineView cv={cv} cinematic={ownerEntitlements.cinematic} />
 *
 * PERFORMANCE (contrainte dure : zéro lag, tout appareil) :
 *   - dpr plafonné [1, 1.5], réduit à 1 si le GPU décroche (PerformanceMonitor)
 *   - rendu coupé (frameloop "never") onglet caché ou composant hors écran
 *   - prefers-reduced-motion : scène statique, overlays sans animation
 *   - fallback CSS pur si WebGL indisponible (vieux mobiles, webviews)
 *   - particules adaptées à la machine (350 bas de gamme / 900 desktop)
 *
 * MÉMOIRE : géométries, matériaux et textures créés ici sont explicitement
 * disposés au démontage (useEffect cleanup) — aucun résidu GPU.
 *
 * SÉCURITÉ AFFICHAGE : les JSONB (stats, palmares, career, links, colors)
 * sont re-validés à l'entrée : textes bornés sans caractères de contrôle
 * (React échappe le HTML), URLs https uniquement, couleurs hex strictes
 * (seules valeurs injectées dans des styles inline).
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MutableRefObject,
} from "react";
import Link from "next/link";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CvData } from "@/app/actions/cv";

// ===========================================================================
// 1. CHARTE — Tomorrow Night Blue (exclusif pour lumières & particules)
// ===========================================================================

const BRAND = {
  bg: "#002451",
  blue: "#8bb6ff",
  green: "#79e0cf",
} as const;

// ===========================================================================
// 2. FILETS DE SÉCURITÉ — parsing strict des JSONB avant affichage
// ===========================================================================

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function toSafeText(v: unknown, max = 80): string {
  if (typeof v === "number" && Number.isFinite(v)) v = String(v);
  if (typeof v !== "string") return "";
  let out = "";
  for (let i = 0; i < v.length; i++) {
    const code = v.charCodeAt(i);
    if (code >= 32 && code !== 127) out += v[i];
  }
  return out.slice(0, max).trim();
}

function toSafeHttpsUrl(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 500) return null;
  try {
    const url = new URL(v);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Seules des couleurs hex strictes finissent dans un style inline. */
function toSafeHex(v: unknown, fallback: string): string {
  return typeof v === "string" && HEX_COLOR.test(v) ? v : fallback;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

interface CineStat { label: string; value: string; unit: string }
interface CinePalmares { icon: string; name: string; count: string }
interface CineCareer { year: string; club: string; detail: string }
interface CineLink { label: string; url: string }

function parseStats(raw: unknown): CineStat[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 6).flatMap((item) => {
    if (!isRecord(item)) return [];
    const label = toSafeText(item.label);
    const value = toSafeText(item.value, 20);
    const unit = toSafeText(item.unit, 8);
    return label && value ? [{ label, value, unit }] : [];
  });
}

function parsePalmares(raw: unknown): CinePalmares[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).flatMap((item) => {
    if (!isRecord(item)) return [];
    const icon = toSafeText(item.icon, 8);
    const name = toSafeText(item.name);
    const count = toSafeText(item.count, 12);
    return name ? [{ icon, name, count }] : [];
  });
}

function parseCareer(raw: unknown): CineCareer[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 12).flatMap((item) => {
    if (!isRecord(item)) return [];
    const year = toSafeText(item.year, 12);
    const club = toSafeText(item.club);
    const detail = toSafeText(item.detail);
    return year || club ? [{ year, club, detail }] : [];
  });
}

function parseLinks(raw: unknown): CineLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 6).flatMap((item) => {
    if (!isRecord(item)) return [];
    const label = toSafeText(item.label, 30);
    const url = toSafeHttpsUrl(item.url); // https obligatoire, sinon le lien saute
    return label && url ? [{ label, url }] : [];
  });
}

// ===========================================================================
// 3. SCÈNE 3D — particules, beacons, grille, parallaxe
// ===========================================================================

type PointerRef = MutableRefObject<{ x: number; y: number }>;

/** Nuage de particules additives bleu pastel <-> vert néon. */
function Particles({
  count,
  animate,
  pointer,
}: {
  count: number;
  animate: boolean;
  pointer: PointerRef;
}) {
  const points = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const blue = new THREE.Color(BRAND.blue);
    const green = new THREE.Color(BRAND.green);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = Math.random() * 11 - 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 26;
      c.copy(blue).lerp(green, Math.random());
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col] as const;
  }, [count]);

  // Nettoyage mémoire explicite : géométrie + matériau disposés au démontage.
  useEffect(() => {
    const obj = points.current;
    return () => {
      obj?.geometry.dispose();
      (obj?.material as THREE.Material | undefined)?.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    const obj = points.current;
    if (!obj || !animate) return;
    obj.rotation.y += delta * 0.02; // dérive lente
    obj.rotation.x = THREE.MathUtils.lerp(obj.rotation.x, pointer.current.y * 0.05, 0.04);
    obj.rotation.z = THREE.MathUtils.lerp(obj.rotation.z, pointer.current.x * 0.04, 0.04);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Texture halo radiale générée en mémoire (aucun asset à charger). */
function makeHaloTexture(hex: string): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const c = new THREE.Color(hex);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgb},0.9)`);
  grad.addColorStop(0.35, `rgba(${rgb},0.35)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** Beacon : halo volumétrique simulé (sprite additif) qui flotte lentement. */
function Beacon({
  color,
  position,
  scale,
  speed,
  animate,
}: {
  color: string;
  position: [number, number, number];
  scale: number;
  speed: number;
  animate: boolean;
}) {
  const sprite = useRef<THREE.Sprite>(null);
  const texture = useMemo(() => makeHaloTexture(color), [color]);

  // Disposal texture + matériau : zéro résidu GPU.
  useEffect(() => {
    const obj = sprite.current;
    return () => {
      texture?.dispose();
      (obj?.material as THREE.Material | undefined)?.dispose();
    };
  }, [texture]);

  useFrame((state) => {
    const obj = sprite.current;
    if (!obj || !animate) return;
    obj.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.4;
  });

  if (!texture) return null;
  return (
    <sprite ref={sprite} position={position} scale={[scale, scale, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

/** Grille-sol abstraite qui défile lentement (effet "piste infinie"). */
function Floor({ animate }: { animate: boolean }) {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(90, 64, new THREE.Color(BRAND.blue), new THREE.Color(BRAND.blue));
    const mat = g.material as THREE.LineBasicMaterial;
    mat.transparent = true;
    mat.opacity = 0.13;
    mat.depthWrite = false;
    return g;
  }, []);

  useEffect(
    () => () => {
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    },
    [grid]
  );

  const cell = (90 / 64) * 2;
  useFrame((_, delta) => {
    if (animate) grid.position.z = (grid.position.z + delta * 0.45) % cell;
  });

  return <primitive object={grid} position={[0, -2.4, 0]} />;
}

/** Parallaxe caméra : suit subtilement la souris (lerp amorti). */
function CameraRig({ pointer, enabled }: { pointer: PointerRef; enabled: boolean }) {
  useFrame(({ camera }) => {
    if (!enabled) return;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.current.x * 0.7, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.4 - pointer.current.y * 0.4, 0.04);
    camera.lookAt(0, 0.2, 0);
  });
  return null;
}

function CineScene({
  particleCount,
  animate,
  pointer,
}: {
  particleCount: number;
  animate: boolean;
  pointer: PointerRef;
}) {
  return (
    <>
      <color attach="background" args={[BRAND.bg]} />
      <fog attach="fog" args={[BRAND.bg, 9, 30]} />
      <ambientLight intensity={0.45} color={BRAND.blue} />
      <pointLight position={[6, 4, -6]} intensity={1.4} color={BRAND.blue} distance={30} decay={2} />
      <pointLight position={[-7, 2, -4]} intensity={1.1} color={BRAND.green} distance={26} decay={2} />
      <Particles key={particleCount} count={particleCount} animate={animate} pointer={pointer} />
      <Floor animate={animate} />
      <Beacon color={BRAND.blue} position={[-4.4, 0.6, -6]} scale={7} speed={0.5} animate={animate} />
      <Beacon color={BRAND.green} position={[4.8, 1.4, -8]} scale={9} speed={0.34} animate={animate} />
      <Beacon color={BRAND.blue} position={[0, 2.8, -12]} scale={12} speed={0.22} animate={animate} />
      <CameraRig pointer={pointer} enabled={animate} />
    </>
  );
}

/** Fallback sans WebGL : mêmes codes couleurs, halos CSS statiques. */
function FallbackBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(640px 420px at 18% 78%, ${BRAND.blue}1f, transparent 70%),
          radial-gradient(560px 380px at 82% 22%, ${BRAND.green}1a, transparent 70%),
          radial-gradient(800px 600px at 50% 110%, ${BRAND.blue}14, transparent 75%),
          ${BRAND.bg}`,
      }}
    />
  );
}

// ===========================================================================
// 4. COMPOSANT PRINCIPAL — scène + overlays Framer Motion
// ===========================================================================

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

export interface CineViewProps {
  cv: CvData;
  /** entitlements_cinematic du propriétaire du CV (lecture serveur, jamais le client). */
  cinematic: boolean;
  /** Accroche optionnelle (colonne dédiée prévue en migration 00002). */
  tagline?: string;
}

export default function CineView({ cv, cinematic, tagline }: CineViewProps) {
  // ---- Données : tout passe au filet avant affichage ----------------------
  const data = useMemo(() => {
    const colors = isRecord(cv.colors) ? cv.colors : {};
    return {
      first: toSafeText(cv.first),
      last: toSafeText(cv.last),
      sport: toSafeText(cv.sport),
      location: toSafeText(cv.location),
      tagline: toSafeText(tagline, 160),
      colorA: toSafeHex(colors.a, BRAND.blue),
      colorB: toSafeHex(colors.b, BRAND.green),
      stats: parseStats(cv.stats),
      palmares: parsePalmares(cv.palmares),
      career: parseCareer(cv.career),
      links: parseLinks(cv.links),
    };
  }, [cv, tagline]);

  // ---- Capacités machine & cycle de vie du rendu --------------------------
  const reducedMotion = useReducedMotion() ?? false;
  const [webgl, setWebgl] = useState<"checking" | "yes" | "no">("checking");
  const [tabVisible, setTabVisible] = useState(true);
  const [onScreen, setOnScreen] = useState(true);
  const [dpr, setDpr] = useState(1.5);
  const [panelOpen, setPanelOpen] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(c.getContext("webgl2") || c.getContext("webgl") ? "yes" : "no");
    } catch {
      setWebgl("no");
    }
  }, []);

  // Onglet caché => rendu coupé (économie batterie/CPU).
  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Composant hors écran => rendu coupé.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Heuristique bas de gamme : moins de particules.
  const lowEnd = useMemo(() => {
    if (typeof navigator === "undefined") return true;
    const nav = navigator as Navigator & { deviceMemory?: number };
    return (nav.hardwareConcurrency ?? 4) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  }, []);

  const animate = !reducedMotion && tabVisible && onScreen;
  const particleCount = lowEnd ? 350 : 900;

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  };

  // ---- Verrou premium : le booléen vient du SERVEUR (entitlements RLS) ----
  if (!cinematic) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-bg px-6">
        <FallbackBackdrop />
        <div className="relative z-10 max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
          <h1 className="font-display text-2xl font-bold text-text-main">
            Mode cinématique 🎬
          </h1>
          <p className="font-body mt-3 text-text-muted">
            Ce CV n&apos;a pas l&apos;option cinématique — réservée à
            l&apos;offre Pro (149&nbsp;€, paiement unique).
          </p>
          <Link
            href="/tarifs"
            className="font-display mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-brand-bg transition hover:opacity-90"
          >
            Passer au Pro
          </Link>
        </div>
      </section>
    );
  }

  const hasDetails =
    data.stats.length > 0 || data.palmares.length > 0 || data.career.length > 0;

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      className="relative min-h-screen overflow-hidden bg-brand-bg text-text-main"
    >
      {/* ---- Couche 3D ------------------------------------------------------ */}
      {webgl === "yes" ? (
        <div className="absolute inset-0">
          <Canvas
            frameloop={animate ? "always" : "never"}
            dpr={[1, dpr]}
            camera={{ position: [0, 0.4, 9], fov: 50 }}
            gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
          >
            {/* Si le GPU décroche, on retombe à dpr 1 sans jamais saccader */}
            <PerformanceMonitor onDecline={() => setDpr(1)} />
            <CineScene particleCount={particleCount} animate={animate} pointer={pointer} />
          </Canvas>
        </div>
      ) : (
        <FallbackBackdrop />
      )}

      {/* Scrim bas : garantit la lisibilité du texte sur la scène */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{ background: `linear-gradient(to top, ${BRAND.bg}e6, transparent)` }}
      />

      {/* ---- Overlays 2D (Framer Motion) ------------------------------------ */}
      <motion.section
        variants={containerVariants}
        initial={reducedMotion ? false : "hidden"}
        animate="show"
        className="relative z-10 flex min-h-screen flex-col justify-end p-6 pb-10 sm:p-12"
      >
        <motion.h1
          variants={itemVariants}
          className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-7xl"
        >
          <span className="block font-light text-text-main/90">{data.first}</span>
          <span
            className="block bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(90deg, ${data.colorA}, ${data.colorB})`,
            }}
          >
            {data.last}
          </span>
        </motion.h1>

        <motion.div
          variants={itemVariants}
          className="font-body mt-4 flex flex-wrap gap-2 text-sm"
        >
          {data.sport && (
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
              {data.sport}
            </span>
          )}
          {data.location && (
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-text-muted backdrop-blur-md">
              📍 {data.location}
            </span>
          )}
        </motion.div>

        {data.tagline && (
          <motion.p
            variants={itemVariants}
            className="font-body mt-4 max-w-xl text-lg text-text-muted"
          >
            {data.tagline}
          </motion.p>
        )}

        <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-3">
          {hasDetails && (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="font-display rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-brand-bg shadow-[0_0_24px_rgba(139,182,255,0.35)] transition hover:opacity-90"
            >
              📊 Stats &amp; palmarès
            </button>
          )}
          <Link
            href={`/${cv.slug}`}
            className="font-body rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm backdrop-blur-md transition hover:border-accent/50"
          >
            📄 CV complet
          </Link>
          {data.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-text-muted backdrop-blur-md transition hover:border-accent-2/50 hover:text-text-main"
            >
              {link.label}
            </a>
          ))}
        </motion.div>
      </motion.section>

      {/* ---- Panneau latéral : stats / parcours / palmarès ------------------- */}
      <AnimatePresence>
        {panelOpen && (
          <motion.aside
            initial={{ x: reducedMotion ? 0 : 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reducedMotion ? 0 : 60, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-20 w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#001b3d]/85 p-8 backdrop-blur-2xl"
            role="dialog"
            aria-label="Statistiques et palmarès"
          >
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Fermer"
              className="absolute right-5 top-5 rounded-full border border-white/10 px-3 py-1.5 text-sm text-text-muted transition hover:border-accent/50 hover:text-text-main"
            >
              ✕
            </button>

            {data.stats.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3">
                {data.stats.map((stat) => (
                  <div
                    key={`${stat.label}-${stat.value}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                  >
                    <div className="font-display text-2xl font-bold text-accent">
                      {stat.value}
                      {stat.unit && (
                        <span className="ml-1 text-sm text-accent-2">{stat.unit}</span>
                      )}
                    </div>
                    <div className="font-body mt-1 text-xs text-text-muted">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.career.length > 0 && (
              <>
                <h4 className="font-display mt-8 text-sm font-semibold uppercase tracking-widest text-text-muted">
                  Parcours
                </h4>
                <div className="mt-3 space-y-2">
                  {data.career.map((step) => (
                    <div
                      key={`${step.year}-${step.club}`}
                      className="font-body flex items-baseline gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm"
                    >
                      <span className="shrink-0 font-semibold text-accent">{step.year}</span>
                      <span className="text-text-main">{step.club}</span>
                      <span className="ml-auto text-right text-text-muted">{step.detail}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {data.palmares.length > 0 && (
              <>
                <h4 className="font-display mt-8 text-sm font-semibold uppercase tracking-widest text-text-muted">
                  Palmarès
                </h4>
                <div className="mt-3 space-y-2">
                  {data.palmares.map((item) => (
                    <div
                      key={item.name}
                      className="font-body flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm"
                    >
                      <span>{item.icon}</span>
                      <span className="text-text-main">{item.name}</span>
                      <span className="ml-auto font-semibold text-gold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
