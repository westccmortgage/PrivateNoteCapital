"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Full-bleed, cinematic hero with an optional AI video-avatar layer
// (markevita / TA Next style) — themed in navy/gold. It looks premium even
// with NO video: a deep-navy immersive field with a soft gold glow. When you
// drop a transparent avatar video at the paths below, it appears on the right.
//
// Expected assets (add later; the hero degrades gracefully without them):
//   /videos/pnc-avatar-en.webm   (VP9 + alpha, transparent receptionist)
//   /videos/pnc-avatar-ru.webm
//   /videos/pnc-avatar-es.webm
//   /images/pnc-hero-poster.jpg  (optional still shown before video plays)

type Lang = "en" | "ru" | "es";

const COPY: Record<
  Lang,
  { eyebrow: string; head: string; gold: string; tail: string; sub: string; cta1: string; cta2: string }
> = {
  en: {
    eyebrow: "For capital partners · West Coast Capital Mortgage",
    head: "Put capital behind ",
    gold: "first-position",
    tail: " California real estate.",
    sub: "Conservatively underwritten, real-estate-secured private mortgage notes — real collateral, low loan-to-value, and a disciplined process. Not promises.",
    cta1: "Become a capital partner",
    cta2: "See our guidelines",
  },
  ru: {
    eyebrow: "Для капитал-партнёров · West Coast Capital Mortgage",
    head: "Разместите капитал в ",
    gold: "первой позиции",
    tail: " калифорнийской недвижимости.",
    sub: "Консервативно андеррайтенные ипотечные ноты под залог недвижимости — реальное обеспечение, низкий LTV и дисциплина. Без обещаний.",
    cta1: "Стать капитал-партнёром",
    cta2: "Наши гайдлайны",
  },
  es: {
    eyebrow: "Para socios de capital · West Coast Capital Mortgage",
    head: "Coloque capital en ",
    gold: "primera posición",
    tail: " sobre bienes raíces de California.",
    sub: "Notas hipotecarias privadas garantizadas por inmuebles, con criterios conservadores — colateral real, bajo LTV y un proceso disciplinado. Sin promesas.",
    cta1: "Ser socio de capital",
    cta2: "Nuestros criterios",
  },
};

const LANGS: Lang[] = ["en", "ru", "es"];

export default function AvatarHero() {
  const [lang, setLang] = useState<Lang>("en");
  const [videoOk, setVideoOk] = useState(true);
  const t = COPY[lang];

  return (
    <section
      id="top"
      className="relative flex min-h-[620px] w-full items-center overflow-hidden"
      style={{ height: "100svh", background: "linear-gradient(135deg,#0a1f47 0%,#0a1c3f 45%,#05122e 100%)" }}
    >
      {/* z0 — ambient gold glow + subtle grid */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <motion.div
          animate={{ opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[-8%] top-[-12%] h-[560px] w-[720px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(196,160,90,0.22), transparent 62%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(120% 90% at 70% 30%, black, transparent 75%)",
          }}
        />
      </div>

      {/* z10 — avatar video layer (right). Hidden gracefully if it fails to load. */}
      {videoOk && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[58%] lg:block">
          <video
            key={lang}
            className="h-full w-full object-cover object-bottom"
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoOk(false)}
            poster="/images/pnc-hero-poster.jpg"
          >
            <source src={`/videos/pnc-avatar-${lang}.webm`} type="video/webm" />
            <source src={`/videos/pnc-avatar-${lang}.mp4`} type="video/mp4" />
          </video>
        </div>
      )}

      {/* z20 — left scrim so headline stays legible over the video */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,18,46,0.92) 0%, rgba(5,18,46,0.78) 34%, rgba(5,18,46,0.30) 52%, rgba(5,18,46,0) 66%)",
        }}
      />

      {/* z40 — content */}
      <div className="relative z-40 mx-auto w-full max-w-engine px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <div className="mb-6 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-gold-soft">
            <span className="h-px w-10 bg-gold-soft/70" />
            {t.eyebrow}
          </div>
          <h1 className="text-balance text-[36px] font-semibold leading-[1.04] tracking-tight text-white sm:text-[54px]">
            {t.head}
            <span className="text-gold">{t.gold}</span>
            {t.tail}
          </h1>
          <p className="mt-6 max-w-lg text-[16.5px] leading-relaxed text-white/75">{t.sub}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#request"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-[15px] font-semibold text-navy transition-transform hover:-translate-y-0.5"
            >
              {t.cta1} <ArrowRight size={17} />
            </a>
            <a
              href="#guidelines"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[15px] font-medium text-white/90 transition-colors hover:border-white/50"
            >
              {t.cta2}
            </a>
          </div>
        </motion.div>
      </div>

      {/* z50 — language switcher (drives the avatar language) */}
      <div className="absolute right-5 top-16 z-50 flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur sm:right-8">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              setLang(l);
              setVideoOk(true);
            }}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
              lang === l ? "bg-gold text-navy" : "text-white/70 hover:text-white"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* bottom fade into the light page */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-24"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(243,248,255,0.9))" }}
      />
    </section>
  );
}
