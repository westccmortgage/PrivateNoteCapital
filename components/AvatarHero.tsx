"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";

// Full-bleed hero video — modeled on the markevita pattern:
//   • fills the whole hero (object-cover, 100svh) as the background
//   • plays ONCE (no loop) and holds its final frame
//   • autoplay WITH sound, falling back to muted if the browser blocks it
//   • a corner sound toggle; sound also enables on the first user gesture
//   • IntersectionObserver: pause + mute when scrolled away (<70% visible),
//     restart from the beginning when scrolled back
// The serif headline sits on top, over a soft left light scrim.

export default function AvatarHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    const btn = btnRef.current;
    if (!video) return;

    video.removeAttribute("loop"); // never loop — hold the final frame
    let userTurnedOff = false;
    let wasAway = false;

    const sync = () => setSoundOn(!video.muted && !video.paused);

    const startFromBeginning = () => {
      try {
        video.currentTime = 0;
      } catch {
        /* ignore */
      }
      video.muted = userTurnedOff;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(sync).catch(() => {
          video.muted = true; // browser blocked sound autoplay → fall back
          video.play().catch(() => {});
          sync();
        });
      } else {
        sync();
      }
    };

    startFromBeginning();

    // Browsers block sound before interaction — enable it on the first gesture.
    const enableSoundOnGesture = () => {
      if (userTurnedOff || wasAway) return;
      if (video.muted) {
        video.muted = false;
        if (video.paused) video.play().catch(() => {});
        sync();
      }
    };
    const gestureEvents: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "keydown"];
    const gestureOpts: AddEventListenerOptions = { capture: true, passive: true };
    gestureEvents.forEach((ev) => window.addEventListener(ev, enableSoundOnGesture, gestureOpts));

    // Corner toggle — one click does what the icon shows.
    const onToggle = () => {
      const turnOn = video.muted; // muted now → this click means "on"
      userTurnedOff = !turnOn;
      video.muted = !turnOn;
      if (turnOn && video.paused) video.play().catch(() => {});
      sync();
    };
    btn?.addEventListener("click", onToggle);

    // Scroll away → pause + mute. Scroll back → restart from the beginning.
    let io: IntersectionObserver | undefined;
    if (section && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          const ratio = entries[0].intersectionRatio;
          if (ratio < 0.7) {
            if (!video.paused) {
              video.pause();
              video.muted = true;
            }
            wasAway = true;
            sync();
          } else if (wasAway) {
            wasAway = false;
            startFromBeginning();
          }
        },
        { threshold: [0, 0.7, 1] },
      );
      io.observe(section);
    }

    return () => {
      gestureEvents.forEach((ev) =>
        window.removeEventListener(ev, enableSoundOnGesture, gestureOpts),
      );
      btn?.removeEventListener("click", onToggle);
      io?.disconnect();
    };
  }, []);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex items-center overflow-hidden"
      style={{ height: "100svh", minHeight: "600px" }}
    >
      {/* z0 — full-screen background video (plays once, holds final frame) */}
      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        autoPlay
        playsInline
        preload="auto"
        poster="/images/pnc-hero-poster.jpg"
      >
        <source src="/videos/pnc-hero.mp4" type="video/mp4" />
      </video>

      {/* z10 — soft left light scrim so the navy headline stays readable */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(244,249,255,0.94) 0%, rgba(244,249,255,0.80) 30%, rgba(244,249,255,0.38) 50%, rgba(244,249,255,0.04) 68%, rgba(244,249,255,0) 100%)",
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

      {/* z30 — corner sound toggle */}
      <button
        ref={btnRef}
        type="button"
        aria-label={soundOn ? "Turn off sound" : "Turn on sound"}
        aria-pressed={soundOn}
        className="absolute bottom-6 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 bg-white/70 text-navy backdrop-blur transition-colors hover:bg-white sm:right-8"
      >
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* bottom fade into the page */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20"
        style={{ background: "linear-gradient(to bottom, transparent, #ffffff)" }}
      />
    </section>
  );
}
