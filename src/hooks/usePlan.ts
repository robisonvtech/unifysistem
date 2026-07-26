import { useEffect, useState, useCallback } from "react";
import { useEntitlements } from "./useEntitlements";

export type Plan = "start" | "pro" | "elite";

const STORAGE_KEY = "unify:plan-override";

export interface PlanTheme {
  plan: Plan;
  label: string;
  badgeClass: string;
  isDark: boolean;
  /** True when the current user is admin and may switch plans freely. */
  canSwitch: boolean;
  /** Set/clear the admin plan override (persists in localStorage). */
  setOverride: (plan: Plan | null) => void;
  /** The currently stored override, if any. */
  override: Plan | null;
}

function readOverride(): Plan | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "start" || v === "pro" || v === "elite" ? v : null;
}

/**
 * Derives the user's plan from entitlements and applies the `data-plan`
 * attribute to the <html> element so global tokens switch instantly.
 * Admins can override to preview any plan.
 */
export function usePlan(): PlanTheme {
  const { isAdmin, isPro, loading } = useEntitlements();
  const [override, setOverrideState] = useState<Plan | null>(() => readOverride());

  // Default plan derived from entitlements
  const derived: Plan = isAdmin ? "elite" : isPro ? "pro" : "start";
  const plan: Plan = isAdmin && override ? override : derived;

  const setOverride = useCallback((next: Plan | null) => {
    if (typeof window === "undefined") return;
    if (next === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, next);
    setOverrideState(next);
  }, []);

  useEffect(() => {
    if (loading) return;
    const root = document.documentElement;
    root.setAttribute("data-plan", plan);
    const shouldUseDark = plan === "elite" || plan === "pro";
    root.classList.toggle("dark", shouldUseDark);
    root.style.colorScheme = shouldUseDark ? "dark" : "light";
  }, [plan, loading]);

  return {
    plan,
    label: plan === "elite" ? "ELITE" : plan === "pro" ? "PRO" : "START",
    badgeClass:
      plan === "elite"
        ? "bg-primary text-primary-foreground shadow-[0_0_20px_oklch(0.62_0.26_27.5/0.6)]"
        : plan === "pro"
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
    isDark: plan === "elite" || plan === "pro",
    canSwitch: isAdmin,
    setOverride,
    override,
  };
}
