import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PathDrawingPortfolioHero from "@/components/ui/path-drawing-portfolio-hero";
import { ArrowRight } from "lucide-react";

interface LandingScreenProps {
  onEnter: () => void;
}

export function LandingScreen({ onEnter }: LandingScreenProps) {
  const [exiting, setExiting] = useState(false);

  const handleEnter = () => {
    if (exiting) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setExiting(true);
    setTimeout(onEnter, 650);
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="landing"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Background — animated ambient layers for premium feel */}
          <div className="absolute inset-0 bg-background" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,241,199,0.08),transparent_70%)] pointer-events-none animate-[ambient-pulse_8s_ease-in-out_infinite]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_42%,rgba(240,147,251,0.06),transparent_70%)] pointer-events-none animate-[ambient-pulse_12s_ease-in-out_infinite_reverse]" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Path-drawing hero animation */}
          <motion.div className="w-full h-full animate-[float_6s_ease-in-out_infinite]">
            <PathDrawingPortfolioHero
              brand="Anysize"
              eyebrow="Multi-Surface Layout Engine"
              tagline="One composition. Every format. Zero manual work."
              fromColor="#f0f1c7"
              toColor="#c8dfd0"
              className="w-full h-full"
            >
            {/* "Open Dashboard" button — cleanly positioned below tagline */}
            <motion.div
              className="mt-8 flex flex-col items-center gap-2.5 z-20"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                onClick={handleEnter}
                disabled={exiting}
                className="
                  group relative flex items-center gap-2.5
                  h-11 px-7 rounded-full overflow-hidden
                  bg-white/[0.07] border border-white/[0.13]
                  text-[#f2f0ea] text-[13px] font-semibold tracking-wide
                  backdrop-blur-2xl transition-all duration-300
                  hover:bg-white/[0.13] hover:border-white/[0.22]
                  hover:scale-105 hover:shadow-[0_0_36px_rgba(240,241,199,0.1)]
                  active:scale-[0.97] cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]" />
                {/* Radial inner glow */}
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(240,241,199,0.07),transparent)]" />
                <span className="relative z-10">Open Dashboard</span>
                <ArrowRight
                  size={14}
                  className="relative z-10 group-hover:translate-x-0.5 transition-transform duration-200"
                />
              </button>

              <motion.p
                className="text-[9.5px] tracking-[0.24em] uppercase text-white/30 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.6 }}
              >
                Press to continue
              </motion.p>
            </motion.div>
            </PathDrawingPortfolioHero>
          </motion.div>

          {/* Film-grain noise */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "128px 128px",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
