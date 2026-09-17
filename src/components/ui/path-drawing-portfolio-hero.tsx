"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

type SvgPathDrawingTextAnimationProps = {
  text: string;
  fromColor?: string;
  toColor?: string;
  strokeWidth?: number;
  /** Seconds for one full draw pass */
  durationSec?: number;
  /** Seconds to pause at full-drawn state before restarting */
  pauseSec?: number;
  /** Restart from the beginning after pauseSec */
  loop?: boolean;
  viewBoxWidth?: number;
  viewBoxHeight?: number;
  fontSize?: number;
  className?: string;
};


function SvgPathDrawingTextAnimation({
  text,
  fromColor = "#f0f1c7",
  toColor = "#c8dfd0",
  strokeWidth = 2.4,
  durationSec = 2.6,
  pauseSec = 2.2,
  loop = true,
  viewBoxWidth = 860,
  viewBoxHeight = 240,
  fontSize = 148,
  className,
}: SvgPathDrawingTextAnimationProps) {
  const reactId = useId().replace(/:/g, "");
  const gradientId = `pathGradient-${reactId}`;
  const glowId = `pathGlow-${reactId}`;
  const textRef = useRef<SVGTextElement>(null);
  const glowRef = useRef<SVGTextElement>(null);
  const [fillOpacity, setFillOpacity] = useState(0);
  const display = text.trim();

  useEffect(() => {
    if (!display) return;

    let animId: number;
    let pauseTimer: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    // Glyph perimeter for the largest letter at this font size is ~750px
    const GLYPH_PERIMETER = 850;
    const drawMs = Math.max(1200, durationSec * 1000);
    const pauseMs = Math.max(800, pauseSec * 1000);

    const el = textRef.current;
    const glowEl = glowRef.current;

    const setupElements = (offset: number) => {
      if (el) {
        el.style.strokeDasharray = `${GLYPH_PERIMETER} ${GLYPH_PERIMETER}`;
        el.style.strokeDashoffset = String(offset);
      }
      if (glowEl) {
        glowEl.style.strokeDasharray = `${GLYPH_PERIMETER} ${GLYPH_PERIMETER}`;
        glowEl.style.strokeDashoffset = String(offset);
      }
    };

    let start = performance.now();
    setupElements(GLYPH_PERIMETER);
    setFillOpacity(0);

    const step = (now: number) => {
      if (isCancelled) return;
      const elapsed = now - start;

      if (elapsed < drawMs) {
        const progress = Math.min(1, elapsed / drawMs);
        // Smooth ease-in-out cubic
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentOffset = GLYPH_PERIMETER * (1 - ease);
        setupElements(currentOffset);
        setFillOpacity(progress > 0.8 ? (progress - 0.8) * 5 * 0.08 : 0);

        animId = requestAnimationFrame(step);
      } else {
        // Fully drawn
        setupElements(0);
        setFillOpacity(0.08);

        if (!loop) return;

        pauseTimer = setTimeout(() => {
          if (isCancelled) return;

          // Brief fade-out transition before redrawing
          const fadeStart = performance.now();
          const fadeDuration = 600;

          const fadeStep = (fadeNow: number) => {
            if (isCancelled) return;
            const fadeElapsed = fadeNow - fadeStart;
            if (fadeElapsed < fadeDuration) {
              const fadeProgress = fadeElapsed / fadeDuration;
              const eraseOffset = GLYPH_PERIMETER * fadeProgress;
              setupElements(eraseOffset);
              setFillOpacity(0.08 * (1 - fadeProgress));
              animId = requestAnimationFrame(fadeStep);
            } else {
              // Restart loop cleanly
              start = performance.now();
              setupElements(GLYPH_PERIMETER);
              setFillOpacity(0);
              animId = requestAnimationFrame(step);
            }
          };

          animId = requestAnimationFrame(fadeStep);
        }, pauseMs);
      }
    };

    // Small delay to guarantee DOM paint before starting
    const initTimer = setTimeout(() => {
      start = performance.now();
      animId = requestAnimationFrame(step);
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(initTimer);
      clearTimeout(pauseTimer);
      cancelAnimationFrame(animId);
    };
  }, [display, durationSec, pauseSec, loop]);

  if (!display) return null;

  return (
    <div
      className={cn(
        "flex min-h-[200px] w-full items-center justify-center select-none",
        className,
      )}
    >
      <svg
        width="1000"
        height="320"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="h-auto w-full max-w-full drop-shadow-[0_0_40px_rgba(240,241,199,0.18)]"
        role="img"
        aria-label={display}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={fromColor}>
              <animate
                attributeName="stop-color"
                values={`${fromColor}; ${toColor}; ${fromColor}`}
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor={toColor}>
              <animate
                attributeName="stop-color"
                values={`${toColor}; ${fromColor}; ${toColor}`}
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={fromColor}>
              <animate
                attributeName="stop-color"
                values={`${fromColor}; ${toColor}; ${fromColor}`}
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          {/* Diffused bloom glow filter */}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient background bloom stroke */}
        <text
          ref={glowRef}
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth * 2.8}
          strokeLinejoin="round"
          strokeLinecap="round"
          fontSize={fontSize}
          fontWeight="bold"
          fontFamily="Arial, Helvetica, sans-serif"
          letterSpacing="0.02em"
          opacity="0.35"
          filter={`url(#${glowId})`}
        >
          {display}
        </text>

        {/* Crisp foreground stroke + luminous inner fill */}
        <text
          ref={textRef}
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={fromColor}
          fillOpacity={fillOpacity}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          fontSize={fontSize}
          fontWeight="bold"
          fontFamily="Arial, Helvetica, sans-serif"
          letterSpacing="0.02em"
          className="transition-fill duration-300"
        >
          {display}
        </text>
      </svg>
    </div>
  );
}

export type PathDrawingPortfolioHeroProps = {
  /** Display name (brand / person) drawn large as an SVG path */
  brand: string;
  /** Short role or tagline under the name */
  tagline?: string;
  /** Small label above the name (e.g. Portfolio) */
  eyebrow?: string;
  /** Gradient start color */
  fromColor?: string;
  /** Gradient end color */
  toColor?: string;
  /** Extra slot (for follow-up sections) */
  children?: ReactNode;
  className?: string;
};

/**
 * Portfolio hero: path-drawn name on loop + soft entrance fade.
 * Transparent background — place it over your own page backdrop.
 */
export default function PathDrawingPortfolioHero({
  brand,
  tagline = "Freelance Designer",
  eyebrow = "Portfolio",
  fromColor,
  toColor,
  children,
  className,
}: PathDrawingPortfolioHeroProps) {
  const name = brand.trim();
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!name) return null;

  const instant = Boolean(reduceMotion) || !ready;

  return (
    <section
      data-path-drawing-hero
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center",
        "bg-transparent text-white",
        className,
      )}
    >
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center px-6 pb-10 pt-20 text-center sm:px-10 sm:pb-12">
        {eyebrow ? (
          <motion.p
            className="mb-6 text-[0.7rem] font-medium uppercase tracking-[0.35em] text-white/55 sm:mb-8 sm:text-xs"
            initial={instant ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {eyebrow}
          </motion.p>
        ) : null}

        <h1 className="sr-only">{name}</h1>
        <motion.div
          className="w-full"
          initial={instant ? false : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <SvgPathDrawingTextAnimation
            text={name}
            fromColor={fromColor}
            toColor={toColor}
            className="w-full min-h-[220px] sm:min-h-[300px] md:min-h-[380px]"
            fontSize={name.length > 12 ? 72 : name.length > 8 ? 96 : 148}
            viewBoxWidth={name.length > 8 ? 1100 : 860}
            viewBoxHeight={name.length > 8 ? 200 : 240}
            strokeWidth={2.4}
            durationSec={5.5}
            loop
          />
        </motion.div>

        {tagline ? (
          <motion.p
            className="mt-4 max-w-md text-sm leading-relaxed text-white/65 sm:mt-6 sm:text-base"
            initial={instant ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.75,
              delay: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {tagline}
          </motion.p>
        ) : null}
      </div>



      {children}
      <style>{`
        @keyframes path-drawing-scroll-cue {
          0%, 100% { transform: scaleY(1); opacity: 0.55; }
          50% { transform: scaleY(0.55); opacity: 0.2; }
        }
        [data-path-drawing-hero] .path-drawing-scroll-cue {
          animation: path-drawing-scroll-cue 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-path-drawing-hero] .path-drawing-scroll-cue {
            animation: none;
            opacity: 0.45;
          }
        }
      `}</style>
    </section>
  );
}
