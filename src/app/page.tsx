"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function WelcomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative overflow-hidden">
      {/* Immersive radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="text-center max-w-2xl mx-auto z-10 relative space-y-2">
        <h1 className="font-headline font-light text-6xl md:text-7xl tracking-wide text-glow mb-2 text-zinc-100">
          EstAi
        </h1>
        
        <p className="font-editorial font-light text-2xl md:text-3xl text-gold tracking-wide pb-10">
          Luxury listings, smarter prices.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
          <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/discover"
              className="border border-zinc-800/60 bg-zinc-900/10 backdrop-blur-xl p-8 rounded-xl hover:border-violet-500/40 transition-all text-center block h-full"
            >
              <div className="font-sans text-xs uppercase tracking-widest text-zinc-200 font-semibold mb-1">
                Continue as Guest
              </div>
              <div className="text-xs text-muted-foreground font-sans">
                Browse-only access to listings
              </div>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/login"
              className="border border-violet-500/20 bg-violet-600/5 backdrop-blur-xl p-8 rounded-xl hover:border-violet-500/50 transition-all text-center block h-full"
            >
              <div className="font-sans text-xs uppercase tracking-widest text-zinc-200 font-semibold mb-1">
                Sign In / Register
              </div>
              <div className="text-xs text-muted-foreground font-sans">
                Unlock all smart estimate tools
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      <footer className="absolute bottom-8 text-center text-xs text-muted-foreground/30 font-sans tracking-wide">
        <p>EstAi &copy; {new Date().getFullYear()} · Estimate. Explore. Elevate.</p>
      </footer>
    </main>
  );
}
