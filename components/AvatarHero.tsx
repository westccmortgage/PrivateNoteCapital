"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Light, editorial hero matching the approved visualization: serif navy
// headline on a soft blue field, with the animated real-estate-backed-note
// render (video) on the right. The video degrades gracefully — if it fails to
// load, a soft gradient/glow stays in its place.

export default function AvatarHero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg,#e9f0fb 0%,#eef4fd 34%,#f5f9ff 66%,#ffffff 100%)",
      }}
    >
      <div className="mx-auto grid max-w-engine items-center gap-8 px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr]">
        {/* Left — copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-serif text-balance text-[40px] font-medium leading-[1.04] tracking-tight text-navy sm:text-[58px]">
            Private capital, structured around real estate-backed notes.
          </h1>
          <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-navy-muted">
            Review selected private note opportunities through a modern capital desk built for
            clarity, control, and collateral visibility.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#request"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3.5 text-[15px] font-semibold text-white/95 transition-transform hover:-translate-y-0.5"
            >
              Request Investor Access <ArrowRight size={17} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-hairline bg-white/70 px-6 py-3.5 text-[15px] font-medium text-navy transition-colors hover:border-navy/25"
            >
              See How It Works
            </a>
          </div>
        </motion.div>

        {/* Right — animated note render (video) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: "radial-gradient(60% 55% at 55% 45%, rgba(200,154,60,0.14), transparent 70%)",
            }}
          />
          <video
            className="mx-auto w-full max-w-[560px] object-contain"
            autoPlay
            muted
            loop
            playsInline
            poster="/images/pnc-hero-poster.jpg"
          >
            <source src="/videos/pnc-hero.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </div>
    </section>
  );
}
