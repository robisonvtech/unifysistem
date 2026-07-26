import { cn } from "@/lib/utils";

export type UnifyState =
  | "idle"
  | "thinking"
  | "typing"
  | "listening"
  | "scanning"
  | "success"
  | "error"
  | "learning"
  | "sleeping"
  | "analyzing"
  | "searching"
  | "speaking"
  | "celebrating"
  | "elite";

interface UnifyMascotProps {
  state?: UnifyState;
  size?: number;
  className?: string;
  variant?: "start" | "pro" | "elite";
}

/**
 * Unify — The official RepairAI mascot.
 * Responsive, 60fps CSS animated, state-aware 3D blob & cyberpunk mascot.
 */
export function UnifyMascot({
  state = "idle",
  size = 96,
  className,
  variant = "start",
}: UnifyMascotProps) {
  const isElite = variant === "elite" || state === "elite";
  const isError = state === "error";
  const isSuccess = state === "success" || state === "celebrating";
  const isThinking = state === "thinking" || state === "analyzing" || state === "searching";
  const isTyping = state === "typing" || state === "speaking";
  const isListening = state === "listening";
  const isScanning = state === "scanning";
  const isLearning = state === "learning";
  const isSleeping = state === "sleeping";
  const eyesClosed = isThinking || isTyping || isSuccess || isLearning || isSleeping;

  return (
    <div
      className={cn("relative inline-block select-none transition-all duration-300", className)}
      style={{ width: size, height: size }}
    >
      {/* ELITE Cyberpunk Pedestal Glow Effect */}
      {isElite && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-red-600/40 blur-md rounded-full animate-pulse" />
      )}

      {/* PRO Glowing Aura Ring */}
      {variant === "pro" && (
        <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-r from-red-500/30 via-pink-500/20 to-red-600/30 blur-lg animate-pulse" />
      )}

      <div
        className="relative w-full h-full"
        style={{
          animation: isError
            ? "unify-shake 0.4s ease-in-out infinite"
            : isSuccess
            ? "unify-glow 1.8s ease-in-out infinite, unify-float 3s ease-in-out infinite"
            : "unify-float 3s ease-in-out infinite, unify-breathe 3.5s ease-in-out infinite",
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <defs>
            {/* Body Gradients */}
            <radialGradient id="unify-body-light" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f4f4f7" />
              <stop offset="100%" stopColor="#e5e5eb" />
            </radialGradient>

            <radialGradient id="unify-body-elite" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#2a2a2e" />
              <stop offset="70%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>

            <radialGradient id="unify-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isElite ? "rgba(191, 0, 0, 0.4)" : "rgba(0,0,0,0.18)"} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            {/* Glowing Red Eyes filter for ELITE */}
            <filter id="red-eye-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ground shadow */}
          <ellipse cx="60" cy="112" rx="28" ry="5" fill="url(#unify-shadow)" />

          {/* Body — rounded smooth blob/ghost mascot */}
          <path
            d="M60 12
               C 32 12, 18 34, 18 60
               L 18 92
               C 18 100, 26 104, 32 100
               C 38 96, 44 100, 50 102
               C 56 104, 64 104, 70 102
               C 76 100, 82 96, 88 100
               C 94 104, 102 100, 102 92
               L 102 60
               C 102 34, 88 12, 60 12 Z"
            fill={isElite ? "url(#unify-body-elite)" : "url(#unify-body-light)"}
            stroke={isElite ? "#BF0000" : isError ? "#BF0000" : "rgba(0,0,0,0.08)"}
            strokeWidth={isElite ? 2 : isError ? 1.5 : 1}
          />

          {/* Red U Emblem on forehead */}
          <g transform="translate(60 34)">
            <path
              d="M-8 -8 L -8 3 C -8 8, -4 11, 0 11 C 4 11, 8 8, 8 3 L 8 -8"
              stroke="#BF0000"
              strokeWidth="3.4"
              strokeLinecap="round"
              fill="none"
              filter={isElite ? "url(#red-eye-glow)" : undefined}
            />
          </g>

          {/* Eyes */}
          {isElite ? (
            /* Cyberpunk Glowing Red Eyes */
            <g fill="#BF0000" filter="url(#red-eye-glow)">
              {isSleeping ? (
                <g stroke="#BF0000" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="40" y1="62" x2="52" y2="62" />
                  <line x1="68" y1="62" x2="80" y2="62" />
                </g>
              ) : (
                <>
                  <ellipse cx="46" cy="62" rx="4" ry="5" />
                  <ellipse cx="74" cy="62" rx="4" ry="5" />
                  <ellipse cx="46" cy="62" rx="1.5" ry="2" fill="#FFFFFF" />
                  <ellipse cx="74" cy="62" rx="1.5" ry="2" fill="#FFFFFF" />
                </>
              )}
            </g>
          ) : isError ? (
            <g stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
              <line x1="42" y1="58" x2="50" y2="66" />
              <line x1="50" y1="58" x2="42" y2="66" />
              <line x1="70" y1="58" x2="78" y2="66" />
              <line x1="78" y1="58" x2="70" y2="66" />
            </g>
          ) : eyesClosed ? (
            <g stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M40 62 Q 46 58 52 62" />
              <path d="M68 62 Q 74 58 80 62" />
            </g>
          ) : (
            <g fill="#1a1a1a">
              <ellipse
                cx="46"
                cy="62"
                rx="3.2"
                ry="4.2"
                style={{ transformOrigin: "46px 62px", animation: "unify-blink 4s infinite" }}
              />
              <ellipse
                cx="74"
                cy="62"
                rx="3.2"
                ry="4.2"
                style={{ transformOrigin: "74px 62px", animation: "unify-blink 4s infinite" }}
              />
            </g>
          )}

          {/* Mouth */}
          {isElite ? (
            <path
              d="M50 78 Q 60 84 70 78"
              stroke="#BF0000"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              filter="url(#red-eye-glow)"
            />
          ) : isError ? (
            <path
              d="M50 82 L 54 78 L 58 82 L 62 78 L 66 82 L 70 78"
              stroke="#1a1a1a"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          ) : isSuccess ? (
            <path d="M48 78 Q 60 92 72 78" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : isThinking || isTyping ? (
            <g fill="#1a1a1a">
              <circle cx="52" cy="80" r="1.8" style={{ animation: "dot-bounce 1.2s infinite", animationDelay: "0s" }} />
              <circle cx="60" cy="80" r="1.8" style={{ animation: "dot-bounce 1.2s infinite", animationDelay: "0.2s" }} />
              <circle cx="68" cy="80" r="1.8" style={{ animation: "dot-bounce 1.2s infinite", animationDelay: "0.4s" }} />
            </g>
          ) : (
            <path d="M52 80 Q 60 85 68 80" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* Scanning line */}
          {isScanning && (
            <rect x="18" y="60" width="84" height="2" fill="#BF0000" opacity="0.8">
              <animate attributeName="y" from="20" to="100" dur="1.4s" repeatCount="indefinite" />
            </rect>
          )}

          {/* Listening sound waves */}
          {isListening && (
            <g stroke="#BF0000" strokeWidth="1.5" fill="none" opacity="0.6">
              <circle cx="60" cy="60" r="52">
                <animate attributeName="r" from="44" to="58" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.7" to="0" dur="1.2s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Success Check Badge */}
          {isSuccess && (
            <g transform="translate(90 90)">
              <circle r="12" fill="#10B981" />
              <path
                d="M-5 0 L -1 4 L 5 -3"
                stroke="white"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
