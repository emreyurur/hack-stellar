import type { ReactNode } from 'react'

/**
 * Hero background with CSS-only gradient mesh and floating billiard balls 1–8.
 * All animations use CSS transforms (GPU-accelerated), zero JS runtime cost.
 */
export function WavyBackground({
  children,
  className = '',
  containerClassName = '',
  ...props
}: {
  backgroundFill?: string
  blur?: number
  children?: ReactNode
  className?: string
  colors?: string[]
  containerClassName?: string
  speed?: 'slow' | 'fast'
  waveOpacity?: number
  waveWidth?: number
  [key: string]: unknown
}) {
  return (
    <div
      className={`relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden bg-[#0A0A0E] ${containerClassName}`}
    >
      {/* CSS-only gradient mesh — fades in after intro */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hero-gradient"
        style={{
          background: [
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(242,193,46,0.14) 0%, transparent 60%)',
            'radial-gradient(ellipse 60% 45% at 20% 60%, rgba(22,163,74,0.10) 0%, transparent 55%)',
            'radial-gradient(ellipse 55% 40% at 80% 50%, rgba(59,130,246,0.09) 0%, transparent 50%)',
            'radial-gradient(ellipse 40% 30% at 65% 80%, rgba(139,92,246,0.06) 0%, transparent 45%)',
          ].join(', '),
        }}
      />

      {/* Floating billiard balls 1–8 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]">

        {/* ━━━ 8-Ball (Black) — Large, centered, iconic ━━━ */}
        <div className="hero-ball hero-ball-8 opacity-35" style={{ top: '50%', left: '50%' }}>
          <svg viewBox="0 0 120 120" className="size-56 sm:size-68 md:size-80">
            <defs>
              <radialGradient id="b8g" cx="38%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#3a3a44" />
                <stop offset="40%" stopColor="#1a1a22" />
                <stop offset="100%" stopColor="#08080c" />
              </radialGradient>
              <radialGradient id="b8s" cx="35%" cy="28%" r="30%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.38)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="56" fill="url(#b8g)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx="60" cy="52" r="18" fill="#F0F0F0" />
            <text x="60" y="58" textAnchor="middle" fill="#0D0D12" fontSize="22" fontWeight="900" fontFamily="'Syne', sans-serif">8</text>
            <circle cx="60" cy="60" r="56" fill="url(#b8s)" />
          </svg>
        </div>

        {/* ━━━ 1-Ball (Yellow/Gold) — top-right ━━━ */}
        <div className="hero-ball hero-ball-1" style={{ top: '22%', right: '14%' }}>
          <svg viewBox="0 0 80 80" className="size-20 sm:size-28">
            <defs>
              <radialGradient id="b1g" cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#f7d96e" />
                <stop offset="60%" stopColor="#F2C12E" />
                <stop offset="100%" stopColor="#b8920f" />
              </radialGradient>
              <radialGradient id="b1s" cx="35%" cy="28%" r="28%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="37" fill="url(#b1g)" />
            <circle cx="40" cy="35" r="11" fill="#F0F0F0" />
            <text x="40" y="40" textAnchor="middle" fill="#0D0D12" fontSize="14" fontWeight="800" fontFamily="'Syne', sans-serif">1</text>
            <circle cx="40" cy="40" r="37" fill="url(#b1s)" />
          </svg>
        </div>

        {/* ━━━ 2-Ball (Blue) — bottom-right ━━━ */}
        <div className="hero-ball hero-ball-2" style={{ bottom: '15%', right: '14%' }}>
          <svg viewBox="0 0 80 80" className="size-18 sm:size-24">
            <defs>
              <radialGradient id="b2g" cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#6ba6f7" />
                <stop offset="60%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563c2" />
              </radialGradient>
              <radialGradient id="b2s" cx="35%" cy="28%" r="28%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.50)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="37" fill="url(#b2g)" />
            <circle cx="40" cy="35" r="11" fill="#F0F0F0" />
            <text x="40" y="40" textAnchor="middle" fill="#0D0D12" fontSize="14" fontWeight="800" fontFamily="'Syne', sans-serif">2</text>
            <circle cx="40" cy="40" r="37" fill="url(#b2s)" />
          </svg>
        </div>

        {/* ━━━ 3-Ball (Red) — right mid ━━━ */}
        <div className="hero-ball hero-ball-3" style={{ top: '54%', right: '11%' }}>
          <svg viewBox="0 0 80 80" className="size-16 sm:size-22">
            <defs>
              <radialGradient id="b3g" cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="60%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#c42e2e" />
              </radialGradient>
              <radialGradient id="b3s" cx="35%" cy="28%" r="28%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.50)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="37" fill="url(#b3g)" />
            <circle cx="40" cy="35" r="11" fill="#F0F0F0" />
            <text x="40" y="40" textAnchor="middle" fill="#0D0D12" fontSize="14" fontWeight="800" fontFamily="'Syne', sans-serif">3</text>
            <circle cx="40" cy="40" r="37" fill="url(#b3s)" />
          </svg>
        </div>

        {/* ━━━ 4-Ball (Purple) — top-left ━━━ */}
        <div className="hero-ball hero-ball-4" style={{ top: '24%', left: '12%' }}>
          <svg viewBox="0 0 80 80" className="size-18 sm:size-24">
            <defs>
              <radialGradient id="b4g" cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ab85f7" />
                <stop offset="60%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6935d4" />
              </radialGradient>
              <radialGradient id="b4s" cx="35%" cy="28%" r="28%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.50)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="37" fill="url(#b4g)" />
            <circle cx="40" cy="35" r="11" fill="#F0F0F0" />
            <text x="40" y="40" textAnchor="middle" fill="#0D0D12" fontSize="14" fontWeight="800" fontFamily="'Syne', sans-serif">4</text>
            <circle cx="40" cy="40" r="37" fill="url(#b4s)" />
          </svg>
        </div>

        {/* ━━━ 5-Ball (Orange) — bottom-left ━━━ */}
        <div className="hero-ball hero-ball-5" style={{ bottom: '16%', left: '16%' }}>
          <svg viewBox="0 0 80 80" className="size-16 sm:size-22">
            <defs>
              <radialGradient id="b5g" cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#fbc06e" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#c47f08" />
              </radialGradient>
              <radialGradient id="b5s" cx="35%" cy="28%" r="28%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.50)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="37" fill="url(#b5g)" />
            <circle cx="40" cy="35" r="11" fill="#F0F0F0" />
            <text x="40" y="40" textAnchor="middle" fill="#0D0D12" fontSize="14" fontWeight="800" fontFamily="'Syne', sans-serif">5</text>
            <circle cx="40" cy="40" r="37" fill="url(#b5s)" />
          </svg>
        </div>

        {/* ━━━ 6-Ball (Green) — left mid ━━━ */}
        <div className="hero-ball hero-ball-6" style={{ top: '58%', left: '10%' }}>
          <svg viewBox="0 0 80 80" className="size-20 sm:size-26">
            <defs>
              <radialGradient id="b6g" cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#34d374" />
                <stop offset="60%" stopColor="#16A34A" />
                <stop offset="100%" stopColor="#0e7a35" />
              </radialGradient>
              <radialGradient id="b6s" cx="35%" cy="28%" r="28%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.50)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="37" fill="url(#b6g)" />
            <circle cx="40" cy="35" r="11" fill="#F0F0F0" />
            <text x="40" y="40" textAnchor="middle" fill="#0D0D12" fontSize="14" fontWeight="800" fontFamily="'Syne', sans-serif">6</text>
            <circle cx="40" cy="40" r="37" fill="url(#b6s)" />
          </svg>
        </div>

        {/* ━━━ 7-Ball (Maroon/Dark Red) — top center-left ━━━ */}
        <div className="hero-ball hero-ball-7" style={{ top: '19%', left: '28%' }}>
          <svg viewBox="0 0 80 80" className="size-14 sm:size-20">
            <defs>
              <radialGradient id="b7g" cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#c97a7a" />
                <stop offset="60%" stopColor="#8B2252" />
                <stop offset="100%" stopColor="#5e1639" />
              </radialGradient>
              <radialGradient id="b7s" cx="35%" cy="28%" r="28%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.50)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="37" fill="url(#b7g)" />
            <circle cx="40" cy="35" r="11" fill="#F0F0F0" />
            <text x="40" y="40" textAnchor="middle" fill="#0D0D12" fontSize="14" fontWeight="800" fontFamily="'Syne', sans-serif">7</text>
            <circle cx="40" cy="40" r="37" fill="url(#b7s)" />
          </svg>
        </div>

      </div>

      {/* Vignette — keeps center text readable */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background: 'radial-gradient(ellipse 65% 65% at 50% 50%, transparent 0%, rgba(10,10,14,0.30) 100%)',
        }}
      />

      <div className={`relative z-10 w-full hero-content ${className}`} {...props}>
        {children}
      </div>

      <style>{`
        /* ── Intro: everything starts hidden ── */
        .hero-gradient {
          opacity: 0;
          animation: hero-fade-in 0.8s ease-out 1.6s forwards;
        }

        .hero-content {
          opacity: 0;
          animation: hero-slide-up 0.7s ease-out 1.8s forwards;
        }

        .hero-ball {
          position: absolute;
          will-change: transform;
          transform: translate(-50%, -50%);
        }

        /* ── 8-Ball: drops from above with bounce ── */
        .hero-ball-8 {
          opacity: 0;
          animation:
            ball8-drop 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards,
            float-8 20s ease-in-out 1.6s infinite;
        }

        /* ── Balls 1-7: pop in after 8-ball lands ── */
        .hero-ball-1 {
          opacity: 0;
          animation:
            ball-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.3s forwards,
            float-drift-1 18s ease-in-out 2s infinite;
        }
        .hero-ball-2 {
          opacity: 0;
          animation:
            ball-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.4s forwards,
            float-drift-2 19s ease-in-out 2.1s infinite;
        }
        .hero-ball-3 {
          opacity: 0;
          animation:
            ball-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.45s forwards,
            float-drift-3 17s ease-in-out 2.1s infinite;
        }
        .hero-ball-4 {
          opacity: 0;
          animation:
            ball-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.35s forwards,
            float-drift-4 24s ease-in-out 2s infinite;
        }
        .hero-ball-5 {
          opacity: 0;
          animation:
            ball-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s forwards,
            float-drift-5 21s ease-in-out 2.2s infinite;
        }
        .hero-ball-6 {
          opacity: 0;
          animation:
            ball-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.38s forwards,
            float-drift-6 22s ease-in-out 2.1s infinite;
        }
        .hero-ball-7 {
          opacity: 0;
          animation:
            ball-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.48s forwards,
            float-drift-7 23s ease-in-out 2.2s infinite;
        }

        /* ── Intro keyframes ── */
        @keyframes ball8-drop {
          0% {
            opacity: 0;
            transform: translate(-50%, -300%) scale(0.6);
          }
          60% {
            opacity: 0.75;
            transform: translate(-50%, -46%) scale(1.05);
          }
          80% {
            transform: translate(-50%, -52%) scale(0.97);
          }
          100% {
            opacity: 0.75;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes ball-pop-in {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          70% {
            transform: translate(-50%, -50%) scale(1.12);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes hero-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes hero-slide-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ── Floating keyframes (play after intro) ── */
        @keyframes float-8 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          25% { transform: translate(-52%, -48%) scale(1.02); }
          50% { transform: translate(-48%, -52%) scale(0.98); }
          75% { transform: translate(-50%, -49%) scale(1.01); }
        }
        @keyframes float-drift-1 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) translateX(0); }
          33% { transform: translate(-50%, -50%) translateY(-20px) translateX(14px); }
          66% { transform: translate(-50%, -50%) translateY(12px) translateX(-10px); }
        }
        @keyframes float-drift-2 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) translateX(0); }
          33% { transform: translate(-50%, -50%) translateY(-12px) translateX(-16px); }
          66% { transform: translate(-50%, -50%) translateY(18px) translateX(10px); }
        }
        @keyframes float-drift-3 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) translateX(0); }
          33% { transform: translate(-50%, -50%) translateY(10px) translateX(12px); }
          66% { transform: translate(-50%, -50%) translateY(-16px) translateX(-8px); }
        }
        @keyframes float-drift-4 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) translateX(0); }
          33% { transform: translate(-50%, -50%) translateY(14px) translateX(-12px); }
          66% { transform: translate(-50%, -50%) translateY(-10px) translateX(16px); }
        }
        @keyframes float-drift-5 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) translateX(0); }
          33% { transform: translate(-50%, -50%) translateY(-16px) translateX(10px); }
          66% { transform: translate(-50%, -50%) translateY(8px) translateX(-14px); }
        }
        @keyframes float-drift-6 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) translateX(0); }
          33% { transform: translate(-50%, -50%) translateY(16px) translateX(18px); }
          66% { transform: translate(-50%, -50%) translateY(-14px) translateX(-8px); }
        }
        @keyframes float-drift-7 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) translateX(0); }
          33% { transform: translate(-50%, -50%) translateY(-12px) translateX(-14px); }
          66% { transform: translate(-50%, -50%) translateY(14px) translateX(10px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-ball,
          .hero-content,
          .hero-gradient { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
    </div>
  )
}
