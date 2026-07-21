import { cn } from "@/lib/utils";

export type UnifyState =
  | "idle"
  | "thinking"
  | "typing"
  | "listening"
  | "scanning"
  | "success"
  | "error"
  | "learning";

interface UnifyMascotProps {
  state?: UnifyState;
  size?: number;
  className?: string;
}

/**
 * Unify — the RepairAI mascot.
 * Minimalist rounded blob with a red "U" on the forehead.
 * State-aware animations driven purely by CSS.
 */
export function UnifyMascot({ state = "idle", size = 96, className }: UnifyMascotProps) {
  const isError = state === "error";
  const isSuccess = state === "success";
  const isThinking = state === "thinking";
  const isTyping = state === "typing";
  const isListening = state === "listening";
  const isScanning = state === "scanning";
  const isLearning = state === "learning";
  const eyesClosed = isThinking || isTyping || isSuccess || isLearning;

  return (
    <div
      className={cn("relative inline-block select-none", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0"
        style={{
          animation: isError
            ? "unify-shake 0.4s ease-in-out infinite"
            : isSuccess
              ? "unify-glow 1.8s ease-in-out infinite, unify-float 3s ease-in-out infinite"
              : "unify-float 3s ease-in-out infinite, unify-breathe 3.5s ease-in-out infinite",
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
          <defs>
            <radialGradient id="unify-body" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f2f2f4" />
            </radialGradient>
            <radialGradient id="unify-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Ground shadow */}
          <ellipse cx="60" cy="112" rx="26" ry="4" fill="url(#unify-shadow)" />

          {/* Body — rounded blob/ghost */}
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
            fill="url(#unify-body)"
            stroke={isError ? "#BF0000" : "rgba(0,0,0,0.06)"}
            strokeWidth={isError ? 1.5 : 1}
          />

          {/* Red U on forehead */}
          <g transform="translate(60 34)">
            <path
              d="M-8 -8 L -8 3 C -8 8, -4 11, 0 11 C 4 11, 8 8, 8 3 L 8 -8"
              stroke="#BF0000"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Eyes */}
          {isError ? (
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
                cx="46" cy="62" rx="3" ry="4"
                style={{ transformOrigin: "46px 62px", animation: "unify-blink 4s infinite" }}
              />
              <ellipse
                cx="74" cy="62" rx="3" ry="4"
                style={{ transformOrigin: "74px 62px", animation: "unify-blink 4s infinite" }}
              />
            </g>
          )}

          {/* Mouth */}
          {isError ? (
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
            <rect x="18" y="60" width="84" height="2" fill="#BF0000" opacity="0.6">
              <animate attributeName="y" from="20" to="100" dur="1.4s" repeatCount="indefinite" />
            </rect>
          )}

          {/* Listening waves */}
          {isListening && (
            <g stroke="#BF0000" strokeWidth="1.5" fill="none" opacity="0.6">
              <circle cx="60" cy="60" r="52">
                <animate attributeName="r" from="46" to="58" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Success check badge */}
          {isSuccess && (
            <g transform="translate(90 90)">
              <circle r="12" fill="oklch(0.65 0.17 150)" />
              <path d="M-5 0 L -1 4 L 5 -3" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
