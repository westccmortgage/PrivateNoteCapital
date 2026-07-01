"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Full-bleed hero: the note-render video fills the entire screen as the
// background (object-cover), with the headline overlaid on top. A soft light
// scrim on the left keeps the navy text legible over the footage.

export default function AvatarHero() {
  return (
    <section
      id="top"
      className="relative flex items-center overflow-hidden"
      style={{ height: "100svh", minHeight: "600px" }}
    >
      {/* z0 — full-screen background video */}
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/images/pnc-hero-poster.jpg"
      >
        <source src="/videos/pnc-hero.mp4" type="video/mp4" />
      </video>

      {/* z10 — soft light scrim so the headline stays readable over the video */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(244,249,255,0.95) 0%, rgba(244,249,255,0.82) 30%, rgba(244,249,255,0.40) 50%, rgba(244,249,255,0.05) 68%, rgba(244,249,255,0) 100%)",
        }}
      />

      {/* z20 — content */}
      <div className="relative z-20 mx-auto w-full max-w-engine px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <h1 className="font-serif text-balance text-[40px] font-medium leading-[1.04] tracking-tight text-navy sm:text-[60px]">
            Private capital, structured around real estate-backed notes.
          </h1>
          <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-navy-soft">
            Review selected private note opportunities through a modern capital desk built for
            clarity, control, and collateral visibility.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#request"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3.5 text-[15px] font-semibold text-white/95 shadow-lift transition-transform hover:-translate-y-0.5"
            >
              Request Investor Access <ArrowRight size={17} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-white/70 px-6 py-3.5 text-[15px] font-medium text-navy backdrop-blur transition-colors hover:border-navy/40"
            >
              See How It Works
            </a>
          </div>
        </motion.div>
      </div>

      {/* bottom fade into the page */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20"
        style={{ background: "linear-gradient(to bottom, transparent, #ffffff)" }}
      />
    </section>
  );
}
