import { cn } from "@/lib/utils";
import mascotSrc from "@/assets/unify-mascot-hero.png";

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
  | "celebrating";

interface UnifyMascotProps {
  state?: UnifyState;
  size?: number;
  className?: string;
  /** Show the red aura glow behind the mascot. */
  aura?: boolean;
  /** Show the ELITE-style neon ring beneath (dark theme). */
  elite?: boolean;
}

/**
 * Unify — the RepairAI mascot.
 * Renders the premium 3D asset with state-aware CSS motion + aura.
 */
export function UnifyMascot({
  state = "idle",
  size = 128,
  className,
  aura = false,
  elite = false,
}: UnifyMascotProps) {
  const isError = state === "error";
  const isSuccess = state === "success" || state === "celebrating";
  const isThinking = state === "thinking" || state === "typing" || state === "scanning" || state === "learning";
  const isSleeping = state === "sleeping";

  const animation = isError
    ? "unify-shake 0.4s ease-in-out infinite"
    : isSuccess
      ? "unify-float 2s ease-in-out infinite, unify-breathe 1.8s ease-in-out infinite"
      : isSleeping
        ? "unify-breathe 5s ease-in-out infinite"
        : "unify-float 4s ease-in-out infinite, unify-breathe 4s ease-in-out infinite";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
      aria-label={`Unify mascot — ${state}`}
    >
      {aura && (
        <div
          className="absolute inset-0 -z-10 animate-aura pointer-events-none"
          style={{
            background: "var(--gradient-glow)",
            filter: "blur(8px)",
          }}
        />
      )}
      {elite && (
        <>
          <div
            className="absolute -z-10 rounded-full pointer-events-none"
            style={{
              width: size * 1.4,
              height: size * 0.4,
              bottom: -size * 0.05,
              left: -size * 0.2,
              background: "radial-gradient(50% 50% at 50% 50%, oklch(0.62 0.26 27.5 / 0.55), transparent 70%)",
              filter: "blur(6px)",
            }}
          />
          <div
            className="absolute -z-10 rounded-full border pointer-events-none"
            style={{
              width: size * 1.1,
              height: size * 0.3,
              bottom: size * 0.02,
              left: -size * 0.05,
              borderColor: "oklch(0.62 0.26 27.5 / 0.6)",
              boxShadow: "0 0 24px oklch(0.62 0.26 27.5 / 0.6)",
            }}
          />
        </>
      )}
      <img
        src={mascotSrc}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className={cn(
          "block h-full w-full object-contain",
          isThinking && "opacity-90",
          isSleeping && "opacity-70",
        )}
        style={{ animation }}
      />
      {isThinking && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" style={{ animation: "dot-bounce 1.2s infinite" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary" style={{ animation: "dot-bounce 1.2s infinite 0.2s" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary" style={{ animation: "dot-bounce 1.2s infinite 0.4s" }} />
        </div>
      )}
    </div>
  );
}
