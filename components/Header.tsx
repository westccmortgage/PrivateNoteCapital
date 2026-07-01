"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const NAV = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Opportunities", href: "/#deal-flow" },
  { label: "Capital Sources", href: "/#guidelines" },
  { label: "About", href: "/company" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-[#e7edf5] bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <nav className="mx-auto flex h-16 max-w-engine items-center justify-between px-5 sm:px-8">
          <a
            href="/"
            className="font-serif text-[20px] font-medium tracking-tight text-navy sm:text-[22px]"
          >
            PrivateNoteCapital<span className="text-navy-muted">.com</span>
          </a>

          <div className="hidden items-center gap-9 md:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[13.5px] font-medium tracking-tight text-navy/70 transition-colors hover:text-navy"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <a
              href="/#request"
              className="rounded-lg bg-navy px-4 py-2.5 text-[13px] font-semibold text-white/95 transition-colors hover:bg-navy-soft"
            >
              Request Investor Access
            </a>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-navy md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="border-b border-[#e7edf5] bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto max-w-engine px-5 py-3 sm:px-8">
              {NAV.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-[#eef2f8] py-3 text-[15px] font-medium text-navy/80 last:border-0 hover:text-navy"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="/#request"
                onClick={() => setOpen(false)}
                className="mt-3 block rounded-lg bg-navy px-3 py-2.5 text-center text-[15px] font-semibold text-white"
              >
                Request Investor Access
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
